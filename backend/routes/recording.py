from flask import jsonify, request
from backend.routes import api_bp
from backend.macro_manager import macro_manager

@api_bp.route('/api/status', methods=['GET'])
def get_status():
    """
    Returns the current global playback and recording states of the automation engine.
    """
    return jsonify({
        "recording": macro_manager.recording,
        "playing": macro_manager.playing
    }), 200

@api_bp.route('/api/record/start', methods=['POST'])
def start_recording():
    """
    Starts listening and recording keyboard and mouse events globally.
    """
    success = macro_manager.start_recording()
    if success:
        return jsonify({"message": "Recording started"}), 200
    return jsonify({"error": "Already recording or playing"}), 400

@api_bp.route('/api/record/stop', methods=['POST'])
def stop_recording():
    """
    Stops current recording and returns the compiled steps.
    Optionally saves the steps to a macro name directly.
    """
    data = request.json or {}
    name = data.get("name")

    steps = macro_manager.stop_recording(name)
    if steps is not None:
        return jsonify({
            "message": "Recording stopped",
            "steps_count": len(steps),
            "steps": steps
        }), 200
    return jsonify({"error": "Not currently recording"}), 400
