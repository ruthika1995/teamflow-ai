import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "TeamFlow AI"

def test_demo_users():
    response = client.get("/api/auth/demo-users")
    assert response.status_code == 200
    users = response.json()
    assert len(users) >= 4
    emails = [u["email"] for u in users]
    assert "ruthi@teamflow.ai" in emails
    assert "rahul@teamflow.ai" in emails

def test_login_and_me():
    res = client.post("/api/auth/login", json={"email": "ruthi@teamflow.ai", "password": "password123"})
    assert res.status_code == 200
    token = res.json()["access_token"]
    assert token

    headers = {"Authorization": f"Bearer {token}"}
    me_res = client.get("/api/auth/me", headers=headers)
    assert me_res.status_code == 200
    assert me_res.json()["email"] == "ruthi@teamflow.ai"

def test_projects_and_tasks():
    # Login as Ruthi
    login_res = client.post("/api/auth/login", json={"email": "ruthi@teamflow.ai", "password": "password123"})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # List workspaces
    ws_res = client.get("/api/workspaces", headers=headers)
    assert ws_res.status_code == 200
    workspaces = ws_res.json()
    assert len(workspaces) > 0
    ws_id = workspaces[0]["id"]

    # List projects in workspace
    proj_res = client.get(f"/api/projects?workspace_id={ws_id}", headers=headers)
    assert proj_res.status_code == 200
    projects = proj_res.json()
    assert len(projects) > 0
    project_id = projects[0]["id"]

    # List tasks
    task_res = client.get(f"/api/tasks?project_id={project_id}", headers=headers)
    assert task_res.status_code == 200
    tasks = task_res.json()
    assert len(tasks) > 0

    # Move a task
    t_id = tasks[0]["id"]
    move_res = client.patch(f"/api/tasks/{t_id}/move", json={"status": "DONE"}, headers=headers)
    assert move_res.status_code == 200
    assert move_res.json()["status"] == "DONE"

def test_ai_planner():
    # Login as Ruthi
    login_res = client.post("/api/auth/login", json={"email": "ruthi@teamflow.ai", "password": "password123"})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    proj_res = client.get("/api/projects", headers=headers)
    project_id = proj_res.json()[0]["id"]

    plan_res = client.post(
        "/api/ai/project-plan",
        json={"project_id": project_id, "prompt": "Build an AI customer support portal with real-time analytics"},
        headers=headers
    )
    assert plan_res.status_code == 200
    plan = plan_res.json()
    assert len(plan["milestones"]) > 0
    assert plan["total_estimated_hours"] > 0

def test_ai_risk_analysis():
    login_res = client.post("/api/auth/login", json={"email": "ruthi@teamflow.ai", "password": "password123"})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    proj_res = client.get("/api/projects", headers=headers)
    project_id = proj_res.json()[0]["id"]

    risk_res = client.post("/api/ai/risk-analysis", json={"project_id": project_id}, headers=headers)
    assert risk_res.status_code == 200
    risk = risk_res.json()
    assert risk["risk_level"] in ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
    assert len(risk["recommendations"]) > 0
