const http = require('http');

var prevResults;

window.onload = function() {
    var client = http.createClient(3004, "edgepi01");

    var request = client.request('GET', 'http://connor-pc:3000/api/MachineLearning/GetResults', {
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
            var jsonData = JSON.parse(responseData);
            prevResults = jsonData;
            localStorage.setItem('prevResults', prevResults);
            document.getElementById('requestResult').innerHTML = prevResults.PrevResults + " " + prevResults.Evaluation;
        });
    });
}

function EvaluateButtonClick() 
{
    var selectedChoice = event.srcElement.innerHTML;
    
    var client = http.createClient(3004, "edgepi01");
    
    prevResults.CurrentChoice = selectedChoice;
    
    var requestData = JSON.stringify(prevResults);
    
    var request = client.request('POST', 'http://connor-pc:3000/api/MachineLearning/ProcessInfo', {
        'Host': 'edgepi01',
        'Port': 3004,
        'User-Agent': 'Node.JS',
        'Content-Type': 'application/octet-stream',
        'Content-Length': requestData.length
    });

    request.write(requestData);
    
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
            var jsonData = JSON.parse(responseData);
            prevResults = jsonData;
            localStorage.setItem('prevResults', prevResults);
            document.getElementById('requestResult').innerHTML = prevResults.PrevResults + " " + prevResults.Evaluation;
        });
    });
}