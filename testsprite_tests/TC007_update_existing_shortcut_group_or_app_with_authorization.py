import requests

BASE_URL = "http://localhost:3001"
TIMEOUT = 30

# Credentials for different roles - using actual database users
ADMIN_CREDENTIALS = {"username": "renshu", "password": "renshu123"}
DEMO_CREDENTIALS = {"username": "gabby_demo", "password": "gabby123"}

HEADERS = {"Content-Type": "application/json"}


def login(username, password):
    url = f"{BASE_URL}/api/auth/login"
    payload = {"username": username, "password": password}
    resp = requests.post(url, json=payload, timeout=TIMEOUT)
    resp.raise_for_status()
    return resp.json()["token"], resp.json()["user"]["id"]


def create_item(token, type_, data):
    url = f"{BASE_URL}/api/shortcuts/{type_}"
    headers = {"Authorization": f"Bearer {token}", **HEADERS}
    resp = requests.post(url, json=data, headers=headers, timeout=TIMEOUT)
    resp.raise_for_status()
    return resp.json()


def update_item(token, type_, item_id, data):
    url = f"{BASE_URL}/api/shortcuts/{type_}/{item_id}"
    headers = {"Authorization": f"Bearer {token}", **HEADERS}
    return requests.put(url, json=data, headers=headers, timeout=TIMEOUT)


def delete_item(token, type_, item_id):
    url = f"{BASE_URL}/api/shortcuts/{type_}/{item_id}"
    headers = {"Authorization": f"Bearer {token}"}
    resp = requests.delete(url, headers=headers, timeout=TIMEOUT)
    resp.raise_for_status()


def test_TC007_update_existing_shortcut_group_or_app_with_authorization():
    # Log in users
    admin_token, _ = login(ADMIN_CREDENTIALS["username"], ADMIN_CREDENTIALS["password"])
    demo_token, _ = login(DEMO_CREDENTIALS["username"], DEMO_CREDENTIALS["password"])

    # We'll test update on a group type for simplicity; could test others similarly
    type_ = "leaderGroups"

    # Sample creation data for group (without id to auto-generate)
    create_data = {
        "name": "Test Group for Update",
        "icon": "test-icon",
        "color": "#123456"
    }

    admin_item_id = None
    demo_item_id = None
    
    try:
        # Create item with admin token (goes to db.json)
        admin_create_resp = create_item(admin_token, type_, create_data)
        admin_item_id = admin_create_resp.get("id")
        assert admin_item_id is not None, "Failed to get created id for admin item"

        # Create item with demo token (goes to demo_db.json)
        demo_create_resp = create_item(demo_token, type_, create_data)
        demo_item_id = demo_create_resp.get("id")
        assert demo_item_id is not None, "Failed to get created id for demo item"

        # Updated data for PUT request
        update_data = {
            "name": "Updated Test Group",
            "icon": "updated-icon",
            "color": "#654321"
        }

        # 1. Valid update by admin on admin's item - expect 200
        resp = update_item(admin_token, type_, admin_item_id, update_data)
        assert resp.status_code == 200, f"Admin update failed with status {resp.status_code}"

        # 2. Valid update by demo user on demo's item - expect 200
        resp = update_item(demo_token, type_, demo_item_id, update_data)
        assert resp.status_code == 200, f"Demo user update failed with status {resp.status_code}"

        # 3. Invalid type - expect 400
        invalid_type = "invalidType123"
        resp_invalid_type = update_item(admin_token, invalid_type, admin_item_id, update_data)
        assert resp_invalid_type.status_code == 400, f"Expected 400 for invalid type, got {resp_invalid_type.status_code}"

        # 4. Non-existent item - expect 404
        fake_id = "0000000000abcdef00000000"
        resp_nonexistent = update_item(admin_token, type_, fake_id, update_data)
        assert resp_nonexistent.status_code == 404, f"Expected 404 for nonexistent id, got {resp_nonexistent.status_code}"

        # 5. Unauthorized user (guest with no token) tries update - expect 401 or 403
        resp_unauth = update_item(None, type_, admin_item_id, update_data)
        assert resp_unauth.status_code in (401, 403), f"Expected 401 or 403 for unauthorized user, got {resp_unauth.status_code}"

    finally:
        # Cleanup: delete the created items if they exist
        if admin_item_id and admin_token:
            try:
                delete_item(admin_token, type_, admin_item_id)
            except Exception:
                pass
        if demo_item_id and demo_token:
            try:
                delete_item(demo_token, type_, demo_item_id)
            except Exception:
                pass


test_TC007_update_existing_shortcut_group_or_app_with_authorization()