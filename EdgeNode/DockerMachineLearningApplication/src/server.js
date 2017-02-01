var util = require('util');
var os = require('os');
var http = require('http');
var request = require('request');
var httpProxy = require('http-proxy');

var externalPort = process.env.port || 3005;
var internalPort = 3502;

console.log("Starting...");

var proxyServer = httpProxy.createProxyServer({
    target: 'http://localhost:' + internalPort,
    toProxy: true
}).listen(externalPort);

proxyServer.on('error',function(err) {
    console.error("ERROR WITH PROXY SERVER:\n" + err.stack);
});

var createdServer = http.createServer(function (req, res) 
{
    //Set error handlers
    req.on('error', function(err) 
    {
        console.error("REQUEST ERROR:\n" + err.stack);
    });

    res.on('error', function(err)
    {
        console.error("RESPONSE ERROR:\n" + err.stack);
    });

    var requestOptions = {
        url: "http://connor-pc:3000/api/machinelearning/processInfo",
        method: 'POST',
        encoding: null
    };

    request(requestOptions, function(error,response,body) {
        if(error) {
            console.error("There was an error requesting content from connor-pc");
        } else {
            console.log("Received info from connor-pc");
            res.end("Received by Edge Node: " + body);
        }
    });
});

//I don't think I should do this in production because the code continues
createdServer.on('error',function(err)
{
    console.error("AN ERROR OCCURRED WITH THE SERVER: " + err.stack);
});

createdServer.listen(internalPort);
 
console.log("Started Node.js server");
