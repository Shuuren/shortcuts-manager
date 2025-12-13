import requests
import uuid

BASE_URL = "http://localhost:3001"
TIMEOUT = 30

def test_update_user_profile_with_password_validation():
    # Step 1: Register a new user to test with
    register_url = f"{BASE_URL}/api/auth/register"
    username = f"testuser_{uuid.uuid4().hex[:8]}"
    password = "OldPassword123!"
    display_name = "Initial DisplayName"
    register_payload = {
        "username": username,
        "password": password,
        "displayName": display_name
    }
    try:
        reg_resp = requests.post(register_url, json=register_payload, timeout=TIMEOUT)
        assert reg_resp.status_code == 201, f"User registration failed: {reg_resp.text}"
        reg_data = reg_resp.json()
        token = reg_data.get("token")
        assert token, "No token returned on registration"

        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }

        update_url = f"{BASE_URL}/api/auth/me"

        # Step 2: Attempt to change password without currentPassword -> Expect 400
        payload_missing_current = {
            "newPassword": "NewPassword456!",
            "displayName": "Updated DisplayName"
        }
        resp_missing_current = requests.put(update_url, json=payload_missing_current, headers=headers, timeout=TIMEOUT)
        assert resp_missing_current.status_code == 400, (
            f"Expected 400 for missing currentPassword, got {resp_missing_current.status_code}")

        # Step 3: Attempt to change password with incorrect currentPassword -> Expect 401
        payload_wrong_current = {
            "currentPassword": "WrongPassword!",
            "newPassword": "NewPassword456!",
            "displayName": "Updated DisplayName"
        }
        resp_wrong_current = requests.put(update_url, json=payload_wrong_current, headers=headers, timeout=TIMEOUT)
        assert resp_wrong_current.status_code == 401, (
            f"Expected 401 for incorrect currentPassword, got {resp_wrong_current.status_code}")

        # Step 4: Successful update - change displayName only (no password change)
        payload_update_displayname = {
            "displayName": "Updated DisplayName Only"
        }
        resp_update_displayname = requests.put(update_url, json=payload_update_displayname, headers=headers, timeout=TIMEOUT)
        assert resp_update_displayname.status_code == 200, (
            f"Failed to update displayName only: {resp_update_displayname.text}")
        data_displayname = resp_update_displayname.json()
        user_data = data_displayname.get("user")
        new_token = data_displayname.get("token")
        assert user_data is not None, "No user object in response"
        assert user_data.get("displayName") == "Updated DisplayName Only", "DisplayName was not updated"
        assert new_token is not None, "No new JWT token issued after displayName update"

        # Step 5: Successful update - change password with correct currentPassword
        payload_change_password = {
            "currentPassword": password,
            "newPassword": "NewPassword456!",
            "displayName": "Updated DisplayName Final"
        }
        # Use the new token for authorization
        headers_password_change = {
            "Authorization": f"Bearer {new_token}",
            "Content-Type": "application/json"
        }
        resp_change_password = requests.put(update_url, json=payload_change_password, headers=headers_password_change, timeout=TIMEOUT)
        assert resp_change_password.status_code == 200, (
            f"Failed to update password: {resp_change_password.text}")
        data_password = resp_change_password.json()
        user_after_pw = data_password.get("user")
        new_token_after_pw = data_password.get("token")
        assert user_after_pw is not None, "No user object in response after password change"
        assert user_after_pw.get("displayName") == "Updated DisplayName Final", "DisplayName was not updated on password change"
        assert new_token_after_pw is not None, "No new JWT token issued after password change"

        # Step 6: Verify login with old password fails
        login_url = f"{BASE_URL}/api/auth/login"
        login_old_pw_payload = {
            "username": username,
            "password": password
        }
        resp_login_old_pw = requests.post(login_url, json=login_old_pw_payload, timeout=TIMEOUT)
        assert resp_login_old_pw.status_code == 401, "Old password should not work after password change"

        # Step 7: Verify login with new password succeeds
        login_new_pw_payload = {
            "username": username,
            "password": "NewPassword456!"
        }
        resp_login_new_pw = requests.post(login_url, json=login_new_pw_payload, timeout=TIMEOUT)
        assert resp_login_new_pw.status_code == 200, "Login with new password failed"
        login_data = resp_login_new_pw.json()
        assert "token" in login_data, "No token returned on login with new password"

    finally:
        # Cleanup: Delete the created user if API to delete user exists (not specified in PRD)
        # Since there's no delete user endpoint in the PRD, skip cleanup.
        pass

test_update_user_profile_with_password_validation()