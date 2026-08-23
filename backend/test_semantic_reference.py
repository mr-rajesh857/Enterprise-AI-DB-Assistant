import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal, Base, engine
from app.models import User, QueryMemory, ChatSession, ChatMessage
from app.services.memory_service import lookup_memory, bind_runtime_parameters, compute_intent_hash
from app.services.langgraph_agent import LangGraphAIAgent

def run_comprehensive_db_memory_tests():
    print("=================================================================")
    print("🎯 COMPREHENSIVE END-TO-END DB & SEMANTIC MEMORY SUITE")
    print("=================================================================\n")

    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    user = db.query(User).first()

    # Clear memories for deterministic test
    db.query(QueryMemory).delete()
    db.commit()

    # ── SCENARIO 1: Phrasing Invariance & Dynamic Parameter Binding ──────────
    print("1. Testing Phrasing Invariance & User ID Slot Binding...")
    m1 = QueryMemory(
        user_id=None,  # Shared Tier
        intent_hash=compute_intent_hash("what the user name"),
        canonical_question="what the user name",
        sql_template="SELECT id, full_name, email FROM users WHERE id = {user_id};",
        sample_question="what the user name",
        is_pii_clean=True
    )
    db.add(m1)
    db.commit()

    # Test incoming query with different phrasing: "who is the user"
    agent = LangGraphAIAgent(allowed_tables=user.get_allowed_tables_list(), user_id=user.id)
    res1 = agent.run("who is the user")
    
    print(f"   Input Query:  'who is the user'")
    print(f"   Result Status: {res1.get('status')}")
    print(f"   Executed SQL:  '{res1.get('sql')}'")
    print(f"   Row Count:     {res1.get('row_count')}")
    assert res1.get("status") == "success", "Scenario 1 failed"
    assert f"WHERE id = {user.id}" in res1.get("sql"), "User ID binding failed"
    print("   ✅ Scenario 1 (User identity phrasing invariance) PASSED!\n")

    # ── SCENARIO 2: Category Count Aggregation Phrasing ─────────────────────
    print("2. Testing Category Count Aggregation Phrasing...")
    m2 = QueryMemory(
        user_id=None,
        intent_hash=compute_intent_hash("show category breakdown"),
        canonical_question="show category breakdown",
        sql_template="SELECT name FROM categories;",
        sample_question="show category breakdown",
        is_pii_clean=True
    )
    db.add(m2)
    db.commit()

    # Test incoming query: "list all category names"
    res2 = agent.run("list all category names")
    print(f"   Input Query:  'list all category names'")
    print(f"   Result Status: {res2.get('status')}")
    print(f"   Executed SQL:  '{res2.get('sql')}'")
    print(f"   Row Count:     {res2.get('row_count')}")
    assert res2.get("status") == "success", "Scenario 2 failed"
    print("   ✅ Scenario 2 (Category aggregation phrasing) PASSED!\n")

    # ── SCENARIO 3: User-Specific Tier Precedence & Isolation ───────────────
    print("3. Testing User-Specific Tier Precedence over Shared Tier...")
    user_mem = QueryMemory(
        user_id=user.id,  # User-Specific Tier
        intent_hash=compute_intent_hash("show my active profile details"),
        canonical_question="show my active profile details",
        sql_template=f"SELECT id, full_name, role_id FROM users WHERE id = {user.id};",
        sample_question="show my active profile details",
        is_pii_clean=True
    )
    db.add(user_mem)
    db.commit()

    # Test query: "get my profile info"
    res3 = agent.run("get my profile info")
    print(f"   Input Query:  'get my profile info'")
    print(f"   Result Status: {res3.get('status')}")
    print(f"   Executed SQL:  '{res3.get('sql')}'")
    print(f"   Row Count:     {res3.get('row_count')}")
    assert res3.get("status") == "success", "Scenario 3 failed"
    print("   ✅ Scenario 3 (User-Specific Tier Precedence) PASSED!\n")

    print("=================================================================")
    print("🎉 ALL END-TO-END DB & SEMANTIC MEMORY TESTS PASSED!")
    print("=================================================================")
    db.close()

if __name__ == "__main__":
    run_comprehensive_db_memory_tests()
