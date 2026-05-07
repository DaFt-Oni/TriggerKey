from flask import Blueprint

# Centralized routes Blueprint for all Flask endpoints
api_bp = Blueprint('api', __name__)

# Import all sub-routes modules to register their endpoints on the central Blueprint
from backend.routes import views, macros, recording, playback, mouse
