self.onmessage = function(e) {
  const { mode, angle, totalMoves, startPositions } = e.data;
  let { rabbit, wolf } = startPositions;

  let stepsDone = 0;

  function moveRabbit(angleDeg) {
    const radians = angleDeg * Math.PI / 180;
    rabbit.x += Math.cos(radians);
    rabbit.y += Math.sin(radians);
  }

  function moveWolf() {
    const dx = hint.x - wolf.x;
    const dy = hint.y - wolf.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 0) {
      wolf.x += (dx / dist);
      wolf.y += (dy / dist);
    }
  }

  function generateHint() {
    const distanceToXAxis = Math.abs(rabbit.y);
    if (distanceToXAxis < 1) {
      hint = { x: rabbit.x, y: 0 };
    } else {
      const direction = rabbit.y > 0 ? -1 : 1;
      hint = { x: rabbit.x, y: rabbit.y + direction };
    }
  }

  let hint = { x: rabbit.x, y: 0 };

  if (mode === 'fast') {
    for (let i = 0; i < totalMoves; i++) {
      moveRabbit(angle);
      generateHint();
      moveWolf();
      stepsDone++;
    }
    self.postMessage({
      done: true,
      rabbit,
      wolf,
      stepsDone
    });
  } else {
    const chunkSize = 1_000_000;
    function processChunk() {
      const limit = Math.min(chunkSize, totalMoves - stepsDone);
      for (let i = 0; i < limit; i++) {
        moveRabbit(angle);
        generateHint();
        moveWolf();
        stepsDone++;
      }
      self.postMessage({
        done: false,
        rabbit,
        wolf,
        stepsDone
      });
      if (stepsDone < totalMoves) {
        setTimeout(processChunk, 0);
      } else {
        self.postMessage({
          done: true,
          rabbit,
          wolf,
          stepsDone
        });
      }
    }
    processChunk();
  }
}; 