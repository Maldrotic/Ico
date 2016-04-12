var express = require('express');
var path = require('path');

var app = express();
var http = require("http").Server(app);

var port = 3000;

require('./app/routes.js')(app);

http.listen(port, function() {
  console.log('Ico happens on port ' + port);
});

exports.app = app;