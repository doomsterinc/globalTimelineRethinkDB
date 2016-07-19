const http = require('http');
const fs = require('fs');
const express = require('express');
const socketIO = require('socket.io');
const r = require('rethinkdb');
const config = require('./config.json');

// Carregando Express, HTTP, SocketIO e DB config
const db = Object.assign(config.rethinkdb, { db: 'timeline' });
const app = express();
const server = http.Server(app);
const io = socketIO(server);

// Rota para carregar pagina inicial
app.get('/', (req, res) => {
  fs.readFile(`${__dirname}/index.html`, (err, html) => {
    res.end(html || err);
  });
});

// Listando novas mensagens via changefeed + socket.io
r.connect(db)
  .then(conn => r.table('messages').changes().run(conn))
  .then(cursor => {
    cursor.each((err, data) => {
      const message = data.new_val;
      io.sockets.emit('/messages', message);
    });
  })
;

// Cadastro de novas mensagens via socket.io
io.on('connection', (client) => {
  r.connect(db)
    .then(conn => r.table('messages').run(conn))
    .then(cursor => {
      cursor.each((err, message) => {
        io.sockets.emit('/messages', message);
      });
    })
  ;
  client.on('/messages', (body) => {
    const  name, message  = body;
    const data = { name, message, date: new Date() };
    r.connect(db).then(conn => r.table('messages').insert(data).run(conn));
  });
});

server.listen(3000, () => console.log('Timeline Server!'));
