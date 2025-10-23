
import os
import sys
import subprocess
import pygame
from pygame.locals import *

# --- Constants ---
# Colors
BLACK = (0, 0, 0)
WHITE = (255, 255, 255)
GRAY = (200, 200, 200)
LIGHT_GRAY = (230, 230, 230)
BLUE = (0, 0, 255)
GREEN = (0, 255, 0)

# Screen dimensions
SCREEN_WIDTH = 800
SCREEN_HEIGHT = 600


import tkinter as tk
from tkinter import filedialog
from sorter import Sorter
import threading

# --- Main Application Class ---
class PhotoSorterApp:
    def __init__(self):
        pygame.init()
        self.screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT))
        pygame.display.set_caption("AI Photo Sorter")
        self.running = True
        self.selected_folder = None
        self.status_message = "Select a folder to begin."
        self.sorting_in_progress = False
        self.sorter = None

        # --- UI Elements ---
        self.select_folder_button = pygame.Rect(
            SCREEN_WIDTH // 2 - 150, 150, 300, 50
        )
        self.start_sorting_button = pygame.Rect(
            SCREEN_WIDTH // 2 - 150, 250, 300, 50
        )

    def run(self):
        while self.running:
            for event in pygame.event.get():
                if event.type == QUIT:
                    self.running = False
                elif event.type == MOUSEBUTTONDOWN:
                    self.handle_click(event.pos)

            self.draw()
            pygame.display.flip()

        pygame.quit()
        sys.exit()

    def handle_click(self, pos):
        if self.select_folder_button.collidepoint(pos):
            self.select_folder()
        elif self.start_sorting_button.collidepoint(pos):
            if self.selected_folder and not self.sorting_in_progress:
                self.start_sorting()

    def select_folder(self):
        root = tk.Tk()
        root.withdraw()
        self.selected_folder = filedialog.askdirectory()
        if self.selected_folder:
            self.status_message = f"Folder selected: {os.path.basename(self.selected_folder)}"
        else:
            self.status_message = "No folder selected."

    def start_sorting(self):
        self.sorting_in_progress = True
        self.status_message = "Sorting in progress..."
        self.sorter = Sorter(self.selected_folder)

        # Run sorting in a separate thread to keep the UI responsive
        sorting_thread = threading.Thread(target=self.run_sorter)
        sorting_thread.start()

    def run_sorter(self):
        self.sorter.run()
        self.status_message = "Sorting complete!"
        self.sorting_in_progress = False

    def draw(self):
        self.screen.fill(WHITE)

        # Title
        self.draw_text("AI Photo Sorter", (SCREEN_WIDTH // 2, 50), BLACK, font_size=48)

        # Buttons
        self.draw_button(
            self.select_folder_button, "Select Folder", GRAY, BLACK
        )
        self.draw_button(
            self.start_sorting_button, "Start Sorting", GREEN, WHITE
        )

        # Status Message
        self.draw_text(self.status_message, (SCREEN_WIDTH // 2, 350), BLUE)

        # Loading Screen
        if self.sorting_in_progress:
            self.draw_loading_screen()

    def draw_button(self, rect, text, color, text_color):
        pygame.draw.rect(self.screen, color, rect, border_radius=10)
        self.draw_text(text, rect.center, text_color)

    def draw_loading_screen(self):
        overlay = pygame.Surface((SCREEN_WIDTH, SCREEN_HEIGHT), pygame.SRCALPHA)
        overlay.fill((0, 0, 0, 128))  # Semi-transparent black overlay
        self.screen.blit(overlay, (0, 0))
        self.draw_text("Sorting in progress...", (SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2), WHITE)

    def draw_text(self, text, position, color, font_size=36):
        font = pygame.font.Font(None, font_size)
        text_surface = font.render(text, True, color)
        text_rect = text_surface.get_rect(center=position)
        self.screen.blit(text_surface, text_rect)


if __name__ == "__main__":
    app = PhotoSorterApp()
    app.run()
