var express = require('express'),
	app = express();

var server = require('http').createServer(app);
server.listen(8000);

var path = require("path");
var _ = require('underscore');

///////////////////////////////static files server////////////////////////////////////

var appsDir = path.join(__dirname, '..', "client");

app.get('/', function(req, res) {
	res.sendFile(appsDir + "/index.html");
});

app.use("/client/", function(req, res, next) {
	res.sendFile(appsDir + req.client._httpMessage.req.originalUrl);
});

app.use("/css", function(req, res, next) {
	var fileName = appsDir + req.client._httpMessage.req.originalUrl;
	var splitting = fileName.split("?");
	if (splitting.length)
		fileName = splitting[0];
	console.log("try to send file " + fileName);
	res.sendFile(fileName);
});

app.use("/locales", function(req, res, next) {
	var fileName = req.client._httpMessage.req.originalUrl;
	var splitting = fileName.split("?");
	if (splitting.length)
		fileName = splitting[0];
	res.sendFile(appsDir + fileName);
});

app.use("/fonts", function(req, res, next) {
	res.sendFile(path.join(appsDir, "bower_components/bootstrap", decodeURI(req.client._httpMessage.req.originalUrl)));
});

app.use("/assets", function(req, res, next) {
	res.sendFile(appsDir + req.client._httpMessage.req.originalUrl);
});

app.use("/bower_components/", function(req, res, next) {
	res.sendFile(appsDir + req.client._httpMessage.req.originalUrl);

});

app.use("/src/", function(req, res, next) {
	res.sendFile(appsDir + req.client._httpMessage.req.originalUrl);
});

app.use(function(req, res, next) {
	res.setHeader('Content-Type', 'text/plain');
	console.log("not founcd " + req.client._httpMessage.req.originalUrl);
	res.sendStatus(404);
});
