const os = require('os')
const ipc = require('electron').ipcRenderer

//Grab first CPU Measure
var startMeasure = cpuAverage();

window.onload = UpdateUI

function UpdateUI() 
{
	//NodeJS OS constants API
    UpdateMemory();
    UpdateProcessor();
}

function UpdateMemory() 
{
    var freeMemBytes = os.freemem();
    var freeMemKB = freeMemBytes/1024;
    var freeMemMB = freeMemKB/1024;
    var freeMemGB = freeMemMB/1024;
    
    document.getElementById('sysMemory').innerHTML = freeMemGB.toFixed(2) + "GB RAM Usage.";
}

//THIS NEEDS UPDATED AS IT DOES NOT SEEM TO BE WORKING CORRECTLY
//This is because it shows 0 a lot and does not really match up with the Activity Monitor
// I used the CPU load function from here https://gist.github.com/bag-man/5570809 as noted below
function UpdateProcessor() 
{    
    //Set delay for second Measure
    setTimeout(function() { 

        //Grab second Measure
        var endMeasure = cpuAverage(); 

        //Calculate the difference in idle and total time between the measures
        var idleDifference = endMeasure.idle - startMeasure.idle;
        var totalDifference = endMeasure.total - startMeasure.total;

        //Calculate the average percentage CPU usage
        var percentageCPU = 100 - ~~(100 * idleDifference / totalDifference);
        
        startMeasure = cpuAverage();
        
        document.getElementById('sysProcessor').innerHTML = percentageCPU + "% CPU Usage.";
    }, 100);
}

// I used the CPU load function from here https://gist.github.com/bag-man/5570809
//Create function to get CPU information
function cpuAverage() 
{
  //Initialise sum of idle and time of cores and fetch CPU info
  var totalIdle = 0, totalTick = 0;
  var cpus = os.cpus();

  //Loop through CPU cores
  for(var i = 0, len = cpus.length; i < len; i++) {

    //Select CPU core
    var cpu = cpus[i];

    //Total up the time in the cores tick
    for(type in cpu.times) {
      totalTick += cpu.times[type];
   }     

    //Total up the idle time of the core
    totalIdle += cpu.times.idle;
  }

  //Return the average Idle and Tick times
  return {idle: totalIdle / cpus.length,  total: totalTick / cpus.length};
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