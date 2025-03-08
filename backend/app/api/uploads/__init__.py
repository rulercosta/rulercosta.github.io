"""
Uploads API initialization
"""
from flask import Blueprint

bp = Blueprint('uploads', __name__)

# Import routes at the end to avoid circular imports
from . import routes  # noqa: F401, E402

# Make routes explicitly used to avoid linting errors
__all__ = ['routes']
