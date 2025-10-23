
import cv2
import numpy as np
import os

class Rotator:
    def __init__(self, image_path):
        self.image_path = image_path

    def rotate(self):
        try:
            img = cv2.imread(self.image_path)
            # A simple heuristic to detect if an image is in portrait and needs rotation.
            # This is a placeholder for a more robust solution, perhaps using EXIF data.
            if img.shape[0] > img.shape[1]:
                img = cv2.rotate(img, cv2.ROTATE_90_CLOCKWISE)
                # Save to a new file to avoid overwriting the original
                rotated_path = os.path.splitext(self.image_path)[0] + "_rotated.jpg"
                cv2.imwrite(rotated_path, img)
                return rotated_path
            return self.image_path
        except Exception as e:
            print(f"Error rotating {self.image_path}: {e}")
