var util = require('util');
var os = require('os');
var http = require('http');
var fs = require('fs');
var spawn = require('child_process').spawn;
var cpu = require('./cpu');
var httpProxy = require('http-proxy');

console.log("Starting...");

var externalPort = process.env.port || 3003;
var internalPort = 3501;

var proxyServer = httpProxy.createProxyServer({
    target: 'http://localhost:' + internalPort,
    toProxy: true
}).listen(externalPort);

proxyServer.on('error', function(err) {
    console.error('ERROR WITH PROXY SERVER: ' + err.stack);
});

var createdServer = http.createServer(function (req, res) 
{
    cpu.cpuStart();

    console.log('Received Request');

    //Set error handlers
    req.on('error', function(err) 
    {
        console.error("REQUEST ERROR:\n" + err.stack);
    });

    res.on('error', function(err)
    {
        console.error("RESPONSE ERROR:\n" + err.stack);
    });

    var body = [];

    req.on('data', function(chunk) {
        body.push(chunk);
    });
  
    req.on('end', function() {
        var postData = Buffer.concat(body);
        fs.writeFileSync("../SavedFile/output.wav", postData);
        
        console.log("Wrote file to disk successfully");

        if(req.headers['preprocess-request'] == 'true') {
            console.log('Preprocess request by performing voice recognition on edge node');
            PreProcessVoiceRecognition(res);
        } else {
            console.log('Forward request to data centre for processing');
            ExecuteRemoteVoiceRecognition(res);
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

function PreProcessVoiceRecognition(res) {
    var childProcessResponse = "";

    var command = spawn('sh', ['../SH/ProcessVoiceFile.sh']);

    command.stdout.on('data', function(data) {
        childProcessResponse += data;
	//console.log(data);
    });

    command.stderr.on('data', function(data) {
        //console.log(data);
        //childProcessResponse += data;
    });

    command.on('exit', function(code) {

	client = http.createClient(3000, "connor-pc");
    
        request = client.request('POST', '/api/voicerecognition/PostForPreProcessedData', {
            'Host': 'connor-pc',
            'Port': 3000,
            'User-Agent': 'Node.JS',
            'Content-Type': 'application/octet-stream',
            'Content-Length': childProcessResponse.length
        });
    
        request.write(childProcessResponse);
        request.end();
    
        request.on('error', function (err) {
            console.log("ERROR with request: " + err);
        });
    
        request.on('response', function (response) {
            var responseData = "";
            response.setEncoding('utf8');
    
            response.on('data', function (chunk) {
                responseData += chunk;
            });
    
            response.on('end', function () {
                console.log("From connor-pc: " + responseData);

                var dataToReturn = {};
                dataToReturn.VoiceRecognitionResponse = responseData;

                EndRequest(res, dataToReturn);
            });
        });
    });
}

function ExecuteRemoteVoiceRecognition(ogResponse)
{
   var data = fs.readFileSync("../SavedFile/output.wav"),
       client,
       request;
    
    client = http.createClient(3000, "connor-pc");
    
    request = client.request('POST', '/api/voicerecognition/PostForProcessingData', {
        'Host': 'connor-pc',
        'Port': 3000,
        'User-Agent': 'Node.JS',
        'Content-Type': 'application/octet-stream',
        'Content-Length': data.length
    });

    request.write(data);
    request.end();

    request.on('error', function (err) {
        console.log("ERROR with request: " + err);
    });

    request.on('response', function (response) {
        var responseData = "";
        response.setEncoding('utf8');

        response.on('data', function (chunk) {
            responseData += chunk;
        });

        response.on('end', function () {
            console.log("From connor-pc: " + responseData);
            
            var dataToReturn = {};
            dataToReturn.VoiceRecognitionResponse = responseData.trim();
            
            EndRequest(ogResponse, dataToReturn); 
        });
    });
}

function EndRequest(res, dataToReturn) {
    var load = cpu.cpuEnd();
    dataToReturn.CPUInfo = load.percent;
    res.write(JSON.stringify(dataToReturn));
    res.end();
}
