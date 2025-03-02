// Получаем элементы DOM
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const angleInput = document.getElementById('angle');
const stepsInput = document.getElementById('steps');
const moveBtn = document.getElementById('moveBtn');
const resetBtn = document.getElementById('resetBtn');
const rabbitCoordsEl = document.getElementById('rabbitCoords');
const wolfCoordsEl = document.getElementById('wolfCoords');
const distanceEl = document.getElementById('distance');

// Настройка размеров canvas
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    drawGrid();
    drawEntities();
}

// Инициализация игры
let scale = 50; // Масштаб (1 юнит = 50 пикселей)
let rabbit = { x: 0, y: 0 }; // Начальные координаты зайца
let wolf = { x: 0, y: 0 }; // Начальные координаты волка
let hint = { x: 0, y: 0 }; // Координаты подсказки
let rabbitPath = []; // Путь зайца
let wolfPath = []; // Путь волка
let hintPath = []; // Путь подсказок

// Преобразование координат из мировых в экранные
function worldToScreen(x, y) {
    return {
        x: (x - rabbit.x) * scale + canvas.width / 2,
        y: (rabbit.y - y) * scale + canvas.height / 2 // Инвертируем Y, так как в canvas Y растет вниз
    };
}

// Отрисовка сетки
function drawGrid() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Вычисляем границы видимой области в мировых координатах
    const leftEdge = rabbit.x - canvas.width / (2 * scale);
    const rightEdge = rabbit.x + canvas.width / (2 * scale);
    const topEdge = rabbit.y + canvas.height / (2 * scale);
    const bottomEdge = rabbit.y - canvas.height / (2 * scale);
    
    // Рисуем горизонтальные линии
    for (let y = Math.floor(bottomEdge); y <= Math.ceil(topEdge); y++) {
        const start = worldToScreen(leftEdge, y);
        const end = worldToScreen(rightEdge, y);
        
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        
        if (y === 0) {
            ctx.strokeStyle = '#000000'; // Ось X - черная
            ctx.lineWidth = 2;
        } else {
            ctx.strokeStyle = '#CCCCCC'; // Обычные линии - серые
            ctx.lineWidth = 1;
        }
        
        ctx.stroke();
    }
    
    // Рисуем вертикальные линии
    for (let x = Math.floor(leftEdge); x <= Math.ceil(rightEdge); x++) {
        const start = worldToScreen(x, bottomEdge);
        const end = worldToScreen(x, topEdge);
        
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        
        if (x === 0) {
            ctx.strokeStyle = '#000000'; // Ось Y - черная
            ctx.lineWidth = 2;
        } else {
            ctx.strokeStyle = '#CCCCCC'; // Обычные линии - серые
            ctx.lineWidth = 1;
        }
        
        ctx.stroke();
    }
}

// Отрисовка зайца, волка и их путей
function drawEntities() {
    // Рисуем путь зайца
    if (rabbitPath.length > 1) {
        ctx.beginPath();
        const startPoint = worldToScreen(rabbitPath[0].x, rabbitPath[0].y);
        ctx.moveTo(startPoint.x, startPoint.y);
        
        for (let i = 1; i < rabbitPath.length; i++) {
            const point = worldToScreen(rabbitPath[i].x, rabbitPath[i].y);
            ctx.lineTo(point.x, point.y);
        }
        
        ctx.strokeStyle = 'blue';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
    
    // Рисуем путь волка
    if (wolfPath.length > 1) {
        ctx.beginPath();
        const startPoint = worldToScreen(wolfPath[0].x, wolfPath[0].y);
        ctx.moveTo(startPoint.x, startPoint.y);
        
        for (let i = 1; i < wolfPath.length; i++) {
            const point = worldToScreen(wolfPath[i].x, wolfPath[i].y);
            ctx.lineTo(point.x, point.y);
        }
        
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
    
    // Рисуем путь подсказок (пунктирная линия)
    if (hintPath.length > 1) {
        ctx.beginPath();
        const startPoint = worldToScreen(hintPath[0].x, hintPath[0].y);
        ctx.moveTo(startPoint.x, startPoint.y);
        
        for (let i = 1; i < hintPath.length; i++) {
            const point = worldToScreen(hintPath[i].x, hintPath[i].y);
            ctx.lineTo(point.x, point.y);
        }
        
        ctx.strokeStyle = 'green';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]); // Пунктирная линия
        ctx.stroke();
        ctx.setLineDash([]); // Сбрасываем стиль линии
    }
    
    // Рисуем зайца
    const rabbitPos = worldToScreen(rabbit.x, rabbit.y);
    ctx.beginPath();
    ctx.arc(rabbitPos.x, rabbitPos.y, 10, 0, 2 * Math.PI);
    ctx.fillStyle = 'gray';
    ctx.fill();
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Рисуем волка
    const wolfPos = worldToScreen(wolf.x, wolf.y);
    ctx.beginPath();
    ctx.arc(wolfPos.x, wolfPos.y, 10, 0, 2 * Math.PI);
    ctx.fillStyle = 'brown';
    ctx.fill();
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Рисуем подсказку
    const hintPos = worldToScreen(hint.x, hint.y);
    ctx.beginPath();
    ctx.arc(hintPos.x, hintPos.y, 5, 0, 2 * Math.PI);
    ctx.fillStyle = 'green';
    ctx.fill();
}

// Обновление информации о координатах и расстоянии
function updateInfo() {
    rabbitCoordsEl.textContent = `${rabbit.x.toFixed(6)}, ${rabbit.y.toFixed(6)}`;
    wolfCoordsEl.textContent = `${wolf.x.toFixed(6)}, ${wolf.y.toFixed(6)}`;
    
    const distance = Math.sqrt(
        Math.pow(rabbit.x - wolf.x, 2) + 
        Math.pow(rabbit.y - wolf.y, 2)
    );
    
    distanceEl.textContent = distance.toFixed(6);
}

// Генерация подсказки для волка (точка на расстоянии 1 юнит от зайца, магнитится к оси X)
function generateHint() {
    const distanceToXAxis = Math.abs(rabbit.y);
    if (distanceToXAxis < 1) {
        // Если заяц близко к оси X, подсказка на оси
        hint = {
            x: rabbit.x,
            y: 0
        };
    } else {
        // Если заяц дальше одного юнита от оси X, подсказка на расстоянии 1 юнит в направлении оси X
        const direction = rabbit.y > 0 ? -1 : 1;
        hint = {
            x: rabbit.x,
            y: rabbit.y + direction
        };
    }
    hintPath.push({ ...hint });
}

// Движение зайца на 1 юнит в заданном направлении
function moveRabbit(angle) {
    const radians = angle * Math.PI / 180;
    rabbit.x += Math.cos(radians);
    rabbit.y += Math.sin(radians);
    rabbitPath.push({ ...rabbit });
}

// Движение волка на 1 юнит в направлении подсказки
function moveWolf() {
    const dx = hint.x - wolf.x;
    const dy = hint.y - wolf.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 0) {
        const stepX = (dx / distance) * Math.min(1, distance);
        const stepY = (dy / distance) * Math.min(1, distance);
        wolf.x += stepX;
        wolf.y += stepY;
    }
    
    wolfPath.push({ ...wolf });
}

// Инициализация игры
function initGame() {
    const angle = parseFloat(angleInput.value) || 0;
    
    // Сбрасываем позиции и пути
    wolf = { x: 0, y: 0 };
    
    // Заяц начинает на расстоянии 1 юнит от начала в заданном направлении
    const radians = angle * Math.PI / 180;
    rabbit = { 
        x: Math.cos(radians), 
        y: Math.sin(radians) 
    };
    
    rabbitPath = [{ x: 0, y: 0 }, { ...rabbit }];
    wolfPath = [{ ...wolf }];
    hintPath = [];
    
    drawGrid();
    drawEntities();
    updateInfo();
}

// Выполнение хода
function makeMove() {
    const angle = parseFloat(angleInput.value) || 0;
    const steps = parseInt(stepsInput.value) || 1;
    
    for (let i = 0; i < steps; i++) {
        moveRabbit(angle);
        generateHint();
        moveWolf();
    }
    
    drawGrid();
    drawEntities();
    updateInfo();
}

// Обработчики событий
moveBtn.addEventListener('click', makeMove);
resetBtn.addEventListener('click', initGame);
window.addEventListener('resize', resizeCanvas);

// Инициализация при загрузке
window.onload = function() {
    resizeCanvas();
    initGame();
}; 