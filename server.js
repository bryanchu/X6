var express = require('express');

var app = express.createServer(express.logger(), express.bodyParser(), express.static(__dirname + '/client'));

app.get('/', function(request, response) {
  response.sendfile(__dirname + '/client/index.html');
}); 

var port = process.env.PORT || 3000;
app.listen(port, function() {
  console.log("Listening on " + port);
});