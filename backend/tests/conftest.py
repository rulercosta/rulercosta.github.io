"""
Test configuration and fixtures
"""
import os
import tempfile
import pytest
from app import create_app
from app.models.database import init_db  # Remove get_db since it's not used directly

@pytest.fixture
def app():
    """Create and configure a Flask app for testing."""
    # Create a temporary file to isolate tests from development/production databases
    db_fd, db_path = tempfile.mkstemp()
    
    # Create the app with the test configuration
    test_app = create_app('testing')
    
    # Override the database path with our temporary path
    test_app.config['DATABASE'] = db_path
    # Ensure DATABASE_URL is None to use SQLite for tests
    test_app.config['DATABASE_URL'] = None
    
    # Create temporary directory for uploads
    uploads_dir = tempfile.mkdtemp()
    test_app.config['UPLOAD_FOLDER'] = uploads_dir
    
    # Set up the application context
    with test_app.app_context():
        # Initialize the database
        init_db()
        yield test_app
    
    # Clean up temporary files
    os.close(db_fd)
    os.unlink(db_path)
    
    # Clean up uploads directory
    for root, dirs, files in os.walk(uploads_dir, topdown=False):
        for name in files:
            os.remove(os.path.join(root, name))
        for name in dirs:
            os.rmdir(os.path.join(root, name))
    os.rmdir(uploads_dir)

@pytest.fixture
def client(app):
    """Test client for the app."""
    # Enable session testing
    with app.test_client() as test_client:
        with app.app_context():
            yield test_client

@pytest.fixture
def runner(app):
    """CLI test runner for the app."""
    return app.test_cli_runner()

@pytest.fixture
def auth(client):
    """Authentication helper fixture."""
    class AuthActions:
        def __init__(self, client):
            self._client = client
            self.cookie = None
            # Login immediately to set session for tests that need authentication
            self.login()

        def login(self, username="admin", password="admin"):
            response = self._client.post(
                '/api/auth/login',
                json={'username': username, 'password': password}
            )
            self.cookie = response.headers.get('Set-Cookie')
            return response

        def logout(self):
            response = self._client.post('/api/auth/logout')
            self.cookie = None
            return response
        
        def add_social_urls(self, urls):
            return self._client.post(
                '/api/auth/social-urls',
                json={'urls': urls},
                headers={'Cookie': self.cookie} if self.cookie else {}
            )
        
        def change_password(self, current_password, new_password):
            response = self._client.post(
                '/api/auth/change-password',
                json={'current_password': current_password, 'new_password': new_password},
                headers={'Cookie': self.cookie} if self.cookie else {}
            )
            return response
        
        def update_username(self, new_username, password):
            response = self._client.post(
                '/api/auth/update-username',
                json={'username': new_username, 'password': password},
                headers={'Cookie': self.cookie} if self.cookie else {}
            )
            if response.status_code == 200:
                self.cookie = response.headers.get('Set-Cookie') or self.cookie
            return response
            
    return AuthActions(client)
