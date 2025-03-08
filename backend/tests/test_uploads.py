"""
Tests for uploads API
"""
import io

def test_list_uploads(client):
    """Test listing uploads returns empty list initially."""
    response = client.get('/api/uploads/list')
    assert response.status_code == 200
    assert isinstance(response.get_json(), list)
    assert len(response.get_json()) == 0

def test_upload_file(client, auth):
    """Test uploading a file."""
    # Create a test file
    file_content = b'test file content'
    data = {'file': (io.BytesIO(file_content), 'test.txt')}
    
    # Upload the file with authentication
    response = client.post(
        '/api/uploads',
        data=data,
        content_type='multipart/form-data',
        headers={'Cookie': auth.cookie}
    )
    
    assert response.status_code == 201
    response_data = response.get_json()
    assert 'url' in response_data
    assert response_data['url'].startswith('/static/uploads/')
    assert response_data['url'].endswith('_test.txt')

def test_upload_unsupported_file(client, auth):
    """Test uploading an unsupported file type."""
    # Create a test file with unsupported extension
    file_content = b'test file content'
    data = {'file': (io.BytesIO(file_content), 'test.exe')}
    
    # Upload the file with authentication
    response = client.post(
        '/api/uploads',
        data=data,
        content_type='multipart/form-data',
        headers={'Cookie': auth.cookie}
    )
    
    assert response.status_code == 400
    response_data = response.get_json()
    assert 'error' in response_data
    assert 'not allowed' in response_data['error']

def test_delete_uploaded_file(client, auth):
    """Test deleting an uploaded file."""
    # First upload a file
    file_content = b'test file content'
    data = {'file': (io.BytesIO(file_content), 'delete-test.txt')}
    
    upload_response = client.post(
        '/api/uploads',
        data=data,
        content_type='multipart/form-data',
        headers={'Cookie': auth.cookie}
    )
    
    url = upload_response.get_json()['url']
    filename = url.split('/')[-1]
    
    # Now delete the file
    response = client.delete(
        f'/api/uploads/{filename}',
        headers={'Cookie': auth.cookie}
    )
    
    assert response.status_code == 200
    response_data = response.get_json()
    assert 'success' in response_data
    assert response_data['success'] is True

def test_authentication_required_for_delete(client, auth):
    """Test that authentication is required for file deletion."""
    # First upload a file with authentication
    file_content = b'test file content'
    data = {'file': (io.BytesIO(file_content), 'auth-test.txt')}
    
    upload_response = client.post(
        '/api/uploads',
        data=data,
        content_type='multipart/form-data',
        headers={'Cookie': auth.cookie}
    )
    
    url = upload_response.get_json()['url']
    filename = url.split('/')[-1]
    
    # Try to delete without authentication
    # First logout to clear session
    auth.logout()
    
    # Then try to delete
    response = client.delete(f'/api/uploads/{filename}')
    assert response.status_code == 401
