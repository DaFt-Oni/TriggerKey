import os
import subprocess
import sys
import importlib.metadata

def check_command(args):
    try:
        subprocess.run(args, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, shell=True, check=True)
        return True
    except (subprocess.SubprocessError, FileNotFoundError):
        return False

def is_python_pkg_installed(pkg_name):
    normalized_name = pkg_name.strip().split('>=')[0].split('==')[0].split('<=')[0].strip()
    if not normalized_name or normalized_name.startswith('#'):
        return True
    
    # Platform-specific check
    if ";" in pkg_name:
        req, cond = pkg_name.split(";", 1)
        normalized_name = req.strip().split('>=')[0].strip()
        if "win32" in cond and sys.platform != "win32":
            return True # Skip non-windows dependencies on other platforms

    try:
        importlib.metadata.version(normalized_name)
        return True
    except importlib.metadata.PackageNotFoundError:
        try:
            # Fallback import checks for common distribution-import discrepancies
            test_name = normalized_name.lower().replace('-', '_')
            if test_name == "pywin32":
                import win32api
                return True
            elif test_name == "pywebview":
                import webview
                return True
            elif test_name == "flask_cors":
                import flask_cors
                return True
            __import__(test_name)
            return True
        except ImportError:
            return False

def check_python_requirements():
    if not os.path.exists("requirements.txt"):
        return False, []
    
    missing = []
    with open("requirements.txt", "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#'):
                continue
            if not is_python_pkg_installed(line):
                missing.append(line)
    return len(missing) == 0, missing

def main():
    print("=" * 60)
    print("           TriggerKey - Environment Setup Script")
    print("=" * 60)

    # 1. Check & Install Python dependencies
    print("\n[1/3] Checking Python dependencies...")
    all_installed, missing_pkgs = check_python_requirements()
    
    if all_installed:
        print("[OK] All Python dependencies are already installed.")
    else:
        print(f"[INFO] Missing Python dependencies: {', '.join(missing_pkgs)}")
        print("Installing missing Python dependencies...")
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
            print("[OK] Python dependencies installed successfully.")
        except Exception as e:
            print(f"[ERROR] Failed to install Python dependencies: {e}")
            sys.exit(1)

    # 2. Check Node.js and NPM
    print("\n[2/3] Checking Node.js and NPM...")
    has_node = check_command(["node", "--version"])
    has_npm = check_command(["npm", "--version"])

    if has_node and has_npm:
        print("[OK] Node.js and NPM are installed.")
    else:
        print("[WARNING] Node.js and/or NPM were not found on this system.")
        print("  You must install Node.js (https://nodejs.org/) to build the React frontend.")
        print("  You will still be able to run the Python backend, but cannot re-build the front.")

    # 3. Setup Frontend dependencies if folder exists
    print("\n[3/3] Setting up Frontend dependencies...")
    frontend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "frontend")
    node_modules_dir = os.path.join(frontend_dir, "node_modules")
    
    if os.path.exists(frontend_dir):
        if has_npm:
            if os.path.exists(node_modules_dir):
                print("[OK] Frontend dependencies are already installed (node_modules exists).")
            else:
                print("Running 'npm install' in frontend directory...")
                try:
                    # Use shell=True on Windows to resolve npm correctly
                    subprocess.run("npm install", cwd=frontend_dir, shell=True, check=True)
                    print("[OK] NPM packages installed successfully.")
                except Exception as e:
                    print(f"[ERROR] Failed to install frontend NPM dependencies: {e}")
        else:
            print("[WARNING] Skipped NPM installation because NPM is not available.")
    else:
        print("[INFO] 'frontend' directory not found yet. Skipping npm install.")

    print("\n" + "=" * 60)
    print(" TriggerKey setup completed successfully!")
    print("=" * 60)

    # 4. Interactive Compilation Menu
    print("\n" + "=" * 60)
    print("           TriggerKey - Compilation Menu")
    print("=" * 60)
    try:
        choice = input("\nDo you want to compile the portable executable now? (Y/N): ").strip().upper()
        if choice in ['S', 'Y', 'SI', 'YES']:
            print("\nStarting compilation process...\n")
            subprocess.run([sys.executable, "build_exe.py"], check=True)
        else:
            print("\nCompilation skipped. You can compile later by running: python build_exe.py")
    except KeyboardInterrupt:
        print("\nCompilation skipped.")
    except Exception as e:
        print(f"\n[ERROR] Error during compilation: {e}")

if __name__ == "__main__":
    main()
