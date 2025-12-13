import requests

BASE_URL = "http://localhost:3001"
LOGIN_ENDPOINT = f"{BASE_URL}/api/auth/login"
TIMEOUT = 30

def test_user_login_with_valid_credentials():
    # Define valid and invalid credentials for testing
    # Using the actual admin user credentials from the database
    valid_credentials = {
        "username": "renshu",
        "password": "renshu123"
    }
    invalid_credentials = {
        "username": "renshu",
        "password": "WrongPass!"
    }

    headers = {
        "Content-Type": "application/json"
    }

    try:
        # First, to ensure the valid user exists, attempt login:
        response = requests.post(
            LOGIN_ENDPOINT,
            json=valid_credentials,
            headers=headers,
            timeout=TIMEOUT
        )
        # Successful login should return HTTP 200
        assert response.status_code == 200, f"Expected status 200, got {response.status_code}"

        data = response.json()
        # Assert presence and validity of token and user information
        assert "token" in data and isinstance(data["token"], str) and data["token"], "JWT token missing or invalid"
        assert "user" in data and isinstance(data["user"], dict), "User details missing or invalid"
        user = data["user"]
        # Validate required user fields
        assert "id" in user and isinstance(user["id"], str) and user["id"], "User ID missing or invalid"
        assert user.get("username") == valid_credentials["username"], f"Username mismatch: expected {valid_credentials['username']}, got {user.get('username')}"
        assert "role" in user and user["role"] in {"admin", "demo", "client"}, f"User role invalid or missing: {user.get('role')}"

        # Now test invalid credentials
        response_invalid = requests.post(
            LOGIN_ENDPOINT,
            json=invalid_credentials,
            headers=headers,
            timeout=TIMEOUT
        )
        # Invalid login should return HTTP 401
        assert response_invalid.status_code == 401, f"Expected status 401 for invalid credentials, got {response_invalid.status_code}"

    except requests.exceptions.RequestException as e:
        assert False, f"Request failed: {e}"

test_user_login_with_valid_credentials()