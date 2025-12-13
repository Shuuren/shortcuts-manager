import requests
import uuid

BASE_URL = "http://localhost:3001"
REGISTER_ENDPOINT = f"{BASE_URL}/api/auth/register"
TIMEOUT = 30

def test_user_registration_unique_username():
    # Generate unique username
    unique_username = f"testuser_{uuid.uuid4().hex[:8]}"
    password = "TestPassword123!"
    display_name = "Test DisplayName"

    headers = {"Content-Type": "application/json"}

    # Payload for registration
    payload = {
        "username": unique_username,
        "password": password,
        "displayName": display_name
    }

    # 1. Register new user with unique username - expect 201 created
    try:
        response = requests.post(REGISTER_ENDPOINT, json=payload, headers=headers, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"Request to register user failed: {e}"

    assert response.status_code == 201, f"Expected HTTP 201 for new user registration, got {response.status_code}"
    json_data = response.json()
    assert "user" in json_data, "'user' field missing in response"
    assert "token" in json_data, "'token' field missing in response"
    user = json_data["user"]
    # Validate fields and role
    assert user.get("username") == unique_username.lower(), "Username in response does not match (should be lowercased)"
    expected_display_name = display_name if display_name else unique_username.lower()
    assert user.get("displayName") == expected_display_name, "Display name in response does not match"
    assert user.get("role") == "client", "User role should be 'client' by default"
    assert isinstance(json_data["token"], str) and len(json_data["token"]) > 0, "JWT token is missing or empty"

    # 2. Attempt to register again with same username - expect 400 error for duplicate username
    dup_payload = {
        "username": unique_username,
        "password": "AnotherPassword123!",
        "displayName": "Another DisplayName"
    }
    try:
        dup_response = requests.post(REGISTER_ENDPOINT, json=dup_payload, headers=headers, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"Request to register duplicate user failed: {e}"

    assert dup_response.status_code == 400, f"Expected HTTP 400 for duplicate username registration, got {dup_response.status_code}"

test_user_registration_unique_username()