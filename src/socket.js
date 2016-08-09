import io from 'socket.io-client';

// let host;
// if (process.env.PORT) host = 'http://localhost';
// else host = 'http://localhost:3333';

let socket = io('https://enigmatic-spire-50792.herokuapp.com/');

export default socket;
