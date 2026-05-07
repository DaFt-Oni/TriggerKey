import time
import threading
from pynput import mouse, keyboard

class MacroEngine:
    """
    Low-level execution engine for mouse and keyboard simulation and recording.
    Directly interacts with hardware controllers and handles parallel playback/listening threads.
    """
    def __init__(self):
        self.recording = False
        self.playing = False

        self.recorded_steps = []
        self.start_time = 0.0
        self.last_event_time = 0.0

        # Controllers for simulating hardware input
        self.mouse_controller = mouse.Controller()
        self.keyboard_controller = keyboard.Controller()

        # Listeners for recording events
        self.mouse_listener = None
        self.keyboard_listener = None

        # Playback thread reference
        self.playback_thread = None

    def _get_relative_time(self):
        now = time.time()
        delay = now - self.last_event_time if self.last_event_time > 0 else 0.0
        self.last_event_time = now
        return max(0.0, delay)

    # --- RECORDING ACTIONS ---
    def start_recording(self):
        if self.recording or self.playing:
            return False

        self.recorded_steps = []
        self.recording = True
        self.start_time = time.time()
        self.last_event_time = self.start_time

        def on_move(x, y):
            if not self.recording:
                return False
            # Limit consecutive mouse moves to prevent coordinate bloat
            if len(self.recorded_steps) > 0 and self.recorded_steps[-1]["type"] == "move":
                last_move = self.recorded_steps[-1]
                if abs(last_move["x"] - x) < 3 and abs(last_move["y"] - y) < 3:
                    return
            self.recorded_steps.append({
                "type": "move",
                "x": int(x),
                "y": int(y),
                "delay": self._get_relative_time()
            })

        def on_click(x, y, button, pressed):
            if not self.recording:
                return False
            self.recorded_steps.append({
                "type": "click",
                "x": int(x),
                "y": int(y),
                "button": button.name,
                "pressed": bool(pressed),
                "delay": self._get_relative_time()
            })

        def on_scroll(x, y, dx, dy):
            if not self.recording:
                return False
            self.recorded_steps.append({
                "type": "scroll",
                "x": int(x),
                "y": int(y),
                "dx": int(dx),
                "dy": int(dy),
                "delay": self._get_relative_time()
            })

        def on_press(key):
            if not self.recording:
                return False
            key_str = self._serialize_key(key)
            # Exclude standard emergency key combinations
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

        self.mouse_listener = mouse.Listener(on_move=on_move, on_click=on_click, on_scroll=on_scroll)
        self.keyboard_listener = keyboard.Listener(on_press=on_press, on_release=on_release)

        self.mouse_listener.start()
        self.keyboard_listener.start()
        return True

    def stop_recording(self):
        if not self.recording:
            return None

        self.recording = False

        if self.mouse_listener:
            try:
                self.mouse_listener.stop()
            except Exception:
                pass
        if self.keyboard_listener:
            try:
                self.keyboard_listener.stop()
            except Exception:
                pass

        steps = self.recorded_steps
        self.recorded_steps = []
        return steps

    # --- PLAYBACK EXECUTION ---
    def start_playback(self, steps):
        if self.playing or self.recording or not steps:
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
                time.sleep(max(0.0, float(step.get("delay", 0.0))))

                if not self.playing:
                    break

                action_type = step.get("type")

                if action_type == "trigger":
                    step_idx += 1
                    continue

                elif action_type == "loop_start":
                    try:
                        count = int(step.get("loop_count", 1))
                    except (ValueError, TypeError):
                        count = 1
                    
                    if step_idx not in loop_counters:
                        loop_counters[step_idx] = count

                    if count <= 0:
                        step_idx += 1
                    else:
                        if loop_counters[step_idx] > 0:
                            loop_counters[step_idx] -= 1
                            step_idx += 1
                        else:
                            end_idx = self._find_matching_loop_end(steps, step_idx)
                            if end_idx != -1:
                                step_idx = end_idx + 1
                            else:
                                step_idx += 1
                            if step_idx in loop_counters:
                                del loop_counters[step_idx]

                elif action_type == "loop_end":
                    start_idx = self._find_matching_loop_start(steps, step_idx)
                    if start_idx != -1:
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
                    try:
                        x = int(step.get("x", 0))
                        y = int(step.get("y", 0))
                        self.mouse_controller.position = (x, y)
                    except (ValueError, TypeError):
                        pass
                    step_idx += 1

                elif action_type == "click":
                    try:
                        x = int(step.get("x", 0))
                        y = int(step.get("y", 0))
                        self.mouse_controller.position = (x, y)
                        btn_name = step.get("button", "left")
                        btn = getattr(mouse.Button, btn_name, mouse.Button.left)
                        if step.get("pressed", True):
                            self.mouse_controller.press(btn)
                        else:
                            self.mouse_controller.release(btn)
                    except (ValueError, TypeError, Exception):
                        pass
                    step_idx += 1

                elif action_type == "scroll":
                    try:
                        x = int(step.get("x", 0))
                        y = int(step.get("y", 0))
                        dx = int(step.get("dx", 0))
                        dy = int(step.get("dy", 0))
                        self.mouse_controller.position = (x, y)
                        self.mouse_controller.scroll(dx, dy)
                    except (ValueError, TypeError):
                        pass
                    step_idx += 1

                elif action_type == "key_press":
                    key = self._deserialize_key(step.get("key", ""))
                    if key:
                        try:
                            self.keyboard_controller.press(key)
                        except Exception:
                            pass
                    step_idx += 1

                elif action_type == "key_release":
                    key = self._deserialize_key(step.get("key", ""))
                    if key:
                        try:
                            self.keyboard_controller.release(key)
                        except Exception:
                            pass
                    step_idx += 1

                elif action_type == "write_text":
                    text = step.get("text", "")
                    if text:
                        try:
                            self.keyboard_controller.type(text)
                        except Exception:
                            pass
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
        try:
            for btn in [mouse.Button.left, mouse.Button.right, mouse.Button.middle]:
                try:
                    self.mouse_controller.release(btn)
                except Exception:
                    pass
            for key in [keyboard.Key.ctrl, keyboard.Key.shift, keyboard.Key.alt, keyboard.Key.cmd]:
                try:
                    self.keyboard_controller.release(key)
                except Exception:
                    pass
        except Exception as e:
            print(f"Error releasing inputs: {e}")

    # --- KEY SERIALIZATION HELPERS ---
    def _serialize_key(self, key):
        if hasattr(key, 'char') and key.char is not None:
            return key.char
        return str(key)

    def _deserialize_key(self, key_str):
        if not key_str:
            return None
        if key_str.startswith("Key."):
            key_name = key_str.split(".")[1]
            return getattr(keyboard.Key, key_name, None)
        elif len(key_str) == 1:
            return key_str
        return None

# Global instance of macro execution engine
macro_engine = MacroEngine()
