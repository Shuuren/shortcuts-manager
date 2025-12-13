import requests
from requests.exceptions import RequestException

BASE_URL = "http://localhost:3001"
TIMEOUT = 30

# Credentials for test users - using actual database users
USERS = {
    "admin": {"username": "renshu", "password": "renshu123"},
    "demo": {"username": "gabby_demo", "password": "gabby123"},
    "guest": None  # No auth for guest
}

def login_get_token(username, password):
    try:
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"username": username, "password": password},
            timeout=TIMEOUT,
        )
        response.raise_for_status()
        data = response.json()
        token = data.get("token")
        assert token, "Token not found in login response"
        return token
    except (RequestException, AssertionError) as e:
        raise RuntimeError(f"Login failed for user {username}: {e}")

def create_item(token, type_, item_data):
    headers = {"Authorization": f"Bearer {token}"} if token else {}
    try:
        resp = requests.post(
            f"{BASE_URL}/api/shortcuts/{type_}",
            json=item_data,
            headers=headers,
            timeout=TIMEOUT,
        )
        return resp
    except RequestException as e:
        raise RuntimeError(f"Request to create item failed: {e}")

def delete_item(token, type_, item_id):
    headers = {"Authorization": f"Bearer {token}"} if token else {}
    try:
        resp = requests.delete(
            f"{BASE_URL}/api/shortcuts/{type_}/{item_id}",
            headers=headers,
            timeout=TIMEOUT,
        )
        return resp
    except RequestException as e:
        raise RuntimeError(f"Request to delete item failed: {e}")

def test_create_new_shortcut_group_or_app_with_authorization():
    # Item data samples for each collection type
    sample_items = {
        "shortcuts": {
            # generic shortcut data
            "sequence": ["Ctrl", "Shift", "N"],
            "category": "TestCategory",
            "app": "TestApp",
            "action": "TestAction",
            "notes": "Test notes",
            "appId": "app_test_123"
        },
        "groups": {
            "name": "Test Group",
            "icon": "test_icon",
            "color": "#123456"
        },
        "apps": {
            "name": "Test App",
            "icon": "dGVzdF9pbWFnZQ==",  # base64 encoded string 'test_image'
            "category": "Utility",
            "linkedShortcuts": []
        },
        "leaderShortcuts": {
            "sequence": ["Cmd", "L"],
            "category": "LeaderCategory",
            "app": "LeaderApp",
            "action": "LeaderAction",
            "notes": None,
            "appId": "leader_app_id"
        },
        "raycastShortcuts": {
            "action": "RaycastAction",
            "key": "R",
            "modifiers": ["Cmd", "Shift"],
            "group": "RaycastGroup",
            "type": "RaycastType",
            "description": "Raycast test shortcut"
        },
        "systemShortcuts": {
            "action": "SystemAction",
            "key": "S",
            "modifiers": ["Ctrl"],
            "group": "SystemGroup",
            "description": None
        },
        "leaderGroups": {
            "name": "Leader Group",
            "icon": "leader_icon_data",
            "color": "#abcdef"
        },
        "raycastGroups": {
            "name": "Raycast Group",
            "icon": "raycast_icon_data",
            "color": "#fedcba"
        },
        "systemGroups": {
            "name": "System Group",
            "icon": "system_icon_data",
            "color": "#654321"
        }
    }

    authorized_users = ["admin", "demo"]
    unauthorized_users = ["guest"]  # Only guest (no auth) is tested for unauthorized access
    types_to_test = list(sample_items.keys())

    for user_key in authorized_users + unauthorized_users:
        creds = USERS[user_key]
        token = None
        if creds:
            token = login_get_token(creds["username"], creds["password"])
        for type_ in types_to_test:
            item_data = sample_items[type_]

            # Make the POST request to create the item
            response = create_item(token, type_, item_data)

            if user_key in authorized_users:
                # Should be allowed to create, expect 200 and returned json object
                try:
                    assert response.status_code == 200, (
                        f"User '{user_key}' with role allowed to create '{type_}' "
                        f"but got status {response.status_code}: {response.text}"
                    )
                    # Response should be a JSON object
                    resp_json = response.json()
                    assert isinstance(resp_json, dict), "Response JSON is not an object"
                    # We expect some kind of id or success info, but schema is flexible so accept any dict
                except (AssertionError, ValueError) as err:
                    raise AssertionError(f"Authorized create failed: {err}")

                # Attempt to cleanup: delete created item if id is returned or try fetch created id from server
                # Since API spec not explicit about return id, try to guess id or skip cleanup
                # For test stability we try to delete if 'id' in resp_json
                item_id = resp_json.get("id")
                if item_id:
                    del_resp = delete_item(token, type_, item_id)
                    try:
                        assert del_resp.status_code == 200, (
                            f"Cleanup delete failed with status {del_resp.status_code}: {del_resp.text}"
                        )
                        del_json = del_resp.json()
                        assert del_json.get("success") is True, "Delete response 'success' is not True"
                    except (AssertionError, ValueError) as err:
                        raise AssertionError(f"Cleanup delete failed: {err}")
            else:
                # Unauthorized user (guest): expect 401 (no auth) or 403 (forbidden)
                try:
                    assert response.status_code in (401, 403), (
                        f"User '{user_key}' without permission should get 401 or 403 for creating '{type_}', "
                        f"got {response.status_code}: {response.text}"
                    )
                except AssertionError as err:
                    raise

test_create_new_shortcut_group_or_app_with_authorization()