var util = require('util');
var os = require('os');
var redis = require('redis');
var http = require('http');
var url = require('url');
var request = require('request');

var hostname = os.hostname();
var port = process.env.port || 3001;
var redishost = 'edgenode01';
var redisport = '6379';

console.log("Starting...");

http.createServer(function (req, res) 
{
    console.log("Get request for: " + req.url);
    
    var url_parts = url.parse(req.url,true);
    var query = url_parts.query;
    var requestedUrl = query.url;

    console.log("Going to make custom request to " + requestedUrl);

    if(req.url == "/clearcache")
    {
        //clear redis cache here
        
    }

    if(typeof requestedUrl == 'undefined') 
    {
        console.log("Recieved undefined request");
        res.writeHead(200, {'Content-Type': 'image/x-icon'});
        res.end();
        return;    
    }

    //Check redis first to see if we already have the value
    //Check if this method is async
    redisclient.get(requestedUrl,function(err,reply)
    {
        if(err) 
        {
            console.error(err);
        }
        else
        {
            if(reply != null) 
            {
                console.log("Found value in redis");
                redisResponse = reply.toString();
                res.end(redisResponse);
                return;
            }
        }
    });

    //COMMENT THIS
    request(requestedUrl, function(error,response,body) 
    {
        res.end(body);
        console.log("Completed request and going to store in Redis");
        redisclient.set(requestedUrl,body);
        redisclient.expire(requestedUrl,60);
    });

    console.log("Sent response");

}).listen(port);
 
console.log("Started Node.js server");

console.log("Trying to connect to redis");

var redisclient = redis.createClient(6379,'edgepi01',{no_ready_check: true});

/*redisclient.auth('password',function(err) 
{
   if(err)
   {
      console.error(err);
   } 
});*/

redisclient.on('connect',function () 
{
   console.log("Connected to Redis");
});

/*redisclient.set("foo","bar",redis.print);

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
});*/
