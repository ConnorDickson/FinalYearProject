const http = require('http');

const totalChoices = 4;

var userID = "";

//After a user logs in they need to get their own vectors (or do they make them up randomly as "Movies Watched"?)
//Use the Javascript save locally method
function Login() {    
    userID = document.getElementById('UserID').value;

    if(userID != "") {
        event.srcElement.parentElement.parentElement.className = "hidden";
        
        document.getElementById('RecommendationButton').className = "button";
        
        var client = http.createClient(3004, "edgepi01");

        var jsonObject = {};
        jsonObject.UserID = userID;
        var jsonData = JSON.stringify(jsonObject);
        
        var request = client.request('POST', '/GetRecommendations', {
            'Host': 'edgepi01',
            'Port': 3004,
            'User-Agent': 'Node.JS',
            'Content-Type': 'application/octet-stream',
            'Content-Length': jsonData.length
        });

        request.write(jsonData);
        
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
                document.getElementById('recommendations').innerHTML = "Initial Reccomendation: " + jsonData.Recommendation;
            });
        });
    } else {
        document.getElementById('recommendations').innerHTML = "Please enter a username."
    }
}

//This now needs to compact and average vectors to get a reccommendation
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
    var resultsJson = {};
    resultsJson.Choice1 = genreArray[0];
    resultsJson.Choice2 = genreArray[1];
    resultsJson.Choice3 = genreArray[2];
    resultsJson.Choice4 = genreArray[3];
    resultsJson.Choice5 = genreArray[4];
    resultsJson.Choice6 = genreArray[5];
    resultsJson.UserID = userID;
    
    var requestData = JSON.stringify(resultsJson);
    
    var request = client.request('POST', '', {
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
            document.getElementById('recommendations').innerHTML = "PreProcessedData: " + jsonData.PreProcessedData + "<br><br>" + "Evaluation: " + jsonData.Evaluation;
        });
    });
}