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

    var reqBody = "";

    req.on('data', function(chunk) {
        reqBody += chunk;
    });

    req.on('end', function() {
        console.log("Received " + req.method + " request.");

        if(req.method == 'POST') {
            MakePostRequest(requestedUrl, res, reqBody);
        } else {
            MakeGetRequest(requestedUrl, res);
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

function MakePostRequest(requestedUrl, res, reqBody) {
   console.log("Making POST request to " + requestedUrl); 

   console.log("Received: " + reqBody);

    var jsonRecieved = JSON.parse(reqBody);

    console.log("Parsed JSON: " + jsonRecieved);

    var requestOptions = {
        url: requestedUrl,
        method: 'POST',
        encoding: null,
        form: reqBody
    };

    request.post(requestOptions, function(error,response,body) {
        if(error) {
            console.error("There was an error requesting content from connor-pc: " + error);
        } else {
            console.log("Received info from connor-pc");
            res.end(body);
        }
    });
};

function MakeGetRequest(requestedUrl, res) {
    console.log("Making GET request for: " + requestedUrl);

     var requestOptions = {
        url: requestedUrl,
        method: 'GET',
        encoding: null
    };

    request(requestOptions, function(error,response,body) {
        if(error) {
            console.error("There was an error requesting content from connor-pc: " + error);
        } else {
            console.log("Received info from connor-pc: " + body);
            res.end(body);
        }
    });   
};
