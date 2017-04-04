//Import all the required modules
var util = require('util');
var os = require('os');
var redis = require('redis');
var http = require('http');
var url = require('url');
var request = require('request');
var httpProxy = require('http-proxy');
var spawn = require('child_process').spawn;
var crypto = require('crypto');

//Global setup variables
var externalPort = process.env.port || 3001;
var internalPort = 3500;
var redisport = '6379';
var redisHosts = ['192.168.1.185', '192.168.1.186', 'EdgePi03'];
var redisClients = [];

console.log("Starting...");

//Create a proxy and link it to the internal server that is not made public
var proxyServer = httpProxy.createProxyServer({
    target: 'http://localhost:' + internalPort,
    toProxy: true
});

//Setup proxy error event handler
proxyServer.on('error', function(err) {
    console.error("ERROR WITH PROXY SERVER:\n" + err.stack);
});

//Listen on the external port that will be made public in the deployment script
proxyServer.listen(externalPort);

//Create the internal server
var createdServer = http.createServer(function (req, res) {
    //Set error handlers
    req.on('error', function(err) {
        console.error("REQUEST ERROR:\n" + err.stack);
    });

    res.on('error', function(err) {
        console.error("RESPONSE ERROR:\n" + err.stack);
    });

    //Get the URL the user requested
    var requestedUrl = req.url;
 
    //See if it is a valid URL and trim the starting slash if required
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

    //The user requested the cache to be cleared
    if(requestedUrl.includes("ClearCache"))
    {
        ClearCaches(requestedUrl, res);
    } else {
        GetOrSetRequestValueFromRedis(requestedUrl,res);
    }
});

//Loop through all the connected caches and execute a remote request to clear it
function ClearCaches(requestedUrl, res)
{
    console.log("Clear Cache Request: " + requestedUrl);
 
    var count = 0;
    redisHosts.forEach(function(redisHost) {
        var command = spawn('redis-cli',['-h', redisHost, 'flushall']);
        var redisClearResponse = "";
        
        //read the data returned from standard out and standard error within linux
        command.stdout.on('data', function(data) {
            redisClearResponse += data;
        });

        command.stderr.on('data', function(data) {
            redisClearResponse += "ERROR: " + data;
        });

        //Once the command has finished for every cache return the response to the user
        command.on('exit', function(exitCode) {
            count++;
            redisClearResponse += "EXIT " + redisHost + ": " + exitCode + "\r\n"; 

            console.log("Finished Clear Cache from " + redisHost + ": " + redisClearResponse);
            res.write(redisClearResponse);
            //If last request 
            if(count == redisHosts.length) 
            {
                console.log("Reached end of request");
                res.end();
            }
        });
    });
}

//The internal server should listen internally and only receive requests from the proxy server
createdServer.listen(internalPort);

//If the requested URL exists in redis return it and if it does not fetch, store and return it
function GetOrSetRequestValueFromRedis(requestedUrl, res) 
{
    //Figure out which cache the data should be/is stored
    var md5Hash = MD5(requestedUrl);
    var md5Mod = MD5ToMod(md5Hash, redisHosts.length);
 
    //Try to get the requested URL from the appropriate cache
    redisClients[md5Mod].get(requestedUrl, function(err,reply) {
        if(err) 
        {
            console.error(err);
        }
        else
        {
            if(reply != null) 
            {
                //Value exists in Redis
                console.log("Found URL in redis");
                res.end(reply);
                return;
            } else {
                //This value does not exist, fetch, store and return
                MakeAndStoreRequest(requestedUrl, res, md5Mod);
            }
        }
    });
}

//Fetch data and store it in redis
function MakeAndStoreRequest(requestedUrl, res, md5Mod) 
{
    //console.log("Going to make custom request to " + requestedUrl);
    console.log("Executing external request");
    
    var requestOptions = {
        url: requestedUrl,
        method: 'GET',
        encoding: null
    };

    //Request.on data instead and save [] data?
    request(requestOptions, function(error,response,body) {
        if(error)
        {
            console.error("There was an error with the custom request: " + error.stack);
        }
        else if(typeof body == 'undefined') 
        {
            console.log("Not storing " + requestedUrl + " in redis as body is undefined");
            res.end();
        } 
        else 
        {
            //This was a successful request
            var contentType = response.headers['content-type'];

            res.writeHead(200, {
                'Content-Type': contentType
            });

            res.end(body);
            redisClients[md5Mod].set(requestedUrl,body);
        }
    }).on('error',function(err) {
        console.error("ERROR WITH CUSTOM REQUEST: " + err.stack);
    });
}

//Generates an MD5 hash from the URL
function MD5(url) 
{
    return crypto.createHash('md5').update(url, 'utf8').digest('hex');
}

//Returns a value between 0 and mod for the MD5 hash value
function MD5ToMod(md5Value, mod) 
{
    //convert hex to dec
    var dec = parseInt(md5Value, 16);
    //return mod
    return dec % mod;
}

console.log("Started Node.js server");

console.log("Trying to connect to redis nodes;");

//Connect to all of the redis hosts using NodeRedis so we have an active connection
redisHosts.forEach(function(redisHost) {
    console.log("Connecting to " + redisHost);

    var redisClient = redis.createClient(6379, redisHost,{
        no_ready_check: true,
        return_buffers: true
    });
    
    redisClient.on('connect', function () {
       console.log("Connected to Redis: " + redisHost);
    });
    
    redisClient.on('error', function(err) {
        console.error("REDIS ERROR:\n" + err.stack);
    });

    //Add the client to the collection
    redisClients.push(redisClient);

    console.log("Added " + redisHost + " to clients. Total Count: " + redisClients.length);
});
