// ----- Canvas & Config -----
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const gridSize = 8;
const canvasGridSize = 9;
const cellSize = 50;

canvas.width = cellSize * canvasGridSize;
canvas.height = cellSize * canvasGridSize;

// Players
let rabbit = { x: 0, y: 0 };
let wolf = { x: 7, y: 7 };

// Water tiles
let waterTiles = [];

// Doors
const doorBottom = { x: 6, y: 7 };
const doorRight = { x: 7, y: 6 };

// ----- Load Images -----
const rabbitImg = new Image();
rabbitImg.src = 'images/rabbit.png';

const wolfImg = new Image();
wolfImg.src = 'images/wolf.png';

const bgImage = new Image();
bgImage.src = 'images/rabbitvswolfbackground.jpg';

function allLoaded() {
    generateWaterTiles();
    drawBoard();
}

// Wait for all images to load
let loadedCount = 0;
[rabbitImg, wolfImg, bgImage].forEach(img => {
    img.onload = () => {
        loadedCount++;
        if (loadedCount === 3) allLoaded();
    };
    img.onerror = () => console.error(img.src + " failed to load");
});

// ----- Water Tiles -----
function generateWaterTiles() {
    waterTiles = [];
    while (waterTiles.length < 8) {
        const x = Math.floor(Math.random() * gridSize);
        const y = Math.floor(Math.random() * gridSize);
        if ((x === 0 && y === 0) || (x === 7 && y === 7) || waterTiles.some(t => t.x === x && t.y === y)) continue;
        waterTiles.push({ x, y });
    }
}

// ----- Draw Board -----
function drawBoard() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background
    ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);

    // Grid
    ctx.strokeStyle = "#333";
    for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
            ctx.strokeRect(x * cellSize, y * cellSize, cellSize, cellSize);
        }
    }

    // Safety zones
    ctx.fillStyle = "#ffd54a";
    for (let x = 6; x < canvasGridSize; x++) ctx.fillRect(x * cellSize, 8 * cellSize, cellSize, cellSize);
    for (let y = 6; y < canvasGridSize; y++) ctx.fillRect(8 * cellSize, y * cellSize, cellSize, cellSize);

    // Water
    ctx.fillStyle = "#3a7afe";
    waterTiles.forEach(t => ctx.fillRect(t.x * cellSize, t.y * cellSize, cellSize, cellSize));

    // Rabbit & Wolf
    ctx.drawImage(rabbitImg, rabbit.x * cellSize, rabbit.y * cellSize, cellSize, cellSize);
    ctx.drawImage(wolfImg, wolf.x * cellSize, wolf.y * cellSize, cellSize, cellSize);
}
