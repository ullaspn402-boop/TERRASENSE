import os
import sys
import json
import psycopg2
from dotenv import load_dotenv
from fastapi.testclient import TestClient

load_dotenv()

# Add project root to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.main import app

def test_neon_connection():
    print("\n--- 1. AUDITING NEON POSTGRESQL CONNECTION & SCHEMA ---")
    db_url = os.environ.get("DATABASE_URL")
    assert db_url, "DATABASE_URL is missing from environment"
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    cur.execute("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_name IN ('user', 'session', 'account', 'verification', 'saved_reports');
    """)
    tables = [r[0] for r in cur.fetchall()]
    print(f"Neon tables found: {tables}")
    assert 'user' in tables, "Table 'user' is missing"
    assert 'session' in tables, "Table 'session' is missing"
    assert 'account' in tables, "Table 'account' is missing"
    assert 'verification' in tables, "Table 'verification' is missing"
    assert 'saved_reports' in tables, "Table 'saved_reports' is missing"

    # Check foreign key cascade on saved_reports
    cur.execute("""
        SELECT tc.constraint_name, rc.delete_rule 
        FROM information_schema.table_constraints AS tc 
        JOIN information_schema.referential_constraints AS rc 
          ON tc.constraint_name = rc.constraint_name 
        WHERE tc.table_name = 'saved_reports';
    """)
    fk_info = cur.fetchall()
    print(f"saved_reports Foreign Key Info: {fk_info}")
    cur.close()
    conn.close()
    print("[OK] Neon PostgreSQL audit PASSED")

def test_ml_pipeline():
    print("\n--- 2. AUDITING MACHINE LEARNING PIPELINE & METRICS ---")
    metrics_path = os.path.join(os.path.dirname(__file__), "..", "backend", "models", "metrics.json")
    model_path = os.path.join(os.path.dirname(__file__), "..", "backend", "models", "flood_model.joblib")
    assert os.path.exists(metrics_path), "metrics.json does not exist"
    assert os.path.exists(model_path), "flood_model.joblib does not exist"

    with open(metrics_path, "r") as f:
        metrics = json.load(f)

    print(f"Model Type: {metrics.get('model_type')}")
    print(f"Sample Size: {metrics.get('sample_size')} records")
    eval_m = metrics.get("evaluation", {})
    print(f"Accuracy:  {eval_m.get('accuracy')}")
    print(f"Precision: {eval_m.get('precision')}")
    print(f"Recall:    {eval_m.get('recall')}")
    print(f"F1 Score:  {eval_m.get('f1_score')}")
    print(f"ROC-AUC:   {eval_m.get('roc_auc')}")

    assert eval_m.get("accuracy") > 0.90, "Model accuracy is too low"
    assert eval_m.get("roc_auc") > 0.95, "ROC-AUC is below standard"
    assert len(metrics.get("feature_importances", [])) == 8, "Missing feature importances"
    print("[OK] ML Pipeline audit PASSED")

def test_backend_api():
    print("\n--- 3. AUDITING BACKEND API & ENVIRONMENTAL MODULES ---")
    client = TestClient(app)

    # 1. Health
    h = client.get("/health").json()
    print(f"Health: {h}")
    assert h["status"] == "ok"
    assert h["ml_model_loaded"] is True
    assert h["evaluation_metrics_available"] is True

    # 2. Locations
    locs = client.get("/locations").json()
    assert len(locs["items"]) >= 4
    print(f"Locations count: {len(locs['items'])}")

    # 3. Environmental modules & Risk for each location
    for loc in locs["items"]:
        lid = loc["id"]
        risk = client.get(f"/risk/{lid}").json()
        assert "flood" in risk
        assert "heat" in risk
        assert "air_quality" in risk
        assert "water_quality" in risk
        assert "soil" in risk
        assert "decision_engine" in risk
        assert "explainable_ai" in risk

        # Verify values
        assert 0 <= risk["flood"]["combined_score"] <= 100
        assert 0.0 <= risk["flood"]["ml_prediction"]["flood_probability"] <= 1.0
        assert 0 <= risk["heat"]["score"] <= 100
        assert 0 <= risk["air_quality"]["score"] <= 100
        assert 0 <= risk["water_quality"]["score"] <= 100
        assert 0 <= risk["soil"]["score"] <= 100
        assert risk["decision_engine"]["decision"]
        assert len(risk["decision_engine"]["recommendations"]) >= 1
        print(f"Location {lid}: Overall Hazard={risk['decision_engine']['overall_score']}, Decision={risk['decision_engine']['decision']}")

    # 4. What-If Scenario Calculation
    wi = client.post("/risk/riverbend/what-if", json={
        "rainfall_24h_mm": 110.0,
        "river_gauge_m": 5.8,
        "soil_saturation_pct": 95.0
    }).json()
    print(f"What-If: Delta Composite Flood Score={wi['deltas']['delta_composite_flood_score']}, Delta Prob={wi['deltas']['delta_probability_pct']}%")
    assert wi["deltas"]["delta_composite_flood_score"] > 0, "What-If risk score did not increase with heavy rainfall scenario"
    assert wi["deltas"]["delta_probability_pct"] > 0, "What-If probability did not increase with heavy rainfall scenario"

    # 5. History
    hist = client.get("/history/riverbend?range_type=24 hours").json()
    assert len(hist["points"]) == 8

    # 6. ML Metrics
    m = client.get("/ml/metrics").json()
    assert "evaluation" in m
    print("[OK] Backend API audit PASSED")

def test_database_persistence_and_cascade():
    print("\n--- 4. AUDITING DATABASE USER & REPORT CASCADE ---")
    db_url = os.environ.get("DATABASE_URL")
    conn = psycopg2.connect(db_url)
    conn.autocommit = True
    cur = conn.cursor()

    # Create a test user directly in user table
    test_user_id = "test-audit-user-12345"
    test_email = "test-audit@terrasense.ai"
    cur.execute("DELETE FROM \"user\" WHERE id = %s OR email = %s;", (test_user_id, test_email))
    cur.execute("""
        INSERT INTO "user" (id, name, email, "emailVerified", "createdAt", "updatedAt")
        VALUES (%s, 'Audit Tester', %s, true, NOW(), NOW())
        RETURNING id;
    """, (test_user_id, test_email))
    inserted_user = cur.fetchone()[0]
    assert inserted_user == test_user_id

    # Insert a saved report for this user
    cur.execute("""
        INSERT INTO saved_reports ("userId", title, location, summary, category, "riskLevel", "riskScore", decision, recommendation)
        VALUES (%s, 'Automated Test Report', 'Riverbend District', 'Audit verified', 'Flood', 'High', 78, 'Activate Barriers', 'Deploy mobile pumps')
        RETURNING id;
    """, (test_user_id,))
    report_id = cur.fetchone()[0]
    print(f"Created saved report #{report_id} for user {test_user_id}")

    # Query report back
    cur.execute("SELECT title, location, \"riskScore\" FROM saved_reports WHERE id = %s AND \"userId\" = %s;", (report_id, test_user_id))
    row = cur.fetchone()
    assert row[0] == 'Automated Test Report'
    assert row[1] == 'Riverbend District'
    assert row[2] == 78
    print("Verified report persistence and data integrity.")

    # Test CASCADE DELETE: deleting user must automatically delete the report
    cur.execute("DELETE FROM \"user\" WHERE id = %s;", (test_user_id,))
    cur.execute("SELECT id FROM saved_reports WHERE id = %s;", (report_id,))
    remaining = cur.fetchone()
    assert remaining is None, "ON DELETE CASCADE failed: report still exists after user was deleted"
    print("[OK] ON DELETE CASCADE verified: report was automatically removed upon user deletion.")

    cur.close()
    conn.close()
    print("[OK] Database Persistence & Cascade audit PASSED")

if __name__ == "__main__":
    test_neon_connection()
    test_ml_pipeline()
    test_backend_api()
    test_database_persistence_and_cascade()
    print("\n=======================================================")
    print("ALL AUDIT & END-TO-END VERIFICATION CHECKS PASSED 100%")
    print("=======================================================\n")
