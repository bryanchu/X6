require('nodefly').profile(
    '66be8553-9270-4344-a5e3-5107c972a67c',
    ['xwsim','Heroku'],
    options // optional
);
require('newrelic');
var express = require('express');

var app = express.createServer(express.logger(), express.bodyParser(), express.static(__dirname + '/client'));

app.get('/', function(request, response) {
  response.sendfile(__dirname + '/client/index.html');
}); 

var port = process.env.PORT || 3000;
app.listen(port, function() {
  console.log("Listening on " + port);
});