const ipc = require('electron').ipcRenderer;
const fs = require('fs');
const http = require('http');
const cpu = require('../JS/cpu');

var context = new AudioContext();
var recorder;
var currentlyRecording = false;
var localStopwatch;
var remoteStopwatch;

window.AudioContext = window.AudioContext || window.webkitAudioContext;
navigator.getUserMedia  = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;

var onFail = function(e) {
    console.log('Rejected!', e);
};

var onSuccess = function(s) {
    var mediaStreamSource = context.createMediaStreamSource(s);
    recorder = new Recorder(mediaStreamSource);
    recorder.clear();
    recorder.record();
    document.getElementById("RecordingStatus").innerHTML = "Recording";
}

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

function StartRecording() 
{
    if (navigator.getUserMedia) {
        navigator.getUserMedia({audio: true}, onSuccess, onFail);
    } else {
        console.log('navigator.getUserMedia not present');
    }
}

function StopRecording() 
{
    recorder.stop();
    document.getElementById("RecordingStatus").innerHTML = "Finished Recording";
    recorder.exportMonoWAV(function(s) {
        document.getElementById('audioplayer').src = window.webkitURL.createObjectURL(s);
        Recorder.forceDownload(s);
    });
}

ipc.on('receive-voice-translation', function(event,response) {
    SetLocalResultsAsFinished(response);
});

function ExecuteVoiceRecognitionScript() {
    localStopwatch.reset();
    localStopwatch.start();
    SetLocalResultsAsProcessing();
    cpu.cpuStart();    
    ipc.send('execute-voicerecognition-script');
}

function ExecuteRemoteVoiceRecognition() {
    remoteStopwatch.reset();
    remoteStopwatch.start();
    cpu.cpuStart();
    SetRemoteResultsAsProcessing();
    
    var data = fs.readFileSync("../../Downloads/output.wav"),
        client,
        request;
    
   client = http.createClient(3002, "edgepi01");
    
    request = client.request('POST', '/', {
        'Host': 'edgepi01',
        'Port': 3002,
        'User-Agent': 'Node.JS',
        'Content-Type': 'application/octet-stream',
        'Content-Length': data.length
    });

    request.write(data);
    request.end();

    request.on('error', function (err) {
        console.log(err);
    });

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

function SetLocalResultsAsProcessing() {
    document.getElementById('localSysProcessor').innerHTML = "Processing...";
    document.getElementById('localSysMemory').innerHTML = "Processing...";
    document.getElementById('localResultsParagraph').innerHTML = "Processing...";
}

function SetRemoteResultsAsProcessing() {
    document.getElementById('remoteSysProcessor').innerHTML = "Processing...";
    document.getElementById('remoteSysMemory').innerHTML = "Processing...";
    document.getElementById('remoteResultsParagraph').innerHTML = "Processing...";
}

function SetLocalResultsAsFinished(response) {
    localStopwatch.stop();
    var freeMemory = cpu.freeMemory();
    document.getElementById('localSysMemory').innerHTML = freeMemory + "GB RAM Free.";
    var load = cpu.cpuEnd();
    document.getElementById('localSysProcessor').innerHTML = load.percent + "% CPU Usage.";
    document.getElementById('localResultsParagraph').innerHTML = "You said: \"" + response.trim() + "\"";
}

function SetRemoteResultsAsFinished(responseData) {
    remoteStopwatch.stop();
    var freeMemory = cpu.freeMemory();
    document.getElementById('remoteSysMemory').innerHTML = freeMemory + "GB RAM Free.";
    var load = cpu.cpuEnd();
    document.getElementById('remoteSysProcessor').innerHTML = load.percent + "% CPU Usage.";
    document.getElementById('remoteResultsParagraph').innerHTML = "You said: \"" + responseData.trim() + "\"";
}

window.onload = function() {
    var localStopwatchElement = document.getElementById('localStopwatchResults');
    var remoteStopwatchElement = document.getElementById('remoteStopwatchResults');
    localStopwatch = new Stopwatch(localStopwatchElement);
    remoteStopwatch = new Stopwatch(remoteStopwatchElement);
};