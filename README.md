# AI Photo Sorter

This application automatically sorts your photos by the people in them using advanced facial recognition technology. It's designed to be user-friendly and powerful, with a simple interface that anyone can use.

## Features

- **Facial Recognition:**  Identifies unique individuals in your photo collection.
- **Automatic Sorting:**  Creates folders for each person and moves the corresponding photos into them.
- **User-Friendly UI:** A simple interface built with Pygame for easy operation.
- **"Click and Play" Setup:** Automatically installs necessary dependencies on the first run.
- **GPU Acceleration:**  Leverages your GPU for faster performance (if available).

## How to Get Started

1. **Run the Application:** Simply run the `setup.py` file.
2. **First-Time Setup:** The application will automatically check for and install any required libraries. This might take a few minutes.
3. **Select a Folder:**  Click the "Select Folder" button and choose the directory containing the photos you want to sort.
4. **Start Sorting:** Click the "Start Sorting" button to begin the process.
5. **Done!** The application will create new folders in the selected directory, each named "person_1," "person_2," etc., containing the sorted photos. You can then rename these folders as you wish.

## Future Updates

- **Object Recognition:**  Sort photos by objects, scenes, or other criteria.
- **Advanced UI:**  A more advanced UI with features like photo previews and manual tagging.

## Dependencies

This project uses the following libraries:

- `deepface`
- `pygame`
- `opencv-python`
- `tensorflow`
- `mtcnn`
