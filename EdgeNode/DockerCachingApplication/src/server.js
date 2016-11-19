var util = require('util');
var os = require('os');
var hostname = os.hostname();

util.debug("Starting...");

var http = require('http');
var port = process.env.port || 3001;
http.createServer(function (req, res) {
    util.debug("Get request");
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end("Caching App\nContainer:"+  hostname);
    util.debug("Send response");
}).listen(port);
 
util.debug("Started");
