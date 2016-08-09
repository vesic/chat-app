var express = require('express');
var app = express();

var port = process.env.PORT || 3333;

console.log(port);
app.get('/', function (req, res) {
  res.send('Hello World!');
});

app.listen(port, function () {
  console.log(`Example app listening on port ${port}!`);
});
