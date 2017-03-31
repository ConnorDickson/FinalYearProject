//This already has the const declared because I am extending the voice recognition file
var localStopwatch;
var requestsLeft;
var initialCountOfRequests;
var localCPURecords = [];
var remoteCPURecords = [];

//Creates the stopwatch object
window.onload = function() {
    var localStopwatchElement = document.getElementById('localStopwatchResults');
    localStopwatch = new Stopwatch(localStopwatchElement);    
};

//called from button to execute the load balance request
function ExecuteVoiceRecognitionLoadBalance() {
    var numberOfRequests = parseInt(document.getElementById('NumberOfVoiceRecognitionRequests').value);

    if(numberOfRequests > 100) {
        document.getElementById('VoiceRecognitionResults').innerHTML = "Please make less than 100 requests";
        return;
    }
    
    document.getElementById('averageLocalCPUResult').innerHTML = "Processing...";
    document.getElementById('averageRemoteCPUResult').innerHTML = "Processing...";
    document.getElementById('requestsLeft').innerHTML = "Processing...";
    
    localStopwatch.reset();
    localStopwatch.start();
    
    document.getElementById('VoiceRecognitionResults').innerHTML = "";
    
    cpu.cpuStart();
        
    requestsLeft = numberOfRequests;
    initialCountOfRequests = numberOfRequests;

    //used to spawn multiple concurrent requests
    if(numberOfRequests > 0) {
        while(numberOfRequests > 0) {
            setTimeout(ExecuteLoadBalanceRemoteVoiceRecognition, 0);            
            numberOfRequests--;
        }
    }
}

//executes a single request but called multiple times concurrently
function ExecuteLoadBalanceRemoteVoiceRecognition() {
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
                    localStopwatch.stop();
                    var averageLocalCPUResult = Average(localCPURecords);
                    var averageRemoteCPUResult = Average(remoteCPURecords);
                    document.getElementById('averageLocalCPUResult').innerHTML = "Average local CPU: " + averageLocalCPUResult;
                    document.getElementById('averageRemoteCPUResult').innerHTML = "Average remote CPU: " + averageRemoteCPUResult;
                }
                SetVoiceRecognitionResults(responseData);
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
function SetVoiceRecognitionResults(responseData) {
    var load = cpu.cpuEnd();
    var freeMemory = cpu.freeMemory();
    var jsonResult = JSON.parse(responseData);
    localCPURecords.push(load.percent);
    remoteCPURecords.push(jsonResult.CPUInfo);
    document.getElementById('VoiceRecognitionResults').innerHTML += "<br>Results: " + jsonResult.VoiceRecognitionResponse.trim() + " Local: " + load.percent + " Remote: " + jsonResult.CPUInfo;
}