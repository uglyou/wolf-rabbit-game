const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('frontend'));

let leaderboard = [];

// Эндпоинт для расчёта движения зайца и волка
app.post('/api/move', (req, res) => {
    const { angle, steps, rabbitX, rabbitY, wolfX, wolfY } = req.body;
    
    // Расчет нового положения зайца
    const radians = angle * Math.PI / 180;
    const newRabbitX = rabbitX + Math.cos(radians) * steps;
    const newRabbitY = rabbitY + Math.sin(radians) * steps;
    
    // Генерация подсказки (точка на оси X)
    const hintX = newRabbitX;
    const hintY = 0;
    
    // Расчет нового положения волка (движение к подсказке)
    let newWolfX = wolfX;
    let newWolfY = wolfY;
    
    for (let i = 0; i < steps; i++) {
        const dx = hintX - newWolfX;
        const dy = hintY - newWolfY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            newWolfX += dx / distance;
            newWolfY += dy / distance;
        }
    }
    
    // Расчет расстояния между зайцем и волком
    const finalDistance = Math.sqrt(
        Math.pow(newRabbitX - newWolfX, 2) + 
        Math.pow(newRabbitY - newWolfY, 2)
    );
    
    res.json({
        rabbitX: newRabbitX,
        rabbitY: newRabbitY,
        wolfX: newWolfX,
        wolfY: newWolfY,
        hintX,
        hintY,
        distance: finalDistance
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
