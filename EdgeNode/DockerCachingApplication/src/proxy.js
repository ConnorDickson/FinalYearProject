var util = require('util');
var os = require('os');
var redis = require('redis');
var http = require('http');
var url = require('url');
var request = require('request');
var httpProxy = require('http-proxy');
var fs = require('fs');

var hostname = os.hostname();
var externalport = process.env.port || 3001;
var internalPort = 3500;
var redishost = 'edgenode01';
var redisport = '6379';

console.log("Starting...");

var proxyServer = httpProxy.createProxyServer({
    target: 'http://localhost:' + internalPort,
    toProxy: true
}).listen(externalport);

proxyServer.on('error',function(err) {
    console.log("ERROR WITH PROXY: " + err.stack);
});
 
http.createServer(function(req,res) 
{
    console.log("Recieved forwarded proxy req for: " + req.url + " with path: " + req.path);
    res.writeHead(200,{'Content-Type':'text/plain'});
    res.write('Request successfully proxied');
    res.end();
}).listen(internalPort);

console.log("Started Node.js Proxy Server");

console.log("Trying to connect to redis");

var redisclient = redis.createClient(6379,'edgepi01',{no_ready_check: true});

redisclient.on('connect',function () 
{
   console.log("Connected to Redis");
});

redisclient.on('error',function(err) 
{
    console.error("REDIS ERROR:\n" + err.stack);
});
