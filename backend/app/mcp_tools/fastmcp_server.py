"""
FastMCP Server & Tool Definitions for DB Assistant
Provides standardized FastMCP tools for schema inspection and SQL query execution.
"""
from typing import Optional, List, Dict, Any
from fastmcp import FastMCP
from app.mcp_tools import sql_tools

# Instantiate FastMCP server
mcp = FastMCP("Enterprise AI DB Assistant")

@mcp.tool()
def get_schema_summary(allowed_tables: Optional[List[str]] = None) -> Dict[str, Any]:
    """Get a compact schema overview of all accessible database tables."""
    return sql_tools.get_schema_summary(allowed_tables)

@mcp.tool()
def describe_table(table_name: str, allowed_tables: Optional[List[str]] = None) -> Dict[str, Any]:
    """Get column names and data types for a specific database table."""
    return sql_tools.describe_table(table_name, allowed_tables)

@mcp.tool()
def list_tables(allowed_tables: Optional[List[str]] = None) -> Dict[str, Any]:
    """List all database tables available to the user based on RBAC permissions."""
    return sql_tools.list_tables(allowed_tables)

@mcp.tool()
def execute_query(sql: str, allowed_tables: Optional[List[str]] = None) -> Dict[str, Any]:
    """Validate and execute a SELECT SQL query on the database safely."""
    return sql_tools.execute_query(sql, allowed_tables)
