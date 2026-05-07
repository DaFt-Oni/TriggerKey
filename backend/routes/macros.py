from flask import jsonify, request
from backend.routes import api_bp
from backend.macro_manager import macro_manager

@api_bp.route('/api/macros', methods=['GET'])
def list_macros():
    """
    Lists all saved macros, including their step count and assigned trigger hotkeys.
    """
    return jsonify(macro_manager.list_macros()), 200

@api_bp.route('/api/macros/<name>', methods=['GET'])
def get_macro(name):
    """
    Retrieves full step list and trigger details for a specific macro by name.
    """
    details = macro_manager.get_macro_details(name)
    if details:
        return jsonify(details), 200
    return jsonify({"error": "Macro not found"}), 404

@api_bp.route('/api/macros', methods=['POST'])
def save_macro():
    """
    Saves or overwrites a macro with specified steps and trigger key.
    """
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

@api_bp.route('/api/macros/<name>', methods=['DELETE'])
def delete_macro(name):
    """
    Permanently deletes a macro file and releases its trigger hotkey.
    """
    success = macro_manager.delete_macro(name)
    if success:
        return jsonify({"message": f"Macro '{name}' deleted successfully"}), 200
    return jsonify({"error": "Macro not found"}), 404
