const http = require('http');

var userID = "";
var edgeNode = "EdgePi01";
var dataCentre = "connor-pc";
var previousResults = {};
var recommendedMovie = null;

//called when the user clicks login
function Login() {
    previousResults = null;
    
    userID = document.getElementById('UserID').value;

    //Make the logged in user GUI visable
    if(userID != "") {
        event.srcElement.parentElement.parentElement.className = "hidden";
        
        document.getElementById('GUIForLoggedInUsers').className = "";
        
        GetPreviousMovies();
    } else {
        document.getElementById('recommendations').innerHTML = "Please enter a username."
    }
}

//makes a call directly to the data center to obtain the previous movies watched for the logged in user
function GetPreviousMovies() {
    document.getElementById('recommendations').innerHTML = GetProcessingString();
    document.getElementById('prevResults').innerHTML = GetProcessingString();
    
    //post to the data centre with your UserID
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

        //receive response data
        response.on('data', function (chunk) {
            responseData += chunk;
        });

        //store the previous movies watched
        response.on('end', function () {
            if(responseData != "") {
                var jsonData = JSON.parse(responseData);

                if(jsonData == null || jsonData == 'undefined' || jsonData.Results == 'undefined' || jsonData.Results == null || jsonData.Results == "null" || jsonData.Results.length == 0) {
                    previousResults = null;
                } else {
                    previousResults = jsonData;
                }
            }
            
            //if we got the previous movies we want to update the UI with a recommendation for these movies
            GetRecommendation()
        });
    });
}

//Get a recommendation from the edge nodes
function GetRecommendation() {
    if(previousResults == 'undefined' || previousResults == null || previousResults == "null" || previousResults.Results.length == 0) {
        //If the user has not watched any movies yet
        document.getElementById('recommendations').innerHTML = "Recommendation: <br>Not enough data to get a recommendation";
        document.getElementById('prevResults').innerHTML = "Your Average of 0 Results: <br>Please watch a movie to get an evaluation";
        return;
    }
    
    var jsonObject = {};
    
    //Post to the edge node and execute code as part of a callback to update the UI
    PostToEdgeNode('/GetRecommendations', jsonObject, function(responseData) {
        console.log("Received recommendation data back: " + responseData);
        
        var receivedJSONData = JSON.parse(responseData);
        
        recommendedMovie = receivedJSONData.Recommendation;
        
        console.log(recommendedMovie);
        
        if(recommendedMovie != null && typeof(recommendedMovie) != 'undefined') {
            document.getElementById('recommendations').innerHTML = "Recommendation: <br>" + FormatMovieString(recommendedMovie);
        } else {
            document.getElementById('recommendations').innerHTML = "Recommendation: <br>Could not get a recommendation";
        }

        //Average the users previously stored results
        AveragePreviousResults();
    });
}

//make a call to the edge node to watch a random movie and receive a recommendation
function WatchRandomMovie() {
    document.getElementById('movieWatched').innerHTML = GetProcessingString();
    document.getElementById('recommendations').innerHTML = GetProcessingString();
    document.getElementById('prevResults').innerHTML = GetProcessingString();
    
    var jsonObject = {};
    
    //make the call and publish the results to the UI
    PostToEdgeNode('/WatchRandomMovie', jsonObject, function(responseData) {
        StoreResultsAndUpdateUI(responseData);
    });
}

//watch the movie that is currently being shown in the UI
function WatchRecommendedMovie() {
    if(recommendedMovie == null || typeof(recommendedMovie) == 'undefined') {
        document.getElementById('recommendations').innerHTML = "Recommendation: <br>Please watch a movie to get a recommendation";
        return;
    }
    
    document.getElementById('movieWatched').innerHTML = GetProcessingString();
    document.getElementById('recommendations').innerHTML = GetProcessingString();
    document.getElementById('prevResults').innerHTML = GetProcessingString();

    //store the recommended movie as part of the posted data
    var jsonObject = {};
    jsonObject.RequestedMovieID = recommendedMovie.ID;
    
    //make the call and publish the results to the UI
    PostToEdgeNode('/WatchMovie', jsonObject, function(responseData) {
        StoreResultsAndUpdateUI(responseData);
    });
}

//post the data passed into the method to the URL passed in to the method and execute the callback with the response data
function PostToEdgeNode(url, jsonObject, callback) {
    jsonObject.UserID = userID;
    jsonObject.AverageResults = AveragePreviousResults();
        
    var client = http.createClient(3004, edgeNode);
    
    var jsonData = JSON.stringify(jsonObject);
    
    console.log("Posting to  " + url + ": " + jsonData);
    
    var request = client.request('POST', url, {
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

    //handle the response
    request.on('response', function (response) {
        var responseData = "";
        response.setEncoding('utf8');

        //receive the response data
        response.on('data', function (chunk) {
            responseData += chunk;
        });

        //execute the callback with the response data
        response.on('end', function () {
            callback(responseData);
        });
    });
}

//parse the response data and update the UI with the information it contains
function StoreResultsAndUpdateUI(responseData) {
    var receivedJSONData = JSON.parse(responseData);

    //add the watched movie to the current results
    //this will later be used to display the new average
    if(previousResults == 'undefined' || previousResults == null || previousResults == "null") {
        previousResults = receivedJSONData;
    } else {
        previousResults.Results.push(receivedJSONData.Results[0]);
    }

    document.getElementById('movieWatched').innerHTML = "Movie Watched: <br>" + FormatMovieString(receivedJSONData.Results[0]);
    
    recommendedMovie = receivedJSONData.Recommendation;
    
    if(recommendedMovie != null && typeof(recommendedMovie) != 'undefined') {
        document.getElementById('recommendations').innerHTML = "Recommendation: <br>" + FormatMovieString(recommendedMovie);
    } else {
        document.getElementById('recommendations').innerHTML = "Recommendation: <br>Could not get a recommendation";
    }
        
    AveragePreviousResults();
}

//take the recorded movies and average them, then display this in the UI
function AveragePreviousResults() 
{    
    if(previousResults == 'undefined' || previousResults == null || previousResults == "null" || previousResults.Results.length == 0) {
        document.getElementById('prevResults').innerHTML = "Your Average of 0 Results: <br>Please watch a movie to get an evaluation";
        return null;
    }
    
    var prevResults = previousResults.Results;
    
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
    document.getElementById('prevResults').innerHTML = "Your Average of " + totalYear.length + " Results: <br>" + FormatMovieString(averagePreviousResult);
    return averagePreviousResult;
}

//Returned a nicely formatted string containing the movie data
function FormatMovieString(movie) {
        return "Title: " + movie.Title + "<br>" +
        "Year: " + movie.Year + "<br>" + 
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

//returns a string to indicate processing
function GetProcessingString() {
        return "Title: Processing...<br>" +
        "Year: Processing...<br>" + 
        "Horror: Processing...<br>" +
        "Comedy: Processing...<br>" +
        "Action: Processing...<br>" +
        "Adventure: Processing...<br>" +
        "Fantasy: Processing...<br>" +
        "Romance: Processing...<br>" +
        "Contains Violence: Processing...<br>" +
        "Contains Sexual Scenes: Processing...<br>" +
        "Contains Drug Use: Processing...<br>" +
        "Contains Flashing Images: Processing...";
}