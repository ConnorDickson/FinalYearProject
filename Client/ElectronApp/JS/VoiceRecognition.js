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

//audio variables for handling audio in Electron
window.AudioContext = window.AudioContext || window.webkitAudioContext;
navigator.getUserMedia  = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;

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

//Make a post request to the DataCentre that is proxied through the Edge Node
function ExecuteRemoteVoiceRecognition() {
    remoteStopwatch.reset();
    remoteStopwatch.start();
    cpu.cpuStart();
    SetRemoteResultsAsProcessing();
    
    var data = fs.readFileSync(filePath),
        client,
        request;
    
    var urlToPostTo = 'http://connor-pc:3000/api/voicerecognition/PostVoiceRequest';
    
    client = http.createClient(3002, "edgepi01");
    
    request = client.request('POST', urlToPostTo, {
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
    document.getElementById('remoteSysMemory').innerHTML = "Processing...";
    document.getElementById('remoteResultsParagraph').innerHTML = "Processing...";
    document.getElementById('remoteRecordingFileSize').innerHTML = "Processing...";
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