# Skill Tracker

The Skill Tracker is a web-based application designed to help users define, track, and master new skills. It provides a structured framework for breaking down a skill into manageable levels, from absolute beginner to legendary master. The application is built with vanilla HTML, CSS, and JavaScript, and it uses the browser's `localStorage` to save and manage skill data, offering a persistent, client-side database solution.

## The Philosophy: A Structured Path to Mastery

The core concept of the Skill Tracker is that skills are not monolithic achievements but rather a series of progressive levels. This application codifies that progression into a clear, actionable path. Each skill is broken down into six distinct levels (0 through 5), each with its own set of tasks and milestones.

### The Structure of a Skill

A skill is defined by more than just a name. It includes:

-   **Author and Endorsements:** Giving credit and showing social proof.
-   **Overview:** A high-level description of the skill.
-   **Levels (0-5):** A detailed progression from novice to expert.

### The Level System

The level system is the heart of the Skill Tracker. It provides a clear and consistent structure for skill development, ensuring that the user always knows what the next step is.

-   **Level 0: The First Step.** This level is for the absolute beginner. It's about taking the initial actions required to start the skill.
    -   *Example (Private Pilot):* Find an intro flight, get study materials, find an instructor.
-   **Level 1: Fledgling Ability.** The user has started. This level focuses on developing basic ability and showing initial progress.
    -   *Example (Private Pilot):* Gaining knowledge and logging the required flight hours.
-   **Level 2: Becoming Average.** The user has basic ability. This level is about becoming proficient and meeting the average standard.
    -   *Example (Private Pilot):* Honing skills to pass the checkride and get a pilot's license.
-   **Level 3: Going Beyond.** The user is proficient. This level is for those who want to go beyond the average and become experts.
    -   *Example (Private Pilot):* Improving tolerances, deepening knowledge, and expanding personal minimums.
-   **Level 4: The Pinnacle.** The user is an expert. This level is about reaching the pinnacle of the skill and becoming legendary.
    -   *Example (Private Pilot):* Becoming competent in all possible situations within the skill's scope.
-   **Level 5: Mastery.** The user has reached the pinnacle. This level is for defining the ongoing maintenance required to stay at the top of their game.

### PPPs and Maintenance: The Building Blocks of Progress

Each level is associated with specific tasks that are categorized as **Prepare, Practice, Prove (PPP)** or **Required Maintenance**.

-   **Prepare, Practice, Prove (PPP):** These are the tasks required to advance from one level to the next. The PPPs for achieving Level N+1 are listed within the card for Level N. This creates a clear, forward-looking path for the user.
-   **Required Maintenance:** These are the tasks that must be completed regularly to maintain proficiency at a given level. They are listed within the card for the level they apply to.

## The User Interface

The Skill Tracker's UI is designed to be intuitive and easy to use. It features a card-based layout for both viewing and editing skills, with collapsible sections to keep the information organized and manageable.

### The Skill Viewer

When a skill is selected, it is displayed in a series of cards, one for each level. Each card contains collapsible sections for the PPPs for the next level, the level's description, and its required maintenance tasks. This allows the user to focus on their current level while still having easy access to the full scope of the skill.

### The Skill Editor

The skill editor uses the same card-based layout as the viewer, providing a consistent user experience. Within the editor, users can:

-   **Edit Level Descriptions:** Provide detailed information about each level.
-   **Add, Edit, and Delete Tasks:** Dynamically manage the PPP and maintenance tasks for each level.
-   **Set Maintenance Periods:** Define how often maintenance tasks need to be completed.

## Technical Details

-   **Frontend:** Vanilla HTML, CSS, and JavaScript.
-   **Data Storage:** Browser `localStorage`.
-   **Styling:** A clean, modern look with a focus on usability.

## Future Development

The Skill Tracker is an ongoing project. Future enhancements may include:

-   **Data Export/Import:** Allow users to back up and share their skills.
-   **User Accounts:** Move beyond `localStorage` to a server-based solution.
-   **Community Features:** Allow users to share and rate skills created by others.
