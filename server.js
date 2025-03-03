const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('frontend'));

let leaderboard = [];

// Эндпоинт для расчёта движения зайца и волка
app.post('/api/move', (req, res) => {
    let { angle, steps, rabbitX, rabbitY, wolfX, wolfY } = req.body;

    // Ограничиваем максимальное количество шагов, чтобы избежать астрономических значений
    const maxSteps = 10000000;
    if (steps > maxSteps) {
        steps = maxSteps;
    }
    
    // Преобразуем угол в радианы
    const radians = angle * Math.PI / 180;
    
    // Вычисляем новые координаты зайца напрямую
    const newRabbitX = rabbitX + Math.cos(radians) * steps;
    const newRabbitY = rabbitY + Math.sin(radians) * steps;
    
    // Подсказка — точка на оси X из нового положения зайца
    const hintX = newRabbitX;
    const hintY = 0;
    
    // Вычисляем разницу между координатами волка и подсказкой
    const dx = hintX - wolfX;
    const dy = hintY - wolfY;
    const d2 = dx * dx + dy * dy;  // Квадрат расстояния
    
    let newWolfX = wolfX;
    let newWolfY = wolfY;
    
    // Если расстояние больше нуля, перемещаем Волка
    if (d2 > 0) {
        // Если число шагов достаточно, чтобы волк добежал до подсказки, перемещаем его сразу в неё
        if (steps * steps >= d2) {
            newWolfX = hintX;
            newWolfY = hintY;
        } else {
            const distance = Math.sqrt(d2);
            newWolfX = wolfX + (dx / distance) * steps;
            newWolfY = wolfY + (dy / distance) * steps;
        }
    }
    
    // Итоговое расстояние между зайцем и волком
    const deltaX = newRabbitX - newWolfX;
    const deltaY = newRabbitY - newWolfY;
    const finalDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    // Масштабирование координат для корректной отрисовки на клиенте
    const scaleFactor = 1e-6;
    res.json({
        rabbitX: newRabbitX * scaleFactor,
        rabbitY: newRabbitY * scaleFactor,
        wolfX: newWolfX * scaleFactor,
        wolfY: newWolfY * scaleFactor,
        hintX: hintX * scaleFactor,
        hintY: hintY * scaleFactor,
        distance: finalDistance * scaleFactor
    });
});

// Эндпоинт для сохранения результата
app.post('/api/score', (req, res) => {
    const { username, distance } = req.body;
    leaderboard.push({ username, distance });
    leaderboard.sort((a, b) => b.distance - a.distance);
    leaderboard = leaderboard.slice(0, 10);
    res.json({ success: true });
});

// Эндпоинт для получения лидерборда
app.get('/api/leaderboard', (req, res) => {
    res.json(leaderboard);
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));