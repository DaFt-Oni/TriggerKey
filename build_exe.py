import os
import subprocess
import sys
import shutil

def main():
    print("=" * 60)
    print("           TriggerKey - Windows Executable Builder")
    print("=" * 60)

    current_dir = os.path.dirname(os.path.abspath(__file__))
    backend_app = os.path.join(current_dir, "backend", "app.py")

    # 1. Run build_front.py first to compile frontend and move assets
    print("\n[1/3] Triggering Frontend Compilation...")
    try:
        subprocess.run([sys.executable, "build_front.py"], check=True)
        print("[OK] Frontend compilation and deployment finished successfully.")
    except Exception as e:
        print(f"[ERROR] Frontend build failed: {e}")
        sys.exit(1)

    # 2. Package with PyInstaller
    print("\n[2/3] Building portable executable via PyInstaller...")
    
    # Define PyInstaller arguments
    # Separator on Windows is ';'
    templates_add = f"backend/templates{os.path.pathsep}backend/templates"
    static_add = f"backend/static{os.path.pathsep}backend/static"

    pyinstaller_cmd = [
        sys.executable,
        "-m",
        "PyInstaller",
        "--onefile",
        "--windowed", # Conceals the background cmd console
        f"--add-data={templates_add}",
        f"--add-data={static_add}",
        "--name=TriggerKey",
        backend_app
    ]

    print(f"Executing command: {' '.join(pyinstaller_cmd)}")
    try:
        subprocess.run(pyinstaller_cmd, check=True)
        print("[OK] PyInstaller bundling completed successfully.")
    except Exception as e:
        print(f"[ERROR] PyInstaller failed to bundle the app: {e}")
        sys.exit(1)

    # 3. Cleanup temporary PyInstaller files (build directory, spec file)
    print("\n[3/3] Performing post-build cleanup...")
    try:
        # Move the compiled executable to the root folder for easy access
        exe_src = os.path.join(current_dir, "dist", "TriggerKey.exe")
        exe_dst = os.path.join(current_dir, "TriggerKey.exe")
        
        if os.path.exists(exe_src):
            try:
                if os.path.exists(exe_dst):
                    os.remove(exe_dst)
                shutil.move(exe_src, exe_dst)
                print("[OK] Moved TriggerKey.exe to the root directory for convenience!")
            except Exception as e:
                print(f"[WARNING] Could not overwrite active TriggerKey.exe in root ({e}). The new compiled executable is located inside the 'dist' folder.")
        
        # Clean build directory and spec file
        build_dir = os.path.join(current_dir, "build")
        spec_file = os.path.join(current_dir, "TriggerKey.spec")
        dist_dir = os.path.join(current_dir, "dist")
        
        if os.path.exists(build_dir):
            shutil.rmtree(build_dir)
        if os.path.exists(spec_file):
            os.remove(spec_file)
        if os.path.exists(dist_dir):
            shutil.rmtree(dist_dir)
            
        print("[OK] Cleanup of temporary build artifacts completed.")
    except Exception as e:
        print(f"[WARNING] Cleanup had some minor issues: {e}")

    print("\n" + "=" * 60)
    print(" TriggerKey portable executable generated successfully!")
    print(" Location: ./TriggerKey.exe")
    print("=" * 60)

if __name__ == "__main__":
    main()
