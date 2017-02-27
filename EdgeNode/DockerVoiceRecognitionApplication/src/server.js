var util = require('util');
var os = require('os');
var http = require('http');
var fs = require('fs');
var spawn = require('child_process').spawn;
var cpu = require('./cpu');
var httpProxy = require('http-proxy');
var request = require('request');

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
 
    console.log("Requested URL: " + requestedUrl);
    
    var body = [];

    req.on('data', function(chunk) {
        body.push(chunk);
    });
  
    req.on('end', function() {
        var postData = Buffer.concat(body);
        
        var fileName = "../SavedFile/output" + guid() + ".wav"; 
        fs.writeFile(fileName, postData, function() {
 
            console.log("Wrote file to disk successfully");
    
            if(req.headers['preprocess-request'] == 'true') {
                console.log('Preprocess request by performing voice recognition on edge node');
                PreProcessVoiceRecognition(fileName, requestedUrl, res);
            } else {
                console.log('Forward request to data centre for processing');
                ExecuteRemoteVoiceRecognition(fileName, requestedUrl, res);
            }
        });
    }); 
});

//I don't think I should do this in production because the code continues
createdServer.on('error',function(err)
{
    console.error("AN ERROR OCCURRED WITH THE SERVER: " + err.stack);
});

createdServer.listen(internalPort);

console.log("Started Node.js server");

function PreProcessVoiceRecognition(fileName, requestedUrl, res) 
{
    var childProcessResponse = "";

    var command = spawn('sh', ['../SH/ProcessVoiceFile.sh', fileName]);

    command.stdout.on('data', function(data) {
        childProcessResponse += data;
	//console.log(data);
    });

    command.stderr.on('data', function(data) {
        //console.log(data);
        //childProcessResponse += data;
    });

    command.on('exit', function(code) {
        var requestOptions = {
            url: requestedUrl,
            method: 'POST',
            form: childProcessResponse
        };

        request.post(requestOptions, function(error, response, body) {
            if(error) {
                console.log("Error with remote request: " + error);
            } else {
                console.log("Remote PC Body: " + body);
    
                var dataToReturn = {};
                dataToReturn.VoiceRecognitionResponse = body;
    
                EndRequest(fileName, res, dataToReturn); 
            }
        });
    });
}

function ExecuteRemoteVoiceRecognition(fileName, requestedUrl, ogResponse)
{
    var myFormData = {
        my_file: fs.createReadStream(fileName)
    };

    var requestOptions = {
        url: requestedUrl,
        method: 'POST',
        formData: myFormData
    };

    request.post(requestOptions, function(error, response, body) {
        if(error) {
            console.log("Error with remote request: " + error);
        } else {
            console.log("Remote PC Body: " + body);
   
            var dataToReturn = {};
            dataToReturn.VoiceRecognitionResponse = body;
    
            EndRequest(fileName, ogResponse, dataToReturn);
        }
    });
}

function EndRequest(fileName, res, dataToReturn) {
    var load = cpu.cpuEnd();
    dataToReturn.CPUInfo = load.percent;
    res.write(JSON.stringify(dataToReturn));
    res.end();

    fs.unlink(fileName, (err) => {
    });
}

function guid() {
    //http://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript/2117523#2117523
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
    });
}
