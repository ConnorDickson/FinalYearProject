const os = require('os')
const ipc = require('electron').ipcRenderer

//Grab first CPU Measure
var startMeasure = cpuAverage();

window.onload = UpdateUI

function UpdateUI() 
{
	//NodeJS OS constants API
    ComputerStats.UpdateMemory();
    ComputerStats.UpdateProcessor();
}

function OpenDialog() 
{
	ipc.send('open-information-dialog')
}

function PingCluster() 
{
	var xmlHttp = new XMLHttpRequest();
	xmlHttp.open("GET","http://edgepi01:5000",false);
	xmlHttp.send(null);
	document.getElementById('webRequestParagrah').innerHTML = xmlHttp.responseText;
}

function NavigateToCachingApplication() 
{
    window.location.href = "Pages/CachingApplication.html";
}

ipc.on('information-dialog-selection', function(event,index) {
	let message = 'You Selected '

	if(index === 0) {
		message += 'Yes.';
	}
	else 
	{
		message += 'No.';
	}
	
	document.getElementById('messageParagraph').innerHTML = message;
});

function AutoRefreshUI() 
{
    startMeasure = cpuAverage();
    UpdateUI();
    setTimeout(AutoRefreshUI, 500);
}

setTimeout(AutoRefreshUI, 500);