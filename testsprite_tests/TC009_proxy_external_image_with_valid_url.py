import requests

BASE_URL = "http://localhost:3001"
TIMEOUT = 30

def test_proxy_external_image_with_valid_url():
    # Valid image URL to proxy - using Google's logo as it's highly reliable and available
    valid_image_url = "https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png"
    
    # Test case: successful fetch with valid URL parameter
    try:
        response = requests.get(
            f"{BASE_URL}/api/proxy-image",
            params={"url": valid_image_url},
            timeout=TIMEOUT
        )
        assert response.status_code == 200, f"Expected status 200, got {response.status_code}"
        
        # The proxy returns JSON with dataUrl and contentType fields
        data = response.json()
        assert "dataUrl" in data, "Expected 'dataUrl' field in response"
        assert "contentType" in data, "Expected 'contentType' field in response"
        assert data["dataUrl"].startswith("data:image/"), f"Expected data URL to start with 'data:image/', got {data['dataUrl'][:50]}"
        assert data["contentType"].startswith("image/"), f"Expected image content type, got {data['contentType']}"
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    # Test case: missing URL parameter returns 400
    try:
        response = requests.get(
            f"{BASE_URL}/api/proxy-image",
            timeout=TIMEOUT
        )
        assert response.status_code == 400, f"Expected status 400 for missing url param, got {response.status_code}"
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

test_proxy_external_image_with_valid_url()
