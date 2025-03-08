"""
Tests for authentication API
"""
import json

def test_login_success(client):
    """Test successful login."""
    response = client.post(
        '/api/auth/login',
        json={'username': 'admin', 'password': 'admin'}
    )
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['success'] is True
    assert 'message' in data
    assert 'Set-Cookie' in response.headers

def test_login_missing_fields(client):
    """Test login with missing fields."""
    # Test missing username
    response = client.post(
        '/api/auth/login',
        json={'password': 'admin'}
    )
    
    assert response.status_code == 400
    
    # Test missing password
    response = client.post(
        '/api/auth/login',
        json={'username': 'admin'}
    )
    
    assert response.status_code == 400
    
    # Test empty request
    response = client.post(
        '/api/auth/login',
        json={}
    )
    
    assert response.status_code == 400

def test_login_invalid_credentials(client):
    """Test login with invalid credentials."""
    response = client.post(
        '/api/auth/login',
        json={'username': 'admin', 'password': 'wrong'}
    )
    
    assert response.status_code == 401
    data = json.loads(response.data)
    assert 'error' in data

def test_logout(client, auth):
    """Test logout functionality."""
    # First login
    auth.login()
    
    # Then logout
    response = client.post('/api/auth/logout')
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['success'] is True

def test_auth_status(client):
    """Test authentication status endpoint when not authenticated."""
    # Check status without login
    response = client.get('/api/auth/status')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['authenticated'] is False

def test_auth_status_authenticated(client, auth):
    """Test authentication status endpoint when authenticated."""
    # Login
    auth.login()
    
    # Check status after login with the session cookie
    response = client.get('/api/auth/status', headers={'Cookie': auth.cookie})
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['authenticated'] is True
    assert 'user' in data

def test_change_password(client, auth):
    """Test password change functionality."""
    # Login with default credentials
    auth.login()
    
    # Change password
    response = client.post(
        '/api/auth/change-password',
        json={'current_password': 'admin', 'new_password': 'newpassword123'},
        headers={'Cookie': auth.cookie}
    )
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['success'] is True
    
    # Logout
    auth.logout()
    
    # Try login with old password (should fail)
    response = client.post(
        '/api/auth/login',
        json={'username': 'admin', 'password': 'admin'}
    )
    assert response.status_code == 401
    
    # Login with new password
    response = client.post(
        '/api/auth/login',
        json={'username': 'admin', 'password': 'newpassword123'}
    )
    assert response.status_code == 200
    
    # Reset password back to default for other tests
    new_cookie = response.headers.get('Set-Cookie')
    response = client.post(
        '/api/auth/change-password',
        json={'current_password': 'newpassword123', 'new_password': 'admin'},
        headers={'Cookie': new_cookie}
    )
    assert response.status_code == 200

def test_change_password_validation(client, auth):
    """Test password change validation."""
    auth.login()
    
    # Test missing current password
    response = client.post(
        '/api/auth/change-password',
        json={'new_password': 'newpass'},
        headers={'Cookie': auth.cookie}
    )
    assert response.status_code == 400
    
    # Test missing new password
    response = client.post(
        '/api/auth/change-password',
        json={'current_password': 'admin'},
        headers={'Cookie': auth.cookie}
    )
    assert response.status_code == 400
    
    # Test incorrect current password
    response = client.post(
        '/api/auth/change-password',
        json={'current_password': 'wrong', 'new_password': 'newpass'},
        headers={'Cookie': auth.cookie}
    )
    assert response.status_code == 401
    
    # Test password too short
    response = client.post(
        '/api/auth/change-password',
        json={'current_password': 'admin', 'new_password': 'short'},
        headers={'Cookie': auth.cookie}
    )
    assert response.status_code == 400

def test_get_admin_info(client, auth):
    """Test getting admin info."""
    auth.login()
    
    response = client.get(
        '/api/auth/admin-info',
        headers={'Cookie': auth.cookie}
    )
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'username' in data
    assert data['username'] == 'admin'

def test_update_username(client, auth):
    """Test updating admin username."""
    auth.login()
    
    # Update username
    response = client.post(
        '/api/auth/update-username',
        json={'username': 'newadmin', 'password': 'admin'},
        headers={'Cookie': auth.cookie}
    )
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['success'] is True
    
    # Verify username change by getting admin info
    new_cookie = response.headers.get('Set-Cookie') or auth.cookie
    response = client.get(
        '/api/auth/admin-info',
        headers={'Cookie': new_cookie}
    )
    
    data = json.loads(response.data)
    assert data['username'] == 'newadmin'
    
    # Change username back for other tests
    response = client.post(
        '/api/auth/update-username',
        json={'username': 'admin', 'password': 'admin'},
        headers={'Cookie': new_cookie or auth.cookie}
    )
    assert response.status_code == 200

def test_update_username_validation(client, auth):
    """Test username update validation."""
    auth.login()
    
    # Test missing username
    response = client.post(
        '/api/auth/update-username',
        json={'password': 'admin'},
        headers={'Cookie': auth.cookie}
    )
    assert response.status_code == 400
    
    # Test missing password
    response = client.post(
        '/api/auth/update-username',
        json={'username': 'newadmin'},
        headers={'Cookie': auth.cookie}
    )
    assert response.status_code == 400
    
    # Test username too short
    response = client.post(
        '/api/auth/update-username',
        json={'username': 'na', 'password': 'admin'},
        headers={'Cookie': auth.cookie}
    )
    assert response.status_code == 400
    
    # Test incorrect password
    response = client.post(
        '/api/auth/update-username',
        json={'username': 'newadmin', 'password': 'wrong'},
        headers={'Cookie': auth.cookie}
    )
    assert response.status_code == 401
