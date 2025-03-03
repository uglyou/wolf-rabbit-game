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
const stepsTakenEl = document.getElementById('stepsTaken'); // Новый элемент для отображения количества шагов

// ------------------- Камера и масштаб -------------------
let camera = { x: 0, y: 0 };  // Координаты камеры (центр в мировых координатах)
let scale = 50;               // Начальный масштаб (1 юнит = 50 пикселей)

// Функция, которая динамически обновляет положение камеры и масштаб,
// чтобы игроки (Заяц, Волк) оставались на экране даже при больших координатах.
function updateCameraAndScale() {
    // 1. Центр камеры = середина между Зайцем и Волком
    camera.x = (rabbit.x + wolf.x) / 2;
    camera.y = (rabbit.y + wolf.y) / 2;

    // 2. Смотрим на расстояние между ними
    const dx = rabbit.x - wolf.x;
    const dy = rabbit.y - wolf.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // 3. Выбираем масштаб так, чтобы при большом dist картинка «отдалялась»
    //    Например, хотим, чтобы 200 пикселей соответствовали dist+1
    //    (плюс 1, чтобы избежать деления на ноль)
    scale = 200 / (dist + 1);

    // 4. Ограничиваем минимальный масштаб, чтобы при ОЧЕНЬ большом dist
    //    канвас не превращался в точку.
    if (scale < 0.0001) {
        scale = 0.0001;
    }
}

// ------------------- Игровые сущности -------------------
let rabbit = { x: 0, y: 0 };  // Координаты Зайца
let wolf = { x: 0, y: 0 };    // Координаты Волка
let hint = { x: 0, y: 0 };    // Координаты подсказки

// Для оптимизации хранения путей – сохраняем только выборочные точки
let rabbitPath = [];  // Путь зайца
let wolfPath = [];    // Путь волка
let hintPath = [];    // Путь подсказок

// Глобальный счётчик ходов
let moveCount = 0;

// ------------------- Преобразование координат -------------------
// Преобразует мировые координаты (x, y) -> экранные координаты (canvas)
function worldToScreen(x, y) {
    // Сдвиг относительно камеры, умноженный на масштаб
    const screenX = (x - camera.x) * scale + canvas.width / 2;
    const screenY = (camera.y - y) * scale + canvas.height / 2; 
    // (camera.y - y) инвертируем ось Y, т.к. в canvas она идёт вниз
    return { x: screenX, y: screenY };
}

// ------------------- Отрисовка сетки и сущностей -------------------
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    drawAll();
}

function drawAll() {
    updateCameraAndScale();  // Каждый раз перед отрисовкой пересчитываем камеру/масштаб
    drawGrid();
    drawEntities();
}

// Рисуем клетчатую сетку вокруг (rabbit.x, rabbit.y) и (wolf.x, wolf.y)
function drawGrid() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Вычисляем границы видимой области в МИРОВЫХ координатах
    // (используем центр камеры и текущий масштаб)
    const worldWidth = canvas.width / scale;
    const worldHeight = canvas.height / scale;

    // Левые/правые/верхние/нижние границы
    const leftEdge = camera.x - worldWidth / 2;
    const rightEdge = camera.x + worldWidth / 2;
    const topEdge = camera.y + worldHeight / 2;
    const bottomEdge = camera.y - worldHeight / 2;

    // Рисуем горизонтальные линии
    for (let y = Math.floor(bottomEdge); y <= Math.ceil(topEdge); y++) {
        const start = worldToScreen(leftEdge, y);
        const end = worldToScreen(rightEdge, y);
        
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);

        if (y === 0) {
            ctx.strokeStyle = '#000000'; // Ось X — чёрная
            ctx.lineWidth = 2;
        } else {
            ctx.strokeStyle = '#CCCCCC'; // Обычные линии — серые
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
            ctx.strokeStyle = '#000000'; // Ось Y — чёрная
            ctx.lineWidth = 2;
        } else {
            ctx.strokeStyle = '#CCCCCC'; // Обычные линии — серые
            ctx.lineWidth = 1;
        }
        
        ctx.stroke();
    }
}

// Рисуем Зайца, Волка, Подсказку и их пути
function drawEntities() {
    // Путь Зайца
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
    
    // Путь Волка
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
    
    // Путь подсказок (пунктир)
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
        ctx.setLineDash([5, 5]); 
        ctx.stroke();
        ctx.setLineDash([]); 
    }
    
    // Заяц
    const rabbitPos = worldToScreen(rabbit.x, rabbit.y);
    ctx.beginPath();
    ctx.arc(rabbitPos.x, rabbitPos.y, 10, 0, 2 * Math.PI);
    ctx.fillStyle = 'gray';
    ctx.fill();
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Волк
    const wolfPos = worldToScreen(wolf.x, wolf.y);
    ctx.beginPath();
    ctx.arc(wolfPos.x, wolfPos.y, 10, 0, 2 * Math.PI);
    ctx.fillStyle = 'brown';
    ctx.fill();
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Подсказка
    const hintPos = worldToScreen(hint.x, hint.y);
    ctx.beginPath();
    ctx.arc(hintPos.x, hintPos.y, 5, 0, 2 * Math.PI);
    ctx.fillStyle = 'green';
    ctx.fill();
}

// ------------------- Обновление инфо на экране -------------------
function updateInfo() {
    rabbitCoordsEl.textContent = `${rabbit.x.toFixed(6)}, ${rabbit.y.toFixed(6)}`;
    wolfCoordsEl.textContent = `${wolf.x.toFixed(6)}, ${wolf.y.toFixed(6)}`;
    
    const distance = Math.sqrt(
        (rabbit.x - wolf.x) ** 2 + (rabbit.y - wolf.y) ** 2
    );
    distanceEl.textContent = distance.toFixed(6);

    stepsTakenEl.textContent = `Steps taken: ${moveCount.toLocaleString('ru-RU')}`;
}

// ------------------- Логика подсказки, Зайца и Волка -------------------

// Генерация подсказки (hint), которая в пределах 1 юнита от Зайца
function generateHint() {
    // Пример: подсказка на оси X (distance ≤ 1)
    // Можно усложнить логику, чтобы случайно генерировать любую точку в круге радиуса 1
    const distanceToXAxis = Math.abs(rabbit.y);
    if (distanceToXAxis < 1) {
        // Если Заяц близко к оси X, размещаем подсказку точно на оси
        hint = { x: rabbit.x, y: 0 };
    } else {
        // Иначе, делаем подсказку на расстоянии 1 юнит в направлении оси X
        // (условная логика, можно заменить на что-то другое)
        const direction = rabbit.y > 0 ? -1 : 1;
        hint = { x: rabbit.x, y: rabbit.y + direction };
    }

    // Сохраняем точку подсказки выборочно (каждые 100 ходов)
    if (moveCount % 100 === 0) {
        hintPath.push({ ...hint });
    }
}

// Заяц двигается ровно на 1 юнит (угол задаётся пользователем)
function moveRabbit(angle) {
    const radians = angle * Math.PI / 180;
    rabbit.x += Math.cos(radians);
    rabbit.y += Math.sin(radians);

    // Сохраняем путь выборочно
    if (moveCount % 100 === 0) {
        rabbitPath.push({ ...rabbit });
    }
}

// Волк двигается ровно на 1 юнит в направлении подсказки
// (по условию задачи: distance(B_{n-1}, B_n) = 1)
function moveWolf() {
    const dx = hint.x - wolf.x;
    const dy = hint.y - wolf.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Если подсказка не совпадает с позицией Волка
    if (distance > 0) {
        // Волк идёт РОВНО на 1 юнит в направлении подсказки, даже если distance < 1
        wolf.x += (dx / distance) * 1;
        wolf.y += (dy / distance) * 1;
    }

    // Сохраняем путь выборочно
    if (moveCount % 100 === 0) {
        wolfPath.push({ ...wolf });
    }
}

// ------------------- Инициализация и выполнение ходов -------------------

// Сброс игры (кнопка "Сброс")
function initGame() {
    const angle = parseFloat(angleInput.value) || 0;

    // Начальные координаты Волка
    wolf = { x: 0, y: 0 };

    // Заяц начинает на расстоянии 1 юнит от (0,0) в заданном направлении
    const radians = angle * Math.PI / 180;
    rabbit = { x: Math.cos(radians), y: Math.sin(radians) };

    moveCount = 1;
    rabbitPath = [{ x: 0, y: 0 }, { ...rabbit }];
    wolfPath = [{ ...wolf }];
    hintPath = [];

    generateHint();
    drawAll();
    updateInfo();
}

let simulationWorker = null;

function startBigSimulation(totalMoves, angle) {
    if (simulationWorker) {
        simulationWorker.terminate();
    }
    simulationWorker = new Worker('simulationWorker.js');
    
    simulationWorker.postMessage({
        mode: (totalMoves > 100000 ? 'fast' : 'chunked'),
        angle,
        totalMoves,
        startPositions: {
          rabbit: { ...rabbit },
          wolf: { ...wolf }
        }
    });
    
    simulationWorker.onmessage = function(e) {
      const data = e.data;
      rabbit = data.rabbit;
      wolf = data.wolf;
      moveCount += (data.stepsDone - moveCount);

      if (!data.done) {
        drawAll();
        updateInfo();
      } else {
        drawAll();
        updateInfo();
        simulationWorker.terminate();
        simulationWorker = null;
      }
    };
}

function makeMove() {
    const angleVal = parseFloat(angleInput.value) || 0;
    const stepsVal = parseInt(stepsInput.value) || 1;
    const targetMoves = moveCount + stepsVal;
    
    startBigSimulation(targetMoves - moveCount, angleVal);
}

// ------------------- Слушатели событий -------------------
moveBtn.addEventListener('click', makeMove);
resetBtn.addEventListener('click', initGame);
window.addEventListener('resize', resizeCanvas);

// Инициализация при загрузке страницы
window.onload = function() {
    resizeCanvas();
    initGame();
};