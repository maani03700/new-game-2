
class SnakeGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.gameState = 'menu';
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('snakeHighScore')) || 0;
        this.level = 1;
        this.snake = [];
        this.food = { x: 0, y: 0 };
        this.direction = 'right';
        this.nextDirection = 'right';
        this.gameSpeed = 150;
        this.cellSize = 20;
        this.gridSize = 20;
        this.gameLoopId = null;
        this.lastUpdateTime = 0;
        this.gameStarted = false;

        this.keys = {};
        this.touchStart = { x: 0, y: 0 };

        this.setupCanvas();
        this.setupInput();
        this.initializeGame();
        this.updateUI();

        document.getElementById('startBtn').addEventListener('click', () => this.startGame());
        document.getElementById('restartBtn').addEventListener('click', () => this.restartGame());

        // Touch control buttons
        document.getElementById('upBtn').addEventListener('touchstart', () => this.handleSwipe('up'));
        document.getElementById('downBtn').addEventListener('touchstart', () => this.handleSwipe('down'));
        document.getElementById('leftBtn').addEventListener('touchstart', () => this.handleSwipe('left'));
        document.getElementById('rightBtn').addEventListener('touchstart', () => this.handleSwipe('right'));
    }

    setupCanvas() {
        const size = Math.min(window.innerWidth * 0.9, 500);
        this.canvas.width = size;
        this.canvas.height = size;
        this.cellSize = Math.floor(size / this.gridSize);
    }

    setupInput() {
        // Keyboard input
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;

            if (this.gameState === 'playing') {
                switch (e.code) {
                    case 'ArrowUp':
                        if (this.direction !== 'down') this.nextDirection = 'up';
                        break;
                    case 'ArrowDown':
                        if (this.direction !== 'up') this.nextDirection = 'down';
                        break;
                    case 'ArrowLeft':
                        if (this.direction !== 'right') this.nextDirection = 'left';
                        break;
                    case 'ArrowRight':
                        if (this.direction !== 'left') this.nextDirection = 'right';
                        break;
                    case 'Space':
                        this.togglePause();
                        break;
                }
            }
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });

        // Touch swipe detection
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.touchStart.x = e.touches[0].clientX;
            this.touchStart.y = e.touches[0].clientY;
        });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
        });

        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            if (!this.touchStart.x || !this.touchStart.y) return;

            const touchEnd = {
                x: e.changedTouches[0].clientX,
                y: e.changedTouches[0].clientY
            };

            const dx = touchEnd.x - this.touchStart.x;
            const dy = touchEnd.y - this.touchStart.y;

            if (Math.abs(dx) > 20 || Math.abs(dy) > 20) {
                if (Math.abs(dx) > Math.abs(dy)) {
                    // Horizontal swipe
                    if (dx > 0 && this.direction !== 'left') {
                        this.nextDirection = 'right';
                    } else if (dx < 0 && this.direction !== 'right') {
                        this.nextDirection = 'left';
                    }
                } else {
                    // Vertical swipe
                    if (dy > 0 && this.direction !== 'up') {
                        this.nextDirection = 'down';
                    } else if (dy < 0 && this.direction !== 'down') {
                        this.nextDirection = 'up';
                    }
                }
            }

            this.touchStart.x = 0;
            this.touchStart.y = 0;
        });
    }

    handleSwipe(dir) {
        if (this.gameState !== 'playing') return;

        switch (dir) {
            case 'up':
                if (this.direction !== 'down') this.nextDirection = 'up';
                break;
            case 'down':
                if (this.direction !== 'up') this.nextDirection = 'down';
                break;
            case 'left':
                if (this.direction !== 'right') this.nextDirection = 'left';
                break;
            case 'right':
                if (this.direction !== 'left') this.nextDirection = 'right';
                break;
        }
    }

    initializeGame() {
        this.snake = [
            { x: 10, y: 10 },
            { x: 9, y: 10 },
            { x: 8, y: 10 }
        ];
        this.direction = 'right';
        this.nextDirection = 'right';
        this.score = 0;
        this.level = 1;
        this.gameSpeed = 150;
        this.spawnFood();
    }

    startGame() {
        if (this.gameStarted) return;

        this.gameState = 'playing';
        this.gameStarted = true;
        document.getElementById('menu').style.display = 'none';
        document.getElementById('gameOver').style.display = 'none';
        this.initializeGame();
        this.lastUpdateTime = performance.now();
        this.gameLoop();
    }

    restartGame() {
        this.gameState = 'playing';
        document.getElementById('gameOver').style.display = 'none';
        this.initializeGame();
        this.lastUpdateTime = performance.now();
        this.gameLoop();
    }

    togglePause() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
        } else if (this.gameState === 'paused') {
            this.gameState = 'playing';
            this.lastUpdateTime = performance.now();
            this.gameLoop();
        }
    }

    gameOver() {
        this.gameState = 'gameover';
        this.gameStarted = false;

        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('snakeHighScore', this.highScore.toString());
        }

        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('finalHighScore').textContent = this.highScore;
        document.getElementById('gameOver').style.display = 'block';

        this.playSound('gameover');
    }

    update(deltaTime) {
        if (this.gameState !== 'playing') return;

        this.direction = this.nextDirection;

        // Move snake
        const head = { ...this.snake[0] };

        switch (this.direction) {
            case 'up': head.y--; break;
            case 'down': head.y++; break;
            case 'left': head.x--; break;
            case 'right': head.x++; break;
        }

        // Check wall collision
        if (head.x < 0 || head.x >= this.gridSize || head.y < 0 || head.y >= this.gridSize) {
            this.gameOver();
            return;
        }

        // Check self collision
        for (let i = 0; i < this.snake.length; i++) {
            if (this.snake[i].x === head.x && this.snake[i].y === head.y) {
                this.gameOver();
                return;
            }
        }

        // Check food collision
        if (head.x === this.food.x && head.y === this.food.y) {
            this.score += 10 * this.level;
            this.playSound('eat');
            this.spawnFood();

            // Increase level every 50 points
            this.level = Math.floor(this.score / 50) + 1;
            this.gameSpeed = Math.max(50, 150 - (this.level - 1) * 10);

            // Don't remove tail when eating food (snake grows)
        } else {
            this.snake.pop(); // Remove tail if no food eaten
        }

        this.snake.unshift(head); // Add new head

        this.updateUI();
    }

    spawnFood() {
        let food;
        let validPosition = false;

        while (!validPosition) {
            food = {
                x: Math.floor(Math.random() * this.gridSize),
                y: Math.floor(Math.random() * this.gridSize)
            };

            validPosition = true;
            for (let segment of this.snake) {
                if (segment.x === food.x && segment.y === food.y) {
                    validPosition = false;
                    break;
                }
            }
        }

        this.food = food;
    }

    render() {
        // Clear canvas
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw grid (subtle)
        this.ctx.strokeStyle = '#222';
        this.ctx.lineWidth = 0.5;
        for (let i = 0; i <= this.gridSize; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(i * this.cellSize, 0);
            this.ctx.lineTo(i * this.cellSize, this.canvas.height);
            this.ctx.stroke();

            this.ctx.beginPath();
            this.ctx.moveTo(0, i * this.cellSize);
            this.ctx.lineTo(this.canvas.width, i * this.cellSize);
            this.ctx.stroke();
        }

        // Draw food
        this.ctx.fillStyle = '#ff6b6b';
        this.ctx.beginPath();
        this.ctx.arc(
            (this.food.x + 0.5) * this.cellSize,
            (this.food.y + 0.5) * this.cellSize,
            this.cellSize * 0.4,
            0,
            Math.PI * 2
        );
        this.ctx.fill();

        // Draw snake
        this.snake.forEach((segment, index) => {
            const isHead = index === 0;
            const progress = index / this.snake.length;

            if (isHead) {
                this.ctx.fillStyle = '#4ecdc4';
            } else {
                // Gradient from head to tail
                const r = Math.floor(78 + progress * (255 - 78));
                const g = Math.floor(205 + progress * (107 - 205));
                const b = Math.floor(196 + progress * (107 - 196));
                this.ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
            }

            this.ctx.fillRect(
                segment.x * this.cellSize,
                segment.y * this.cellSize,
                this.cellSize,
                this.cellSize
            );

            // Add rounded corners
            this.ctx.strokeStyle = isHead ? '#2a8f87' : 'rgba(0,0,0,0.3)';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(
                segment.x * this.cellSize,
                segment.y * this.cellSize,
                this.cellSize,
                this.cellSize
            );

            // Draw eyes on head
            if (isHead) {
                this.ctx.fillStyle = '#fff';
                let eyeOffsetX = 0;
                let eyeOffsetY = 0;

                switch (this.direction) {
                    case 'right': eyeOffsetX = 0.7; break;
                    case 'left': eyeOffsetX = -0.7; break;
                    case 'up': eyeOffsetY = -0.7; break;
                    case 'down': eyeOffsetY = 0.7; break;
                }

                this.ctx.beginPath();
                this.ctx.arc(
                    (segment.x + 0.5 + eyeOffsetX * 0.3) * this.cellSize,
                    (segment.y + 0.5 + eyeOffsetY * 0.3) * this.cellSize,
                    this.cellSize * 0.15,
                    0,
                    Math.PI * 2
                );
                this.ctx.fill();
            }
        });

        // Draw level indicator
        if (this.gameState === 'playing') {
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            this.ctx.font = '12px Arial';
            this.ctx.fillText(`Level ${this.level}`, 10, 20);
        }
    }

    updateUI() {
        document.getElementById('currentScore').textContent = this.score;
        document.getElementById('highScore').textContent = this.highScore;
    }

    playSound(type) {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            switch (type) {
                case 'eat':
                    oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
                    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
                    break;
                case 'gameover':
                    oscillator.frequency.setValueAtTime(196.00, audioContext.currentTime); // G3
                    gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
                    break;
            }

            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.3);
        } catch (error) {
            console.log('Audio not supported');
        }
    }

    gameLoop(currentTime) {
        if (this.gameState === 'playing') {
            const deltaTime = currentTime - this.lastUpdateTime;

            if (deltaTime > this.gameSpeed) {
                this.update(deltaTime);
                this.lastUpdateTime = currentTime;
            }

            this.render();
        }

        this.gameLoopId = requestAnimationFrame(this.gameLoop.bind(this));
    }
}

// Initialize game when page loads
window.addEventListener('DOMContentLoaded', () => {
    const game = new SnakeGame();

    // Handle window resize
    window.addEventListener('resize', () => {
        game.setupCanvas();
        game.render();
    });
});