import os
import sys
from flask import Flask, jsonify, request, send_from_directory, render_template
from flask_cors import CORS

# Resolve paths correctly for development and PyInstaller bundled environment
if getattr(sys, 'frozen', False):
    # Running as a bundled executable
    base_dir = sys._MEIPASS
else:
    # Running in development
    base_dir = os.path.dirname(os.path.abspath(__file__))

app = Flask(
    __name__,
    static_folder=os.path.join(base_dir, "static"),
    template_folder=os.path.join(base_dir, "templates")
)

# Enable CORS for development
CORS(app)

# Import and instantiate the macro manager
from macro_manager import MacroManager
macro_manager = MacroManager()

# --- WEB UI ROUTE ---
@app.route('/')
def index():
    try:
        return render_template('index.html')
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({
            "message": "TriggerKey API is running. Build the frontend first to see the UI.",
            "error": str(e),
            "status": "active"
        }), 200

# Fallback to serve static files if needed (PyInstaller support)
@app.route('/static/<path:path>')
def serve_static(path):
    return send_from_directory(app.static_folder, path)

# --- REST API ENDPOINTS ---

@app.route('/api/status', methods=['GET'])
def get_status():
    return jsonify({
        "recording": macro_manager.recording,
        "playing": macro_manager.playing
    }), 200

@app.route('/api/macros', methods=['GET'])
def list_macros():
    return jsonify(macro_manager.list_macros()), 200

@app.route('/api/macros/<name>', methods=['GET'])
def get_macro(name):
    details = macro_manager.get_macro_details(name)
    if details:
        return jsonify(details), 200
    return jsonify({"error": "Macro not found"}), 404

@app.route('/api/macros', methods=['POST'])
def save_macro():
    data = request.json or {}
    name = data.get("name")
    steps = data.get("steps", [])
    trigger_key = data.get("trigger_key")

    if not name or not steps:
        return jsonify({"error": "Name and steps are required"}), 400

    success = macro_manager.save_macro(name, steps, trigger_key)
    if success:
        return jsonify({"message": f"Macro '{name}' saved successfully"}), 200
    return jsonify({"error": "Failed to save macro"}), 500

@app.route('/api/macros/<name>', methods=['DELETE'])
def delete_macro(name):
    success = macro_manager.delete_macro(name)
    if success:
        return jsonify({"message": f"Macro '{name}' deleted successfully"}), 200
    return jsonify({"error": "Macro not found"}), 404

# Recording Endpoints
@app.route('/api/record/start', methods=['POST'])
def start_recording():
    success = macro_manager.start_recording()
    if success:
        return jsonify({"message": "Recording started"}), 200
    return jsonify({"error": "Already recording or playing"}), 400

@app.route('/api/record/stop', methods=['POST'])
def stop_recording():
    data = request.json or {}
    name = data.get("name") # Optional name to save directly

    steps = macro_manager.stop_recording(name)
    if steps is not None:
        return jsonify({
            "message": "Recording stopped",
            "steps_count": len(steps),
            "steps": steps
        }), 200
    return jsonify({"error": "Not currently recording"}), 400

# Playback Endpoints
@app.route('/api/play/<name>', methods=['POST'])
def play_macro(name):
    success = macro_manager.start_playback(name)
    if success:
        return jsonify({"message": f"Playback started for '{name}'"}), 200
    return jsonify({"error": "Cannot play. Already active or macro not found"}), 400

@app.route('/api/play/steps', methods=['POST'])
def play_steps():
    data = request.json or {}
    steps = data.get("steps", [])
    if not steps:
        return jsonify({"error": "Steps are required"}), 400

    success = macro_manager.start_playback(steps)
    if success:
        return jsonify({"message": "Custom steps playback started"}), 200
    return jsonify({"error": "Cannot play. Already active"}), 400

@app.route('/api/stop', methods=['POST'])
def stop_action():
    stopped_play = macro_manager.stop_playback()
    stopped_rec = False
    if macro_manager.recording:
        macro_manager.stop_recording()
        stopped_rec = True

    return jsonify({
        "message": "Actions stopped",
        "stopped_playback": stopped_play,
        "stopped_recording": stopped_rec
    }), 200

@app.route('/api/mouse/position', methods=['GET'])
def get_mouse_position():
    try:
        from pynput.mouse import Controller
        mouse = Controller()
        pos = mouse.position
        return jsonify({"x": int(pos[0]), "y": int(pos[1])}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    import threading
    import webview

    # In development or when requested, enable debug tools
    is_debug = os.environ.get("TRIGGERKEY_DEBUG") == "1"

    # Start Flask server in a daemon thread to serve the frontend and API
    flask_thread = threading.Thread(
        target=lambda: app.run(host="127.0.0.1", port=5000, debug=False, use_reloader=False)
    )
    flask_thread.daemon = True
    flask_thread.start()

    # Create the native desktop window pointing to the Flask server
    webview.create_window(
        title="TriggerKey - Macro Automation Center",
        url="http://127.0.0.1:5000",
        width=1280,
        height=800,
        min_size=(1024, 768),
        background_color="#0F0E13" # Dark obsidian background
    )

    # Start the pywebview native window loop.
    # In production (debug=False), DevTools are disabled and purged (fully inaccessible).
    webview.start(debug=is_debug)

