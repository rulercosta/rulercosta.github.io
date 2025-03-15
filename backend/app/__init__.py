"""
Application factory module
"""
import os
from flask import Flask
from flask_cors import CORS
from .config import config

def create_app(config_name='default'):
    """
    Create and configure the Flask application
    
    Args:
        config_name: Name of the configuration to use
        
    Returns:
        Flask application instance
    """
    # Create and configure the app
    app = Flask(__name__, instance_relative_config=True)
    app.config.from_object(config[config_name])
    
    # Ensure the instance folder exists
    os.makedirs(app.instance_path, exist_ok=True)
    
    # Set up CORS with proper credentials support
    cors_origins = app.config['CORS_ORIGINS']
    app.logger.info(f"CORS configured for origins: {cors_origins}")
    
    # Fix: Configure CORS once and properly
    CORS(app, 
         resources={r"/api/*": {"origins": cors_origins}},
         supports_credentials=True,
         allow_headers=["Content-Type", "Authorization", "Accept"],
         methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])
    
    # Configure session cookie settings
    app.config['SESSION_COOKIE_SECURE'] = True  # Require HTTPS
    app.config['SESSION_COOKIE_HTTPONLY'] = True  # Prevent JavaScript access
    app.config['SESSION_COOKIE_SAMESITE'] = 'None'  # Allow cross-site cookies
    app.config['PERMANENT_SESSION_LIFETIME'] = 86400  # 24 hours in seconds
    
    # Register database functions
    from .models.database import init_app
    init_app(app)
    
    # Register API blueprints
    from .api.auth import bp as auth_bp
    app.register_blueprint(auth_bp)
    
    from .api.pages import bp as pages_bp
    app.register_blueprint(pages_bp, url_prefix='/api/pages')
    
    from .api.settings import bp as settings_bp
    app.register_blueprint(settings_bp, url_prefix='/api/settings')
    
    from .api.uploads import bp as uploads_bp
    app.register_blueprint(uploads_bp, url_prefix='/api/uploads')
    
    # Log Cloudinary configuration status
    if app.config['CLOUDINARY_CLOUD_NAME'] and app.config['CLOUDINARY_API_KEY']:
        app.logger.info("Cloudinary configured for image uploads")
    else:
        app.logger.warning("Cloudinary is not configured - image uploads will not work")
    
    # Add a health check endpoint
    @app.route('/health')
    def health_check():
        return {'status': 'ok'}, 200
    
    return app
