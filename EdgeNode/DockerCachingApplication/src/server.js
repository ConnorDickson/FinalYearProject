var util = require('util');
var os = require('os');
var redis = require('redis');

util.debug("Starting...");

var hostname = os.hostname();
var http = require('http');
var port = process.env.port || 3001;

http.createServer(function (req, res) {
    console.error("Get request");
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end("Caching App\nContainer:"+  hostname);
    console.error("Send response");
}).listen(port);
 
console.error("Started Node.js server");

var redishost = 'edgenode01';
var redisport = '6379';

var redisclient = redis.createClient(redisport,redishost);

/*function TryConnectToRedis() 
{
    try
    {
        redisclient = redis.createClient(6379, edge01);
        return true;
    }
    catch(ex)
    {
        return false;
    }

    return false;
}

while(!TryConnectToRedis()) {
    setTimeout(function() {
        console.error("Could not connect to redis, trying again after 10 seconds");
    }, 10000);
}*/

redisclient.on('connect',function () {
   console.error("Connected to redis");
});
