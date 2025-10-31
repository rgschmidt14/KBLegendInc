document.addEventListener('DOMContentLoaded', () => {

    // --- DOM Elements ---
    const skillDisplayContainer = document.getElementById('skill-display-container');
    const openSkillListModalBtn = document.getElementById('open-skill-list-modal');
    const skillListModal = document.getElementById('skill-list-modal');
    const skillEditorModal = document.getElementById('skill-editor-modal');
    const closeButtons = document.querySelectorAll('.close-button');

    // --- LOCAL STORAGE DATA MANAGEMENT ---

    /**
     * Retrieves all skills from localStorage.
     * @returns {Object} An object containing all skills, keyed by a unique ID.
     */
    const getSkills = () => {
        const skills = localStorage.getItem('skills');
        return skills ? JSON.parse(skills) : {};
    };

    /**
     * Saves a single skill to localStorage.
     * @param {Object} skill - The skill object to save.
     */
    const saveSkill = (skill) => {
        const skills = getSkills();
        if (!skill.id) {
            skill.id = `skill_${new Date().getTime()}`; // Assign a unique ID if it's a new skill
        }
        skills[skill.id] = skill;
        localStorage.setItem('skills', JSON.stringify(skills));
    };

    /**
     * Deletes a skill from localStorage.
     * @param {string} skillId - The ID of the skill to delete.
     */
    const deleteSkill = (skillId) => {
        const skills = getSkills();
        delete skills[skillId];
        localStorage.setItem('skills', JSON.stringify(skills));
    };


    // --- MODAL VISIBILITY ---

    openSkillListModalBtn.addEventListener('click', () => {
        skillListModal.style.display = 'block';
    });

    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            skillListModal.style.display = 'none';
            skillEditorModal.style.display = 'none';
        });
    });

    // Close modal if user clicks outside of the modal content
    window.addEventListener('click', (event) => {
        if (event.target == skillListModal) {
            skillListModal.style.display = 'none';
        }
        if (event.target == skillEditorModal) {
            // TODO: Implement auto-save as draft before closing
            skillEditorModal.style.display = 'none';
        }
    });

    // --- TASK MANAGEMENT ---

    /**
     * Finds a task within a skill object using its code.
     * @param {Object} skill - The skill object to search within.
     * @param {string} taskCode - The code of the task to find (e.g., "1PE1", "3PO4-1").
     * @returns {Object|null} The found task object or null.
     */
    const findTask = (skill, taskCode) => {
        for (const level of skill.levels) {
            for (const pppType of ['prepare', 'practice', 'prove', 'maintenance']) {
                if (level[pppType]) {
                    const found = findTaskRecursive(level[pppType], taskCode);
                    if (found) return found;
                }
            }
        }
        return null;
    };

    const findTaskRecursive = (tasks, taskCode) => {
        for (const task of tasks) {
            if (task.code === taskCode) return task;
            if (task.children && task.children.length > 0) {
                const found = findTaskRecursive(task.children, taskCode);
                if (found) return found;
            }
        }
        return null;
    };

    /**
     * Handles the checking/unchecking of a task.
     * @param {string} skillId - The ID of the skill being updated.
     * @param {string} taskCode - The code of the task being checked.
     * @param {boolean} isChecked - The new checked state.
     */
    const updateTaskStatus = (skillId, taskCode, isChecked) => {
        const skills = getSkills();
        const skill = skills[skillId];
        if (!skill) return;

        const task = findTask(skill, taskCode);
        if (!task) return;

        const now = new Date().toISOString();
        if (isChecked) {
            if (task.checked && !task.isUnchecked) { // This is a recheck
                task.rechecked = task.rechecked || [];
                task.rechecked.push(now);
            } else { // This is a first-time check or a check after being unchecked
                task.checked = now;
            }
            task.isUnchecked = false; // Mark as currently checked
        } else { // Unchecking
            task.isUnchecked = true;
        }

        updateParentTaskStatus(skill, taskCode);
        saveSkill(skill);
        // TODO: Add logic to update skill 'rusty'/'current' status
    };

    /**
     * Checks the status of a parent task based on its children.
     * If all children are checked, the parent is checked.
     * @param {Object} skill - The skill object.
     * @param {string} taskCode - The code of the task that was just updated.
     */
    const updateParentTaskStatus = (skill, taskCode) => {
        const parentCode = taskCode.substring(0, taskCode.lastIndexOf('-'));
        if (!parentCode) return; // This task is a root-level task

        const parentTask = findTask(skill, parentCode);
        if (!parentTask || !parentTask.children || parentTask.children.length === 0) return;

        const allChildrenChecked = parentTask.children.every(child => child.checked && !child.isUnchecked);

        if (allChildrenChecked) {
            if (!parentTask.checked || parentTask.isUnchecked) {
                parentTask.checked = new Date().toISOString();
            }
            parentTask.isUnchecked = false;
            // Recursively check the parent's parent
            updateParentTaskStatus(skill, parentCode);
        } else {
            // If any child is unchecked, the parent becomes unchecked.
            parentTask.isUnchecked = true;
        }
    };


    // --- Event Listener for Task Checkboxes ---
    skillDisplayContainer.addEventListener('change', (event) => {
        if (event.target.type === 'checkbox' && event.target.dataset.taskCode) {
            const skillId = event.target.dataset.skillId;
            const taskCode = event.target.dataset.taskCode;

            // Preserve the state of collapsible sections before re-rendering
            const openSections = new Set();
            skillDisplayContainer.querySelectorAll('.collapsible-header').forEach(header => {
                if (header.nextElementSibling.style.display === 'block') {
                    openSections.add(header.textContent.trim());
                }
            });

            updateTaskStatus(skillId, taskCode, event.target.checked);

            // Re-render the skill, which is necessary to update parent task statuses
            renderSkill(getSkills()[skillId]);

            // Restore the state of the collapsible sections after re-rendering
            skillDisplayContainer.querySelectorAll('.collapsible-header').forEach(header => {
                // The default render logic opens some sections, so we must override it
                // if the user had them closed.
                if (openSections.has(header.textContent.trim())) {
                    header.nextElementSibling.style.display = 'block';
                    header.classList.add('active');
                } else {
                    header.nextElementSibling.style.display = 'none';
                    header.classList.remove('active');
                }
            });
        }
    });

    // --- UI RENDERING ---

    /**
     * Renders a single skill object to the main display area.
     * @param {Object} skill - The skill object to render.
     */
    const renderSkill = (skill) => {
        if (!skill) {
            skillDisplayContainer.innerHTML = '<p>Select a skill to view its details.</p>';
            return;
        }

        const { status, level: highestLevel } = getSkillStatus(skill);
        const endorsementText = skill.endorsements && skill.endorsements.length > 0 ? `<em>(endorsed by ${skill.endorsements.join(', ')})</em>` : '';

        skillDisplayContainer.innerHTML = `
            <div class="skill-header" data-skill-id="${skill.id}">
                <h2>${skill.skillName} - Current Level: ${highestLevel} (${status})</h2>
                <button id="edit-skill-btn">Edit Skill</button>
                <button id="delete-skill-btn">Delete Skill</button>
                <p><strong>Author:</strong> ${skill.authorName} ${endorsementText}</p>
                <p><strong>Rating:</strong> ${skill.rating.usersAtLevel3} people have obtained level 3</p>
                <p><em>Created: ${new Date(skill.createdAt).toLocaleDateString()} (Last Updated: ${new Date(skill.updatedAt).toLocaleDateString()})</em></p>
                <p>${skill.overview}</p>
            </div>
            <div class="levels-display-container">
            ${skill.levels.map((level, index) => {
                const nextLevel = skill.levels[index + 1];
                const hasAchievedLevel = level.level <= highestLevel;
                const isCurrentLevel = level.level === highestLevel;

                // PPP section for the next level
                let pppHtml = '';
                if (level.level < 5 && nextLevel) {
                    const isNextLevelPppVisible = isCurrentLevel; // Only expand PPP for the current level
                    pppHtml = `
                        <div class="collapsible-section">
                            <button type="button" class="collapsible-header">Prepare, Practice, Prove for Level ${nextLevel.level}</button>
                            <div class="collapsible-content" style="display: ${isNextLevelPppVisible ? 'block' : 'none'};">
                                <h4>Prepare</h4>
                                <ul>${renderTasks(skill.id, nextLevel.prepare)}</ul>
                                <h4>Practice</h4>
                                <ul>${renderTasks(skill.id, nextLevel.practice)}</ul>
                                <h4>Prove</h4>
                                <ul>${renderTasks(skill.id, nextLevel.prove)}</ul>
                            </div>
                        </div>
                    `;
                }

                // Description section
                const congratulationsMessage = hasAchievedLevel ? '<p class="congrats">Congratulations on achieving this level!</p>' : '';
                const isDescriptionVisible = hasAchievedLevel;
                const descriptionHtml = `
                    <div class="collapsible-section">
                        <button type="button" class="collapsible-header">Level ${level.level} Description</button>
                        <div class="collapsible-content" style="display: ${isDescriptionVisible ? 'block' : 'none'};">
                            ${congratulationsMessage}
                            <p>${level.description}</p>
                        </div>
                    </div>
                `;

                // Maintenance section
                let maintenanceHtml = '';
                if (level.level > 0 && level.maintenance && level.maintenance.length > 0) {
                     const isMaintenanceVisible = hasAchievedLevel;
                     maintenanceHtml = `
                        <div class="collapsible-section">
                            <button type="button" class="collapsible-header">Required Maintenance for Level ${level.level}</button>
                            <div class="collapsible-content" style="display: ${isMaintenanceVisible ? 'block' : 'none'};">
                                <ul>${renderTasks(skill.id, level.maintenance)}</ul>
                            </div>
                        </div>
                    `;
                }

                return `
                <div class="level-card">
                    <div class="level-card-header">
                         <h3>Level ${level.level}</h3>
                    </div>
                    <div class="level-card-content">
                        ${descriptionHtml}
                        ${maintenanceHtml}
                        ${pppHtml}
                    </div>
                </div>
                `;
            }).join('')}
            </div>
        `;
    };

    /**
     * Recursively renders a list of tasks and their children.
     * @param {string} skillId - The ID of the parent skill.
     * @param {Array} tasks - The array of task objects to render.
     * @returns {string} The generated HTML string for the tasks.
     */
    const renderTasks = (skillId, tasks) => {
        if (!tasks || tasks.length === 0) return '<li>No tasks defined.</li>';

        return tasks.map(task => `
            <li>
                <input type="checkbox"
                       id="task-${task.code}"
                       data-skill-id="${skillId}"
                       data-task-code="${task.code}"
                       ${(task.checked && !task.isUnchecked) ? 'checked' : ''}>
                <label for="task-${task.code}">${task.content}</label>
                ${task.children && task.children.length > 0 ? `<ul class="task-list">${renderTasks(skillId, task.children)}</ul>` : ''}
            </li>
        `).join('');
    };

    /**
     * Calculates the skill's current status ('rusty' or 'current') and highest achieved level.
     * @param {Object} skill - The skill object.
     * @returns {{status: string, level: number}} An object with the skill's status and level.
     */
    const getSkillStatus = (skill) => {
        let highestLevel = 0;
        let isRusty = false;

        skill.levels.forEach(level => {
            const proveTasks = level.prove || [];
            if (proveTasks.length > 0 && proveTasks.every(p => p.checked && !p.isUnchecked)) {
                highestLevel = Math.max(highestLevel, level.level);

                const maintenanceTasks = level.maintenance || [];
                maintenanceTasks.forEach(mTask => {
                    if (!mTask.maintenancePeriod || (!mTask.checked && !mTask.rechecked)) {
                        isRusty = true; // Rusty if maintenance is required but not done
                        return;
                    }

                    const lastChecked = (mTask.rechecked && mTask.rechecked.length > 0)
                        ? mTask.rechecked[mTask.rechecked.length - 1]
                        : mTask.checked;

                    if(!lastChecked || mTask.isUnchecked) {
                        isRusty = true;
                        return;
                    }

                    const expiryDate = new Date(lastChecked);
                    const period = mTask.maintenancePeriod; // e.g., { value: 3, unit: 'months' }

                    switch (period.unit) {
                        case 'days': expiryDate.setDate(expiryDate.getDate() + period.value); break;
                        case 'weeks': expiryDate.setDate(expiryDate.getDate() + period.value * 7); break;
                        case 'months': expiryDate.setMonth(expiryDate.getMonth() + period.value); break;
                        case 'years': expiryDate.setFullYear(expiryDate.getFullYear() + period.value); break;
                    }

                    if (new Date() > expiryDate) {
                        isRusty = true;
                    }
                });
            }
        });

        return { status: isRusty ? 'rusty' : 'current', level: highestLevel };
    };


    // Add event listener for collapsible sections and edit/delete buttons
    skillDisplayContainer.addEventListener('click', (event) => {
        if (event.target.classList.contains('collapsible-header')) {
            event.preventDefault();
            const header = event.target;
            header.classList.toggle('active');
            const content = header.nextElementSibling;
            if (content.style.display === "block") {
                content.style.display = "none";
            } else {
                content.style.display = "block";
            }
        }

        const skillHeader = event.target.closest('.skill-header');
        if (!skillHeader) return;

        const skillId = skillHeader.dataset.skillId;
        const skill = getSkills()[skillId];

        if (event.target.id === 'edit-skill-btn') {
            openSkillEditor(skill);
        }

        if (event.target.id === 'delete-skill-btn') {
            if (confirm('Are you sure you want to delete this skill?')) {
                deleteSkill(skillId);
                renderSkill(null); // Clear the display
                renderSkillList(); // Update the skill list modal
            }
        }
    });


    // --- SKILL LIST MODAL LOGIC ---
    const searchInput = document.getElementById('search-input');
    const sortSelect = document.getElementById('sort-select');
    const filterSelect = document.getElementById('filter-select');
    const skillListContainer = document.getElementById('skill-list');

    const renderSkillList = () => {
        const skills = Object.values(getSkills());
        let filteredSkills = skills;

        // 1. Filter
        const filterValue = filterSelect.value;
        if (filterValue === 'published') {
            filteredSkills = filteredSkills.filter(s => !s.isDraft);
        } else if (filterValue === 'draft') {
            filteredSkills = filteredSkills.filter(s => s.isDraft);
        }

        // 2. Search
        const searchValue = searchInput.value.toLowerCase();
        if (searchValue) {
            filteredSkills = filteredSkills.filter(s => s.skillName.toLowerCase().includes(searchValue));
        }

        // 3. Sort
        const sortValue = sortSelect.value;
        filteredSkills.sort((a, b) => {
            switch (sortValue) {
                case 'name-asc': return a.skillName.localeCompare(b.skillName);
                case 'name-desc': return b.skillName.localeCompare(a.skillName);
                case 'date-created-desc': return new Date(b.createdAt) - new Date(a.createdAt);
                case 'date-created-asc': return new Date(a.createdAt) - new Date(b.createdAt);
                case 'date-updated-desc': return new Date(b.updatedAt) - new Date(a.updatedAt);
                case 'date-updated-asc': return new Date(a.updatedAt) - new Date(b.updatedAt);
                default: return 0;
            }
        });

        // 4. Render
        skillListContainer.innerHTML = filteredSkills.map(skill => `
            <div class="skill-list-item" data-skill-id="${skill.id}">
                ${skill.skillName} ${skill.isDraft ? '(Draft)' : ''}
            </div>
        `).join('') || '<p>No skills found.</p>';
    };

    openSkillListModalBtn.addEventListener('click', () => {
        renderSkillList();
        skillListModal.style.display = 'block';
    });

    [searchInput, sortSelect, filterSelect].forEach(el => el.addEventListener('change', renderSkillList));

    skillListContainer.addEventListener('click', (event) => {
        if (event.target.classList.contains('skill-list-item')) {
            const skillId = event.target.dataset.skillId;
            const skill = getSkills()[skillId];
            if (skill) {
                renderSkill(skill);
                skillListModal.style.display = 'none';
            }
        }
    });

    // --- SKILL EDITOR MODAL LOGIC ---
    const createNewSkillBtn = document.getElementById('create-new-skill-btn');
    const skillForm = document.getElementById('skill-form');
    const editorTitle = document.getElementById('editor-title');
    const publishSkillBtn = document.getElementById('publish-skill-button');
    let currentlyEditingSkillId = null;

    const levelTooltips = [
        "Level 0 -> 1 (First Steps): Define the initial actions required to start the skill. e.g., for a private pilot: find an intro flight, get study materials, find an instructor.",
        "Level 1 -> 2 (Fledgling Ability): The user has started. What's needed to show progress and develop basic ability? e.g., gain knowledge, log required flight hours.",
        "Level 2 -> 3 (Becoming Average): The user has basic ability. What's required to become proficient and meet the average standard? e.g., hone skills to pass the checkride and get a pilot's license.",
        "Level 3 -> 4 (Going Beyond): The user is proficient. What does it take to go beyond the average and become an expert? e.g., improve tolerances, deepen knowledge, expand personal minimums.",
        "Level 4 -> 5 (The Pinnacle): The user is an expert. What is involved in reaching the pinnacle of this skill and becoming legendary? e.g., become competent in all possible situations within the skill's scope.",
        "Level 5 (Mastery): The user has reached the pinnacle. This level is for defining the ongoing maintenance required to stay at the top of their game."
    ];

    const openSkillEditor = (skill = null) => {
        currentlyEditingSkillId = skill ? skill.id : null;

        if (skill) {
            editorTitle.textContent = `Editing: ${skill.skillName}`;
            publishSkillBtn.textContent = 'Update';
        } else {
            editorTitle.textContent = 'Create New Skill';
            publishSkillBtn.textContent = 'Publish';
        }

        renderSkillForm(skill);
        skillEditorModal.style.display = 'block';
    };

    const renderSkillForm = (skill) => {
        const defaultSkill = {
            skillName: '', authorName: '', endorsements: [], rating: { usersAtLevel3: 0 },
            overview: '',
            levels: Array.from({ length: 6 }, (_, i) => ({ level: i, description: '', prepare: [], practice: [], prove: [], maintenance: [] })),
            isDraft: true,
            createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
        };
        const skillData = skill || defaultSkill;

        // Ensure the skill data has exactly 6 levels (0-5) for the form
        const levels = Array.from({ length: 6 }, (_, i) => {
            return (skillData.levels && skillData.levels[i]) ? skillData.levels[i] : { level: i, description: '', prepare: [], practice: [], prove: [], maintenance: [] };
        });
        skillData.levels = levels;


        skillForm.innerHTML = `
            <input type="hidden" id="skillId" value="${skillData.id || ''}">
            <label for="skillName">Skill Name:</label>
            <input type="text" id="skillName" value="${skillData.skillName}" required>

            <label for="authorName">Author:</label>
            <input type="text" id="authorName" value="${skillData.authorName || ''}">

            <label for="endorsements">Endorsements (comma-separated):</label>
            <input type="text" id="endorsements" value="${(skillData.endorsements || []).join(', ')}">

            <label for="rating">Users at Level 3:</label>
            <input type="number" id="rating" value="${skillData.rating.usersAtLevel3 || 0}">

            <label for="overview">Overview:</label>
            <textarea id="overview">${skillData.overview || ''}</textarea>

            <div id="levels-container"></div>
        `;

        const levelsContainer = document.getElementById('levels-container');
        skillData.levels.forEach((level, index) => {
            const nextLevel = skillData.levels[index + 1];
            renderLevelForm(level, nextLevel, levelsContainer);
        });

        skillForm.addEventListener('click', (event) => {
            // Handle tooltips
            if (event.target.classList.contains('tooltip-icon')) {
                alert(event.target.title);
                return;
            }

            // Handle collapsible sections
            if (event.target.classList.contains('collapsible-header')) {
                event.preventDefault();
                const header = event.target;
                header.classList.toggle('active');
                const content = header.nextElementSibling;
                if (content.style.display === "block") {
                    content.style.display = "none";
                } else {
                    content.style.display = "block";
                }
                return;
            }

            // Handle adding new sub-tasks
            if (event.target.classList.contains('add-subtask-btn')) {
                event.preventDefault();
                const button = event.target;
                const taskItem = button.closest('.task-item');
                const type = taskItem.closest('.task-category').dataset.type;
                const subtaskList = taskItem.querySelector('.task-list');

                if (subtaskList) {
                    subtaskList.style.display = 'block';
                    const newTaskHtml = renderTaskForms([{ content: '' }], type);
                    subtaskList.insertAdjacentHTML('beforeend', newTaskHtml);
                }
                return;
            }

            // Handle adding new tasks
            if (event.target.classList.contains('add-task-btn')) {
                event.preventDefault();
                const button = event.target;
                const type = button.dataset.type;
                const taskList = button.previousElementSibling; // The <ul> is right before the button
                const newTaskHtml = renderTaskForms([{ content: '' }], type); // Render a single new task
                taskList.insertAdjacentHTML('beforeend', newTaskHtml);
                return;
            }

            // Handle deleting tasks
            if (event.target.classList.contains('delete-task-btn')) {
                event.preventDefault();
                const taskItem = event.target.closest('.task-item');
                if (taskItem) {
                    taskItem.remove();
                }
                return;
            }
        });
    };

    const renderLevelForm = (levelData, nextLevelData, container) => {
        const levelDiv = document.createElement('div');
        levelDiv.className = 'level-card';
        levelDiv.dataset.level = levelData.level;

        const tooltipText = levelTooltips[levelData.level] || "Define the requirements for this level.";

        // Card Header
        let html = `
            <div class="level-card-header" data-level="${levelData.level}">
                <h3>Level ${levelData.level}</h3>
                <span class="tooltip-icon" title="${tooltipText}">?</span>
            </div>
            <div class="level-card-content">
        `;

        // --- Section Order: Description -> Maintenance -> PPP ---

        // 1. Level Description Section
        html += `
            <div class="collapsible-section">
                <button type="button" class="collapsible-header">Level ${levelData.level} Description</button>
                <div class="collapsible-content">
                    <textarea class="level-description" placeholder="Level ${levelData.level} description...">${levelData.description}</textarea>
                </div>
            </div>
        `;

        // 2. Maintenance Section
        if (levelData.level > 0) {
            html += `
                <div class="collapsible-section">
                    <button type="button" class="collapsible-header">Required Maintenance for Level ${levelData.level}</button>
                    <div class="collapsible-content">
                        <div class="task-category" data-type="maintenance">
                            <h4>Maintenance</h4>
                            <ul class="task-list">${renderTaskForms(levelData.maintenance || [], 'maintenance')}</ul>
                            <button type="button" class="add-task-btn" data-level="${levelData.level}" data-type="maintenance">Add Maintenance Task</button>
                        </div>
                    </div>
                </div>
            `;
        }

        // 3. PPP Section (for the next level)
        if (levelData.level < 5 && nextLevelData) {
            html += `
                <div class="collapsible-section">
                    <button type="button" class="collapsible-header">Prepare, Practice, Prove for Level ${nextLevelData.level}</button>
                    <div class="collapsible-content">
                        <div class="task-category" data-type="prepare">
                            <h4>Prepare</h4>
                            <ul class="task-list">${renderTaskForms(nextLevelData.prepare || [], 'prepare')}</ul>
                            <button type="button" class="add-task-btn" data-level="${nextLevelData.level}" data-type="prepare">Add Prepare Task</button>
                        </div>
                        <div class="task-category" data-type="practice">
                            <h4>Practice</h4>
                            <ul class="task-list">${renderTaskForms(nextLevelData.practice || [], 'practice')}</ul>
                            <button type="button" class="add-task-btn" data-level="${nextLevelData.level}" data-type="practice">Add Practice Task</button>
                        </div>
                        <div class="task-category" data-type="prove">
                            <h4>Prove</h4>
                            <ul class="task-list">${renderTaskForms(nextLevelData.prove || [], 'prove')}</ul>
                            <button type="button" class="add-task-btn" data-level="${nextLevelData.level}" data-type="prove">Add Prove Task</button>
                        </div>
                    </div>
                </div>
            `;
        }

        html += `</div>`; // Close level-card-content
        levelDiv.innerHTML = html;
        container.appendChild(levelDiv);
    };

    const renderTaskForms = (tasks, type) => {
        if (!tasks) return '';
        return tasks.map(task => {
            let maintenanceHtml = '';
            if (type === 'maintenance') {
                const period = task.maintenancePeriod || { value: 1, unit: 'months' };
                maintenanceHtml = `
                    <input type="number" class="maintenance-value" value="${period.value}" min="1">
                    <select class="maintenance-unit">
                        <option value="days" ${period.unit === 'days' ? 'selected' : ''}>Days</option>
                        <option value="weeks" ${period.unit === 'weeks' ? 'selected' : ''}>Weeks</option>
                        <option value="months" ${period.unit === 'months' ? 'selected' : ''}>Months</option>
                        <option value="years" ${period.unit === 'years' ? 'selected' : ''}>Years</option>
                    </select>
                `;
            }

            const childrenHtml = (task.children && task.children.length > 0)
                ? `<ul class="task-list">${renderTaskForms(task.children, type)}</ul>`
                : '<ul class="task-list" style="display: none;"></ul>'; // Hidden placeholder for new sub-tasks

            return `
                <li class="task-item">
                    <div class="task-controls">
                        <input type="text" class="task-content" value="${task.content || ''}" placeholder="Task description...">
                        ${maintenanceHtml}
                        <button type="button" class="add-subtask-btn">Add Sub-task</button>
                        <button type="button" class="delete-task-btn">Delete</button>
                    </div>
                    ${childrenHtml}
                </li>
            `;
        }).join('');
    };

    createNewSkillBtn.addEventListener('click', () => openSkillEditor(null));
    publishSkillBtn.addEventListener('click', () => {
        const skill = buildSkillObjectFromForm();
        if (skill) {
            skill.isDraft = false; // Mark as published
            saveSkill(skill);
            skillEditorModal.style.display = 'none';
            renderSkill(getSkills()[skill.id]); // Re-render the updated skill
            renderSkillList(); // Update skill list in case name changed
        }
    });

    // Handle auto-save as draft when closing modal
    window.addEventListener('click', (event) => {
        if (event.target === skillListModal) {
            skillListModal.style.display = 'none';
        }
        if (event.target === skillEditorModal) {
            const skill = buildSkillObjectFromForm();
            if (skill && skill.skillName) { // Only save if there's a skill name
                saveSkill(skill); // Saved as a draft by default
                renderSkillList();
            }
            skillEditorModal.style.display = 'none';
        }
    });

    const buildSkillObjectFromForm = () => {
        const skillId = document.getElementById('skillId').value;
        const existingSkill = getSkills()[skillId];
        const skill = existingSkill || {
            id: skillId || `skill_${new Date().getTime()}`,
            createdAt: new Date().toISOString(),
            levels: Array.from({ length: 6 }, (_, i) => ({ level: i, description: '', prepare: [], practice: [], prove: [], maintenance: [] }))
        };

        skill.skillName = document.getElementById('skillName').value;
        if (!skill.skillName) {
            // Don't alert here, just return null. The calling function can decide.
            return null;
        }

        skill.authorName = document.getElementById('authorName').value;
        skill.overview = document.getElementById('overview').value;
        skill.updatedAt = new Date().toISOString();
        skill.isDraft = true; // Always save as draft until "Publish" is clicked

        skill.endorsements = document.getElementById('endorsements').value.split(',').map(e => e.trim()).filter(Boolean);
        skill.rating = { usersAtLevel3: parseInt(document.getElementById('rating').value, 10) || 0 };

        const newLevels = Array.from({ length: 6 }, (_, i) => {
             const existingLevel = skill.levels.find(l => l.level === i) || {};
             return {
                level: i, description: '', prepare: [], practice: [], prove: [], maintenance: [],
                ...existingLevel
             };
        });


        document.querySelectorAll('.level-card').forEach((levelCard) => {
            const levelIndex = parseInt(levelCard.dataset.level, 10);
            const currentLevelObject = newLevels[levelIndex];

            const descriptionTextarea = levelCard.querySelector(`.level-description`);
            if (descriptionTextarea) {
                currentLevelObject.description = descriptionTextarea.value;
            }

            if (levelIndex > 0) {
                const maintenanceContainer = levelCard.querySelector(`.task-category[data-type="maintenance"]`);
                if (maintenanceContainer) {
                    const maintenanceTasks = [];
                    maintenanceContainer.querySelectorAll('.task-list > .task-item').forEach(taskItem => {
                        const contentInput = taskItem.querySelector('.task-content');
                        if (contentInput && contentInput.value) {
                            const task = { content: contentInput.value };
                            const valueInput = taskItem.querySelector('.maintenance-value');
                            const unitInput = taskItem.querySelector('.maintenance-unit');
                            if (valueInput && unitInput) {
                                task.maintenancePeriod = { value: parseFloat(valueInput.value) || 1, unit: unitInput.value };
                            }
                            maintenanceTasks.push(task);
                        }
                    });
                    currentLevelObject.maintenance = maintenanceTasks;
                }
            }

            if (levelIndex < 5) {
                const nextLevelObject = newLevels[levelIndex + 1];
                ['prepare', 'practice', 'prove'].forEach(type => {
                    const taskContainer = levelCard.querySelector(`.task-category[data-type="${type}"]`);
                    if (taskContainer) {
                        const tasks = [];
                        taskContainer.querySelectorAll('.task-list > .task-item').forEach(taskItem => {
                            const contentInput = taskItem.querySelector('.task-content');
                            if (contentInput && contentInput.value) {
                                tasks.push({ content: contentInput.value });
                            }
                        });
                        nextLevelObject[type] = tasks;
                    }
                });
            }
        });

        skill.levels = newLevels;

        const parseTasksFromList = (listElement, type) => {
            const tasks = [];
            const taskItems = listElement.querySelectorAll(':scope > .task-item');

            taskItems.forEach(item => {
                const contentInput = item.querySelector(':scope > .task-controls > .task-content');
                if (contentInput && contentInput.value) {
                    const task = { content: contentInput.value };
                    if (type === 'maintenance') {
                         const valueInput = item.querySelector('.maintenance-value');
                         const unitInput = item.querySelector('.maintenance-unit');
                         if (valueInput && unitInput) {
                             task.maintenancePeriod = { value: parseFloat(valueInput.value) || 1, unit: unitInput.value };
                         }
                    }

                    const sublist = item.querySelector(':scope > .task-list');
                    if (sublist && sublist.children.length > 0) {
                        task.children = parseTasksFromList(sublist, type);
                    }
                    tasks.push(task);
                }
            });
            return tasks;
        };

        document.querySelectorAll('.level-card').forEach((levelCard) => {
            const levelIndex = parseInt(levelCard.dataset.level, 10);
            const currentLevelObject = newLevels[levelIndex];

            const descriptionTextarea = levelCard.querySelector(`.level-description`);
            if (descriptionTextarea) {
                currentLevelObject.description = descriptionTextarea.value;
            }

            // PPP tasks are for the *next* level
            if (levelIndex < 5) {
                const nextLevelObject = newLevels[levelIndex + 1];
                ['prepare', 'practice', 'prove'].forEach(type => {
                    const taskCategory = levelCard.querySelector(`.task-category[data-type="${type}"]`);
                    if (taskCategory) {
                        const taskList = taskCategory.querySelector('.task-list');
                        if(taskList) nextLevelObject[type] = parseTasksFromList(taskList, type);
                    }
                });
            }

            // Maintenance tasks are for the *current* level
            if (levelIndex > 0) {
                const taskCategory = levelCard.querySelector(`.task-category[data-type="maintenance"]`);
                if (taskCategory) {
                    const taskList = taskCategory.querySelector('.task-list');
                    if(taskList) currentLevelObject.maintenance = parseTasksFromList(taskList, 'maintenance');
                }
            }
        });

        skill.levels = newLevels;

        // --- Assign Codes ---
        skill.levels.forEach(level => {
            const assignCodesRecursive = (tasks, parentCode) => {
                tasks.forEach((task, index) => {
                    task.code = `${parentCode}-${index + 1}`;
                    if (task.children) {
                        assignCodesRecursive(task.children, task.code);
                    }
                });
            };

            const pppInitial = { 'prepare': 'PE', 'practice': 'PA', 'prove': 'PO' };
            for(const type in pppInitial) {
                 if (level[type]) {
                    level[type].forEach((task, index) => {
                        task.code = `${level.level}${pppInitial[type]}${index + 1}`;
                        if (task.children) assignCodesRecursive(task.children, task.code);
                    });
                 }
            }

            if (level.maintenance) {
                level.maintenance.forEach((task, index) => {
                    task.code = `${level.level}MNR${index + 1}`;
                    if (task.children) assignCodesRecursive(task.children, task.code);
                });
            }
        });

        return skill;
    };

    // --- DATA EXPORT ---
    const downloadSkillsBtn = document.getElementById('download-skills-btn');

    downloadSkillsBtn.addEventListener('click', () => {
        const skills = getSkills();
        if (Object.keys(skills).length === 0) {
            alert('Skill library is empty. Nothing to download.');
            return;
        }

        const dataStr = JSON.stringify(skills, null, 4); // Pretty print JSON
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);

        const downloadLink = document.createElement('a');
        downloadLink.href = url;
        downloadLink.download = 'skill_library.json';
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        URL.revokeObjectURL(url);
    });

    // --- DATA IMPORT ---
    const uploadSkillsBtn = document.getElementById('upload-skills-btn');
    const uploadSkillsInput = document.getElementById('upload-skills-input');

    uploadSkillsBtn.addEventListener('click', () => {
        uploadSkillsInput.click();
    });

    uploadSkillsInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) {
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const newSkills = JSON.parse(e.target.result);

                const addOrReplace = confirm("Press OK to add to the library, or Cancel to replace the library.");

                if (addOrReplace) {
                    if(confirm("Are you sure you want to add the skills from this file to your library? This will overwrite any skills with the same name.")){
                        const currentSkills = getSkills();
                        const updatedSkills = { ...currentSkills, ...newSkills };
                        localStorage.setItem('skills', JSON.stringify(updatedSkills));
                        alert('Skills added successfully!');
                    }
                } else {
                    if(confirm("Are you sure you want to replace your entire skill library with the contents of this file? This action cannot be undone.")){
                        localStorage.setItem('skills', JSON.stringify(newSkills));
                        alert('Skill library replaced successfully!');
                    }
                }

                renderSkill(null);
                renderSkillList();

            } catch (error) {
                alert('Error reading or parsing the file. Please ensure it is a valid JSON file.');
                console.error("Error during file import: ", error);
            } finally {
                uploadSkillsInput.value = '';
            }
        };
        reader.readAsText(file);
    });

    // --- Initial Load ---
    const initialize = () => {
        // For now, just show a welcome message.
        // Later, we can load the last viewed skill.
        renderSkill(null);
    };

    initialize();

});
