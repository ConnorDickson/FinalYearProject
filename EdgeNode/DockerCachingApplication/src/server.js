var util = require('util');
var os = require('os');
var redis = require('redis');

console.error("Starting...");

var hostname = os.hostname();
var http = require('http');
var port = process.env.port || 3001;

var redisResponse = "";

http.createServer(function (req, res) {
    console.error("Get request");
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end("Caching App\nContainer:" + hostname + "\nRedis Response: " +  redisResponse);
    console.error("Send response");
}).listen(port);
 
console.error("Started Node.js server");

var redishost = 'edgenode01';
var redisport = '6379';

console.error("Trying to connect to redis");

var redisclient = redis.createClient(6379,'edgepi01',{no_ready_check: true});

redisclient.auth('password',function(err) 
{
   if(err)
   {
      console.error(err);
   } 
});

redisclient.on('connect',function () 
{
   console.log("Connected to Redis");
});

redisclient.set("foo","bar",redis.print);

redisclient.get("foo",function(err,reply)
{
    if(err) 
    {
        console.error(err);
    }
    else
    {
        redisResponse = reply.toString();
        console.log(reply.toString());
    }
});
