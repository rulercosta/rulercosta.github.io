"""
Tests for pages API
"""
import json

def test_get_pages_empty(client):
    """Test getting all pages when none exist."""
    response = client.get('/api/pages')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert isinstance(data, list)
    assert len(data) == 0  # No pages initially

def test_create_and_get_page(client, auth):
    """Test creating and retrieving a page."""
    # Login first
    auth.login()
    
    # Create a page
    page_data = {
        'title': 'Test Page',
        'content': '<p>This is a test page.</p>',
        'is_blog': False
    }
    
    response = client.post(
        '/api/pages',
        json=page_data
    )
    assert response.status_code == 201
    page = json.loads(response.data)
    assert page['title'] == 'Test Page'
    assert page['slug'] == 'test-page'
    assert page['is_blog'] == 0  # SQLite returns 0/1 for booleans
    
    # Get the page by slug
    response = client.get(f'/api/pages/{page["slug"]}')
    assert response.status_code == 200
    retrieved_page = json.loads(response.data)
    assert retrieved_page['title'] == 'Test Page'
    assert retrieved_page['content'] == '<p>This is a test page.</p>'
    
    # Get all pages
    response = client.get('/api/pages')
    assert response.status_code == 200
    pages = json.loads(response.data)
    assert len(pages) == 1
    assert pages[0]['slug'] == 'test-page'

def test_create_blog_post(client, auth):
    """Test creating a blog post."""
    auth.login()
    
    # Create a blog post
    blog_data = {
        'title': 'Test Blog Post',
        'content': '<p>This is a test blog post.</p>',
        'is_blog': True,
        'featured': True,
        'excerpt': 'Test excerpt'
    }
    
    response = client.post(
        '/api/pages',
        json=blog_data
    )
    assert response.status_code == 201
    post = json.loads(response.data)
    assert post['title'] == 'Test Blog Post'
    assert post['is_blog'] == 1  # SQLite returns 0/1 for booleans
    assert post['featured'] == 1
    assert post['excerpt'] == 'Test excerpt'
    
    # Get blog posts
    response = client.get('/api/pages?type=blog')
    assert response.status_code == 200
    posts = json.loads(response.data)
    assert len(posts) == 1
    assert posts[0]['slug'] == 'test-blog-post'
    
    # Get featured blog posts
    response = client.get('/api/pages?type=blog&featured=true')
    assert response.status_code == 200
    featured_posts = json.loads(response.data)
    assert len(featured_posts) == 1
    assert featured_posts[0]['slug'] == 'test-blog-post'

def test_update_page(client, auth):
    """Test updating a page."""
    # Create a page first
    auth.login()
    client.post(
        '/api/pages',
        json={'title': 'Original Title', 'content': '<p>Original content.</p>'}
    )
    
    # Update the page
    update_data = {
        'title': 'Updated Title',
        'content': '<p>Updated content.</p>'
    }
    response = client.put(
        '/api/pages/original-title',
        json=update_data
    )
    assert response.status_code == 200
    updated_page = json.loads(response.data)
    assert updated_page['title'] == 'Updated Title'
    assert updated_page['content'] == '<p>Updated content.</p>'
    
    # Verify the update
    response = client.get('/api/pages/updated-title')
    assert response.status_code == 200
    page = json.loads(response.data)
    assert page['title'] == 'Updated Title'

def test_delete_page(client, auth):
    """Test deleting a page."""
    # Create a page first
    auth.login()
    client.post(
        '/api/pages',
        json={'title': 'Delete Me', 'content': '<p>This page will be deleted.</p>'}
    )
    
    # Delete the page
    response = client.delete('/api/pages/delete-me')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['success'] is True
    
    # Verify deletion
    response = client.get('/api/pages/delete-me')
    assert response.status_code == 404

def test_authentication_required(client):
    """Test that authentication is required for modifying pages."""
    # Try to create a page without authentication
    response = client.post(
        '/api/pages',
        json={'title': 'Unauthorized', 'content': '<p>Should not be created.</p>'}
    )
    assert response.status_code == 401
    
    # Try to update a non-existent page without authentication
    response = client.put(
        '/api/pages/some-page',
        json={'title': 'Update Unauthorized'}
    )
    assert response.status_code == 401
    
    # Try to delete a non-existent page without authentication
    response = client.delete('/api/pages/some-page')
    assert response.status_code == 401
