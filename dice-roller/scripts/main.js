// PWA Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then(registration => {
                console.log('ServiceWorker registration successful with scope: ', registration.scope);
            })
            .catch(error => {
                console.log('ServiceWorker registration failed: ', error);
            });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const diceBtns = document.querySelectorAll('.dice-btn');
    const rollBtn = document.getElementById('roll-btn');
    const advantageBtn = document.getElementById('advantage-btn');
    const disadvantageBtn = document.getElementById('disadvantage-btn');
    const clearHistoryBtn = document.getElementById('clear-history-btn');

    const diceCountInput = document.getElementById('dice-count');
    const modifierInput = document.getElementById('modifier');
    const resultDisplay = document.getElementById('result-display');
    const historyList = document.getElementById('history-list');

    let selectedSides = 6; // Default to d6

    // --- Event Listeners ---

    diceBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all buttons
            diceBtns.forEach(b => b.classList.remove('active'));
            // Add active class to the clicked button
            btn.classList.add('active');
            selectedSides = parseInt(btn.dataset.sides);
        });
    });

    rollBtn.addEventListener('click', () => {
        const numDice = parseInt(diceCountInput.value);
        const modifier = parseInt(modifierInput.value);
        rollDice(numDice, selectedSides, modifier);
    });

    advantageBtn.addEventListener('click', () => {
        const modifier = parseInt(modifierInput.value);
        rollAdvantageDisadvantage(true, modifier);
    });

    disadvantageBtn.addEventListener('click', () => {
        const modifier = parseInt(modifierInput.value);
        rollAdvantageDisadvantage(false, modifier);
    });

    clearHistoryBtn.addEventListener('click', () => {
        historyList.innerHTML = '';
    });


    // --- Core Functions ---

    function rollDie(sides) {
        return Math.floor(Math.random() * sides) + 1;
    }

    function rollDice(numDice, sides, modifier) {
        let rolls = [];
        let total = 0;
        for (let i = 0; i < numDice; i++) {
            const roll = rollDie(sides);
            rolls.push(roll);
            total += roll;
        }

        const finalTotal = total + modifier;
        const modifierString = modifier > 0 ? ` + ${modifier}` : (modifier < 0 ? ` - ${Math.abs(modifier)}` : '');
        const resultString = `${numDice}d${sides}${modifierString} = [${rolls.join(', ')}]${modifierString} = ${finalTotal}`;

        displayResult(resultString, finalTotal);
        addToHistory(resultString);
    }

    function rollAdvantageDisadvantage(isAdvantage, modifier) {
        const roll1 = rollDie(20);
        const roll2 = rollDie(20);
        const chosenRoll = isAdvantage ? Math.max(roll1, roll2) : Math.min(roll1, roll2);

        const finalTotal = chosenRoll + modifier;
        const rollType = isAdvantage ? 'Advantage' : 'Disadvantage';
        const modifierString = modifier > 0 ? ` + ${modifier}` : (modifier < 0 ? ` - ${Math.abs(modifier)}` : '');
        const resultString = `${rollType} Roll: [${roll1}, ${roll2}] -> ${chosenRoll}${modifierString} = ${finalTotal}`;

        displayResult(resultString, finalTotal);
        addToHistory(resultString);
    }

    function displayResult(text, total) {
        resultDisplay.textContent = text;
        // Add a class for critical success/failure visuals
        resultDisplay.classList.remove('crit-success', 'crit-fail');
        if (selectedSides === 20) {
            const baseRoll = parseInt(text.match(/\[(.*?)\]/)[1].split(',')[0]); // Get first roll for crit check
            if (baseRoll === 20) {
                resultDisplay.classList.add('crit-success');
            } else if (baseRoll === 1) {
                resultDisplay.classList.add('crit-fail');
            }
        }
    }

    function addToHistory(result) {
        const li = document.createElement('li');
        li.textContent = result;
        historyList.prepend(li);
    }

    // Set a default active button
    document.querySelector('.dice-btn[data-sides="6"]').classList.add('active');
});
