"""
Database utilities for the application using SQLAlchemy
"""
import click
from flask import g
from flask.cli import with_appcontext
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
import os

# Initialize SQLAlchemy instance
db = SQLAlchemy()

# Define models
class AdminCredential(db.Model):
    __tablename__ = 'admin_credentials'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String, unique=True, nullable=False)
    password_hash = db.Column(db.String, nullable=False)

    def verify_password(self, password):
        """Verify password against hash"""
        return check_password_hash(self.password_hash, password)

class Page(db.Model):
    __tablename__ = 'pages'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String, nullable=False)
    slug = db.Column(db.String, unique=True, nullable=False)
    content = db.Column(db.Text, nullable=False)
    # Change Integer to Boolean for better PostgreSQL compatibility
    is_blog = db.Column(db.Boolean, nullable=False, default=False)
    excerpt = db.Column(db.Text)
    # Change Integer to Boolean for better PostgreSQL compatibility
    featured = db.Column(db.Boolean, nullable=False, default=False)
    created_at = db.Column(db.String, nullable=False)
    updated_at = db.Column(db.String, nullable=False)
    published_date = db.Column(db.String)
    
    def to_dict(self):
        """Convert page to dictionary for JSON serialization"""
        return {
            'id': self.id,
            'title': self.title,
            'slug': self.slug,
            'content': self.content,
            # Convert boolean to integer for consistent API response
            'is_blog': 1 if self.is_blog else 0,
            'excerpt': self.excerpt,
            # Convert boolean to integer for consistent API response
            'featured': 1 if self.featured else 0,
            'created_at': self.created_at,
            'updated_at': self.updated_at,
            'published_date': self.published_date
        }

class Setting(db.Model):
    __tablename__ = 'settings'
    
    key = db.Column(db.String(128), primary_key=True)  # Make key the primary key
    value = db.Column(db.String, nullable=False)

def get_db():
    """
    Get database session.
    
    Returns:
        SQLAlchemy session object
    """
    if 'db_session' not in g:
        g.db_session = db.session
    return g.db_session

def close_db(e=None):
    """Close database session."""
    g.pop('db_session', None)

# Remove unnecessary helper functions
# is_postgres(), bool_to_int(), int_to_bool()

def init_db():
    """Initialize the database by creating tables and default data."""
    # Create all tables
    db.create_all()
    
    # Insert default admin user if not exists
    admin = AdminCredential.query.filter_by(username='admin').first()
    if not admin:
        admin = AdminCredential(
            username='admin',
            password_hash=generate_password_hash('admin')
        )
        db.session.add(admin)
    
    # Insert default settings if not exist
    default_settings = {
        'site_title': 'My Blog',
        'site_description': 'A simple blog created with Flask',
        'posts_per_page': '5',
        'introduction': 'Welcome to my blog',
        'github_url': '',
        'linkedin_url': '',
        'twitter_url': ''
    }
    
    # Remove the circular import and use the local Setting class directly
    for key, value in default_settings.items():
        setting = Setting.query.filter_by(key=key).first()
        if not setting:
            setting = Setting(key=key, value=value)
            db.session.add(setting)
    
    db.session.commit()

@click.command('init-db')
@with_appcontext
def init_db_command():
    """Clear the existing data and create new tables."""
    init_db()
    click.echo('Initialized the database.')

def init_app(app):
    """Register database functions with the Flask app."""
    # Configure SQLAlchemy
    # Check for DATABASE_URL in environment first, then app config
    database_url = os.environ.get('DATABASE_URL') or app.config.get('DATABASE_URL')
    
    if database_url:
        # PostgreSQL connection string is already properly formatted
        app.config['SQLALCHEMY_DATABASE_URI'] = database_url
        app.logger.info('Using PostgreSQL database')
    else:
        # Fall back to SQLite
        sqlite_path = app.config.get('DATABASE', 'sqlite:///instance/blog.sqlite')
        if sqlite_path.startswith('sqlite:///'):
            app.config['SQLALCHEMY_DATABASE_URI'] = sqlite_path
        else:
            app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{os.path.abspath(sqlite_path)}"
        app.logger.info('Using SQLite database')
    
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # Add connection pool settings to handle connection recycling
    app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
        'pool_pre_ping': True,     # Test connections before use to detect stale ones
        'pool_recycle': 280        # Recycle connections after ~4.5 minutes (before Supabase's ~5 min timeout)
    }
    
    db.init_app(app)
    app.cli.add_command(init_db_command)
    app.teardown_appcontext(close_db)
    
    with app.app_context():
        db.create_all()
