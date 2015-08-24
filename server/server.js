var express = require('express'),
	app = express();

var server = require('http').createServer(app);
server.listen(8000);

var path = require("path");
var _ = require('underscore');

///////////////////////////////static files server////////////////////////////////////

var appsDir = path.join(__dirname, '..');

app.get('/', function(req, res) {
	res.sendFile(appsDir + "/index.html");
});

app.use("/src/", function(req, res, next) {
	res.sendFile(appsDir + req.client._httpMessage.req.originalUrl);
});

app.use("/bower_components/", function(req, res, next) {
	res.sendFile(appsDir + req.client._httpMessage.req.originalUrl);
});

app.use("/css/", function(req, res, next) {
	res.sendFile(appsDir + req.client._httpMessage.req.originalUrl);
});

app.use("/lib/", function(req, res, next) {
	res.sendFile(appsDir + req.client._httpMessage.req.originalUrl);
});

app.use("/assets/", function(req, res, next) {
	res.sendFile(appsDir + req.client._httpMessage.req.originalUrl);
});

app.use(function(req, res, next) {
	res.setHeader('Content-Type', 'text/plain');
	console.log("not found " + req.client._httpMessage.req.originalUrl);
	res.sendStatus(404);
});
