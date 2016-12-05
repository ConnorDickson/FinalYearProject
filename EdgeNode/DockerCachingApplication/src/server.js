var util = require('util');
var os = require('os');
var redis = require('redis');
var http = require('http');
var url = require('url');
var request = require('request');
var httpProxy = require('http-proxy');

var hostname = os.hostname();
var externalPort = process.env.port || 3001;
var internalPort = 3500;
var redishost = 'edgenode01';
var redisport = '6379';

console.log("Starting...");

var proxyServer = httpProxy.createProxyServer({
    target: 'http://localhost:' + internalPort,
    toProxy: true
}).listen(externalPort);

proxyServer.on('error',function(err) {
    console.error("ERROR WITH PROXY SERVER: " + err.stack);
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
    console.log("Request for: " + req.url);
    
    var requestedUrl = req.url;

    if(typeof requestedUrl == 'undefined') 
    {
        console.error("Received undefined request");
        res.end("Cannot process undefined request");
        return;
    } 
    else 
    {
        if(requestedUrl.length > 1 && requestedUrl.substring(0,1) == '/') 
        {
            requestedUrl = requestedUrl.substring(1);
        }
    }

    console.log("Updated request for: " + requestedUrl);

    if(req.url == "/clearcache")
    {
        //clear redis cache here
        console.log("Clear Redis cache");   
    }

    //Get Query String request
    /*var url_parts = url.parse(req.url,true);
    var query = url_parts.query;
    var requestedUrl = query.url;

    if(typeof requestedUrl == 'undefined') 
    {
        //This is a follow on request to the caching service
        console.log("Get request for: " + req.url + " but it had an undefined querystring");
        
        var referer = req.headers.referer;
        var refererUrlParts = url.parse(referer,true);
        var refererQuery = refererUrlParts.query;
        var refererRequestedUrl = refererQuery.url; 
        //GetOrSetRequestValueFromRedis("http://google.com" + req.url,res);
        GetOrSetRequestValueFromRedis(refererRequestedUrl + req.url,res);
    } else {
        //This is a standard request to the caching service
        GetOrSetRequestValueFromRedis(requestedUrl,res);
    }*/    
    GetOrSetRequestValueFromRedis(requestedUrl,res);
});

//I don't think I should do this in production because the code continues
createdServer.on('error',function(err)
{
    console.error("AN ERROR OCCURRED WITH THE SERVER: " + err.stack);
});

createdServer.listen(internalPort);

function GetOrSetRequestValueFromRedis(requestedUrl, res) 
{
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
                console.log("Found " + requestedUrl + " value in redis");
                redisResponse = reply.toString();
                res.writeHead(200, {'Content-Type':'text/html'});
                res.end(redisResponse);
                return;
            } else {
                MakeAndStoreRequest(requestedUrl,res);
            }
        }
    });
}

function MakeAndStoreRequest(requestedUrl, res) 
{
    console.log("Going to make custom request to " + requestedUrl);

    /*if(requestedUrl.includes(".gif")) 
    {
        console.log("Got gif request");

        http.get(requestedUrl, function(imageRes)
        {
            if(typeof imageRes == 'undefined')
            {
                console.log("Image request was undefined");
                res.end();
            } else {
                res.writeHead(200, {'Content-Type':'image/gif'});
                res.end(imageRes,'binary');
            }
        });
    } else {*/
        request(requestedUrl, function(error,response,body) 
        {
            //console.log("Custom Request results\n\tError: " + error + ".\n\tResponse: " + response + ".\n\tBody: " + body + ".");

            if(error)
            {
                console.error("There was an error with the custom request: " + error.stack);
            }
	    else if(typeof body == 'undefined') 
	    {
                //DO IMAGE STUFF HERE BECAUSE THIS MUST BE BINARY?
		//Does this mean I need to store content type in redis?
	        console.log("Not storing " + requestedUrl + " in redis as body is undefined");
	        res.end();
	    } 
            else 
            {
                //This was a successful request
                res.writeHead(200, {'Content-Type':'text/html'});
	        res.end(body);
	        console.log("Completed request and going to store " + requestedUrl + " in Redis");
	        redisclient.set(requestedUrl,body);
	        redisclient.expire(requestedUrl,60);
	    }
        }).on('error',function(err) {
            console.error("ERROR WITH CUSTOM REQUEST: " + err.stack);
        });
    /*}*/
}
 
console.log("Started Node.js server");

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
