import requests
import time

BASE_URL = "http://localhost:3001"
TIMEOUT = 30

def test_get_authenticated_user_profile():
    # First, register a new user uniquely for this test
    register_url = f"{BASE_URL}/api/auth/register"
    login_url = f"{BASE_URL}/api/auth/login"
    me_url = f"{BASE_URL}/api/auth/me"
    
    # Use timestamp to ensure unique username for each test run
    test_username = f"testuser_tc003_{int(time.time())}"
    test_password = "TestPass123!"
    test_display_name = "Test User TC003"

    headers = {"Content-Type": "application/json"}

    # Register user
    reg_payload = {
        "username": test_username,
        "password": test_password,
        "displayName": test_display_name
    }
    reg_response = requests.post(register_url, json=reg_payload, headers=headers, timeout=TIMEOUT)
    assert reg_response.status_code == 201, f"User registration failed: {reg_response.text}"
    reg_json = reg_response.json()
    assert "token" in reg_json and "user" in reg_json, "Registration response missing token or user"

    # Login user to get valid token (to ensure token is valid and fresh)
    login_payload = {
        "username": test_username,
        "password": test_password
    }
    login_response = requests.post(login_url, json=login_payload, headers=headers, timeout=TIMEOUT)
    assert login_response.status_code == 200, f"User login failed: {login_response.text}"
    login_json = login_response.json()
    assert "token" in login_json and "user" in login_json, "Login response missing token or user"
    token = login_json["token"]

    try:
        # Test with valid token - should succeed and return user profile matching logged in user
        auth_headers = {
            "Authorization": f"Bearer {token}"
        }
        me_response = requests.get(me_url, headers=auth_headers, timeout=TIMEOUT)
        assert me_response.status_code == 200, f"Get profile failed with valid token: {me_response.text}"
        profile = me_response.json()
        assert profile.get("username") == test_username, "Profile username mismatch"
        assert profile.get("displayName") == test_display_name, "Profile displayName mismatch"
        assert "id" in profile and "role" in profile, "Profile missing required fields"

        # Test with missing token - expect 401 Unauthorized or equivalent (not documented, test common practice)
        no_auth_response = requests.get(me_url, timeout=TIMEOUT)
        # The API requires valid JWT token so expect 401/403, 404 is for user not found only with valid token
        assert no_auth_response.status_code in (401, 403), f"Expected 401 or 403 for missing token, got {no_auth_response.status_code}"

        # Test with invalid token - expect 401/403
        invalid_headers = {
            "Authorization": "Bearer invalid.token.value"
        }
        invalid_token_response = requests.get(me_url, headers=invalid_headers, timeout=TIMEOUT)
        assert invalid_token_response.status_code in (401, 403), f"Expected 401 or 403 for invalid token, got {invalid_token_response.status_code}"

        # Simulate user not found condition:
        # Since user ID is from token, normally server would lookup user.
        # We can try to modify the token payload or use a revoked token.
        # However, since no direct method provided, test by deleting user then accessing.
        # No endpoint provided to delete user, so this part can't be done directly.
        # Instead, verify 404 on /api/auth/me if token valid but user not found.
        # We will try to hack this by using a token for user that doesn't exist.
        # Alternative: Use token from newly registered user, then after deleting user.
        # Since no delete user endpoint or ability, skip this part.

    finally:
        # Clean up: no user deletion endpoint documented, so no cleanup possible.
        # In a real scenario, we would delete the created user here.
        pass

test_get_authenticated_user_profile()