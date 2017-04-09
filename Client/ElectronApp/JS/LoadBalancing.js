//This already has the const declared because I am extending the voice recognition file
var startTime;
var requestsLeft;
var initialCountOfRequests;

//Variables for requests
var requestTimeRecords = [];
var localCPURecords = [];
var remoteCPURecords = [];
var dataCentreCPURecords = [];
var localRAMRecords = [];
var edgeRAMRecords = [];
var dataCentreRAMRecords = [];

//Variables for experimentation
var totalAverageTime = [];
var totalAverageRequestTime = [];
var totalAverageLocalCPU = [];
var totalAverageEdgeCPU = [];
var totalAverageDataCentreCPU = [];
var totalAverageLocalRAM = [];
var totalAverageEdgeRAM = [];
var totalAverageDataCentreRAM = [];

var remoteExecutionCounter = 0;
var remoteExecuionsRequired = 10;

function PerformExperiment() {
    remoteExecutionCounter = 0;
    
    totalAverageTime = [];
    totalAverageRequestTime = [];
    totalAverageLocalCPU = [];
    totalAverageEdgeCPU = [];
    totalAverageDataCentreCPU = [];
    totalAverageLocalRAM = [];
    totalAverageEdgeRAM = [];
    totalAverageDataCentreRAM = [];
        
    var timeBetweenRequests = 45000;
    
    //Clear cache after X time and print to UI saying that's what is going to happen
    for(var requestNumber = 0; requestNumber < remoteExecuionsRequired; requestNumber++) {        
        setTimeout(ExecuteVoiceRecognitionLoadBalance.bind(this, recordExperiment), (timeBetweenRequests * requestNumber));
    }
}

function recordExperiment() {
    remoteExecutionCounter++;
    
    if(remoteExecutionCounter == remoteExecuionsRequired) {
        document.getElementById('localStopwatchResults').innerHTML = "Time: ";
        document.getElementById('averageRequestTimeResult').innerHTML = "Average request time: ";
        document.getElementById('averageLocalCPUResult').innerHTML = "Average local CPU: ";
        document.getElementById('averageRemoteCPUResult').innerHTML = "Average edge CPU: ";
        document.getElementById('averageDataCentreCPUResult').innerHTML = "Average data centre CPU: ";
        document.getElementById('averageLocalRAMResult').innerHTML = "Average local RAM: ";
        document.getElementById('averageRemoteRAMResult').innerHTML = "Average edge RAM: ";
        document.getElementById('averageDataCentreRAMResult').innerHTML = "Average data centre RAM: ";

        for(var i = 0; i < totalAverageTime.length; i++) {
            document.getElementById('localStopwatchResults').innerHTML = document.getElementById('localStopwatchResults').innerHTML + totalAverageTime[i] + " ";
            document.getElementById('averageRequestTimeResult').innerHTML = document.getElementById('averageRequestTimeResult').innerHTML + totalAverageRequestTime[i].toFixed(3) + " ";
            document.getElementById('averageLocalCPUResult').innerHTML = document.getElementById('averageLocalCPUResult').innerHTML + totalAverageLocalCPU[i].toFixed(2) + " ";
            document.getElementById('averageRemoteCPUResult').innerHTML = document.getElementById('averageRemoteCPUResult').innerHTML + totalAverageEdgeCPU[i].toFixed(2) + " ";
            document.getElementById('averageDataCentreCPUResult').innerHTML = document.getElementById('averageDataCentreCPUResult').innerHTML + totalAverageDataCentreCPU[i].toFixed(2) + " ";
            document.getElementById('averageLocalRAMResult').innerHTML = document.getElementById('averageLocalRAMResult').innerHTML + totalAverageLocalRAM[i].toFixed(2) + " ";
            document.getElementById('averageRemoteRAMResult').innerHTML = document.getElementById('averageRemoteRAMResult').innerHTML + totalAverageEdgeRAM[i].toFixed(2) + " ";
            document.getElementById('averageDataCentreRAMResult').innerHTML = document.getElementById('averageDataCentreRAMResult').innerHTML + totalAverageDataCentreRAM[i].toFixed(2) + " ";
        }

        document.getElementById('localStopwatchResults').innerHTML = document.getElementById('localStopwatchResults').innerHTML + " seconds.";   
    }
}

//called from button to execute the load balance request
function ExecuteVoiceRecognitionLoadBalance(callback) {
    requestTimeRecords = [];
    localCPURecords = [];
    remoteCPURecords = [];
    dataCentreCPURecords = [];
    localRAMRecords = [];
    edgeRAMRecords = [];
    dataCentreRAMRecords = [];
    
    var numberOfRequests = parseInt(document.getElementById('NumberOfVoiceRecognitionRequests').value);

    if(numberOfRequests > 100) {
        document.getElementById('VoiceRecognitionResults').innerHTML = "Please make less than 100 requests";
        return;
    }
    
    document.getElementById('localStopwatchResults').innerHTML = "Processing...";
    document.getElementById('averageRequestTimeResult').innerHTML = "Processing...";
    document.getElementById('averageLocalCPUResult').innerHTML = "Processing...";
    document.getElementById('averageRemoteCPUResult').innerHTML = "Processing...";
    document.getElementById('averageDataCentreCPUResult').innerHTML = "Processing...";
    document.getElementById('averageLocalRAMResult').innerHTML = "Processing...";
    document.getElementById('averageRemoteRAMResult').innerHTML = "Processing...";
    document.getElementById('averageDataCentreRAMResult').innerHTML = "Processing...";
    document.getElementById('requestsLeft').innerHTML = "Processing...";
    
    startTime = Date.now();

    document.getElementById('VoiceRecognitionResults').innerHTML = "";
    
    cpu.cpuStart();
        
    requestsLeft = numberOfRequests;
    initialCountOfRequests = numberOfRequests;

    //used to spawn multiple concurrent requests
    if(numberOfRequests > 0) {
        while(numberOfRequests > 0) {
            setTimeout(ExecuteLoadBalanceRemoteVoiceRecognition.bind(this, callback, 0));            
            numberOfRequests--;
        }
    }
}

//executes a single request but called multiple times concurrently
function ExecuteLoadBalanceRemoteVoiceRecognition(callback) {        
    var requestStartTime = Date.now();
    
    //read the file async so that other threads are not held up
    fs.readFile("../../Downloads/output.wav", (err, data) => {
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

        //post voice data to the server
        request.write(data);
        request.end();

        request.on('error', function (err) {
            console.log(err);
        });

        request.on('response', function (response) {
            var responseData = "";
            response.setEncoding('utf8');

            //read all data returned incase it extends beyond the buffer
            response.on('data', function (chunk) {
                responseData += chunk;
            });

            //once the request is finished update the UI
            response.on('end', function () {
                requestsLeft--;
                
                document.getElementById('requestsLeft').innerHTML = "Requests left: " + requestsLeft + '/' + initialCountOfRequests;                
                
                if(requestsLeft == 0) {
                    var endTime = Date.now();
                    var totalTime = (endTime - startTime)/1000;
                    document.getElementById('localStopwatchResults').innerHTML = "Time: " + totalTime + " seconds.";
                    
                    var averageRequestTimeResult = Average(requestTimeRecords);
                    var averageLocalCPUResult = Average(localCPURecords);
                    var averageRemoteCPUResult = Average(remoteCPURecords);
                    var averageDataCentreCPUResult = Average(dataCentreCPURecords);
                    var averageLocalRAMResult = Average(localRAMRecords);
                    var averageEdgeRAMResult = Average(edgeRAMRecords);
                    var averageDataCentreRAMResult = Average(dataCentreRAMRecords);
                                        
                    totalAverageTime.push(totalTime);
                    totalAverageRequestTime.push(averageRequestTimeResult);
                    totalAverageLocalCPU.push(averageLocalCPUResult);
                    totalAverageEdgeCPU.push(averageRemoteCPUResult);
                    totalAverageDataCentreCPU.push(averageDataCentreCPUResult);
                    totalAverageLocalRAM.push(averageLocalRAMResult);
                    totalAverageEdgeRAM.push(averageEdgeRAMResult);
                    totalAverageDataCentreRAM.push(averageDataCentreRAMResult);
                    
                    document.getElementById('averageRequestTimeResult').innerHTML = "Average request time: " + averageRequestTimeResult.toFixed(2);
                    document.getElementById('averageLocalCPUResult').innerHTML = "Average local CPU: " + averageLocalCPUResult.toFixed(2);
                    document.getElementById('averageRemoteCPUResult').innerHTML = "Average edge CPU: " + averageRemoteCPUResult.toFixed(2);
                    document.getElementById('averageDataCentreCPUResult').innerHTML = "Average data centre CPU: " + averageDataCentreCPUResult.toFixed(2);
                    document.getElementById('averageLocalRAMResult').innerHTML = "Average local RAM: " + averageLocalRAMResult.toFixed(2);
                    document.getElementById('averageRemoteRAMResult').innerHTML = "Average edge RAM: " + averageEdgeRAMResult.toFixed(2);
                    document.getElementById('averageDataCentreRAMResult').innerHTML = "Average data centre RAM: " + averageDataCentreRAMResult.toFixed(2);
                    
                    if(callback) {
                        callback();
                    }
                }
                
                SetVoiceRecognitionResults(responseData, requestStartTime);
            });
        }); 
    });
}

//average the elements of an array
function Average(elements) {
    var sum = 0.0;
    
    for(var i = 0; i < elements.length; i++) {
        sum += parseFloat(elements[i]);
    }
    
    return sum/elements.length;
}

//obtain and set the voice recognition results
function SetVoiceRecognitionResults(responseData, requestStartTime) {
    var load = cpu.cpuEnd();
    var freeMemory = cpu.freeMemory();
    var jsonResult = JSON.parse(responseData);
    var requestEndTime = Date.now();
    var totalTime = (requestEndTime - requestStartTime)/1000;
    var dataCentreCPU = parseFloat(jsonResult.DataCentreProcessor).toFixed(2)
    requestTimeRecords.push(totalTime);
    localCPURecords.push(load.percent);
    remoteCPURecords.push(jsonResult.CPUInfo);
    dataCentreCPURecords.push(dataCentreCPU);
    localRAMRecords.push(freeMemory);
    edgeRAMRecords.push(jsonResult.RAMInfo);
    dataCentreRAMRecords.push((jsonResult.DataCentreMemory/1000000).toFixed(2));
    document.getElementById('VoiceRecognitionResults').innerHTML += "<br>Results: " + jsonResult.VoiceRecognitionResponse.trim() + " Local CPU: " + load.percent + " Edge CPU: " + jsonResult.CPUInfo + " Data Centre CPU: " + dataCentreCPU + " Total Time: " + totalTime;
}