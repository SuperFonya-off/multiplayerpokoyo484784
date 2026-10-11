const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

app.use(express.static('public'));

const players = {};
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const PLAYER_SIZE = 40;
const SPEED = 5;

// Случайный цвет для кубика игрока
function getRandomColor() {
  const colors = ['#FF5733', '#33FF57', '#3357FF', '#F39C12', '#9B59B6', '#1ABC9C'];
  return colors[Math.floor(Math.random() * colors.length)];
}

io.on('connection', (socket) => {
  console.log(`Игрок подключился: ${socket.id}`);

  // Регистрация игрока с ником
  socket.on('joinGame', (nickname) => {
    players[socket.id] = {
      id: socket.id,
      nickname: nickname || 'Игрок',
      x: Math.floor(Math.random() * (CANVAS_WIDTH - PLAYER_SIZE)),
      y: Math.floor(Math.random() * (CANVAS_HEIGHT - PLAYER_SIZE)),
      color: getRandomColor(),
      size: PLAYER_SIZE
    };

    // Отправляем текущему игроку его данные
    socket.emit('init', { id: socket.id, players });
    // Оповещаем остальных о новом игроке
    socket.broadcast.emit('newPlayer', players[socket.id]);
  });

  // Обработка движения
  socket.on('move', (dir) => {
    const player = players[socket.id];
    if (!player) return;

    if (dir.up && player.y > 0) player.y -= SPEED;
    if (dir.down && player.y < CANVAS_HEIGHT - player.size) player.y += SPEED;
    if (dir.left && player.x > 0) player.x -= SPEED;
    if (dir.right && player.x < CANVAS_WIDTH - player.size) player.x += SPEED;

    io.emit('playerMoved', { id: socket.id, x: player.x, y: player.y });
  });

  // Отключение игрока
  socket.on('disconnect', () => {
    console.log(`Игрок отключился: ${socket.id}`);
    delete players[socket.id];
    io.emit('playerDisconnected', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});