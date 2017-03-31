//a custom node module that can be imported and is reuseable
//records total CPU use

const os = require('os');
var start;

// I used some logic from here for these methods: https://gist.github.com/bag-man/5570809
function cpuAverage() {

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

//works out the average CPU use since recording started
var cpuEnd = function() {
    var end = cpuAverage();
    
    var dif = {};

    dif.idle  = end.idle  - start.idle;
    dif.total = end.total - start.total;

    dif.percent = ((1 - dif.idle / dif.total) * 100).toFixed(2);

    return dif;
}

//records the starting measurement
var cpuStart = function() {
    start = cpuAverage();    
}

//used to return the amount of free ram the system has (in GB)
var freeMemory = function() 
{
    var freeMemBytes = os.freemem();
    var freeMemKB = freeMemBytes/1024;
    var freeMemMB = freeMemKB/1024;
    var freeMemGB = freeMemMB/1024;
    
    return freeMemGB.toFixed(2);
}

//Used to make methods accessable from the code importing the module
module.exports = {
    cpuStart,
    cpuEnd,
    freeMemory
};