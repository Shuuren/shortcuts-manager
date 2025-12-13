import requests

BASE_URL = "http://localhost:3001"
TIMEOUT = 30

def login(username: str, password: str) -> str:
    url = f"{BASE_URL}/api/auth/login"
    payload = {"username": username, "password": password}
    try:
        response = requests.post(url, json=payload, timeout=TIMEOUT)
        response.raise_for_status()
        data = response.json()
        token = data.get("token")
        assert token, "Login response missing token"
        return token
    except requests.RequestException as e:
        raise RuntimeError(f"Login failed for user {username}: {str(e)}")

def get_shortcuts(token: str):
    url = f"{BASE_URL}/api/shortcuts"
    headers = {"Authorization": f"Bearer {token}"}
    try:
        response = requests.get(url, headers=headers, timeout=TIMEOUT)
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        raise RuntimeError(f"Get shortcuts failed: {str(e)}")

def test_tc005_get_all_shortcuts_based_on_user_role():
    # Define test users and expected results per role
    # Using actual credentials from the database
    users = {
        "admin": {"username": "renshu", "password": "renshu123"},
        "demo": {"username": "gabby_demo", "password": "gabby123"},
        "guest": None  # guest means no auth token, should receive demo_db.json data
    }

    # Expected keys for the data
    expected_keys = {
        "leaderShortcuts",
        "raycastShortcuts",
        "systemShortcuts",
        "leaderGroups",
        "appsLibrary",
        "apps"
    }

    def is_full_data(data):
        # Admin gets full db.json data - arrays should be non-empty (assuming full data has shortcuts)
        # We only check type here (lists) and non-empty as heuristic
        if not all(k in data and isinstance(data[k], list) for k in expected_keys):
            return False
        # At least one of the shortcut lists should be non-empty to be considered full db.json
        return any(len(data[k]) > 0 for k in ["leaderShortcuts", "raycastShortcuts", "systemShortcuts"])

    def is_demo_data(data):
        # Demo and guest get demo_db.json data - arrays present, expected to be non-empty but can be smaller than admin
        if not all(k in data and isinstance(data[k], list) for k in expected_keys):
            return False
        # At least one shortcut list should be non-empty
        return any(len(data[k]) > 0 for k in ["leaderShortcuts", "raycastShortcuts", "systemShortcuts"])

    def is_empty_data(data):
        # Client users receive empty arrays
        if not all(k in data and isinstance(data[k], list) for k in expected_keys):
            return False
        return all(len(data[k]) == 0 for k in expected_keys)

    # Admin user test
    admin_token = login(users["admin"]["username"], users["admin"]["password"])
    admin_data = get_shortcuts(admin_token)
    assert is_full_data(admin_data), "Admin user should receive full db.json data with non-empty shortcut arrays"

    # Demo user test
    demo_token = login(users["demo"]["username"], users["demo"]["password"])
    demo_data = get_shortcuts(demo_token)
    assert is_demo_data(demo_data), "Demo user should receive demo_db.json data with shortcut arrays present"

    # Guest user test - no authorization header
    url = f"{BASE_URL}/api/shortcuts"
    response = requests.get(url, timeout=TIMEOUT)
    assert response.status_code == 200, f"Guest user request failed with status {response.status_code}"
    guest_data = response.json()
    assert is_demo_data(guest_data), "Guest user should receive demo_db.json data with shortcut arrays present"

test_tc005_get_all_shortcuts_based_on_user_role()