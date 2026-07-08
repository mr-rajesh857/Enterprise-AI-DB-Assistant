import re
from typing import Optional, List
from sqlalchemy import text, inspect as sa_inspect
from app.database import engine

# Tables hidden from AI (internal system tables)
SYSTEM_TABLES = {"users", "roles", "permissions", "role_permissions", "audit_logs"}

def list_tables(allowed_tables: Optional[List[str]] = None) -> dict:
    """
    MCP Tool: List all available tables the user can access.
    Returns dict so Gemini can parse it as a tool result.
    """
    inspector = sa_inspect(engine)
    all_tables = [t for t in inspector.get_table_names() if t not in SYSTEM_TABLES]
    if allowed_tables is not None:
        all_tables = [t for t in all_tables if t in allowed_tables]
    return {"tables": all_tables, "count": len(all_tables)}


def describe_table(table_name: str, allowed_tables: Optional[List[str]] = None) -> dict:
    """
    MCP Tool: Get the columns and types for a specific table.
    """
    if allowed_tables is not None and table_name not in allowed_tables:
        return {"error": f"Access to table '{table_name}' is not permitted for your role."}
    inspector = sa_inspect(engine)
    if table_name not in inspector.get_table_names():
        return {"error": f"Table '{table_name}' does not exist."}
    columns = inspector.get_columns(table_name)
    return {
        "table": table_name,
        "columns": [{"name": c["name"], "type": str(c["type"])} for c in columns]
    }


def validate_sql(sql: str) -> Optional[str]:
    """Returns error string if invalid, None if OK."""
    sql_upper = sql.strip().upper()
    blocked = ["INSERT", "UPDATE", "DELETE", "DROP", "ALTER",
               "CREATE", "TRUNCATE", "EXEC", "EXECUTE", "GRANT", "REVOKE"]
    for kw in blocked:
        if re.search(rf"\b{kw}\b", sql_upper):
            return f"'{kw}' is not allowed. Only SELECT queries are permitted."
    if not re.match(r"^\s*SELECT\b", sql_upper, re.IGNORECASE):
        return "Only SELECT queries are allowed."
    return None


def execute_query(sql: str, allowed_tables: Optional[List[str]] = None, max_rows: int = 200) -> dict:
    """
    MCP Tool: Validate and execute a SELECT SQL query.
    """
    error = validate_sql(sql)
    if error:
        return {"error": error}
    # Auto-add LIMIT
    if "limit" not in sql.lower():
        sql = sql.rstrip(";") + f" LIMIT {max_rows}"
    try:
        with engine.connect() as conn:
            result = conn.execute(text(sql))
            columns = list(result.keys())
            rows = [dict(zip(columns, row)) for row in result.fetchall()]
            return {"columns": columns, "rows": rows, "row_count": len(rows)}
    except Exception as e:
        return {"error": f"Query failed: {str(e)}"}


def get_schema_summary(allowed_tables: Optional[List[str]] = None) -> dict:
    """
    MCP Tool: Get a compact schema overview of all accessible tables.
    """
    tables_result = list_tables(allowed_tables)
    tables = tables_result.get("tables", [])
    inspector = sa_inspect(engine)
    schema = {}
    for table in tables:
        try:
            cols = inspector.get_columns(table)
            schema[table] = [f"{c['name']} ({c['type']})" for c in cols]
        except Exception:
            schema[table] = ["(unreadable)"]
    return {"schema": schema}
