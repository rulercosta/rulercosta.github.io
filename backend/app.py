"""
Main application entry point
"""
import os
from app import create_app

# Determine environment from env var or default to development
config_name = os.environ.get('FLASK_ENV', 'development')

# Create the application instance
app = create_app(config_name)

if __name__ == '__main__':
    app.run(debug=app.config['DEBUG'])
