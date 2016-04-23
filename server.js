var express = require('express');
var path = require('path');

var app = express();

app.use('/js', express.static(path.join(__dirname, 'js')));
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/fonts', express.static(path.join(__dirname, 'fonts')));

var http = require("http").Server(app);

var port = 3000;

require('./app/routes.js')(app);

http.listen(port, function() {
  console.log('Ico happens on port ' + port);
});

exports.app = app;