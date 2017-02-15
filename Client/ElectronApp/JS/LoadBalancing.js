//This already has the const declared because I am extending the voice recognition file
var localStopwatch;
var requestsLeft;
var initialCountOfRequests;
var localCPURecords = [];
var remoteCPURecords = [];

window.onload = function() {
    var localStopwatchElement = document.getElementById('localStopwatchResults');
    localStopwatch = new Stopwatch(localStopwatchElement);    
};

function ExecuteVoiceRecognitionLoadBalance() {
    document.getElementById('averageLocalCPUResult').innerHTML = "Processing...";
    document.getElementById('averageRemoteCPUResult').innerHTML = "Processing...";
    
    localStopwatch.reset();
    localStopwatch.start();
    
    document.getElementById('VoiceRecognitionResults').innerHTML = "";
    
    cpu.cpuStart();
    
    var numberOfRequests = parseInt(document.getElementById('NumberOfVoiceRecognitionRequests').value);
    
    requestsLeft = numberOfRequests;
    initialCountOfRequests = numberOfRequests;
    
    if(numberOfRequests > 0) {
        while(numberOfRequests > 0) {
            setTimeout(ExecuteLoadBalanceRemoteVoiceRecognition, 0);            
            numberOfRequests--;
        }
    }
}

function ExecuteLoadBalanceRemoteVoiceRecognition() {
    var data = fs.readFileSync("../../Downloads/output.wav"),
        client,
        request;
    
    var client = http.createClient(3002, "edgepi01");
    
    var request = client.request('POST', 'http://connor-pc:3000/api/voicerecognition/PostForPreProcessedData', {
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

    request.on('response', function (response) {
        var responseData = "";
        response.setEncoding('utf8');

        response.on('data', function (chunk) {
            responseData += chunk;
        });

        response.on('end', function () {
            requestsLeft--;
            if(requestsLeft == 0) {
                localStopwatch.stop();
                var averageLocalCPUResult = Average(localCPURecords);
                var averageRemoteCPUResult = Average(remoteCPURecords);
                document.getElementById('averageLocalCPUResult').innerHTML = "Average local CPU: " + averageLocalCPUResult;
                document.getElementById('averageRemoteCPUResult').innerHTML = "Average remote CPU: " + averageRemoteCPUResult;
            }
            SetVoiceRecognitionResults(responseData);
        });
    });
}

function Average(elements) {
    var sum = 0.0;
    
    for(var i = 0; i < elements.length; i++) {
        sum += parseFloat(elements[i]);
    }
    
    return sum/elements.length;
}

function SetVoiceRecognitionResults(responseData) {
    var load = cpu.cpuEnd();
    var freeMemory = cpu.freeMemory();
    var jsonResult = JSON.parse(responseData);
    localCPURecords.push(load.percent);
    remoteCPURecords.push(jsonResult.CPUInfo);
    document.getElementById('VoiceRecognitionResults').innerHTML += "<br>Results: " + jsonResult.VoiceRecognitionResponse.trim() + " Local: " + load.percent + " Remote: " + jsonResult.CPUInfo;
}