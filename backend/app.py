import os
import sys
from flask import Flask
from flask_cors import CORS

def create_app():
    """
    Application factory that initializes and configures the Flask application.
    Resolves directories for both development and PyInstaller bundled environments.
    """
    if getattr(sys, 'frozen', False):
        # Running inside PyInstaller bundle
        base_dir = sys._MEIPASS
    else:
        # Running in development
        base_dir = os.path.dirname(os.path.abspath(__file__))

    app = Flask(
        __name__,
        static_folder=os.path.join(base_dir, "static"),
        template_folder=os.path.join(base_dir, "templates")
    )

    # Enable CORS for cross-origin development calls from Vite
    CORS(app)

    # Register the modularized API routes Blueprint
    from backend.routes import api_bp
    app.register_blueprint(api_bp)

    return app

# Main entry point for standalone Flask server launching (if run directly)
if __name__ == "__main__":
    app = create_app()
    app.run(host="127.0.0.1", port=5000, debug=True)
