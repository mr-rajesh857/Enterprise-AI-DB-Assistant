"""
LangGraph AI Agent Implementation for DB Assistant.
Integrates LangGraph StateGraph workflow with FastMCP tool execution.
"""
import json
from typing import TypedDict, Optional, List, Dict, Any, Union
from langgraph.graph import StateGraph, START, END
from google import genai
from google.genai import types
from app.config import settings
from app.mcp_tools.fastmcp_server import (
    list_tables, describe_table, execute_query, get_schema_summary
)

client = genai.Client(api_key=settings.GEMINI_API_KEY)

# ── FastMCP Tool declarations for Gemini API ────────────────────────────────
LIST_TABLES_TOOL = types.FunctionDeclaration(
    name="list_tables",
    description="List all database tables the current user has access to.",
    parameters=types.Schema(type="OBJECT", properties={}, required=[])
)

DESCRIBE_TABLE_TOOL = types.FunctionDeclaration(
    name="describe_table",
    description="Get column names and data types for a specific table.",
    parameters=types.Schema(
        type="OBJECT",
        properties={"table_name": types.Schema(type="STRING", description="The exact name of the table.")},
        required=["table_name"]
    )
)

EXECUTE_QUERY_TOOL = types.FunctionDeclaration(
    name="execute_query",
    description="Execute a SELECT SQL query and return the results. Only SELECT queries are allowed.",
    parameters=types.Schema(
        type="OBJECT",
        properties={"sql": types.Schema(type="STRING", description="The SELECT SQL query to execute.")},
        required=["sql"]
    )
)

GET_SCHEMA_TOOL = types.FunctionDeclaration(
    name="get_schema_summary",
    description="Get a full schema overview of all accessible tables with their columns.",
    parameters=types.Schema(type="OBJECT", properties={}, required=[])
)

FAST_MCP_TOOLS = types.Tool(functionDeclarations=[
    LIST_TABLES_TOOL, DESCRIBE_TABLE_TOOL, EXECUTE_QUERY_TOOL, GET_SCHEMA_TOOL
])

SYSTEM_INSTRUCTION = """You are an expert SQL data analyst assistant for a MySQL/PostgreSQL database.

Your workflow:
1. When the user asks a data question, ALWAYS call get_schema_summary first to understand available tables.
2. If you need more detail about a specific table, call describe_table.
3. Generate an accurate SELECT query and call execute_query.
4. Interpret the results and respond in clear, concise natural language.
5. If no data is found, say so clearly.

Rules:
- Only use SELECT queries. Never INSERT, UPDATE, DELETE, DROP, or ALTER.
- Always summarize results in plain English after executing a query.
- If the user asks a general question (not data-related), answer conversationally without using tools.
- Be helpful, accurate, and concise.
"""

from app.database import SessionLocal
from app.services.memory_service import lookup_memory

# ── LangGraph State Definition ─────────────────────────────────────────────
class AgentState(TypedDict):
    user_message: str
    user_id: Optional[int]
    conversation_history: List[Dict[str, Any]]
    allowed_tables: Optional[List[str]]
    contents: List[Any]
    pending_tool_calls: List[Any]
    last_sql: Optional[str]
    last_data: Dict[str, Any]
    memory_hit: bool
    final_answer: Optional[str]
    status: str
    iteration: int


# ── Node Functions ─────────────────────────────────────────────────────────

def memory_lookup_node(state: AgentState) -> Dict[str, Any]:
    """
    Node 0: Sub-second Cheap-First Memory Lookup.
    Checks User-Specific Tier first, Shared Agent Tier second.
    On hit, bypasses LLM reasoning loop to save API cost.
    """
    print("🔍 [LangGraph Node 0: memory_lookup] Cheap-First Two-Tiered Memory Lookup...")
    db = SessionLocal()
    try:
        mem = lookup_memory(db, state["user_message"], user_id=state.get("user_id"))
        if mem and mem.sql_template:
            print(f"⚡ [LangGraph Node 0: memory_lookup] MEMORY HIT! Reusing template (0 LLM cost): '{mem.sql_template}'")
            # Create synthetic pending tool call for execute_query
            synthetic_fc = types.Part(
                functionCall=types.FunctionCall(
                    name="execute_query",
                    args={"sql": mem.sql_template}
                )
            )
            return {
                "memory_hit": True,
                "pending_tool_calls": [synthetic_fc],
                "last_sql": mem.sql_template,
                "iteration": 1
            }
    except Exception as e:
        print(f"⚠️ [Memory Lookup] Error during lookup (falling back to standard LLM): {e}")
    finally:
        db.close()

    print("ℹ️ [LangGraph Node 0: memory_lookup] No matching memory found. Proceeding to LLM reasoning.")
    return {"memory_hit": False}


def schema_inspector_node(state: AgentState) -> Dict[str, Any]:
    """Node 1: Inspect schema permissions and initialize state contents with full schema context."""
    print("🔵 [LangGraph Node 1/4: schema_inspector] Initializing graph state, checking RBAC permissions, and loading DB schema...")
    contents = []
    
    # Load schema summary directly to eliminate unnecessary LLM turns
    schema_info = get_schema_summary(state.get("allowed_tables"))
    schema_context = f"Database Schema Context:\n{json.dumps(schema_info, default=str)}\n"

    for msg in (state.get("conversation_history") or [])[-6:]:
        role = "user" if msg.get("role") == "user" else "model"
        contents.append(types.Content(role=role, parts=[types.Part(text=msg.get("content", ""))]))

    user_prompt_with_schema = f"{schema_context}\nUser Question: {state['user_message']}"
    contents.append(types.Content(role="user", parts=[types.Part(text=user_prompt_with_schema)]))
    
    return {
        "contents": contents,
        "last_data": {"columns": None, "rows": None, "row_count": None},
        "status": "processing",
        "iteration": state.get("iteration", 0)
    }


def llm_reasoner_node(state: AgentState) -> Dict[str, Any]:
    """Node 2: Call LLM with FastMCP tools attached."""
    print(f"🧠 [LangGraph Node 2/4: llm_reasoner] Calling Gemini model (iteration {state['iteration'] + 1}) with FastMCP tool declarations...")
    try:
        response = client.models.generate_content(
            model=settings.GEMINI_MODEL,
            contents=state["contents"],
            config=types.GenerateContentConfig(
                systemInstruction=SYSTEM_INSTRUCTION,
                tools=[FAST_MCP_TOOLS],
                temperature=0.1,
            )
        )

        candidate = response.candidates[0]
        new_contents = list(state["contents"])
        new_contents.append(types.Content(role="model", parts=candidate.content.parts))

        tool_calls = [p for p in candidate.content.parts if p.function_call]
        final_text = "".join(p.text for p in candidate.content.parts if hasattr(p, "text") and p.text)

        return {
            "contents": new_contents,
            "pending_tool_calls": tool_calls,
            "final_answer": final_text.strip() if final_text else None,
            "iteration": state["iteration"] + 1,
            "status": "processing"
        }
    except Exception as e:
        error_msg = str(e)
        print(f"❌ [LangGraph LLM Reasoner Error]: {error_msg}")
        if "429" in error_msg or "RESOURCE_EXHAUSTED" in error_msg:
            user_err = "Gemini API Quota Reached (429 Rate Limit). Please wait a moment and try again."
        else:
            user_err = f"AI Agent Error: {error_msg}"

        return {
            "pending_tool_calls": [],
            "final_answer": user_err,
            "status": "error",
            "iteration": state["iteration"] + 1
        }


def mcp_tool_execution_node(state: AgentState) -> Dict[str, Any]:
    """Node 3: Execute tool calls via FastMCP tools."""
    tool_calls = state.get("pending_tool_calls", [])
    allowed_tables = state.get("allowed_tables")
    tool_results = []

    last_sql = state.get("last_sql")
    last_data = dict(state.get("last_data", {}))

    for part in tool_calls:
        fc = part.function_call
        name = fc.name
        args = dict(fc.args)

        print(f"⚡ [FastMCP Tool Execution] Executing tool: '{name}' with args: {args}")

        if name == "list_tables":
            output_dict = list_tables(allowed_tables=allowed_tables)
        elif name == "describe_table":
            output_dict = describe_table(table_name=args.get("table_name", ""), allowed_tables=allowed_tables)
        elif name == "execute_query":
            output_dict = execute_query(sql=args.get("sql", ""), allowed_tables=allowed_tables)
        elif name == "get_schema_summary":
            output_dict = get_schema_summary(allowed_tables=allowed_tables)
        else:
            output_dict = {"error": f"Unknown tool: {name}"}

        tool_output_str = json.dumps(output_dict, default=str)

        if name == "execute_query":
            last_sql = args.get("sql")
            if "error" not in output_dict:
                last_data = {
                    "columns": output_dict.get("columns"),
                    "rows": output_dict.get("rows"),
                    "row_count": output_dict.get("row_count")
                }

        tool_results.append(types.Part(
            functionResponse=types.FunctionResponse(
                name=name,
                response={"result": tool_output_str}
            )
        ))

    new_contents = list(state.get("contents", []))
    new_contents.append(types.Content(role="user", parts=tool_results))

    return {
        "contents": new_contents,
        "pending_tool_calls": [],
        "last_sql": last_sql,
        "last_data": last_data
    }


def response_synthesizer_node(state: AgentState) -> Dict[str, Any]:
    """Node 4: Synthesize final output and status."""
    print("✅ [LangGraph Node 4/4: response_synthesizer] Synthesizing final response and building response object...")
    if state.get("status") == "error":
        answer = state.get("final_answer") or "An error occurred during query execution."
        status = "error"
    elif state.get("last_sql"):
        answer = state.get("final_answer") or "Query executed successfully."
        status = "success"
    elif state.get("final_answer"):
        answer = state.get("final_answer")
        status = "success"
    else:
        answer = "No SQL query could be generated for this request. Please verify your query."
        status = "error"

    return {
        "final_answer": answer,
        "status": status
    }


# ── Conditional Routers ──────────────────────────────────────────────────────
def route_start(state: AgentState) -> str:
    if state.get("memory_hit"):
        return "mcp_tool_execution"
    return "schema_inspector"

def route_next(state: AgentState) -> str:
    if state.get("memory_hit") and not state.get("pending_tool_calls"):
        return "response_synthesizer"
    if state.get("pending_tool_calls") and state.get("iteration", 0) < 8:
        return "mcp_tool_execution"
    if not state.get("last_sql") and state.get("iteration", 0) < 6 and state.get("status") != "error":
        return "llm_reasoner"
    return "response_synthesizer"


# ── Build LangGraph Workflow ─────────────────────────────────────────────────
builder = StateGraph(AgentState)

builder.add_node("memory_lookup", memory_lookup_node)
builder.add_node("schema_inspector", schema_inspector_node)
builder.add_node("llm_reasoner", llm_reasoner_node)
builder.add_node("mcp_tool_execution", mcp_tool_execution_node)
builder.add_node("response_synthesizer", response_synthesizer_node)

builder.add_edge(START, "memory_lookup")

builder.add_conditional_edges(
    "memory_lookup",
    route_start,
    {
        "mcp_tool_execution": "mcp_tool_execution",
        "schema_inspector": "schema_inspector"
    }
)

builder.add_edge("schema_inspector", "llm_reasoner")

builder.add_conditional_edges(
    "llm_reasoner",
    route_next,
    {
        "mcp_tool_execution": "mcp_tool_execution",
        "response_synthesizer": "response_synthesizer"
    }
)

builder.add_conditional_edges(
    "mcp_tool_execution",
    route_next,
    {
        "mcp_tool_execution": "mcp_tool_execution",
        "llm_reasoner": "llm_reasoner",
        "response_synthesizer": "response_synthesizer"
    }
)

builder.add_edge("response_synthesizer", END)

langgraph_app = builder.compile()


# ── LangGraph AIAgent Class ─────────────────────────────────────────────────
class LangGraphAIAgent:
    def __init__(self, allowed_tables: Optional[List[str]] = None, user_id: Optional[int] = None):
        self.allowed_tables = allowed_tables
        self.user_id = user_id

    def run(self, user_message: str, conversation_history: List[dict] = None) -> dict:
        initial_state: AgentState = {
            "user_message": user_message,
            "user_id": self.user_id,
            "conversation_history": conversation_history or [],
            "allowed_tables": self.allowed_tables,
            "contents": [],
            "pending_tool_calls": [],
            "last_sql": None,
            "last_data": {"columns": None, "rows": None, "row_count": None},
            "memory_hit": False,
            "final_answer": None,
            "status": "processing",
            "iteration": 0
        }

        final_state = langgraph_app.invoke(initial_state)

        last_data = final_state.get("last_data", {})
        return {
            "answer": final_state.get("final_answer", ""),
            "sql": final_state.get("last_sql"),
            "columns": last_data.get("columns"),
            "rows": last_data.get("rows"),
            "row_count": last_data.get("row_count"),
            "status": final_state.get("status", "success")
        }
