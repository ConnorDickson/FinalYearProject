//This already has the const declared because I am extending the voice recognition file

function ExecuteVoiceRecognitionLoadBalance() {
    document.getElementById('VoiceRecognitionResults').innerHTML = "";
    
    cpu.cpuStart();
    var numberOfRequests = parseInt(document.getElementById('NumberOfVoiceRecognitionRequests').value);
    
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
            SetVoiceRecognitionResults(responseData);
        });
    });
}

function SetVoiceRecognitionResults(responseData) {
    var load = cpu.cpuEnd();
    var freeMemory = cpu.freeMemory();
    var jsonResult = JSON.parse(responseData);

    document.getElementById('VoiceRecognitionResults').innerHTML += "<br>Results: " + jsonResult.VoiceRecognitionResponse.trim() + " Local: " + load.percent + " Remote: " + jsonResult.CPUInfo;
}