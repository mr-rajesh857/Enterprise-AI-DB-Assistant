import json
from typing import Optional, List
from google import genai
from google.genai import types
from app.config import settings
from app.mcp_tools.sql_tools import (
    list_tables, describe_table, execute_query, get_schema_summary
)

client = genai.Client(api_key=settings.GEMINI_API_KEY)

# ── Tool definitions (Gemini function declarations) ────────────────────────
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
        properties={"table_name": types.Schema(type="STRING",
                    description="The exact name of the table to describe.")},
        required=["table_name"]
    )
)

EXECUTE_QUERY_TOOL = types.FunctionDeclaration(
    name="execute_query",
    description="Execute a SELECT SQL query and return the results. Only SELECT queries are allowed.",
    parameters=types.Schema(
        type="OBJECT",
        properties={"sql": types.Schema(type="STRING",
                    description="The SELECT SQL query to execute.")},
        required=["sql"]
    )
)

GET_SCHEMA_TOOL = types.FunctionDeclaration(
    name="get_schema_summary",
    description="Get a full schema overview of all accessible tables with their columns.",
    parameters=types.Schema(type="OBJECT", properties={}, required=[])
)

ALL_TOOLS = types.Tool(functionDeclarations=[
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

class AIAgent:
    def __init__(self, allowed_tables: Optional[List[str]] = None):
        self.allowed_tables = allowed_tables

    def _call_tool(self, name: str, args: dict) -> str:
        """Dispatch tool calls to actual MCP functions."""
        if name == "list_tables":
            result = list_tables(self.allowed_tables)
        elif name == "describe_table":
            result = describe_table(args.get("table_name", ""), self.allowed_tables)
        elif name == "execute_query":
            result = execute_query(args.get("sql", ""), self.allowed_tables)
        elif name == "get_schema_summary":
            result = get_schema_summary(self.allowed_tables)
        else:
            result = {"error": f"Unknown tool: {name}"}
        return json.dumps(result, default=str)

    def run(self, user_message: str, conversation_history: List[dict] = None) -> dict:
        # Build conversation history for Gemini
        contents = []
        for msg in (conversation_history or [])[-8:]:
            role = "user" if msg.get("role") == "user" else "model"
            contents.append(types.Content(role=role,
                parts=[types.Part(text=msg.get("content", ""))]))

        # Add current user message
        contents.append(types.Content(role="user",
            parts=[types.Part(text=user_message)]))

        last_sql = None
        last_data = {"columns": None, "rows": None, "row_count": None}

        # Agentic loop — Gemini calls tools until it gives a final answer
        for _ in range(8):  # max 8 iterations
            response = client.models.generate_content(
                model=settings.GEMINI_MODEL,
                contents=contents,
                config=types.GenerateContentConfig(
                    systemInstruction=SYSTEM_INSTRUCTION,
                    tools=[ALL_TOOLS],
                    temperature=0.1,
                )
            )

            candidate = response.candidates[0]
            contents.append(types.Content(role="model", parts=candidate.content.parts))

            # Check for tool calls
            tool_calls = [p for p in candidate.content.parts if p.function_call]

            if not tool_calls:
                # Final text response
                final_text = "".join(
                    p.text for p in candidate.content.parts if hasattr(p, "text") and p.text
                )
                return {
                    "answer": final_text.strip(),
                    "sql": last_sql,
                    "columns": last_data["columns"],
                    "rows": last_data["rows"],
                    "row_count": last_data["row_count"],
                    "status": "success"
                }

            # Execute all tool calls and feed results back
            tool_results = []
            for part in tool_calls:
                fc = part.function_call
                tool_output = self._call_tool(fc.name, dict(fc.args))

                # Track SQL and data
                if fc.name == "execute_query":
                    last_sql = dict(fc.args).get("sql")
                    try:
                        parsed = json.loads(tool_output)
                        if "error" not in parsed:
                            last_data = {
                                "columns": parsed.get("columns"),
                                "rows": parsed.get("rows"),
                                "row_count": parsed.get("row_count")
                            }
                    except Exception:
                        pass

                tool_results.append(types.Part(
                    functionResponse=types.FunctionResponse(
                        name=fc.name,
                        response={"result": tool_output}
                    )
                ))

            contents.append(types.Content(role="user", parts=tool_results))

        return {
            "answer": "I was unable to complete the request within the allowed steps.",
            "sql": last_sql,
            "columns": None, "rows": None, "row_count": None,
            "status": "error"
        }