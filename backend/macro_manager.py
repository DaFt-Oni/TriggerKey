import os
import json
from pynput import keyboard
from backend.macro_engine import macro_engine

class MacroManager:
    """
    High-level orchestrator/manager responsible for macro file storage, 
    trigger hotkey mappings, and listening for global system hotkeys.
    Delegates hardware execution to MacroEngine.
    """
    def __init__(self, macros_dir="macros"):
        self.macros_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", macros_dir)
        os.makedirs(self.macros_dir, exist_ok=True)

        self.engine = macro_engine
        self.hotkey_listener = None

        # Macro trigger registry: mapping of hotkey-string -> macro_name
        self.trigger_mappings = {}
        self._load_trigger_mappings()

        # Start the global hotkeys listener
        self._start_global_hotkeys_listener()

    @property
    def recording(self):
        return self.engine.recording

    @property
    def playing(self):
        return self.engine.playing

    # --- ORCHESTRATION BRIDGE ---
    def start_recording(self):
        return self.engine.start_recording()

    def stop_recording(self, macro_name=None):
        steps = self.engine.stop_recording()
        if steps is not None and macro_name and len(steps) > 0:
            self.save_macro(macro_name, steps)
        return steps

    def start_playback(self, macro_name_or_steps):
        steps = []
        if isinstance(macro_name_or_steps, str):
            steps = self.load_macro(macro_name_or_steps)
        elif isinstance(macro_name_or_steps, list):
            steps = macro_name_or_steps

        if not steps:
            return False
        return self.engine.start_playback(steps)

    def stop_playback(self):
        return self.engine.stop_playback()

    # --- MACRO STORAGE MANAGEMENT ---
    def save_macro(self, name, steps, trigger_key=None):
        filename = f"{name}.json"
        filepath = os.path.join(self.macros_dir, filename)
        macro_data = {
            "name": name,
            "steps": steps,
            "trigger_key": trigger_key
        }
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(macro_data, f, indent=2)

        if trigger_key:
            self.register_trigger(trigger_key, name)
        return True

    def load_macro(self, name):
        filepath = os.path.join(self.macros_dir, f"{name}.json")
        if not os.path.exists(filepath):
            return None
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                data = json.load(f)
                return data.get("steps", [])
        except Exception:
            return None

    def get_macro_details(self, name):
        filepath = os.path.join(self.macros_dir, f"{name}.json")
        if not os.path.exists(filepath):
            return None
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception:
            return None

    def delete_macro(self, name):
        details = self.get_macro_details(name)
        if details and details.get("trigger_key"):
            self.unregister_trigger(details["trigger_key"])

        filepath = os.path.join(self.macros_dir, f"{name}.json")
        if os.path.exists(filepath):
            os.remove(filepath)
            return True
        return False

    def list_macros(self):
        macros = []
        if not os.path.exists(self.macros_dir):
            return macros
        for filename in os.listdir(self.macros_dir):
            if filename.endswith(".json") and not filename.startswith("_"):
                name = filename[:-5]
                details = self.get_macro_details(name)
                if details:
                    macros.append({
                        "name": name,
                        "steps_count": len(details.get("steps", [])),
                        "trigger_key": details.get("trigger_key")
                    })
        return macros

    # --- GLOBAL HOTKEYS / TRIGGER SYSTEM ---
    def register_trigger(self, hotkey_str, macro_name):
        self.trigger_mappings[hotkey_str] = macro_name
        self._save_trigger_mappings()
        self._restart_global_hotkeys_listener()

    def unregister_trigger(self, hotkey_str):
        if hotkey_str in self.trigger_mappings:
            del self.trigger_mappings[hotkey_str]
            self._save_trigger_mappings()
            self._restart_global_hotkeys_listener()

    def _save_trigger_mappings(self):
        mapping_path = os.path.join(self.macros_dir, "_triggers_mapping.json")
        with open(mapping_path, 'w', encoding='utf-8') as f:
            json.dump(self.trigger_mappings, f, indent=2)

    def _load_trigger_mappings(self):
        mapping_path = os.path.join(self.macros_dir, "_triggers_mapping.json")
        if os.path.exists(mapping_path):
            try:
                with open(mapping_path, 'r', encoding='utf-8') as f:
                    self.trigger_mappings = json.load(f)
            except Exception:
                self.trigger_mappings = {}

    def _start_global_hotkeys_listener(self):
        hotkeys = {}

        # Emergency stop callbacks
        def emergency_stop():
            print("⚠ EMERGENCY SAFETY-STOP TRIGGERED! Stopping all macros.")
            self.stop_playback()
            self.stop_recording()

        hotkeys["<ctrl>+<alt>+s"] = emergency_stop
        hotkeys["<ctrl>+<alt>+<shift>+<esc>"] = emergency_stop

        # Map dynamic triggers
        for hk, macro_name in self.trigger_mappings.items():
            def make_trigger_callback(name=macro_name):
                def callback():
                    print(f"Triggered macro: {name}")
                    self.start_playback(name)
                return callback
            
            formatted_hk = self._format_hotkey_for_pynput(hk)
            if formatted_hk:
                hotkeys[formatted_hk] = make_trigger_callback()

        try:
            self.hotkey_listener = keyboard.GlobalHotKeys(hotkeys)
            self.hotkey_listener.start()
        except Exception as e:
            print(f"Error starting global hotkey listener: {e}")

    def _restart_global_hotkeys_listener(self):
        if self.hotkey_listener:
            try:
                self.hotkey_listener.stop()
            except Exception:
                pass
        self._start_global_hotkeys_listener()

    def _format_hotkey_for_pynput(self, hk_str):
        if not hk_str:
            return None
        parts = hk_str.lower().split("+")
        formatted_parts = []
        for part in parts:
            part = part.strip()
            if part in ["ctrl", "alt", "shift", "cmd", "win"]:
                formatted_parts.append(f"<{part}>")
            elif part.startswith("f") and len(part) > 1 and part[1:].isdigit():
                formatted_parts.append(f"<{part}>")
            else:
                formatted_parts.append(part)
        return "+".join(formatted_parts)

# Singleton global instance of macro manager orchestrator
macro_manager = MacroManager()
