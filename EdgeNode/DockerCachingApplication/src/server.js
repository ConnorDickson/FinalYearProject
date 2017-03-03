var util = require('util');
var os = require('os');
var redis = require('redis');
var http = require('http');
var url = require('url');
var request = require('request');
var httpProxy = require('http-proxy');
var spawn = require('child_process').spawn;
var crypto = require('crypto');

var externalPort = process.env.port || 3001;
var internalPort = 3500;
var redisport = '6379';
var redisHosts = ['192.168.1.185', 'EdgePi02', 'EdgePi03'];
var redisClients = [];

console.log("Starting...");

var proxyServer = httpProxy.createProxyServer({
    target: 'http://localhost:' + internalPort,
    toProxy: true
});

proxyServer.on('error', function(err) {
    console.error("ERROR WITH PROXY SERVER:\n" + err.stack);
});

proxyServer.listen(externalPort);

var createdServer = http.createServer(function (req, res) {
    //Set error handlers
    console.log("New Request\n");

    req.on('error', function(err) {
        console.error("REQUEST ERROR:\n" + err.stack);
    });

    res.on('error', function(err) {
        console.error("RESPONSE ERROR:\n" + err.stack);
    });

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

    if(requestedUrl.includes("ClearCache"))
    {
        ClearCaches(requestedUrl, res);
    } else {
        GetOrSetRequestValueFromRedis(requestedUrl,res);
    }
});

function ClearCaches(requestedUrl, res)
{
    //ToDo - Clear all caches
    console.log("Clear Cache Request: " + requestedUrl);
    
    var count = 0;
    redisHosts.forEach(function(redisHost) {
        var command = spawn('redis-cli',['-h', redisHost, 'flushall']);
        var redisClearResponse = "";

        command.stdout.on('data', function(data) {
            redisClearResponse += data;
        });

        command.stderr.on('data', function(data) {
            redisClearResponse += "ERROR: " + data;
        });

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


createdServer.listen(internalPort);

function GetOrSetRequestValueFromRedis(requestedUrl, res) 
{
    var md5Hash = MD5(requestedUrl);
    var md5Mod = MD5ToMod(md5Hash, redisHosts.length);
    console.log("Going to try to get data from: " + md5Mod + " redisClient");

    redisClients[md5Mod].get(requestedUrl, function(err,reply) {
        if(err) 
        {
            console.error(err);
        }
        else
        {
            if(reply != null) 
            {
                //console.log("Found " + requestedUrl + " value in redis");
                console.log("Found URL in redis");
                //redisResponse = reply.toString();
                //res.writeHead(200, {'Content-Type':'text/html'});
                //res.writeHead(200, {
                  //  'Content-Type':reply.ContentType
                //});
                //JSON this request?
                res.end(reply);
                return;
            } else {
                MakeAndStoreRequest(requestedUrl, res, md5Mod);
            }
        }
    });
}

function MakeAndStoreRequest(requestedUrl, res, md5Mod) 
{
    //console.log("Going to make custom request to " + requestedUrl);
    console.log("Going to make external request");
    
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
            //console.log("Completed request and going to store " + requestedUrl + " in Redis");
            //console.log("Completed request and going to store in Redis");
            redisClients[md5Mod].set(requestedUrl,body);
            //redisclient.expire(requestedUrl,30);
        }
    }).on('error',function(err) {
        console.error("ERROR WITH CUSTOM REQUEST: " + err.stack);
    });
}

function MD5(url) 
{
    return crypto.createHash('md5').update(url, 'utf8').digest('hex');
}

function MD5ToMod(md5Value, mod) 
{
    //convert hex to dec
    var dec = parseInt(md5Value, 16);
    //return mod
    return dec % mod;
}

console.log("Started Node.js server");

console.log("Trying to connect to redis nodes;");

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

    redisClients.push(redisClient);

    console.log("Added " + redisHost + " to clients. Total Count: " + redisClients.length);
});
