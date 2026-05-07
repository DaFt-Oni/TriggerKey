import os
import shutil
import subprocess
import sys

def main():
    print("=" * 60)
    print("           TriggerKey - Frontend Build Script")
    print("=" * 60)

    current_dir = os.path.dirname(os.path.abspath(__file__))
    frontend_dir = os.path.join(current_dir, "frontend")
    backend_dir = os.path.join(current_dir, "backend")
    
    templates_dir = os.path.join(backend_dir, "templates")
    static_dir = os.path.join(backend_dir, "static")

    # 1. Compile frontend
    print("\n[1/3] Compiling React frontend via Vite...")
    if not os.path.exists(frontend_dir):
        print(f"[ERROR] Frontend directory not found at {frontend_dir}")
        sys.exit(1)

    try:
        # Use shell=True for Windows to execute npm correctly
        subprocess.run("npm run build", cwd=frontend_dir, shell=True, check=True)
        print("[OK] Frontend compiled successfully.")
    except Exception as e:
        print(f"[ERROR] Failed to compile frontend: {e}")
        sys.exit(1)

    # 2. Re-create backend target directories
    print("\n[2/3] Preparing backend distribution directories...")
    for folder in [templates_dir, static_dir]:
        if os.path.exists(folder):
            print(f"Cleaning existing folder: {os.path.basename(folder)}...")
            try:
                shutil.rmtree(folder)
                os.makedirs(folder, exist_ok=True)
            except Exception as e:
                print(f"[WARNING] Could not delete folder {os.path.basename(folder)} ({e}). Cleaning contents inside instead.")
                for root, dirs, files in os.walk(folder, topdown=False):
                    for file in files:
                        try:
                            os.remove(os.path.join(root, file))
                        except Exception:
                            pass
                    for d in dirs:
                        try:
                            os.rmdir(os.path.join(root, d))
                        except Exception:
                            pass
        else:
            os.makedirs(folder, exist_ok=True)
    print("[OK] Backend directories prepared.")

    # 3. Move compiled files to backend
    print("\n[3/3] Deploying compiled assets to Flask...")
    dist_dir = os.path.join(frontend_dir, "dist")
    if not os.path.exists(dist_dir):
        print(f"[ERROR] Compiled 'dist' directory not found at {dist_dir}")
        sys.exit(1)

    try:
        # Move index.html to templates/index.html
        src_html = os.path.join(dist_dir, "index.html")
        dst_html = os.path.join(templates_dir, "index.html")
        shutil.copy2(src_html, dst_html)
        print("[OK] Moved index.html -> templates/index.html")

        # Copy all other folders (like assets, public assets, favicons) to static
        for item in os.listdir(dist_dir):
            if item == "index.html":
                continue
            src_item = os.path.join(dist_dir, item)
            dst_item = os.path.join(static_dir, item)
            if os.path.isdir(src_item):
                shutil.copytree(src_item, dst_item, dirs_exist_ok=True)
                print(f"[OK] Copied directory: {item} -> static/{item}")
            else:
                shutil.copy2(src_item, dst_item)
                print(f"[OK] Copied file: {item} -> static/{item}")

        print("\n[OK] Deployment completed successfully!")
    except Exception as e:
        print(f"[ERROR] Failed to copy compiled files: {e}")
        sys.exit(1)

    print("\n" + "=" * 60)
    print(" Frontend compilation and movement complete!")
    print("=" * 60)

if __name__ == "__main__":
    main()
