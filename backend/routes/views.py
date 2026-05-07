from flask import render_template, send_from_directory, jsonify, current_app
from backend.routes import api_bp

@api_bp.route('/')
def index():
    """
    Renders the main frontend single page application.
    If the compiled index.html is missing, returns an informative API status message.
    """
    try:
        return render_template('index.html')
    except Exception as e:
        return jsonify({
            "message": "TriggerKey API is running. Build the frontend first to see the UI.",
            "error": str(e),
            "status": "active"
        }), 200

@api_bp.route('/static/<path:path>')
def serve_static(path):
    """
    Serves static files under the static folder for production bundled environment.
    """
    return send_from_directory(current_app.static_folder, path)
