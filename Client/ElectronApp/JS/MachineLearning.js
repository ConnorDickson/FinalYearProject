const http = require('http');

const totalChoices = 4;

var userID = "";
var edgeNode = "edgepi01";
//var edgeNode = "192.168.1.185";
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

    var request = client.request('POST', '/api/MachineLearning/GetPreviousMovies', {
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
            if(responseData != "") {
                var jsonData = JSON.parse(responseData);

                if(jsonData == null || jsonData == 'undefined' || jsonData.Results == 'undefined' || jsonData.Results == null || jsonData.Results == "null" || jsonData.Results.count == 0) {
                    localStorage.setItem(localStorageDataName + userID, null);
                } else {
                    localStorage.setItem(localStorageDataName + userID, responseData);
                }
            }
            
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
    var prevResultsString = localStorage.getItem(localStorageDataName + userID);
    var prevResultsJSON = JSON.parse(prevResultsString);
    
    if(prevResultsJSON == 'undefined' || prevResultsJSON == null || prevResultsJSON == "null" || prevResultsJSON.Results.count == 0) {
        return null;
    }
    
    var prevResults = prevResultsJSON.Results;
    
    //Add up the total of each category for all our results
    var totalYear = [];
    var totalPercentageHorror = [];
    var totalPercentageComedy = [];
    var totalPercentageAction = [];
    var totalPercentageAdventure = [];
    var totalPercentageFantasy = [];
    var totalPercentageRomance = [];
    var totalContainsViolence = [];
    var totalContainsSexualScenes = [];
    var totalContainsDrugUse = [];
    var totalContainsFlashingImages = [];

    prevResults.forEach(function(prevResult) {
        totalYear.push(prevResult.Year);
        totalPercentageHorror.push(prevResult.PercentageHorror);
        totalPercentageComedy.push(prevResult.PercentageComedy);
        totalPercentageAction.push(prevResult.PercentageAction);
        totalPercentageAdventure.push(prevResult.PercentageAdventure);
        totalPercentageFantasy.push(prevResult.PercentageFantasy);
        totalPercentageRomance.push(prevResult.PercentageRomance);
        totalContainsViolence.push(prevResult.ContainsViolence);
        totalContainsSexualScenes.push(prevResult.ContainsSexualScenes);
        totalContainsDrugUse.push(prevResult.ContainsDrugUse);
        totalContainsFlashingImages.push(prevResult.ContainsFlashingImages);
    });
    
    var totalYearCount = 0;
    var totalPercentageHorrorCount = 0.0;
    var totalPercentageComedyCount = 0.0;
    var totalPercentageActionCount = 0.0;
    var totalPercentageAdventureCount = 0.0;
    var totalPercentageFantasyCount = 0.0;
    var totalPercentageRomanceCount = 0.0;
    var totalContainsViolenceTrueCount = 0;
    var totalContainsSexualScenesTrueCount = 0;
    var totalContainsDrugUseTrueCount = 0;
    var totalContainsFlashingImagesTrueCount = 0;    
    
    for(var i = 0; i < prevResults.length; i++) {
        //This is not adding ints. Just concantinating strings
        totalYearCount += totalYear[i];
        totalPercentageHorrorCount += totalPercentageHorror[i];
        totalPercentageComedyCount += totalPercentageComedy[i];
        totalPercentageActionCount += totalPercentageAction[i];
        totalPercentageAdventureCount += totalPercentageAdventure[i];
        totalPercentageFantasyCount += totalPercentageFantasy[i];
        totalPercentageRomanceCount += totalPercentageRomance[i];
        if(totalContainsViolence[i] == true) {
            totalContainsViolenceTrueCount++;
        }
        if(totalContainsSexualScenes[i] == true) {
            totalContainsSexualScenesTrueCount++;
        }
        if(totalContainsDrugUse[i] == true) {
            totalContainsDrugUseTrueCount++;
        }
        if(totalContainsFlashingImages[i] == true) {
            totalContainsFlashingImagesTrueCount++;
        }
    }
    
    var averageYear = totalYearCount / totalYear.length;
    var averagePercentageHorror = totalPercentageHorrorCount / totalPercentageHorror.length;
    var averagePercentageComedy = totalPercentageComedyCount / totalPercentageComedy.length;    
    var averagePercentageAction = totalPercentageActionCount / totalPercentageAction.length;    
    var averagePercentageAdventure = totalPercentageAdventureCount / totalPercentageAdventure.length;    
    var averagePercentageFantasy = totalPercentageFantasyCount / totalPercentageFantasy.length;    
    var averagePercentageRomance = totalPercentageRomanceCount / totalPercentageRomance.length;    
    var averageContainsViolence = false;
    if(totalContainsViolenceTrueCount > (totalContainsViolence.length/2)) {
        averageContainsViolence = true;
    }
    var averageContainsSexualScenes = false;
    if(totalContainsSexualScenesTrueCount > (totalContainsSexualScenes.length/2)) {
        averageContainsSexualScenes = true;
    }
    var averageContainsDrugUse = false;
    if(totalContainsDrugUseTrueCount > (totalContainsDrugUse.length/2)) {
        averageContainsDrugUse = true;
    }
    var averageContainsFlashingImages = false;
    if(totalContainsFlashingImagesTrueCount > (totalContainsFlashingImages.length/2)) {
        averageContainsFlashingImages = true;
    }
    
    var averagePreviousResult = {};
    averagePreviousResult.Year = averageYear;
    averagePreviousResult.PercentageHorror = averagePercentageHorror;
    averagePreviousResult.PercentageComedy = averagePercentageComedy;
    averagePreviousResult.PercentageAction = averagePercentageAction;
    averagePreviousResult.PercentageAdventure = averagePercentageAdventure;
    averagePreviousResult.PercentageFantasy = averagePercentageFantasy;
    averagePreviousResult.PercentageRomance = averagePercentageRomance;
    averagePreviousResult.ContainsViolence = averageContainsViolence;
    averagePreviousResult.ContainsSexualScenes = averageContainsSexualScenes;
    averagePreviousResult.ContainsDrugUse = averageContainsDrugUse;
    averagePreviousResult.ContainsFlashingImages = averageContainsFlashingImages;
    
    return averagePreviousResult;
}

function WatchRandomMovie() {
    //Should I also display average vector of currently watched movies in the UI? 
    //This means that when I return a reccommendation I can see how close it was?
    //Should it actually travel through the edge node instead of talking directly to the DC so that a reccommendation can be produced/updated?
    var client = http.createClient(3004, edgeNode);
    
    var jsonObject = {};
    jsonObject.UserID = userID;
    var jsonData = JSON.stringify(jsonObject);
    
    var request = client.request('POST', '/WatchRandomMovie', {
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
            var receivedJSONData = JSON.parse(responseData);
            var prevResultsString = localStorage.getItem(localStorageDataName + userID);
            var result = "";
            
            if(prevResultsString == 'undefined' || prevResultsString == null || prevResultsString == "null") {
                result = responseData;
            } else {
                var localResultsJSON = JSON.parse(prevResultsString);
                localResultsJSON.Results.push(receivedJSONData.Results[0]);
                result = JSON.stringify(localResultsJSON);
            }
            
            localStorage.setItem(localStorageDataName + userID, result);
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