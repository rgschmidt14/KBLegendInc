import pygame
import cv2
import numpy as np

# Initialize Pygame
pygame.init()

# Screen dimensions
SCREEN_WIDTH = 640
SCREEN_HEIGHT = 480
screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT))
pygame.display.set_caption("Machine Learning Toy")

# Colors
WHITE = (255, 255, 255)

# Webcam setup
cap = cv2.VideoCapture(0)

def main():
    """Main game loop."""
    running = True
    while running:
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False

        # Get frame from webcam
        ret, frame = cap.read()
        if not ret:
            print("Failed to grab frame")
            break

        # Convert the image from BGR to RGB
        frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        # The frame needs to be flipped horizontally
        frame = np.rot90(frame)
        frame = pygame.surfarray.make_surface(frame)
        frame = pygame.transform.flip(frame, True, False)


        # Draw the frame on the screen
        screen.blit(frame, (0, 0))

        # Update the display
        pygame.display.flip()

    # Quit Pygame
    pygame.quit()
    cap.release()

if __name__ == "__main__":
    main()
