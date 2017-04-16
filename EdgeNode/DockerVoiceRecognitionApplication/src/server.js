//Import required modules
var util = require('util');
var os = require('os');
var http = require('http');
var fs = require('fs');
var spawn = require('child_process').spawn;
var stressTestCpu = require('./cpu');
var cpu = require('./cpu');
var httpProxy = require('http-proxy');
var request = require('request');

console.log("Starting...");

//Global variables required
var externalPort = process.env.port || 3003;
var internalPort = 3501;
var serverLoadThreshold = 70;

//Send requests to internal voice recognition server
var proxyServer = httpProxy.createProxyServer({
    target: 'http://localhost:' + internalPort,
    toProxy: true
});

//Hook up the proxy event handler
proxyServer.on('error', function(err) {
    console.error('ERROR WITH PROXY SERVER: ' + err.stack);
});

//Listen on the port that will be made available with the deployment script
proxyServer.listen(externalPort);

//Create the internal server
var createdServer = http.createServer(function (req, res) {
    stressTestCpu.cpuStart();
    cpu.cpuStart();

    console.log('Received Request');

    //Set error handlers
    req.on('error', function(err) {
        console.error("REQUEST ERROR:\n" + err.stack);
    });

    res.on('error', function(err) {
        console.error("RESPONSE ERROR:\n" + err.stack);
    });

    if(req.method != "POST") 
    {
        res.end("Please make a POST request");
    }

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

    //Recieve all the POST data from the client
    req.on('data', function(chunk) {
        body.push(chunk);
    });
  
    req.on('end', function() {
        var postData = Buffer.concat(body);
        //Get all the data and store it on disk with 
        // a unique name so that multiple people can make requests at once
        var fileName = "../SavedFile/output" + guid() + ".wav"; 
        fs.writeFile(fileName, postData, function() {
            console.log("Wrote file to disk successfully");
            //Check if the user want's the request to be pre-processed and
            // if the system is capable of handling it
            if(req.headers['preprocess-request'] == 'true') 
            {// && !SystemUnderStress()) {
                console.log('Preprocess request by performing voice recognition on edge node');
                PreProcessVoiceRecognition(fileName, requestedUrl, res);
            } 
            else 
            {
                console.log('Forward request to data centre for processing');
                ExecuteRemoteVoiceRecognition(fileName, requestedUrl, res);
            }
        });
    }); 
});

//Recieve requests from the proxy
createdServer.listen(internalPort);

console.log("Started Node.js server");

//Check if the CPU utalisation is above the allowed threshold
function SystemUnderStress() 
{
    var load = stressTestCpu.cpuEnd();

    var result = false;
    if(load.percent > serverLoadThreshold) {
        console.log("System is under too much stress");
        result = true;
    }

    return result;
}

//Execute the voice recognition script
function PreProcessVoiceRecognition(fileName, requestedUrl, res) 
{
    var childProcessResponse = "";

    var command = spawn('sh', ['../SH/ProcessVoiceFile.sh', fileName]);

    //Read data from linux standard output streams
    command.stdout.on('data', function(data) {
        childProcessResponse += data;
    });

    command.stderr.on('data', function(data) {
        //childProcessResponse += data;
    });

    //Once the process has finished send the result to the Data Centre with the appropriate header
    command.on('exit', function(code) {
        var requestOptions = {
            url: requestedUrl,
            headers: {
                'DataIsPreProcessed': 'True'
            },
            method: 'POST',
            form: childProcessResponse
        };

        request.post(requestOptions, function(error, response, body) {
            if(error) 
            {
                console.log("Error with remote request: " + error);
            } 
            else 
            {
                //console.log("Remote PC Body: " + body);
                var dataFromDataCentre = JSON.parse(body);
                var dataToReturn = {};
                dataToReturn.VoiceRecognitionResponse = dataFromDataCentre.ProcessedString;
                dataToReturn.DataCentreReceivedLength = dataFromDataCentre.ReceivedRequestLength;
                dataToReturn.DataCentreSentLength = Buffer.byteLength(dataFromDataCentre.ProcessedString, 'utf8');
                dataToReturn.DataCentreProcessor = dataFromDataCentre.ProcessorPercentage;
                dataToReturn.DataCentreMemory = dataFromDataCentre.GBMemoryUse;
                EndRequest(fileName, res, dataToReturn); 
            }
        });
    });
}

//Send the voice recording to the data centre for processing and return the repsonse to the client
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
        if(error) 
        {
            console.log("Error with remote request: " + error);
        } 
        else 
        {
            //console.log("Remote PC Body: " + body);
            var dataFromDataCentre = JSON.parse(body);
            var dataToReturn = {};
            dataToReturn.VoiceRecognitionResponse = dataFromDataCentre.ProcessedString;
            dataToReturn.DataCentreReceivedLength = dataFromDataCentre.ReceivedRequestLength;
            dataToReturn.DataCentreSentLength = Buffer.byteLength(dataFromDataCentre.ProcessedString, 'utf8');
            dataToReturn.DataCentreProcessor = dataFromDataCentre.ProcessorPercentage;
            dataToReturn.DataCentreMemory = dataFromDataCentre.GBMemoryUse;           
            EndRequest(fileName, ogResponse, dataToReturn);
        }
    });
}

//Return machine metrics and the voice text as a JSON object
function EndRequest(fileName, res, dataToReturn) 
{
    var load = cpu.cpuEnd();
    dataToReturn.CPUInfo = load.percent;
    dataToReturn.RAMInfo = cpu.freeMemory();
    res.write(JSON.stringify(dataToReturn));
    res.end();

    fs.unlink(fileName, (err) => {
        //I don't need to log if it failed
    });
}

//Create a guid in JavaScript
function guid() 
{
    //http://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript/2117523#2117523
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
    });
}
