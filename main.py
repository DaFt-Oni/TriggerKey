import os
import sys
import threading
import webview
from backend.app import create_app

def main():
    """
    Central entry point of TriggerKey.
    Starts the Flask backend in a background daemon thread and opens the native
    pywebview desktop window container pointing to the server.
    """
    # Create the modularized Flask application instance
    app = create_app()

    # Determine if we are running in debug mode
    is_debug = os.environ.get("TRIGGERKEY_DEBUG") == "1"

    # Run the Flask server in a background daemon thread
    flask_thread = threading.Thread(
        target=lambda: app.run(host="127.0.0.1", port=5000, debug=False, use_reloader=False)
    )
    flask_thread.daemon = True
    flask_thread.start()

    # Create the native desktop window pointing to the local Flask server
    webview.create_window(
        title="TriggerKey - Macro Automation Center",
        url="http://127.0.0.1:5000",
        width=1280,
        height=800,
        min_size=(1024, 768),
        background_color="#0D1018" # Deep operator console HSL background
    )

    # Launch the pywebview native window loop
    # DevTools are disabled in production for a clean, secure monolithic experience
    webview.start(debug=is_debug)

if __name__ == "__main__":
    main()
