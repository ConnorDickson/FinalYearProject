var util = require('util');
var PythonShell = require('python-shell');
var os = require('os');
var hostname = os.hostname();

var pyshell = new PythonShell('pythonscript.py');
 
util.debug("Starting...");
 
var message = "";

pyshell.on('message',function(localmessage) {
	message = localmessage;
});

pyshell.end(function(err) {
	if(err) throw err;
	console.log('finished');
});

var http = require('http');
var port = process.env.port || 3000;
http.createServer(function (req, res) {
    util.debug("Get request");
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end("Received message and updated it " + message + "\nContainer:"+  hostname);
    util.debug("Send response");
}).listen(port);
 
util.debug("Started");
