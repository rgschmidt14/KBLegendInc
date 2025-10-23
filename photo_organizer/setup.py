
import subprocess
import sys
import pkg_resources
import os

def install_packages():
    required_packages = {
        'pygame': 'pygame',
        'deepface': 'deepface',
        'opencv-python': 'opencv-python',
        'tensorflow': 'tensorflow',
        'mtcnn': 'mtcnn',
        'tf-keras': 'tf-keras'
    }

    installed = {pkg.key for pkg in pkg_resources.working_set}
    missing = [name for name, key in required_packages.items() if key not in installed]

    if missing:
        print("Installing missing packages...")
        python = sys.executable
        try:
            subprocess.check_call([python, '-m', 'pip', 'install', '--no-warn-script-location', *missing], stdout=subprocess.DEVNULL)
            print("All packages installed.")
        except subprocess.CalledProcessError as e:
            print(f"Error installing packages: {e}")
            sys.exit(1)

if __name__ == "__main__":
    install_packages()
    # Now that packages are installed, we can run the main application
    sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), 'src')))
    from main import PhotoSorterApp
    app = PhotoSorterApp()
    app.run()
