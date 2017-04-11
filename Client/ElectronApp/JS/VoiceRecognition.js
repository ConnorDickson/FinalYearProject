const ipc = require('electron').ipcRenderer;
const fs = require('fs');
const http = require('http');
const cpu = require('../JS/cpu');

var context = new AudioContext();
var recorder;
var currentlyRecording = false;
var localStopwatch;
var remoteStopwatch;
var filePath = "../../Downloads/output.wav";

//Use these values to record * 10 and then print total to the UI.
var localTimeTakenTotalResults = [];
var localMemoryTotalResults = [];
var localProcessorTotalResults = [];

//audio variables for handling audio in Electron
window.AudioContext = window.AudioContext || window.webkitAudioContext;
navigator.getUserMedia  = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;

var localExecutionCounter = 0;
var localExecuionsRequired = 1;

function ExecuteLocalExperiment() {
    localExecutionCounter = 0;
    localTimeTakenTotalResults = [];
    localMemoryTotalResults = [];
    localProcessorTotalResults = [];
    
    document.getElementById('localStopwatchResults').innerHTML = "";
    var localStopwatchElement = document.getElementById('localStopwatchResults');
    localStopwatch = new Stopwatch(localStopwatchElement);
    
    //Execute Warmup
    var timeBetweenRequests = 10000;
    
    //Clear cache after X time and print to UI saying that's what is going to happen
    for(var requestNumber = 0; requestNumber < localExecuionsRequired; requestNumber++) {        
        setTimeout(executeLocalExperiment, (timeBetweenRequests * requestNumber));
    }
}

function executeLocalExperiment() {
    localStopwatch.reset();
    localStopwatch.start();
    SetLocalResultsAsProcessing();
    cpu.cpuStart();    
    ipc.send('execute-voicerecognition-script-experiment');    
}

ipc.on('receive-voice-translation-experiment', function(event,response) {
    var load = cpu.cpuEnd();
    localStopwatch.stop();
    var freeMemory = cpu.freeMemory();
    
    //time is in this format at the moment - timer.innerHTML = "Time: " + clock/1000 + " seconds."; 
    localTimeTakenTotalResults.push(document.getElementById('localStopwatchResults').innerHTML);
    localMemoryTotalResults.push(freeMemory);
    localProcessorTotalResults.push(load.percent);
    
    localExecutionCounter++;
    
    if(localExecutionCounter == localExecuionsRequired) {
        document.getElementById('localResultsParagraph').innerHTML = "You said: \"" + response.trim() + "\"";
        document.getElementById('localStopwatchResults').innerHTML = "";
        document.getElementById('localSysMemory').innerHTML = "";
        document.getElementById('localSysProcessor').innerHTML = "";
        
        for(var i = 0; i < localTimeTakenTotalResults.length; i++) {
            document.getElementById('localStopwatchResults').innerHTML = document.getElementById('localStopwatchResults').innerHTML + localTimeTakenTotalResults[i] + " "; 
            document.getElementById('localSysMemory').innerHTML = document.getElementById('localSysMemory').innerHTML + localMemoryTotalResults[i] + " ";
            document.getElementById('localSysProcessor').innerHTML = document.getElementById('localSysProcessor').innerHTML +  localProcessorTotalResults[i] + " ";
        }
        
        document.getElementById('localSysMemory').innerHTML = document.getElementById('localSysMemory').innerHTML + "GB RAM Free.";
        document.getElementById('localSysProcessor').innerHTML = document.getElementById('localSysProcessor').innerHTML + "% CPU Usage.";
        
        var stats = fs.statSync(filePath);
        document.getElementById('localRecordingFileSize').innerHTML = "File Size:  " + stats.size;
    }
});

//event handler for failed audio recording
var onFail = function(e) {
    console.log('Rejected!', e);
};

//event handler for successful audio recording 
var onSuccess = function(s) {
    var mediaStreamSource = context.createMediaStreamSource(s);
    recorder = new Recorder(mediaStreamSource);
    recorder.clear();
    recorder.record();
    document.getElementById("RecordingStatus").innerHTML = "Recording";
}

//start or stop recording
function ToggleRecording() 
{
    if(!currentlyRecording) {
        document.getElementById("RecordingButton").innerHTML = "Stop Recording";
        currentlyRecording = true;
        StartRecording();
    } else {
        document.getElementById("RecordingButton").innerHTML = "Start Recording";
        currentlyRecording = false;
        StopRecording();
    }
}

//start the recording
function StartRecording() 
{
    if (navigator.getUserMedia) {
        navigator.getUserMedia({audio: true}, onSuccess, onFail);
    } else {
        console.log('navigator.getUserMedia not present');
    }
}

//stop and save the recording
function StopRecording() 
{
    recorder.stop();
    document.getElementById("RecordingStatus").innerHTML = "Finished Recording";
    recorder.exportMonoWAV(function(s) {
        document.getElementById('audioplayer').src = window.webkitURL.createObjectURL(s);
        Recorder.forceDownload(s);
    });
}

//receive data from the "main" thread (Node.js backend in Electron)
ipc.on('receive-voice-translation', function(event,response) {
    SetLocalResultsAsFinished(response);
});

//make a call to the Node.js main thread that can spawn a new process and execute voice recognition
function ExecuteVoiceRecognitionScript() {
    localStopwatch.reset();
    localStopwatch.start();
    SetLocalResultsAsProcessing();
    cpu.cpuStart();    
    ipc.send('execute-voicerecognition-script');
}

var remoteTimeTakenTotalResults = [];
var remoteMemoryTotalResults = [];
var remoteProcessorTotalResults = [];
var edgeProcessorTotalResults = [];
var edgeMemoryTotalResults = [];
var dataCentreReceivedLengthTotalResults = [];
var dataCentreSentLengthTotalResults = [];
var dataCentreProcessorTotalResults = [];
var dataCentreMemoryTotalResults = [];

var remoteExecutionCounter = 0;
var remoteExecuionsRequired = 1;

function ExecuteRemoteExperiment() {
    remoteExecutionCounter = 0;
    remoteTimeTakenTotalResults = [];
    remoteMemoryTotalResults = [];
    remoteProcessorTotalResults = [];
    edgeProcessorTotalResults = [];
    edgeMemoryTotalResults = [];
    dataCentreReceivedLengthTotalResults = [];
    dataCentreSentLengthTotalResults = [];
    dataCentreProcessorTotalResults = [];
    dataCentreMemoryTotalResults = [];
    document.getElementById('remoteStopwatchResults').innerHTML = "";
    var remoteStopwatchElement = document.getElementById('remoteStopwatchResults');
    remoteStopwatch = new Stopwatch(remoteStopwatchElement);
    
    //Execute Warmup
    var timeBetweenRequests = 10000;
    
    //Clear cache after X time and print to UI saying that's what is going to happen
    for(var requestNumber = 0; requestNumber < remoteExecuionsRequired; requestNumber++) {        
        setTimeout(executeRemoteExperiment, (timeBetweenRequests * requestNumber));
    }
}

function executeRemoteExperiment() {
    remoteStopwatch.reset();
    remoteStopwatch.start();
    cpu.cpuStart();
    SetRemoteResultsAsProcessing();
    
    var data = fs.readFileSync(filePath);
    
    var urlToPostTo = 'http://connor-pc:3000/api/voicerecognition/PostVoiceRequest';
    
    var client = http.createClient(3002, "edgepi01");
    
    var request = client.request('POST', urlToPostTo, {
        'Host': 'edgepi01',
        'Port': 3002,
        'User-Agent': 'Node.JS',
        'Content-Type': 'application/octet-stream',
        'Content-Length': data.length,
        'Preprocess-Request': document.getElementById('useEdgeNodeCheckbox').checked
    });

    request.write(data);
    request.end();

    request.on('error', function (err) {
        console.log(err);
    });

    //handle the response data
    request.on('response', function (response) {
        var responseData = "";
        response.setEncoding('utf8');

        response.on('data', function (chunk) {
            responseData += chunk;
        });

        response.on('end', function () {
            var load = cpu.cpuEnd();
            remoteStopwatch.stop();
            var freeMemory = cpu.freeMemory();
            var jsonResult = JSON.parse(responseData);

            remoteTimeTakenTotalResults.push(document.getElementById('remoteStopwatchResults').innerHTML);
            remoteMemoryTotalResults.push(freeMemory);
            remoteProcessorTotalResults.push(load.percent);
            edgeProcessorTotalResults.push(jsonResult.CPUInfo);
            edgeMemoryTotalResults.push(jsonResult.RAMInfo);
            dataCentreReceivedLengthTotalResults.push(jsonResult.DataCentreReceivedLength);
            dataCentreSentLengthTotalResults.push(jsonResult.DataCentreSentLength);
            dataCentreProcessorTotalResults.push(jsonResult.DataCentreProcessor);
            dataCentreMemoryTotalResults.push((jsonResult.DataCentreMemory/1000000).toFixed(2));
            
            remoteExecutionCounter++;
            
            if(remoteExecutionCounter == remoteExecuionsRequired) {
                document.getElementById('remoteSysMemory').innerHTML = "";
                document.getElementById('remoteSysProcessor').innerHTML = "";
                document.getElementById('edgeNodeProcessor').innerHTML = "";
                document.getElementById('edgeNodeMemory').innerHTML = "";
                document.getElementById('remoteDataCentreReceivedDataLength').innerHTML = "Data received at the Data Centre: ";
                document.getElementById('remoteDataCentreSentDataLength').innerHTML = "Data received from the Data Centre: ";
                document.getElementById('remoteDataCentreCPUUse').innerHTML = "";
                document.getElementById('remoteDataCentreMemoryUse').innerHTML = "";          
                document.getElementById('remoteResultsParagraph').innerHTML = "You said: \"" + jsonResult.VoiceRecognitionResponse.trim() + "\"";
                document.getElementById('remoteStopwatchResults').innerHTML = "";

                for(var i = 0; i < remoteTimeTakenTotalResults.length; i++) {
                    document.getElementById('remoteStopwatchResults').innerHTML = document.getElementById('remoteStopwatchResults').innerHTML + remoteTimeTakenTotalResults[i] + " "; 
                    document.getElementById('remoteSysMemory').innerHTML = document.getElementById('remoteSysMemory').innerHTML + remoteMemoryTotalResults[i] + " ";
                    document.getElementById('remoteSysProcessor').innerHTML = document.getElementById('remoteSysProcessor').innerHTML + remoteProcessorTotalResults[i] + " ";
                    document.getElementById('edgeNodeMemory').innerHTML = document.getElementById('edgeNodeMemory').innerHTML + edgeMemoryTotalResults[i] + " ";
                    document.getElementById('edgeNodeProcessor').innerHTML = document.getElementById('edgeNodeProcessor').innerHTML + edgeProcessorTotalResults[i] + " ";
                    document.getElementById('remoteDataCentreReceivedDataLength').innerHTML = document.getElementById('remoteDataCentreReceivedDataLength').innerHTML + dataCentreReceivedLengthTotalResults[i] + " ";
                    document.getElementById('remoteDataCentreSentDataLength').innerHTML = document.getElementById('remoteDataCentreSentDataLength').innerHTML + dataCentreSentLengthTotalResults[i] + " ";
                    document.getElementById('remoteDataCentreCPUUse').innerHTML = document.getElementById('remoteDataCentreCPUUse').innerHTML + dataCentreProcessorTotalResults[i] + " ";
                    document.getElementById('remoteDataCentreMemoryUse').innerHTML = document.getElementById('remoteDataCentreMemoryUse').innerHTML + dataCentreMemoryTotalResults[i] + " ";                    
                }

                document.getElementById('remoteSysMemory').innerHTML = document.getElementById('remoteSysMemory').innerHTML + "GB Local RAM Free.";
                document.getElementById('remoteSysProcessor').innerHTML = document.getElementById('remoteSysProcessor').innerHTML + "% Local CPU Usage.";
                document.getElementById('edgeNodeProcessor').innerHTML = document.getElementById('edgeNodeProcessor').innerHTML + "% Edge Node CPU Usage";
                document.getElementById('edgeNodeMemory').innerHTML = document.getElementById('edgeNodeMemory').innerHTML + "GB Edge Node RAM Free.";
                document.getElementById('remoteDataCentreReceivedDataLength').innerHTML = document.getElementById('remoteDataCentreReceivedDataLength').innerHTML + " bytes";
                document.getElementById('remoteDataCentreSentDataLength').innerHTML = document.getElementById('remoteDataCentreSentDataLength').innerHTML + " bytes";;
                document.getElementById('remoteDataCentreCPUUse').innerHTML = document.getElementById('remoteDataCentreCPUUse').innerHTML + "% Data Centre CPU use";
                document.getElementById('remoteDataCentreMemoryUse').innerHTML = document.getElementById('remoteDataCentreMemoryUse').innerHTML + "GB Data Centre RAM Free";

                var stats = fs.statSync(filePath);
                document.getElementById('remoteRecordingFileSize').innerHTML = "File Size:  " + stats.size;
            }
        });
    });   
}

//Make a post request to the DataCentre that is proxied through the Edge Node
function ExecuteRemoteVoiceRecognition() {
    remoteStopwatch.reset();
    remoteStopwatch.start();
    cpu.cpuStart();
    SetRemoteResultsAsProcessing();
    
    var data = fs.readFileSync(filePath);
    
    var urlToPostTo = 'http://connor-pc:3000/api/voicerecognition/PostVoiceRequest';
    
    var client = http.createClient(3002, "edgepi01");
    
    var request = client.request('POST', urlToPostTo, {
        'Host': 'edgepi01',
        'Port': 3002,
        'User-Agent': 'Node.JS',
        'Content-Type': 'application/octet-stream',
        'Content-Length': data.length,
        'Preprocess-Request': document.getElementById('useEdgeNodeCheckbox').checked
    });

    request.write(data);
    request.end();

    request.on('error', function (err) {
        console.log(err);
    });

    //handle the response data
    request.on('response', function (response) {
        var responseData = "";
        response.setEncoding('utf8');

        response.on('data', function (chunk) {
            responseData += chunk;
        });

        response.on('end', function () {
            SetRemoteResultsAsFinished(responseData);
        });
    });
}

//update the left hand side of the table as processing
function SetLocalResultsAsProcessing() {
    document.getElementById('localSysProcessor').innerHTML = "Processing...";
    document.getElementById('localSysMemory').innerHTML = "Processing...";
    document.getElementById('localResultsParagraph').innerHTML = "Processing...";
    document.getElementById('localRecordingFileSize').innerHTML = "Processing...";
}

//update the right hand side of the table as processing
function SetRemoteResultsAsProcessing() {
    document.getElementById('remoteSysProcessor').innerHTML = "Processing...";
    document.getElementById('edgeNodeProcessor').innerHTML =  "Processing...";
    document.getElementById('edgeNodeMemory').innerHTML =  "Processing...";
    document.getElementById('remoteSysMemory').innerHTML = "Processing...";
    document.getElementById('remoteResultsParagraph').innerHTML = "Processing...";
    document.getElementById('remoteRecordingFileSize').innerHTML = "Processing...";
    document.getElementById('remoteDataCentreReceivedDataLength').innerHTML = "Processing...";
    document.getElementById('remoteDataCentreSentDataLength').innerHTML = "Processing...";
    document.getElementById('remoteDataCentreCPUUse').innerHTML = "Processing...";
    document.getElementById('remoteDataCentreMemoryUse').innerHTML = "Processing...";
}

//update the left hand side of the table as finished by recording metrics and displaying them in the UI
function SetLocalResultsAsFinished(response) {
    var load = cpu.cpuEnd();
    localStopwatch.stop();
    var freeMemory = cpu.freeMemory();
    
    document.getElementById('localResultsParagraph').innerHTML = "You said: \"" + response.trim() + "\"";
    document.getElementById('localSysMemory').innerHTML = freeMemory + "GB RAM Free.";
    document.getElementById('localSysProcessor').innerHTML = load.percent + "% CPU Usage.";    
        
    var stats = fs.statSync(filePath);
    document.getElementById('localRecordingFileSize').innerHTML = "File Size:  " + stats.size;
}

//set the right hand side of the table as finished by recording metrics and displaying them in the UI
function SetRemoteResultsAsFinished(responseData) {
    var load = cpu.cpuEnd();
    remoteStopwatch.stop();
    var freeMemory = cpu.freeMemory();
    var jsonResult = JSON.parse(responseData);
    
    document.getElementById('remoteResultsParagraph').innerHTML = "You said: \"" + jsonResult.VoiceRecognitionResponse.trim() + "\"";
    document.getElementById('remoteSysMemory').innerHTML = freeMemory + "GB Local RAM Free.";
    document.getElementById('remoteSysProcessor').innerHTML = load.percent + "% Local CPU Usage.";
    document.getElementById('edgeNodeProcessor').innerHTML =  jsonResult.CPUInfo + "% Edge Node CPU Usage";
    document.getElementById('edgeNodeMemory').innerHTML = jsonResult.RAMInfo + "GB Edge Node RAM Free.";
    document.getElementById('remoteDataCentreReceivedDataLength').innerHTML = "Data received at the Data Centre: " + jsonResult.DataCentreReceivedLength + " bytes";
    document.getElementById('remoteDataCentreSentDataLength').innerHTML = "Data received from the Data Centre: " + jsonResult.DataCentreSentLength + " bytes";;
    document.getElementById('remoteDataCentreCPUUse').innerHTML = jsonResult.DataCentreProcessor + "% Data Centre CPU use";
    document.getElementById('remoteDataCentreMemoryUse').innerHTML = jsonResult.DataCentreMemory + "GB Data Centre RAM Free";
    
    var stats = fs.statSync(filePath);
    document.getElementById('remoteRecordingFileSize').innerHTML = "File Size:  " + stats.size;
}

//when the page loads we want to setup stopwatchs for the requests
window.onload = function() {
    var localStopwatchElement = document.getElementById('localStopwatchResults');
    var remoteStopwatchElement = document.getElementById('remoteStopwatchResults');
    localStopwatch = new Stopwatch(localStopwatchElement);
    remoteStopwatch = new Stopwatch(remoteStopwatchElement);
};