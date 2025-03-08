"""
Authentication API initialization
"""
from flask import Blueprint

bp = Blueprint('auth', __name__, url_prefix='/api/auth')

from . import routes  # noqa: F401, E402
