const http = require('http');

var userID = "";
var edgeNode = "edgepi01";
var dataCentre = "connor-pc";
var localStorageDataName = "prevResults";
var recommendedMovie = {};

//After a user logs in they need to get their own vectors (or do they make them up randomly as "Movies Watched"?)
//Use the Javascript save locally method
function Login() {    
    userID = document.getElementById('UserID').value;

    if(userID != "") {
        event.srcElement.parentElement.parentElement.className = "hidden";
        
        document.getElementById('GUIForLoggedInUsers').className = "";
        
        GetPreviousMovies();
    } else {
        document.getElementById('recommendations').innerHTML = "Please enter a username."
    }
}

function GetPreviousMovies() {
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
            
            GetRecommendation()
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
            var receivedJsonData = JSON.parse(responseData);
            recommendedMovie = receivedJsonData;
            document.getElementById('recommendations').innerHTML = "Recommendation: <br>" + FormatMovieString(receivedJsonData.Recommendation);
        });
    });
}

function WatchRandomMovie() {
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
            document.getElementById('MovieWatched').innerHTML = "Random Movie Watched: <br>" + FormatMovieString(receivedJSONData.Results[0]);
            AveragePreviousResults();
            GetRecommendation();
            localStorage.setItem(localStorageDataName + userID, result);
        });
    });
}

function WatchRecommendedMovie() {
    
    if(recommendedMovie == 'undefined' || recommendedMovie == null || recommendedMovie == "null") {
        document.getElementById('recommendations').innerHTML = "Please use a valid recommended movie";
        return;
    }
    
    var client = http.createClient(3004, edgeNode);
    
    var jsonObject = {};
    jsonObject.UserID = userID;
    jsonObject.RequestedMovieID = recommendedMovie.Recommendation.ID;
    var jsonData = JSON.stringify(jsonObject);
    
    var request = client.request('POST', '/WatchMovie', {
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
            document.getElementById('MovieWatched').innerHTML = "Movie Watched: <br>" + FormatMovieString(receivedJSONData.Results[0]);
            AveragePreviousResults();
            GetRecommendation();
            localStorage.setItem(localStorageDataName + userID, result);
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
    averagePreviousResult.Title = "";
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
    document.getElementById('prevResults').innerHTML = "Your Average Results: <br>" + FormatMovieString(averagePreviousResult);
    return averagePreviousResult;
}

function FormatMovieString(movie) {
        return "Title: " + movie.Title + "<br>" +
        "Horror: " + movie.PercentageHorror + "<br>" +
        "Comedy: " + movie.PercentageComedy + "<br>" +
        "Action: " + movie.PercentageAction + "<br>" +
        "Adventure: " + movie.PercentageAdventure + "<br>" +
        "Fantasy: " + movie.PercentageFantasy + "<br>" +
        "Romance: " + movie.PercentageRomance + "<br>" +
        "Contains Violence: " + movie.ContainsViolence + "<br>" +
        "Contains Sexual Scenes: " + movie.ContainsSexualScenes + "<br>" +
        "Contains Drug Use: " + movie.ContainsDrugUse + "<br>" +
        "Contains Flashing Images: " + movie.ContainsFlashingImages;
}