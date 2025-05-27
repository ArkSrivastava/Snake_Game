// Get canvas and context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game variables
let snake = [];
let food = {};
let bonusFood = null;
let bonusFoodTimer = null;
let direction = 'right';
let newDirection = 'right';
let gameSpeed = 100; // milliseconds
let gameLoop;
let score = 0;
let level = 1;
let highScore = localStorage.getItem('snakeHighScore') || 0;
let gameRunning = false;
let gridSize = 20; // Size of grid cells
let gridWidth = canvas.width / gridSize;
let gridHeight = canvas.height / gridSize;
let difficultySettings = {
    easy: { initialSpeed: 120, speedDecrement: 1, bonusChance: 0.005, bonusPoints: 20, bonusDuration: 10000 },
    medium: { initialSpeed: 100, speedDecrement: 2, bonusChance: 0.01, bonusPoints: 30, bonusDuration: 7000 },
    hard: { initialSpeed: 80, speedDecrement: 3, bonusChance: 0.02, bonusPoints: 50, bonusDuration: 5000 }
};
let currentDifficulty = 'medium';
let particles = [];

// DOM elements
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('highScore');
const levelElement = document.getElementById('level');
const startBtn = document.getElementById('startBtn');
const resetBtn = document.getElementById('resetBtn');
const difficultySelector = document.getElementById('difficulty');

// Update high score display
highScoreElement.textContent = highScore;

// Difficulty change handler
difficultySelector.addEventListener('change', function() {
    currentDifficulty = this.value;
    if (!gameRunning) {
        initGame();
        draw();
    }
});

// Initialize game
function initGame() {
    // Create initial snake (3 segments)
    snake = [
        { x: 6, y: 10 },
        { x: 5, y: 10 },
        { x: 4, y: 10 }
    ];
    
    // Reset score and level
    score = 0;
    level = 1;
    scoreElement.textContent = score;
    levelElement.textContent = level;
    
    // Reset direction
    direction = 'right';
    newDirection = 'right';
    
    // Reset game speed based on difficulty
    gameSpeed = difficultySettings[currentDifficulty].initialSpeed;
    
    // Clear bonus food
    bonusFood = null;
    if (bonusFoodTimer) clearTimeout(bonusFoodTimer);
    
    // Clear particles
    particles = [];
    
    // Create initial food
    createFood();
    
    // Clear any existing game loop
    if (gameLoop) clearInterval(gameLoop);
}

// Create food at random position
function createFood() {
    // Generate random position for food
    let foodX, foodY;
    let validPosition = false;
    
    while (!validPosition) {
        foodX = Math.floor(Math.random() * gridWidth);
        foodY = Math.floor(Math.random() * gridHeight);
        
        // Check if food position overlaps with snake or bonus food
        validPosition = true;
        for (let segment of snake) {
            if (segment.x === foodX && segment.y === foodY) {
                validPosition = false;
                break;
            }
        }
        
        if (bonusFood && foodX === bonusFood.x && foodY === bonusFood.y) {
            validPosition = false;
        }
    }
    
    food = { x: foodX, y: foodY };
}

// Create bonus food
function createBonusFood() {
    if (bonusFood) return; // Don't create if one already exists
    
    let bonusFoodX, bonusFoodY;
    let validPosition = false;
    
    while (!validPosition) {
        bonusFoodX = Math.floor(Math.random() * gridWidth);
        bonusFoodY = Math.floor(Math.random() * gridHeight);
        
        // Check if bonus food position overlaps with snake or regular food
        validPosition = true;
        for (let segment of snake) {
            if (segment.x === bonusFoodX && segment.y === bonusFoodY) {
                validPosition = false;
                break;
            }
        }
        
        if (food.x === bonusFoodX && food.y === bonusFoodY) {
            validPosition = false;
        }
    }
    
    bonusFood = { 
        x: bonusFoodX, 
        y: bonusFoodY,
        pulseValue: 0,
        pulseDirection: 0.05
    };
    
    // Set timer to remove bonus food
    bonusFoodTimer = setTimeout(() => {
        bonusFood = null;
    }, difficultySettings[currentDifficulty].bonusDuration);
}

// Create particle effect
function createParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x: x * gridSize + gridSize / 2,
            y: y * gridSize + gridSize / 2,
            vx: (Math.random() - 0.5) * 3,
            vy: (Math.random() - 0.5) * 3,
            radius: Math.random() * 3 + 1,
            color: color,
            alpha: 1,
            life: Math.random() * 20 + 10
        });
    }
}

// Update particles
function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.02;
        p.life--;
        
        if (p.life <= 0 || p.alpha <= 0) {
            particles.splice(i, 1);
        }
    }
}

// Draw game elements
function draw() {
    // Clear canvas
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--game-bg-color');
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw background pattern
    drawBackgroundPattern();
    
    // Draw grid lines (subtle)
    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--grid-color');
    ctx.lineWidth = 0.5;
    
    // Vertical lines
    for (let x = 0; x <= canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    
    // Horizontal lines
    for (let y = 0; y <= canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
    
    // Draw particles
    for (const p of particles) {
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;
    
    // Draw snake with improved visuals
    drawSnake();
    
    // Draw regular food with enhanced glow effect
    const foodX = food.x * gridSize + gridSize / 2;
    const foodY = food.y * gridSize + gridSize / 2;
    const foodRadius = gridSize / 2 - 2;
    const pulseAmount = Math.sin(Date.now() * 0.005) * 0.1 + 0.9; // Pulsing effect
    
    // Enhanced glow effect
    ctx.shadowColor = getComputedStyle(document.documentElement).getPropertyValue('--food-color');
    ctx.shadowBlur = 15;
    
    // Outer glow
    ctx.beginPath();
    ctx.arc(foodX, foodY, foodRadius * 1.3 * pulseAmount, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 87, 34, 0.2)';
    ctx.fill();
    
    // Food gradient
    const foodGradient = ctx.createRadialGradient(foodX, foodY, 0, foodX, foodY, foodRadius);
    foodGradient.addColorStop(0, '#fff');
    foodGradient.addColorStop(0.6, '#ffb74d');
    foodGradient.addColorStop(1, getComputedStyle(document.documentElement).getPropertyValue('--food-color'));
    
    ctx.fillStyle = foodGradient;
    ctx.beginPath();
    ctx.arc(foodX, foodY, foodRadius, 0, Math.PI * 2);
    ctx.fill();
    
    // Reset shadow
    ctx.shadowBlur = 0;
    
    // Draw bonus food if it exists
    if (bonusFood) {
        const bonusFoodX = bonusFood.x * gridSize + gridSize / 2;
        const bonusFoodY = bonusFood.y * gridSize + gridSize / 2;
        const bonusFoodRadius = gridSize / 2 - 2;
        
        // Update pulse value for animation
        bonusFood.pulseValue += bonusFood.pulseDirection;
        if (bonusFood.pulseValue >= 1 || bonusFood.pulseValue <= 0) {
            bonusFood.pulseDirection *= -1;
        }
        
        // Glow effect
        ctx.shadowColor = getComputedStyle(document.documentElement).getPropertyValue('--bonus-food-color');
        ctx.shadowBlur = 15;
        
        // Outer glow for bonus food
        ctx.beginPath();
        ctx.arc(bonusFoodX, bonusFoodY, bonusFoodRadius * 1.5 * (0.8 + bonusFood.pulseValue * 0.3), 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(244, 67, 54, 0.3)';
        ctx.fill();
        
        // Bonus food gradient
        const bonusFoodGradient = ctx.createRadialGradient(bonusFoodX, bonusFoodY, 0, bonusFoodX, bonusFoodY, bonusFoodRadius);
        bonusFoodGradient.addColorStop(0, '#fff');
        bonusFoodGradient.addColorStop(0.5, '#ff8a80');
        bonusFoodGradient.addColorStop(1, getComputedStyle(document.documentElement).getPropertyValue('--bonus-food-color'));
        
        ctx.fillStyle = bonusFoodGradient;
        ctx.beginPath();
        ctx.arc(bonusFoodX, bonusFoodY, bonusFoodRadius * (0.8 + bonusFood.pulseValue * 0.3), 0, Math.PI * 2);
        ctx.fill();
        
        // Reset shadow
        ctx.shadowBlur = 0;
        
        // Draw timer indicator with animation
        const timeLeft = 1 - ((Date.now() - (Date.now() - bonusFoodTimer._idleStart)) / difficultySettings[currentDifficulty].bonusDuration);
        
        // Animated timer ring
        ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--bonus-food-color');
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(bonusFoodX, bonusFoodY, bonusFoodRadius * 1.5, -Math.PI/2, Math.PI * 2 * timeLeft - Math.PI/2);
        ctx.stroke();
        
        // Add sparkle effect
        const sparkleCount = 3;
        const sparkleAngle = Date.now() * 0.003;
        for (let i = 0; i < sparkleCount; i++) {
            const angle = (i / sparkleCount) * Math.PI * 2 + sparkleAngle;
            const sparkleX = bonusFoodX + Math.cos(angle) * bonusFoodRadius * 2;
            const sparkleY = bonusFoodY + Math.sin(angle) * bonusFoodRadius * 2;
            const sparkleSize = Math.random() * 2 + 1;
            
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(sparkleX, sparkleY, sparkleSize, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

// Function to draw background pattern
function drawBackgroundPattern() {
    // Draw subtle stars/dots in the background
    for (let i = 0; i < 30; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const radius = Math.random() * 1.5;
        const alpha = Math.random() * 0.3 + 0.1;
        
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Continue the draw function
function continueDraw() {
    // Draw food (continuation from draw function)
    ctx.beginPath();
    ctx.arc(foodX, foodY, foodRadius, 0, Math.PI * 2);
    ctx.fill();
    
    // Reset shadow
    ctx.shadowBlur = 0;
    
    // Draw bonus food if it exists
    if (bonusFood) {
        const bonusFoodX = bonusFood.x * gridSize + gridSize / 2;
        const bonusFoodY = bonusFood.y * gridSize + gridSize / 2;
        
        // Update pulse effect
        bonusFood.pulseValue += bonusFood.pulseDirection;
        if (bonusFood.pulseValue >= 1 || bonusFood.pulseValue <= 0) {
            bonusFood.pulseDirection *= -1;
        }
        
        const bonusFoodRadius = (foodRadius - 1) + bonusFood.pulseValue * 3;
        
        // Glow effect
        ctx.shadowColor = getComputedStyle(document.documentElement).getPropertyValue('--bonus-food-color');
        ctx.shadowBlur = 15;
        
        // Bonus food gradient
        const bonusFoodGradient = ctx.createRadialGradient(bonusFoodX, bonusFoodY, 0, bonusFoodX, bonusFoodY, bonusFoodRadius);
        bonusFoodGradient.addColorStop(0, '#fff');
        bonusFoodGradient.addColorStop(0.6, '#ffcc80');
        bonusFoodGradient.addColorStop(1, getComputedStyle(document.documentElement).getPropertyValue('--bonus-food-color'));
        
        ctx.fillStyle = bonusFoodGradient;
        ctx.beginPath();
        ctx.arc(bonusFoodX, bonusFoodY, bonusFoodRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw star shape
        ctx.beginPath();
        const spikes = 5;
        const outerRadius = bonusFoodRadius;
        const innerRadius = bonusFoodRadius / 2;
        
        for (let i = 0; i < spikes * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (Math.PI * i) / spikes;
            const x = bonusFoodX + Math.cos(angle) * radius;
            const y = bonusFoodY + Math.sin(angle) * radius;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        
        ctx.closePath();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.fill();
        
        // Reset shadow
        ctx.shadowBlur = 0;
    }
}

// Helper function to adjust color brightness
function adjustColor(color, factor) {
    // Convert hex to RGB
    let r, g, b;
    if (color.startsWith('#')) {
        r = parseInt(color.slice(1, 3), 16);
        g = parseInt(color.slice(3, 5), 16);
        b = parseInt(color.slice(5, 7), 16);
    } else if (color.startsWith('rgb')) {
        const rgbValues = color.match(/\d+/g);
        r = parseInt(rgbValues[0]);
        g = parseInt(rgbValues[1]);
        b = parseInt(rgbValues[2]);
    } else {
        return color;
    }
    
    // Adjust brightness
    r = Math.min(255, Math.max(0, Math.round(r * factor)));
    g = Math.min(255, Math.max(0, Math.round(g * factor)));
    b = Math.min(255, Math.max(0, Math.round(b * factor)));
    
    // Convert back to hex
    return `rgb(${r}, ${g}, ${b})`;
}

// Draw snake with improved visuals
function drawSnake() {
    // Draw snake body segments first (so head appears on top)
    for (let i = snake.length - 1; i >= 0; i--) {
        const segment = snake[i];
        const radius = gridSize / 2 - 1;
        const x = segment.x * gridSize + radius;
        const y = segment.y * gridSize + radius;
        
        // Add shadow for 3D effect
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 5;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        
        if (i === 0) { // Head
            // Draw head with more detailed gradient
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            
            const headGradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
            headGradient.addColorStop(0, '#8affcb');
            headGradient.addColorStop(0.6, getComputedStyle(document.documentElement).getPropertyValue('--snake-head-color'));
            headGradient.addColorStop(1, adjustColor(getComputedStyle(document.documentElement).getPropertyValue('--snake-head-color'), 0.8));
            ctx.fillStyle = headGradient;
            ctx.fill();
            
            // Draw eyes with more detail
            ctx.shadowColor = 'transparent'; // Remove shadow for eyes
            const eyeSize = radius / 2.5;
            ctx.save();
            
            // Position eyes based on direction
            let eyeX1, eyeY1, eyeX2, eyeY2;
            switch(direction) {
                case 'up':
                    eyeX1 = x - eyeSize - 1;
                    eyeY1 = y - eyeSize;
                    eyeX2 = x + eyeSize + 1;
                    eyeY2 = y - eyeSize;
                    break;
                case 'down':
                    eyeX1 = x - eyeSize - 1;
                    eyeY1 = y + eyeSize;
                    eyeX2 = x + eyeSize + 1;
                    eyeY2 = y + eyeSize;
                    break;
                case 'left':
                    eyeX1 = x - eyeSize;
                    eyeY1 = y - eyeSize - 1;
                    eyeX2 = x - eyeSize;
                    eyeY2 = y + eyeSize + 1;
                    break;
                case 'right':
                    eyeX1 = x + eyeSize;
                    eyeY1 = y - eyeSize - 1;
                    eyeX2 = x + eyeSize;
                    eyeY2 = y + eyeSize + 1;
                    break;
            }
            
            // Eye whites
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(eyeX1, eyeY1, eyeSize / 1.5, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.beginPath();
            ctx.arc(eyeX2, eyeY2, eyeSize / 1.5, 0, Math.PI * 2);
            ctx.fill();
            
            // Pupils (follow movement direction)
            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.arc(eyeX1, eyeY1, eyeSize / 3, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.beginPath();
            ctx.arc(eyeX2, eyeY2, eyeSize / 3, 0, Math.PI * 2);
            ctx.fill();
            
            // Highlight on eyes
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(eyeX1 - eyeSize/6, eyeY1 - eyeSize/6, eyeSize / 6, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.beginPath();
            ctx.arc(eyeX2 - eyeSize/6, eyeY2 - eyeSize/6, eyeSize / 6, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
            
        } else { // Body segments
            ctx.beginPath();
            ctx.arc(x, y, radius * (1 - (i / (snake.length * 3))), 0, Math.PI * 2); // Slightly taper the tail
            
            // Create pattern effect for body segments
            const bodyColor = getComputedStyle(document.documentElement).getPropertyValue('--snake-body-color');
            const patternColor = i % 2 === 0 ? bodyColor : adjustColor(bodyColor, 1.2);
            
            // Add gradient to each segment
            const segmentGradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
            segmentGradient.addColorStop(0, adjustColor(patternColor, 1.3));
            segmentGradient.addColorStop(0.7, patternColor);
            segmentGradient.addColorStop(1, adjustColor(patternColor, 0.8));
            
            ctx.fillStyle = segmentGradient;
            ctx.fill();
            
            // Add connection between segments for smoother look
            if (i < snake.length - 1) {
                const nextSegment = snake[i + 1];
                const nextX = nextSegment.x * gridSize + radius;
                const nextY = nextSegment.y * gridSize + radius;
                
                // Draw connection if segments are adjacent
                if (Math.abs(segment.x - nextSegment.x) <= 1 && Math.abs(segment.y - nextSegment.y) <= 1) {
                    ctx.beginPath();
                    ctx.moveTo(x, y);
                    ctx.lineTo(nextX, nextY);
                    ctx.lineWidth = radius * 1.5;
                    ctx.strokeStyle = patternColor;
                    ctx.stroke();
                }
            }
        }
    }
    
    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
}

// Update game state
function update() {
    // Update direction based on new direction
    direction = newDirection;
    
    // Create new head based on current direction
    const head = { x: snake[0].x, y: snake[0].y };
    
    switch (direction) {
        case 'up':
            head.y -= 1;
            break;
        case 'down':
            head.y += 1;
            break;
        case 'left':
            head.x -= 1;
            break;
        case 'right':
            head.x += 1;
            break;
    }
    
    // Check for collisions
    if (checkCollision(head)) {
        gameOver();
        return;
    }
    
    // Add new head to snake
    snake.unshift(head);
    
    // Check if snake ate food
    let ate = false;
    if (head.x === food.x && head.y === food.y) {
        // Increase score
        score += 10;
        scoreElement.textContent = score;
        
        // Create particles at food location
        createParticles(food.x, food.y, getComputedStyle(document.documentElement).getPropertyValue('--food-color'), 15);
        
        // Create new food
        createFood();
        
        // Possibly create bonus food
        if (Math.random() < difficultySettings[currentDifficulty].bonusChance && !bonusFood) {
            createBonusFood();
        }
        
        // Check for level up (every 50 points)
        if (score % 50 === 0) {
            level++;
            levelElement.textContent = level;
            
            // Create level up effect
            createParticles(head.x, head.y, '#ffeb3b', 30);
        }
        
        // Update high score if needed
        if (score > highScore) {
            highScore = score;
            highScoreElement.textContent = highScore;
            localStorage.setItem('snakeHighScore', highScore);
        }
        
        // Speed up the game slightly
        if (gameSpeed > 40) {
            clearInterval(gameLoop);
            gameSpeed -= difficultySettings[currentDifficulty].speedDecrement;
            gameLoop = setInterval(gameStep, gameSpeed);
        }
        
        ate = true;
    } else if (bonusFood && head.x === bonusFood.x && head.y === bonusFood.y) {
        // Increase score (bonus points)
        score += difficultySettings[currentDifficulty].bonusPoints;
        scoreElement.textContent = score;
        
        // Create particles at bonus food location
        createParticles(bonusFood.x, bonusFood.y, getComputedStyle(document.documentElement).getPropertyValue('--bonus-food-color'), 25);
        
        // Clear bonus food and timer
        bonusFood = null;
        clearTimeout(bonusFoodTimer);
        
        // Check for level up (every 50 points)
        if (score % 50 === 0) {
            level++;
            levelElement.textContent = level;
            
            // Create level up effect
            createParticles(head.x, head.y, '#ffeb3b', 30);
        }
        
        // Update high score if needed
        if (score > highScore) {
            highScore = score;
            highScoreElement.textContent = highScore;
            localStorage.setItem('snakeHighScore', highScore);
        }
        
        ate = true;
    }
    
    if (!ate) {
        // Remove tail if snake didn't eat food
        snake.pop();
    }
    
    // Update particles
    updateParticles();
}

// Check for collisions
function checkCollision(head) {
    // Check wall collision
    if (head.x < 0 || head.x >= gridWidth || head.y < 0 || head.y >= gridHeight) {
        return true;
    }
    
    // Check self collision (skip the last segment as it will be removed)
    for (let i = 0; i < snake.length - 1; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            return true;
        }
    }
    
    return false;
}

// Game over
function gameOver() {
    clearInterval(gameLoop);
    gameRunning = false;
    startBtn.textContent = 'Start Game';
    
    // Create explosion particles at snake head
    createParticles(snake[0].x, snake[0].y, '#f44336', 40);
    
    // Display game over message with animation
    let alpha = 0;
    const fadeIn = setInterval(() => {
        alpha += 0.05;
        if (alpha >= 0.8) {
            clearInterval(fadeIn);
            alpha = 0.8;
        }
        
        // Semi-transparent overlay
        ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Game over text
        ctx.font = "30px 'Press Start 2P', cursive";
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.fillText('Game Over!', canvas.width / 2, canvas.height / 2 - 30);
        
        // Score text
        ctx.font = "20px 'Roboto', sans-serif";
        ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2 + 10);
        ctx.fillText(`Level: ${level}`, canvas.width / 2, canvas.height / 2 + 40);
        
        // Update particles during fade in
        updateParticles();
        for (const p of particles) {
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }, 50);
}

// Game step (called by game loop)
function gameStep() {
    update();
    draw();
}

// Handle keyboard input
document.addEventListener('keydown', (event) => {
    if (!gameRunning) {
        // Start game with any arrow key if not running
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
            startBtn.click();
        }
        return;
    }
    
    switch (event.key) {
        case 'ArrowUp':
            if (direction !== 'down') newDirection = 'up';
            break;
        case 'ArrowDown':
            if (direction !== 'up') newDirection = 'down';
            break;
        case 'ArrowLeft':
            if (direction !== 'right') newDirection = 'left';
            break;
        case 'ArrowRight':
            if (direction !== 'left') newDirection = 'right';
            break;
        case ' ': // Space bar to pause/resume
            startBtn.click();
            break;
    }
    
    // Prevent default behavior for arrow keys to avoid page scrolling
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(event.key)) {
        event.preventDefault();
    }
});

// Add touch controls for mobile devices
let touchStartX = 0;
let touchStartY = 0;

canvas.addEventListener('touchstart', (event) => {
    touchStartX = event.touches[0].clientX;
    touchStartY = event.touches[0].clientY;
    event.preventDefault();
});

canvas.addEventListener('touchmove', (event) => {
    if (!gameRunning) return;
    
    const touchEndX = event.touches[0].clientX;
    const touchEndY = event.touches[0].clientY;
    
    const dx = touchEndX - touchStartX;
    const dy = touchEndY - touchStartY;
    
    // Determine swipe direction based on which axis had larger movement
    if (Math.abs(dx) > Math.abs(dy)) {
        // Horizontal swipe
        if (dx > 0 && direction !== 'left') {
            newDirection = 'right';
        } else if (dx < 0 && direction !== 'right') {
            newDirection = 'left';
        }
    } else {
        // Vertical swipe
        if (dy > 0 && direction !== 'up') {
            newDirection = 'down';
        } else if (dy < 0 && direction !== 'down') {
            newDirection = 'up';
        }
    }
    
    // Update touch start position for continuous swiping
    touchStartX = touchEndX;
    touchStartY = touchEndY;
    
    event.preventDefault();
});

// Start button click handler
startBtn.addEventListener('click', () => {
    if (gameRunning) {
        // Pause game
        clearInterval(gameLoop);
        gameRunning = false;
        startBtn.textContent = 'Resume Game';
    } else {
        // Start or resume game
        if (snake.length === 0) {
            initGame();
        }
        
        gameLoop = setInterval(gameStep, gameSpeed);
        gameRunning = true;
        startBtn.textContent = 'Pause Game';
    }
});

// Reset button click handler
resetBtn.addEventListener('click', () => {
    initGame();
    draw();
    
    if (gameRunning) {
        clearInterval(gameLoop);
        gameLoop = setInterval(gameStep, gameSpeed);
    } else {
        startBtn.textContent = 'Start Game';
    }
});

// Initialize game on page load
initGame();
draw();