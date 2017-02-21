const http = require('http');

const totalChoices = 4;

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
//            document.getElementById('requestResult').innerHTML = prevResults.PrevResults + " " + prevResults.Evaluation;
        });
    });
}

function EvaluateButtonClick() 
{
    var selectedChoice = event.srcElement.innerHTML;

    var choiceNum = event.srcElement.parentElement.id;
    
    document.getElementById(choiceNum + "Result").innerHTML = selectedChoice;
}

function SendResults() {
    var client = http.createClient(3004, "edgepi01");
    
    var choice1 = document.getElementById('Choice1Result').innerHTML;
    var choice2 = document.getElementById('Choice2Result').innerHTML;
    var choice3 = document.getElementById('Choice3Result').innerHTML;
    var choice4 = document.getElementById('Choice4Result').innerHTML;

    if(choice1 == "" || choice2 == "" || choice3 == "" || choice4 == "") {
        document.getElementById('requestResult').innerHTML = "Please fill out the responses";
        return;
    }
    
    prevResults.Choice1 = choice1;
    prevResults.Choice2 = choice2;
    prevResults.Choice3 = choice3;
    prevResults.Choice4 = choice4; 

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
            document.getElementById('requestResult').innerHTML = "PreProcessedData: " + prevResults.PreProcessedData + "<br><br>" + "Evaluation: " + prevResults.Evaluation;
        });
    });
}