import os
import sys
import json
import time
import threading
from pynput import mouse, keyboard

class MacroManager:
    def __init__(self, macros_dir="macros"):
        self.macros_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", macros_dir)
        os.makedirs(self.macros_dir, exist_ok=True)

        self.recording = False
        self.playing = False

        self.recorded_steps = []
        self.start_time = 0.0
        self.last_event_time = 0.0

        # Controllers for simulating input
        self.mouse_controller = mouse.Controller()
        self.keyboard_controller = keyboard.Controller()

        # Listeners for recording
        self.mouse_listener = None
        self.keyboard_listener = None

        # Thread management
        self.playback_thread = None
        self.hotkey_listener = None

        # Macro trigger registry: mapping of hotkey-string -> macro_name
        self.trigger_mappings = {}
        self._load_trigger_mappings()

        # Start the global hotkeys listener
        self._start_global_hotkeys_listener()

    def _get_relative_time(self):
        now = time.time()
        delay = now - self.last_event_time if self.last_event_time > 0 else 0.0
        self.last_event_time = now
        return max(0.0, delay)

    # --- RECORDING LOGIC ---
    def start_recording(self):
        if self.recording or self.playing:
            return False

        self.recorded_steps = []
        self.recording = True
        self.start_time = time.time()
        self.last_event_time = self.start_time

        # Define mouse event callbacks
        def on_move(x, y):
            if not self.recording:
                return False
            # Limit mouse move recordings to prevent bloat unless it's a meaningful shift
            if len(self.recorded_steps) > 0 and self.recorded_steps[-1]["type"] == "move":
                # Throttling moves if they are identical or too close in time
                last_move = self.recorded_steps[-1]
                if abs(last_move["x"] - x) < 3 and abs(last_move["y"] - y) < 3:
                    return
            self.recorded_steps.append({
                "type": "move",
                "x": x,
                "y": y,
                "delay": self._get_relative_time()
            })

        def on_click(x, y, button, pressed):
            if not self.recording:
                return False
            self.recorded_steps.append({
                "type": "click",
                "x": x,
                "y": y,
                "button": button.name,
                "pressed": pressed,
                "delay": self._get_relative_time()
            })

        def on_scroll(x, y, dx, dy):
            if not self.recording:
                return False
            self.recorded_steps.append({
                "type": "scroll",
                "x": x,
                "y": y,
                "dx": dx,
                "dy": dy,
                "delay": self._get_relative_time()
            })

        # Define keyboard event callbacks
        def on_press(key):
            if not self.recording:
                return False
            # Exclude our emergency stop key combinations to avoid recording them
            key_str = self._serialize_key(key)
            if "ctrl" in key_str.lower() and "alt" in key_str.lower() and "s" in key_str.lower():
                return

            self.recorded_steps.append({
                "type": "key_press",
                "key": key_str,
                "delay": self._get_relative_time()
            })

        def on_release(key):
            if not self.recording:
                return False
            key_str = self._serialize_key(key)
            self.recorded_steps.append({
                "type": "key_release",
                "key": key_str,
                "delay": self._get_relative_time()
            })

        # Start listeners in separate non-blocking threads
        self.mouse_listener = mouse.Listener(on_move=on_move, on_click=on_click, on_scroll=on_scroll)
        self.keyboard_listener = keyboard.Listener(on_press=on_press, on_release=on_release)

        self.mouse_listener.start()
        self.keyboard_listener.start()
        return True

    def stop_recording(self, macro_name=None):
        if not self.recording:
            return None

        self.recording = False

        if self.mouse_listener:
            self.mouse_listener.stop()
        if self.keyboard_listener:
            self.keyboard_listener.stop()

        steps = self.recorded_steps
        self.recorded_steps = []

        if macro_name and len(steps) > 0:
            self.save_macro(macro_name, steps)

        return steps

    # --- PLAYBACK LOGIC ---
    def start_playback(self, macro_name_or_steps):
        if self.playing or self.recording:
            return False

        steps = []
        if isinstance(macro_name_or_steps, str):
            steps = self.load_macro(macro_name_or_steps)
        elif isinstance(macro_name_or_steps, list):
            steps = macro_name_or_steps

        if not steps:
            return False

        self.playing = True
        self.playback_thread = threading.Thread(target=self._run_playback, args=(steps,))
        self.playback_thread.daemon = True
        self.playback_thread.start()
        return True

    def _run_playback(self, steps):
        try:
            steps_len = len(steps)
            step_idx = 0
            loop_counters = {}

            while step_idx < steps_len:
                if not self.playing:
                    break

                step = steps[step_idx]

                # Sleep the relative delay before the action
                time.sleep(step.get("delay", 0.0))

                if not self.playing:
                    break

                action_type = step.get("type")

                if action_type == "trigger":
                    step_idx += 1
                    continue

                elif action_type == "loop_start":
                    count = int(step.get("loop_count", 1))
                    if step_idx not in loop_counters:
                        loop_counters[step_idx] = count

                    # 0 or negative means infinite loop
                    if count <= 0:
                        step_idx += 1
                    else:
                        if loop_counters[step_idx] > 0:
                            loop_counters[step_idx] -= 1
                            step_idx += 1
                        else:
                            # Loop ended, jump past matching loop_end
                            end_idx = self._find_matching_loop_end(steps, step_idx)
                            if end_idx != -1:
                                step_idx = end_idx + 1
                            else:
                                step_idx += 1
                            del loop_counters[step_idx]

                elif action_type == "loop_end":
                    start_idx = self._find_matching_loop_start(steps, step_idx)
                    if start_idx != -1:
                        # Go back to start of loop
                        step_idx = start_idx
                    else:
                        step_idx += 1

                elif action_type == "conditional":
                    cond_type = step.get("cond_type", "mouse_x")
                    condition_met = True
                    try:
                        if cond_type == "mouse_x":
                            curr_x, _ = self.mouse_controller.position
                            val = int(step.get("cond_val", 0))
                            condition_met = (curr_x > val)
                        elif cond_type == "mouse_y":
                            _, curr_y = self.mouse_controller.position
                            val = int(step.get("cond_val", 0))
                            condition_met = (curr_y > val)
                    except Exception:
                        condition_met = True

                    if condition_met:
                        step_idx += 1
                    else:
                        step_idx += 2

                elif action_type == "move":
                    self.mouse_controller.position = (step["x"], step["y"])
                    step_idx += 1

                elif action_type == "click":
                    self.mouse_controller.position = (step["x"], step["y"])
                    btn = getattr(mouse.Button, step["button"], mouse.Button.left)
                    if step["pressed"]:
                        self.mouse_controller.press(btn)
                    else:
                        self.mouse_controller.release(btn)
                    step_idx += 1

                elif action_type == "scroll":
                    self.mouse_controller.position = (step["x"], step["y"])
                    self.mouse_controller.scroll(step["dx"], step["dy"])
                    step_idx += 1

                elif action_type == "key_press":
                    key = self._deserialize_key(step["key"])
                    if key:
                        self.keyboard_controller.press(key)
                    step_idx += 1

                elif action_type == "key_release":
                    key = self._deserialize_key(step["key"])
                    if key:
                        self.keyboard_controller.release(key)
                    step_idx += 1
                elif action_type == "write_text":
                    text = step.get("text", "")
                    if text:
                        self.keyboard_controller.type(text)
                    step_idx += 1
                else:
                    step_idx += 1


        except Exception as e:
            print(f"Playback error: {e}")
        finally:
            self.release_all_inputs()
            self.playing = False

    def _find_matching_loop_end(self, steps, start_idx):
        depth = 1
        for i in range(start_idx + 1, len(steps)):
            if steps[i].get("type") == "loop_start":
                depth += 1
            elif steps[i].get("type") == "loop_end":
                depth -= 1
                if depth == 0:
                    return i
        return -1

    def _find_matching_loop_start(self, steps, end_idx):
        depth = 1
        for i in range(end_idx - 1, -1, -1):
            if steps[i].get("type") == "loop_end":
                depth += 1
            elif steps[i].get("type") == "loop_start":
                depth -= 1
                if depth == 0:
                    return i
        return -1


    def stop_playback(self):
        if not self.playing:
            return False
        self.playing = False
        self.release_all_inputs()
        return True

    def release_all_inputs(self):
        """Emergency safety function to release all mouse buttons and keys."""
        try:
            # Release mouse buttons
            for btn in [mouse.Button.left, mouse.Button.right, mouse.Button.middle]:
                self.mouse_controller.release(btn)
            
            # Since pynput doesn't easily list pressed keys, we release standard modifiers
            for key in [keyboard.Key.ctrl, keyboard.Key.shift, keyboard.Key.alt, keyboard.Key.cmd]:
                try:
                    self.keyboard_controller.release(key)
                except Exception:
                    pass
        except Exception as e:
            print(f"Error releasing inputs: {e}")

    # --- HELPERS FOR SERIALIZATION ---
    def _serialize_key(self, key):
        if hasattr(key, 'char') and key.char is not None:
            return key.char
        return str(key)

    def _deserialize_key(self, key_str):
        if key_str.startswith("Key."):
            key_name = key_str.split(".")[1]
            return getattr(keyboard.Key, key_name, None)
        elif len(key_str) == 1:
            return key_str
        return None

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

        # Update triggers if specified
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
        # Remove trigger key first if any
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
        for filename in os.listdir(self.macros_dir):
            if filename.endswith(".json"):
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
        # Build hotkey dictionary
        hotkeys = {}

        # 1. Exclusive emergency safety-stop: Ctrl + Alt + Shift + Escape or Ctrl + Alt + S
        def emergency_stop():
            print("⚠ EMERGENCY SAFETY-STOP TRIGGERED! Stopping all macros.")
            self.stop_playback()
            self.stop_recording()

        hotkeys["<ctrl>+<alt>+s"] = emergency_stop
        hotkeys["<ctrl>+<alt>+<shift>+<esc>"] = emergency_stop

        # 2. Dynamic triggers
        for hk, macro_name in self.trigger_mappings.items():
            # Create a closure for triggering playback
            def make_trigger_callback(name=macro_name):
                def callback():
                    print(f"Triggered macro: {name}")
                    self.start_playback(name)
                return callback
            
            # Format hotkey string for pynput (e.g. "ctrl+j" -> "<ctrl>+j", "f8" -> "<f8>")
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
            self.hotkey_listener.stop()
        self._start_global_hotkeys_listener()

    def _format_hotkey_for_pynput(self, hk_str):
        """Converts user hotkey string e.g. 'ctrl+shift+j' to '<ctrl>+<shift>+j'"""
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
