"""
Application configuration
"""
import os
import secrets

class Config:
    """Base configuration class"""
    # Generate a secure random key for development
    SECRET_KEY = os.environ.get('SECRET_KEY') or secrets.token_hex(32)
    
    # Database configuration
    DATABASE_URL = os.environ.get('DATABASE_URL')
    DATABASE = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'instance', 'blog.sqlite')

    # CORS configuration 
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', 'http://localhost:5173,http://127.0.0.1:5173,http://192.168.246.150:5173').split(',')    
    
    # Cloudinary configuration
    CLOUDINARY_CLOUD_NAME = os.environ.get('CLOUDINARY_CLOUD_NAME', '')
    CLOUDINARY_API_KEY = os.environ.get('CLOUDINARY_API_KEY', '')
    CLOUDINARY_API_SECRET = os.environ.get('CLOUDINARY_API_SECRET', '')

class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True
    TESTING = False

class TestingConfig(Config):
    """Testing configuration"""
    DEBUG = True
    TESTING = True
    # Use in-memory database for testing
    DATABASE = ':memory:'
    # Clear DATABASE_URL to ensure tests use SQLite
    DATABASE_URL = None

class ProductionConfig(Config):
    """Production configuration"""
    DEBUG = False
    TESTING = False
    SECRET_KEY = os.environ.get('SECRET_KEY')  # Must be set in production

class PostgresConfig(ProductionConfig):
    """PostgreSQL configuration"""
    # Use the DATABASE_URL environment variable
    # This class ensures there's a specific config for PostgreSQL deployments
    pass

config = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig,
    'postgres': PostgresConfig,
    'default': DevelopmentConfig
}
