const http = require('http');

const totalChoices = 4;

var userID = "";
var edgeNode = "edgepi01";
var dataCentre = "connor-pc";
var localStorageDataName = "prevResults";

//After a user logs in they need to get their own vectors (or do they make them up randomly as "Movies Watched"?)
//Use the Javascript save locally method
function Login() {    
    userID = document.getElementById('UserID').value;

    if(userID != "") {
        event.srcElement.parentElement.parentElement.className = "hidden";
        
        document.getElementById('GUIForLoggedInUsers').className = "";
        
        GetPreviousMovies(GetRecommendation);
    } else {
        document.getElementById('recommendations').innerHTML = "Please enter a username."
    }
}

function GetPreviousMovies(callback) {
    var client = http.createClient(3000, dataCentre);

    var jsonObject = {};
    jsonObject.UserID = userID;
    var jsonData = JSON.stringify(jsonObject);

    var request = client.request('POST', '/GetPreviousMovies', {
        'Host': dataCentre,
        'Port': 3000,
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
            localStorage.setItem(localStorageDataName, jsonData.Results);
            callback();
        });
    });
}

function GetRecommendation() {
    var averagePreviousResults = AveragePreviousResults();
    
    var client = http.createClient(3004, edgeNode);

    var jsonObject = {};
    jsonObject.UserID = userID;
    jsonObject.Results = averagePreviousResults;
    var jsonData = JSON.stringify(jsonObject);

    var request = client.request('POST', '/GetRecommendations', {
        'Host': edgeNode,
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
            document.getElementById('recommendations').innerHTML = "Initial Recommendation: " + jsonData.Recommendation;
        });
    });
}

function AveragePreviousResults() 
{
    //Get the previous results we have stored
    var prevResults = localStorage.getItem(localStorageDataName);
    //Add up the total of each category for all our results
    var totalYear = [];
    var totalPercentageHorror = [];
    var totalContainsViolence = []
    
    prevResults.forEach(function(prevResult) {
        totalYear.push(prevResult.Year);
        totalPercentageHorror.push(prevResult.PercentageHorror);
        totalContainsViolence.push(prevResult.ContainsViolence);
    });
    
    var totalYearCount = 0;
    var totalPercentageHorrorCount = 0.0;
    var totalContainsViolenceTrueCount = 0;

    for(var i = 0; i < prevResults.length; i++) {
        totalYear += totalYear[i];
        totalPercentageHorrorCount += totalPercentageHorror[i];
        if(totalContainsViolence[i] == true) {
            totalContainsViolenceTrueCount++;
        }
    }
    
    var averageYear = totalYear / totalYear.length;
    var averagePercentageHorror = totalPercentageHorrorCount / totalPercentageHorror.length;    
    var averageContainsViolence = false;
    if(totalContainsViolenceTrueCount > (totalContainsViolence.length/2)) {
        averageContainsViolence = true;
    }
    
    var averagePreviousResult = {};
    averagePreviousResult.Year = averageYear;
    averagePreviousResult.PercentageHorror = averagePercentageHorror;
    averagePreviousResult.ContainsViolence = averageContainsViolence;
    
    return averagePreviousResult;
}

function WatchRandomMovie() {
    //Should I also display average vector of currently watched movies in the UI? 
    //This means that when I return a reccommendation I can see how close it was?
    //Should it actually travel through the edge node instead of talking directly to the DC so that a reccommendation can be produced/updated?
    var client = http.createClient(3000, dataCentre);
    
    var jsonObject = {};
    jsonObject.UserID = userID;
    var jsonData = JSON.stringify(jsonObject);
    
    var request = client.request('POST', '/api/MachineLearning/WatchRandomMovie', {
        'Host': dataCentre,
        'Port': 3000,
        'User-Agent': 'Node.JS',
        'Content-Type': 'application/octet-stream',
        'Content-Length': jsonData.length
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
            var prevResults = localStorage.getItem(localStorageDataName);
            prevResults.push(jsonData.Results[0]);
        });
    });
}

function WatchRecommendedMovie() {
    alert("Not Implemented");
    //We should have all the movie information here. Could we just send the ID of the movie we want to watch?
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
    var client = http.createClient(3004, edgeNode);
    
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
        'Host': edgeNode,
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