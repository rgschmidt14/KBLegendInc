import random
import os

# Kivy requires a specific environment setup on some systems, especially for display.
# This tries to prevent a crash in headless environments where there's no display.
os.environ['KIVY_NO_CONSOLELOG'] = '1'
os.environ['KIVY_NO_FILELOG'] = '1'

# Use a dummy provider for window and text to allow it to run headlessly.
from kivy.config import Config
Config.set('graphics', 'width', '400')
Config.set('graphics', 'height', '700')
# The following lines are commented out as they might not be necessary with recent Kivy versions
# and can sometimes cause issues. If the script fails to run due to display errors,
# these might be needed.
# from kivy.core.window import Window
# from kivy.core.text import LabelBase

from kivy.app import App
from kivy.uix.boxlayout import BoxLayout
from kivy.uix.gridlayout import GridLayout
from kivy.uix.button import Button
from kivy.uix.label import Label
from kivy.uix.textinput import TextInput
from kivy.uix.scrollview import ScrollView
from kivy.uix.widget import Widget
from kivy.graphics import Color, Rectangle


class DiceRollerApp(App):
    def build(self):
        self.selected_sides = 6  # Default to d6

        # --- Main Layout ---
        root = BoxLayout(orientation='vertical', padding=10, spacing=10)

        # --- Header ---
        header = Label(text='Dice Roller', font_size='24sp', size_hint_y=None, height=40)
        root.add_widget(header)

        # --- Dice Selection ---
        dice_grid = GridLayout(cols=4, spacing=10, size_hint_y=None, height=100)
        dice_types = [4, 6, 8, 10, 12, 20, 100]
        self.dice_buttons = {}
        for sides in dice_types:
            button = Button(text=f'd{sides}')
            button.bind(on_press=self.select_dice)
            self.dice_buttons[sides] = button
            dice_grid.add_widget(button)
        root.add_widget(dice_grid)

        # --- Inputs Layout ---
        input_layout = GridLayout(cols=4, spacing=10, size_hint_y=None, height=40)
        input_layout.add_widget(Label(text='Number:'))
        self.dice_count_input = TextInput(text='1', multiline=False, input_filter='int')
        input_layout.add_widget(self.dice_count_input)
        input_layout.add_widget(Label(text='Modifier:'))
        self.modifier_input = TextInput(text='0', multiline=False, input_filter='int')
        input_layout.add_widget(self.modifier_input)
        root.add_widget(input_layout)

        # --- Special Rolls ---
        special_layout = GridLayout(cols=2, spacing=10, size_hint_y=None, height=50)
        adv_button = Button(text='Advantage')
        adv_button.bind(on_press=lambda instance: self.roll_advantage_disadvantage(instance, is_advantage=True))
        special_layout.add_widget(adv_button)
        dis_button = Button(text='Disadvantage')
        dis_button.bind(on_press=lambda instance: self.roll_advantage_disadvantage(instance, is_advantage=False))
        special_layout.add_widget(dis_button)
        root.add_widget(special_layout)

        # --- Roll Button ---
        roll_button = Button(text='Roll', size_hint_y=None, height=50)
        roll_button.bind(on_press=self.roll_dice)
        root.add_widget(roll_button)

        # --- Result Display ---
        self.result_label = Label(text='Roll the dice to see the result!', size_hint_y=None, height=60)
        root.add_widget(Label(text='Result', font_size='20sp', size_hint_y=None, height=30))
        root.add_widget(self.result_label)

        # --- History View ---
        root.add_widget(Label(text='History', font_size='20sp', size_hint_y=None, height=30))
        self.history_label = Label(text='', size_hint_y=None, halign='left', valign='top')
        self.history_label.bind(texture_size=self.history_label.setter('size'))
        scroll_view = ScrollView(size_hint=(1, 1))
        scroll_view.add_widget(self.history_label)
        root.add_widget(scroll_view)

        # Set initial active button
        self.dice_buttons[6].state = 'down'

        return root

    def select_dice(self, instance):
        # Reset all button states
        for button in self.dice_buttons.values():
            button.state = 'normal'
        # Set the pressed button's state
        instance.state = 'down'
        # Update selected sides
        self.selected_sides = int(instance.text[1:])

    def roll_dice(self, instance):
        try:
            num_dice = int(self.dice_count_input.text)
            modifier = int(self.modifier_input.text)
        except ValueError:
            self.result_label.text = "Invalid input. Please enter numbers."
            return

        rolls = [random.randint(1, self.selected_sides) for _ in range(num_dice)]
        total = sum(rolls) + modifier

        modifier_str = f" + {modifier}" if modifier > 0 else f" - {abs(modifier)}" if modifier < 0 else ""
        result_str = f"{num_dice}d{self.selected_sides}{modifier_str} = [{', '.join(map(str, rolls))}]{modifier_str} = {total}"

        self.result_label.text = result_str
        self.update_history(result_str)

    def roll_advantage_disadvantage(self, instance, is_advantage):
        try:
            modifier = int(self.modifier_input.text)
        except ValueError:
            self.result_label.text = "Invalid modifier. Please enter a number."
            return

        roll1 = random.randint(1, 20)
        roll2 = random.randint(1, 20)

        chosen_roll = max(roll1, roll2) if is_advantage else min(roll1, roll2)
        total = chosen_roll + modifier

        roll_type = "Advantage" if is_advantage else "Disadvantage"
        modifier_str = f" + {modifier}" if modifier > 0 else f" - {abs(modifier)}" if modifier < 0 else ""
        result_str = f"{roll_type}: [{roll1}, {roll2}] -> {chosen_roll}{modifier_str} = {total}"

        self.result_label.text = result_str
        self.update_history(result_str)

    def update_history(self, result_string):
        self.history_label.text = f"{result_string}\n{self.history_label.text}"


if __name__ == '__main__':
    DiceRollerApp().run()
