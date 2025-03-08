"""
Helper utilities for database management
"""
import os
from flask import current_app

def is_using_postgres():
    """
    Check if the application is using PostgreSQL
    
    Returns:
        bool: True if using PostgreSQL, False if using SQLite
    """
    db_uri = current_app.config.get('SQLALCHEMY_DATABASE_URI', '')
    return db_uri.startswith('postgresql://')

def setup_database(app):
    """
    Configure the application to use the appropriate database
    
    Args:
        app: Flask application instance
    """
    # Check if DATABASE_URL is set in environment
    if os.environ.get('DATABASE_URL'):
        # Switch to postgres configuration if using DATABASE_URL
        app.config.from_object("app.config.PostgresConfig")
        app.logger.info("Using PostgreSQL database configuration")
    else:
        # Use the default configuration which uses SQLite
        app.logger.info("Using default SQLite database configuration")
