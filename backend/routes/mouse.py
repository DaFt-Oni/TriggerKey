from flask import jsonify
from backend.routes import api_bp

@api_bp.route('/api/mouse/position', methods=['GET'])
def get_mouse_position():
    """
    Returns the current real-time Cartesian coordinates (X, Y) of the mouse cursor.
    """
    try:
        from pynput.mouse import Controller
        mouse_ctrl = Controller()
        pos = mouse_ctrl.position
        return jsonify({"x": int(pos[0]), "y": int(pos[1])}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
