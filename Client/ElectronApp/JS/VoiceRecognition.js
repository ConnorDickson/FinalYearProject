const ipc = require('electron').ipcRenderer;
const fs = require('fs');
window.AudioContext = window.AudioContext || window.webkitAudioContext;
navigator.getUserMedia  = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;

var recorder;
var currentlyRecording = false;

var onFail = function(e) {
    console.log('Rejected!', e);
};

var onSuccess = function(s) {
	var context = new AudioContext();
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

function ExecuteScript() {
    ipc.send('execute-voicerecognition-script');
}