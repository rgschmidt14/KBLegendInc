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
            updateTaskStatus(skillId, taskCode, event.target.checked);
            // Re-render the skill to reflect changes (e.g., parent task checked)
            renderSkill(getSkills()[skillId]);
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
        const currentLevel = skill.levels.find(l => l.level === highestLevel) || skill.levels[0];

        const endorsementText = skill.endorsements && skill.endorsements.length > 0 ? `<em>(endorsed by ${skill.endorsements.join(', ')})</em>` : '';

        skillDisplayContainer.innerHTML = `
            <div class="skill-header" data-skill-id="${skill.id}">
                <h2>${skill.skillName} ${currentLevel.level} (${status})</h2>
                <button id="edit-skill-btn">Edit Skill</button>
                <button id="delete-skill-btn">Delete Skill</button>
                <p><strong>Author:</strong> ${skill.authorName} ${endorsementText}</p>
                <p><strong>Rating:</strong> ${skill.rating.usersAtLevel3} people have obtained level 3</p>
                <p><em>Created: ${new Date(skill.createdAt).toLocaleDateString()} (Last Updated: ${new Date(skill.updatedAt).toLocaleDateString()})</em></p>
                <p>${skill.overview}</p>
            </div>
            ${skill.levels.map((level) => {
                const nextLevel = skill.levels.find(l => l.level === level.level + 1);
                const hasAchievedLevel = level.level <= highestLevel;
                const congratulationsMessage = hasAchievedLevel ? '<p class="congrats">Congratulations on achieving this level!</p>' : '';

                let pppHtml = '';
                if (nextLevel) {
                    pppHtml = `
                        <div class="ppp-section">
                            <h4>Prepare for Level ${nextLevel.level}</h4>
                            <ul>${renderTasks(skill.id, nextLevel.prepare)}</ul>
                            <h4>Practice for Level ${nextLevel.level}</h4>
                            <ul>${renderTasks(skill.id, nextLevel.practice)}</ul>
                            <h4>Prove for Level ${nextLevel.level}</h4>
                            <ul>${renderTasks(skill.id, nextLevel.prove)}</ul>
                        </div>
                    `;
                }

                const maintenanceHtml = (level.level > 0 && level.maintenance && level.maintenance.length > 0)
                    ? `<div class="maintenance-section">
                           <h4 class="maintenance-title">Required Maintenance</h4>
                           <div class="maintenance-content" style="display: none;">
                               <ul>${renderTasks(skill.id, level.maintenance)}</ul>
                           </div>
                       </div>`
                    : '';

                // By default, only show the current and next level's content expanded.
                const isContentVisible = level.level <= highestLevel + 1;

                return `
                <div class="skill-level">
                    <h3 class="level-title">Level ${level.level}</h3>
                    <div class="level-content" style="display: ${isContentVisible ? 'block' : 'none'};">
                        ${congratulationsMessage}
                        <p>${level.description}</p>
                        ${maintenanceHtml}
                        <hr />
                        ${pppHtml}
                    </div>
                </div>
                `;
            }).join('')}
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
                ${task.children && task.children.length > 0 ? `<ul>${renderTasks(skillId, task.children)}</ul>` : ''}
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
        if (event.target.classList.contains('level-title')) {
            const content = event.target.nextElementSibling;
            // Toggle visibility
            content.style.display = content.style.display === 'block' ? 'none' : 'block';
        } else if (event.target.classList.contains('maintenance-title')) {
            const content = event.target.nextElementSibling;
            content.style.display = content.style.display === 'block' ? 'none' : 'block';
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
        skillData.levels.forEach(level => renderLevelForm(level, levelsContainer));

        skillForm.addEventListener('click', (event) => {
            if (event.target.classList.contains('tooltip-icon')) {
                alert(event.target.title);
            }
        });
    };

    const renderLevelForm = (level, container) => {
        const levelDiv = document.createElement('div');
        levelDiv.className = 'level-form';
        levelDiv.dataset.level = level.level;

        const tooltipText = levelTooltips[level.level] || "Define the requirements for this level.";

        let buttonsHtml = '';
        if (level.level < 5) { // Levels 0-4 get PPP buttons
            buttonsHtml += `
                <button type="button" class="add-task-btn" data-level="${level.level}" data-type="prepare">Add Prepare</button>
                <button type="button" class="add-task-btn" data-level="${level.level}" data-type="practice">Add Practice</button>
                <button type="button" class="add-task-btn" data-level="${level.level}" data-type="prove">Add Prove</button>
            `;
        }
        if (level.level > 0) { // Levels 1-5 get Maintenance buttons
            buttonsHtml += `<button type="button" class="add-task-btn" data-level="${level.level}" data-type="maintenance">Add Maintenance</button>`;
        }

        levelDiv.innerHTML = `
            <div class="level-form-header">
                 <h4>Level ${level.level}</h4>
                 <span class="tooltip-icon" title="${tooltipText}">?</span>
            </div>
            <textarea placeholder="Level description..." title="${tooltipText}">${level.description}</textarea>
            <div class="tasks-container" data-level="${level.level}">
                <!-- Tasks will be rendered here -->
            </div>
            ${buttonsHtml}
        `;
        container.appendChild(levelDiv);

        const tasksContainer = levelDiv.querySelector('.tasks-container');
        ['prepare', 'practice', 'prove', 'maintenance'].forEach(type => {
            if(level[type]) renderTaskForms(level[type], tasksContainer, type);
        });

        levelDiv.querySelectorAll('.add-task-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const level = e.target.dataset.level;
                const type = e.target.dataset.type;
                // Add a new empty task form
                renderTaskForms([{ content: '', code: '' }], tasksContainer, type, true);
            });
        });
    };

    const renderTaskForms = (tasks, container, type, isNew = false) => {
        const taskList = document.createElement('ul');
        taskList.innerHTML = `<h5>${type.charAt(0).toUpperCase() + type.slice(1)}</h5>`;

        tasks.forEach(task => {
            const taskItem = document.createElement('li');
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
            taskItem.innerHTML = `
                <input type="text" class="task-content" value="${task.content || ''}" placeholder="Task description...">
                ${maintenanceHtml}
                <button type="button" class="convert-to-subtask-btn">Make Sub-task</button>
            `;
            taskItem.querySelector('.convert-to-subtask-btn').addEventListener('click', (e) => {
                const currentTask = e.target.parentElement;
                const newParent = document.createElement('li');
                newParent.innerHTML = `
                    <input type="text" class="task-content" value="" placeholder="New parent task overview...">
                    <ul></ul>
                `;
                currentTask.parentElement.insertBefore(newParent, currentTask);
                newParent.querySelector('ul').appendChild(currentTask);
            });

            if (task.children && task.children.length > 0) {
                renderTaskForms(task.children, taskItem);
            }
            taskList.appendChild(taskItem);
        });
        container.appendChild(taskList);
    };

    createNewSkillBtn.addEventListener('click', () => openSkillEditor(null));
    publishSkillBtn.addEventListener('click', () => {
        const skill = buildSkillObjectFromForm();
        if (skill) {
            skill.isDraft = false;
            saveSkill(skill);
            skillEditorModal.style.display = 'none';
            renderSkill(skill);
        }
    });

    window.addEventListener('click', (event) => {
        if (event.target === skillListModal) {
            skillListModal.style.display = 'none';
        }
        if (event.target === skillEditorModal) {
            const skill = buildSkillObjectFromForm();
            if (skill && skill.skillName) {
                saveSkill(skill);
            }
            skillEditorModal.style.display = 'none';
        }
    });

    const buildSkillObjectFromForm = () => {
        const skillId = document.getElementById('skillId').value;
        const skill = getSkills()[skillId] || {
            id: `skill_${new Date().getTime()}`,
            createdAt: new Date().toISOString(),
        };

        skill.skillName = document.getElementById('skillName').value;
        if (!skill.skillName) return null;

        skill.authorName = document.getElementById('authorName').value;
        skill.overview = document.getElementById('overview').value;
        skill.updatedAt = new Date().toISOString();
        skill.isDraft = true;

        skill.endorsements = document.getElementById('endorsements').value.split(',').map(e => e.trim()).filter(Boolean);
        skill.rating = { usersAtLevel3: parseInt(document.getElementById('rating').value, 10) || 0 };
        skill.levels = [];

        document.querySelectorAll('.level-form').forEach((levelDiv) => {
            const levelIndex = levelDiv.dataset.level;
            const level = {
                level: parseInt(levelIndex, 10),
                description: levelDiv.querySelector('textarea').value,
                prepare: [], practice: [], prove: [], maintenance: []
            };

            const parseTasks = (container, type, parentCode) => {
                const tasks = [];
                const directChildren = Array.from(container.children).filter(el => el.tagName === 'LI');

                directChildren.forEach((li, index) => {
                    const taskContentInput = li.querySelector('.task-content');
                    if (!taskContentInput) return;

                    const content = taskContentInput.value;
                    if (!content) return;

                    const newCode = `${parentCode}-${index + 1}`;
                    const task = {
                        content: content,
                        code: newCode
                    };

                    if (type === 'maintenance') {
                        const value = li.querySelector('.maintenance-value').value;
                        const unit = li.querySelector('.maintenance-unit').value;
                        task.maintenancePeriod = { value: parseFloat(value) || 1, unit };
                    }

                    const sublist = li.querySelector('ul');
                    if (sublist) {
                        task.children = parseTasks(sublist, type, newCode);
                    }

                    tasks.push(task);
                });
                return tasks;
            };

            levelDiv.querySelectorAll('.tasks-container > ul').forEach(ul => {
                const type = ul.querySelector('h5').textContent.toLowerCase();
                const typeCode = type.charAt(0).toUpperCase();
                level[type] = parseTasks(ul, type, `${levelIndex}${typeCode}`);
            });

            skill.levels.push(level);
        });

        return skill;
    };

    // --- Initial Load ---
    const initialize = () => {
        // For now, just show a welcome message.
        // Later, we can load the last viewed skill.
        renderSkill(null);
    };

    initialize();

});
