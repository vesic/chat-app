'use strict';

var express = require('express');
var app = express();
// var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var fs = require('fs');
var _ = require('lodash');
var chance = require('chance').Chance();
var uuid = require('node-uuid');

app.use(express.static('public'));
if (app.get('env')==='development') app.use(require('cors')());

// heroku port
server.listen(process.env.PORT || 3333);

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

let users = [
  {
    id: uuid.v4(),
    name: chance.name(),
    lat: chance.latitude(),
    lng: chance.longitude()
  },
  {
    id: uuid.v4(),
    name: chance.name(),
    lat: chance.latitude(),
    lng: chance.longitude()
  },
  {
    id: uuid.v4(),
    name: chance.name(),
    lat: chance.latitude(),
    lng: chance.longitude()
  }
];

let messages = [];

// Shuffle users
const i = setInterval(() => {
  if (Math.random() > .5) {
      let len = users.length;
      if (len >= 0 && len < 10) {
        users.push({
          id: uuid.v4(),
          name: chance.name(),
          lat: chance.latitude(),
          lng: chance.longitude(),
          protected: false
        })
      }
  } else {
    let random = _.random(0, users.length - 1);
    users = _.remove(users, (user, index) =>
      random !== index || user.protected ); // if real user
  }

  io.sockets.emit('users', users);
}, 2000);

io.on('connection', socket => {

  socket.on('connect-user', (userName, lat, lng) => {
    let connectedUser = {
      id: uuid.v4(),
      name: userName,
      lat: lat,
      lng: lng,
      protected: true
    }

    users.push(connectedUser);

    socket.emit('connect-success', connectedUser);
    io.sockets.emit('users', users);
  })

  socket.on('disconnect-user', connectedUser => {
    if (connectedUser !== null) {
      users = _.remove(users, user => user.id !== connectedUser.id);
    }

    socket.emit('disconnect-success');
    io.sockets.emit('users', users);
  })

  socket.on('join-room', room => {
    for (let i in socket.rooms) {
      socket.leave(socket.rooms[i]);
    }
    socket.join(room);
    // console.log('fiterede', _.filter(messages, m => m[2] === room));
    io.to(room).emit('chat-messages', _.filter(messages, m => m[2] === room));
    // socket.emit('chat-messages', _.filter(messages, m => m[2] === room));
  });

  socket.on('send-message', payload => {
    messages.unshift(payload);
    io.to(payload[2]).emit('chat-messages', _.filter(messages, m => m[2] === payload[2]));
  })

  socket.once('disconnect', () => {
    // clean up?
  })

})
