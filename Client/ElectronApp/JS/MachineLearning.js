const http = require('http');

const totalChoices = 4;

var prevResults = {};

//window.onload = function() {
//    var client = http.createClient(3004, "edgepi01");
//
//    var request = client.request('GET', 'http://connor-pc:3000/api/MachineLearning/GetResults', {
//        'Host': 'edgepi01',
//        'Port': 3004,
//        'User-Agent': 'Node.JS',
//        'Content-Type': 'application/octet-stream'
//    });
//
//    request.end();
//
//    request.on('error', function (err) {
//        console.log(err);
//    });
//
//    request.on('response', function (response) {
//        var responseData = "";
//        response.setEncoding('utf8');
//
//        response.on('data', function (chunk) {
//            responseData += chunk;
//        });
//
//        response.on('end', function () {
//            var jsonData = JSON.parse(responseData);
//            prevResults = jsonData;
//            localStorage.setItem('prevResults', prevResults);
////            document.getElementById('requestResult').innerHTML = prevResults.PrevResults + " " + prevResults.Evaluation;
//        });
//    });
//}

function EvaluateButtonClick() 
{
    var selectedChoice = event.srcElement.parentElement.children[0].innerHTML;

    var genre = event.srcElement.parentElement.getAttribute('genre');
    
    var choiceNum = event.srcElement.parentElement.id;
        
    SendResults(genre);
}

function SendResults(genre) {    
    var client = http.createClient(3004, "edgepi01");
    
    var genreArray = genre.split('');
        
    prevResults.Choice1 = genreArray[0];
    prevResults.Choice2 = genreArray[1];
    prevResults.Choice3 = genreArray[2];
    prevResults.Choice4 = genreArray[3];
    prevResults.Choice5 = genreArray[4];
    prevResults.Choice6 = genreArray[5];
    
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
            document.getElementById('recommendations').innerHTML = "PreProcessedData: " + prevResults.PreProcessedData + "<br><br>" + "Evaluation: " + prevResults.Evaluation;
        });
    });
}