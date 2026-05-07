from flask import jsonify, request
from backend.routes import api_bp
from backend.macro_manager import macro_manager

@api_bp.route('/api/play/<name>', methods=['POST'])
def play_macro(name):
    """
    Starts execution of a saved macro by name in a background thread.
    """
    success = macro_manager.start_playback(name)
    if success:
        return jsonify({"message": f"Playback started for '{name}'"}), 200
    return jsonify({"error": "Cannot play. Already active or macro not found"}), 400

@api_bp.route('/api/play/steps', methods=['POST'])
def play_steps():
    """
    Starts playback of a custom, temporary list of macro steps.
    """
    data = request.json or {}
    steps = data.get("steps", [])
    if not steps:
        return jsonify({"error": "Steps are required"}), 400

    success = macro_manager.start_playback(steps)
    if success:
        return jsonify({"message": "Custom steps playback started"}), 200
    return jsonify({"error": "Cannot play. Already active"}), 400

@api_bp.route('/api/stop', methods=['POST'])
def stop_action():
    """
    Triggers emergency stop for both playing macros and recording.
    """
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
