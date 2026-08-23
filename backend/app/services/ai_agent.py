from typing import Optional, List
from app.services.langgraph_agent import LangGraphAIAgent

class AIAgent:
    """
    Backward-compatible wrapper for the LangGraph-powered AI Agent.
    """
    def __init__(self, allowed_tables: Optional[List[str]] = None):
        self.agent = LangGraphAIAgent(allowed_tables=allowed_tables)

    def run(self, user_message: str, conversation_history: List[dict] = None) -> dict:
        return self.agent.run(user_message=user_message, conversation_history=conversation_history)