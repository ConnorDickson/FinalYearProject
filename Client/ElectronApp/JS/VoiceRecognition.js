const ipc = require('electron').ipcRenderer;
const fs = require('fs');
const http = require('http');
	
window.AudioContext = window.AudioContext || window.webkitAudioContext;
navigator.getUserMedia  = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;

var context = new AudioContext();

var recorder;
var currentlyRecording = false;

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
	document.getElementById('messageParagraph').innerHTML = response;
});

function ExecuteVoiceRecognitionScript() {
    document.getElementById('messageParagraph').innerHTML = "Processing Locally...";

    ipc.send('execute-voicerecognition-script');
}

function ExecuteRemoteVoiceRecognition() {
    document.getElementById('messageParagraph').innerHTML = "Processing on Edge Node...";
    
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
            document.getElementById('messageParagraph').innerHTML = responseData;
        });
    });
}