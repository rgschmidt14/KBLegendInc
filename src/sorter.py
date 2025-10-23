
import os
import shutil
from deepface import DeepFace
import cv2
from rotator import Rotator

class Sorter:
    def __init__(self, folder_path):
        self.folder_path = folder_path
        self.image_files = self.get_image_files()
        self.face_groups = {}  # { "person_1": [img_path_1, img_path_2, ...], ... }

    def get_image_files(self):
        files = []
        for f in os.listdir(self.folder_path):
            if f.lower().endswith((".jpg", ".jpeg", ".png")):
                files.append(os.path.join(self.folder_path, f))
        return files

    def run(self):
        # A dictionary to hold embeddings for each person.
        # The key is the person's ID (e.g., "person_1"), and the value is a list of their face embeddings.
        person_embeddings = {}

        for img_path in self.image_files:
            try:
                # Rotate the image if necessary
                rotator = Rotator(img_path)
                rotated_image_path = rotator.rotate()

                # Extract face embeddings from the image.
                # The `extract_faces` function can also return embeddings if the model is specified.
                embedding_objs = DeepFace.represent(img_path=rotated_image_path, model_name='VGG-Face', enforce_detection=False)

                if not embedding_objs:
                    continue

                for embedding_obj in embedding_objs:
                    embedding = embedding_obj["embedding"]
                    matched_person = None

                    # Compare the new embedding with existing ones.
                    for person_id, embeddings in person_embeddings.items():
                        # We only need to compare against one embedding from each person's group.
                        distance = DeepFace.dst.findCosineDistance(embedding, embeddings[0])
                        # A lower distance means a better match. The threshold may need tuning.
                        if distance < 0.4:  # Cosine distance threshold for VGG-Face
                            matched_person = person_id
                            break

                    if matched_person:
                        # Add the image to the existing person's group and the new embedding to their list.
                        if img_path not in self.face_groups[matched_person]:
                            self.face_groups[matched_person].append(img_path)
                        person_embeddings[matched_person].append(embedding)
                    else:
                        # Create a new person group.
                        new_person_id = f"person_{len(self.face_groups) + 1}"
                        self.face_groups[new_person_id] = [img_path]
                        person_embeddings[new_person_id] = [embedding]

            except Exception as e:
                print(f"Error processing {img_path}: {e}")

        self.move_files()

    def move_files(self):
        for person, img_paths in self.face_groups.items():
            person_folder = os.path.join(self.folder_path, person)
            os.makedirs(person_folder, exist_ok=True)
            for img_path in img_paths:
                shutil.move(img_path, person_folder)
