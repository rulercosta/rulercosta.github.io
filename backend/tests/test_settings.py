"""
Tests for settings API
"""
import json

def test_get_settings(client):
    """Test getting all settings."""
    response = client.get('/api/settings')
    assert response.status_code == 200
    settings = json.loads(response.data)
    assert isinstance(settings, dict)
    assert 'site_title' in settings
    assert 'site_description' in settings
    assert 'posts_per_page' in settings
    assert 'introduction' in settings
    # Check for social media URL settings
    assert 'github_url' in settings
    assert 'linkedin_url' in settings
    assert 'twitter_url' in settings

def test_get_setting(client):
    """Test getting a specific setting."""
    response = client.get('/api/settings/site_title')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'site_title' in data
    assert data['site_title'] == 'My Blog'

def test_update_setting(client, auth):
    """Test updating a specific setting."""
    # Update the setting
    response = client.put(
        '/api/settings/site_title',
        json={'value': 'Updated Title'},
        headers={'Cookie': auth.cookie}
    )
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['success'] is True
    
    # Verify the update
    response = client.get('/api/settings/site_title')
    data = json.loads(response.data)
    assert data['site_title'] == 'Updated Title'

def test_update_social_url_setting(client, auth):
    """Test updating social URL settings."""
    # Update GitHub URL
    response = client.put(
        '/api/settings/github_url',
        json={'value': 'https://github.com/username'},
        headers={'Cookie': auth.cookie}
    )
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['success'] is True
    
    # Verify the GitHub URL update
    response = client.get('/api/settings/github_url')
    data = json.loads(response.data)
    assert data['github_url'] == 'https://github.com/username'

def test_update_multiple_settings(client, auth):
    """Test updating multiple settings at once."""
    settings_data = {
        'site_title': 'Multiple Update Title',
        'site_description': 'Updated description',
        'twitter_url': 'https://twitter.com/username',
        'linkedin_url': 'https://linkedin.com/in/username'
    }
    
    response = client.post(
        '/api/settings', 
        json=settings_data,
        headers={'Cookie': auth.cookie}
    )
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['success'] is True
    
    # Verify the updates
    response = client.get('/api/settings')
    settings = json.loads(response.data)
    assert settings['site_title'] == 'Multiple Update Title'
    assert settings['site_description'] == 'Updated description'
    assert settings['twitter_url'] == 'https://twitter.com/username'
    assert settings['linkedin_url'] == 'https://linkedin.com/in/username'

def test_delete_setting(client, auth):
    """Test deleting a setting."""
    # First create a test setting
    client.put(
        '/api/settings/test_setting',
        json={'value': 'Test Value'},
        headers={'Cookie': auth.cookie}
    )
    
    # Delete the setting
    response = client.delete(
        '/api/settings/test_setting',
        headers={'Cookie': auth.cookie}
    )
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['success'] is True
    
    # Verify deletion
    response = client.get('/api/settings/test_setting')
    assert response.status_code == 404
