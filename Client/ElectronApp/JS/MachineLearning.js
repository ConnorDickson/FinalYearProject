const http = require('http');

function ExecuteMachingLearningRequest() {
    client = http.createClient(3004, "edgepi01");
    
    request = client.request('POST', '/', {
        'Host': 'edgepi01',
        'Port': 3004,
        'User-Agent': 'Node.JS',
        'Content-Type': 'application/octet-stream'
    });

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
            document.getElementById('requestResult').innerHTML = responseData;
        });
    });
}