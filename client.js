const socket = io();
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let myId = null;
let players = {};
const keys = { up: false, down: false, left: false, right: false };

function startGame() {
  const nickInput = document.getElementById('nickname').value.trim();
  const nickname = nickInput || 'Кубик';

  document.getElementById('login-screen').style.display = 'none';
  canvas.style.display = 'block';

  socket.emit('joinGame', nickname);
}

// Получение начального состояния
socket.on('init', (data) => {
  myId = data.id;
  players = data.players;
  requestAnimationFrame(gameLoop);
});

socket.on('newPlayer', (player) => {
  players[player.id] = player;
});

socket.on('playerMoved', (data) => {
  if (players[data.id]) {
    players[data.id].x = data.x;
    players[data.id].y = data.y;
  }
});

socket.on('playerDisconnected', (id) => {
  delete players[id];
});

// Отслеживание нажатий клавиш (WASD + Стрелки)
window.addEventListener('keydown', (e) => {
  if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') keys.up = true;
  if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') keys.down = true;
  if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') keys.left = true;
  if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') keys.right = true;
});

window.addEventListener('keyup', (e) => {
  if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') keys.up = false;
  if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') keys.down = false;
  if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') keys.left = false;
  if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') keys.right = false;
});

// Главный игровой цикл
function gameLoop() {
  // Отправляем ввод на сервер
  if (keys.up || keys.down || keys.left || keys.right) {
    socket.emit('move', keys);
  }

  // Очистка экрана
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Отрисовка сетки
  ctx.strokeStyle = '#1e1e2f';
  for (let x = 0; x < canvas.width; x += 40) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
  }
  for (let y = 0; y < canvas.height; y += 40) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
  }

  // Отрисовка всех игроков
  for (let id in players) {
    const p = players[id];

    // Кубик
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, p.size, p.size);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = id === myId ? 3 : 1;
    ctx.strokeRect(p.x, p.y, p.size, p.size);

    // Никнейм над кубиком
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(p.nickname, p.x + p.size / 2, p.y - 8);
  }

  requestAnimationFrame(gameLoop);
}