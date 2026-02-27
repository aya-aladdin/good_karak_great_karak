// static/js/game.js
document.addEventListener('DOMContentLoaded', () => {
    // --- DOM ELEMENTS ---
    const gameWorld = document.getElementById('game-world');
    const scoreEl = document.getElementById('score');
    const feedbackEl = document.getElementById('feedback');
    const potStatusEl = document.getElementById('pot-status');
    const potContentsEl = document.getElementById('pot-contents');
    const customerOrderEl = document.querySelector('#customer-order span');
    const patienceBarEl = document.getElementById('patience-bar');
    const ingredients = document.querySelectorAll('.ingredient');
    const serveBtn = document.getElementById('serve-btn');
    const dayEl = document.getElementById('day');
    const streakEl = document.getElementById('streak');

    // --- GAME STATE ---
    let score = 0;
    let day = 1;
    let streak = 0;
    let customersServed = 0;
    let pot = {
        ingredients: [],
        brewed: false
    };
    let customer = {
        order: [],
        patience: 100,
        timer: null,
        active: false
    };
    
    // The correct recipe for Karak
    const karakRecipe = ["tea", "milk", "sugar", "cardamom"];

    // --- GAME FUNCTIONS ---

    /**
     * Updates the visual feedback for the player.
     */
    function updateFeedback(message, isError = false) {
        feedbackEl.textContent = message;
        feedbackEl.style.color = isError ? '#ff6b6b' : '#dcdde1'; 
        
        if (isError) {
            gameWorld.classList.add('shake');
            setTimeout(() => {
                gameWorld.classList.remove('shake');
            }, 500);
        }
    }

    /**
     * Resets the brewing pot to its initial empty state.
     */
    function resetPot() {
        pot.ingredients = [];
        pot.brewed = false;
        potStatusEl.textContent = 'Status: Empty';
        potContentsEl.style.height = '0%';
        potContentsEl.style.backgroundColor = '#8b4513'; // Reset color
        updateFeedback('Pot has been emptied.');
    }

    /**
     * Generates a new customer with a Karak order.
     */
    function newCustomer() {
        if (customer.active) return; // Don't create a new customer if one is waiting

        customer.order = [...karakRecipe].sort(() => 0.5 - Math.random()); // Shuffle order for fun
        customer.patience = 100;
        customer.active = true;
        
        customerOrderEl.textContent = `${customer.order.join(', ')}`;
        patienceBarEl.style.width = '100%';
        patienceBarEl.style.backgroundColor = '#4cd137'; // Reset to green
        updateFeedback('A new customer has arrived!');

        // Difficulty: Patience drops faster on higher days
        const decayRate = 1 + (day * 0.5); 

        // Start the patience timer
        customer.timer = setInterval(() => {
            customer.patience -= decayRate; // Decrease patience based on difficulty
            patienceBarEl.style.width = customer.patience + '%';

            if (customer.patience < 50) {
                patienceBarEl.style.backgroundColor = '#f1c40f'; // Warning Yellow
            }
            if (customer.patience < 20) {
                patienceBarEl.style.backgroundColor = '#e74c3c'; // Danger Red
            }
            if (customer.patience <= 0) {
                clearInterval(customer.timer);
                customerLeaves(false); // Customer leaves unhappy
            }
        }, 200); // Faster tick rate for smoother bar
    }

    /**
     * Handles the customer leaving, either happy or unhappy.
     */
    function customerLeaves(happy) {
        clearInterval(customer.timer);
        customer.active = false;
        customerOrderEl.textContent = 'Waiting...';
        patienceBarEl.style.width = '100%';

        if (happy) {
            streak++;
            customersServed++;
            
            // Score calculation: Base 10 + Streak Bonus
            const earnings = 10 + (streak * 2);
            score += earnings;
            updateFeedback(`Great Karak! +${earnings} AED`);
            
            // Day progression
            if (customersServed % 3 === 0) {
                day++;
                dayEl.textContent = day;
                updateFeedback(`Day ${day} begins! Customers are faster!`);
            }
        } else {
            streak = 0;
            score = Math.max(0, score - 5); // Penalty
            updateFeedback('Customer left angry! -5 AED', true);
        }
        scoreEl.textContent = score;
        streakEl.textContent = streak;
        resetPot();

        // Get a new customer after a short delay
        setTimeout(newCustomer, 3000);
    }

    /**
     * Adds an ingredient to the pot.
     */
    function addIngredient(ingredientName) {
        if (!customer.active) {
            updateFeedback('Wait for a customer before you start brewing!', true);
            return;
        }
        if (pot.ingredients.length >= 4) {
            updateFeedback('The pot is full!', true);
            return;
        }

        pot.ingredients.push(ingredientName);
        
        // Update visuals
        const newHeight = (pot.ingredients.length / 4) * 100; 
        potContentsEl.style.height = newHeight + '%';
        potStatusEl.textContent = `Contains: ${pot.ingredients.join(', ')}`;
        updateFeedback(`Added ${ingredientName}.`);
    }

    /**
     * Checks if the brewed drink matches the customer's order.
     */
    function serveDrink() {
        if (!customer.active) {
            updateFeedback('There is no one to serve!', true);
            return;
        }
        if (pot.ingredients.length < 4) {
            updateFeedback('The drink is not ready yet!', true);
            return;
        }

        // Check if the ingredients in the pot match the recipe (order doesn't matter for this simple version)
        const potSet = new Set(pot.ingredients);
        const recipeSet = new Set(karakRecipe);
        const isCorrect = potSet.size === recipeSet.size && [...potSet].every(value => recipeSet.has(value));

        if (isCorrect) {
            customerLeaves(true);
        } else {
            updateFeedback('This is not what the customer ordered!', true);
            // In a real game, this might just make the customer unhappy, but here we'll reset.
            resetPot();
        }
    }

    // --- EVENT LISTENERS ---
    ingredients.forEach(ingredient => {
        ingredient.addEventListener('click', () => {
            addIngredient(ingredient.dataset.ingredient);
        });
    });

    serveBtn.addEventListener('click', serveDrink);

    // --- START GAME ---
    resetPot();
    setTimeout(newCustomer, 1000); // First customer arrives after 1 second
});
