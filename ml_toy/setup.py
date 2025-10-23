import subprocess
import sys
import os

def install_packages():
    """Installs required packages from requirements.txt."""
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt", "--no-warn-script-location"])
    except subprocess.CalledProcessError as e:
        print(f"Error installing packages: {e}")
        sys.exit(1)

def main():
    """Main function to run the application."""
    # Change to the script's directory
    os.chdir(os.path.dirname(os.path.abspath(__file__)))

    # Install packages
    install_packages()

    # Run the main application
    subprocess.run([sys.executable, "src/main.py"])

if __name__ == "__main__":
    main()
