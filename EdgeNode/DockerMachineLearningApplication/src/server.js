var util = require('util');
var os = require('os');
var http = require('http');
var request = require('request');
var httpProxy = require('http-proxy');
var fs = require('fs');

var externalPort = process.env.port || 3005;
var internalPort = 3502;
var movieDataFilePath = "../MLResults/MovieVectors.txt";
var dataCentreMoviesURL = "http://connor-pc:3000/api/MachineLearning/GetMovies";

console.log("Starting...");

var proxyServer = httpProxy.createProxyServer({
    target: 'http://localhost:' + internalPort,
    toProxy: true
});

proxyServer.on('error', function(err) {
    console.error("ERROR WITH PROXY SERVER:\n" + err.stack);
});

proxyServer.listen(externalPort);

var createdServer = http.createServer(function (req, res) {
    //Set error handlers
    req.on('error', function(err) {
        console.error("REQUEST ERROR:\n" + err.stack);
    });

    res.on('error', function(err) {
        console.error("RESPONSE ERROR:\n" + err.stack);
    });

    var requestedUrl = req.url;

    //console.log("Requested URL: " + requestedUrl);
 
    if(typeof requestedUrl == 'undefined') 
    {
        console.error("Received undefined request");
        res.end("Cannot process undefined request");
        return;
    } 
    else 
    {
        if(requestedUrl.length > 1 && requestedUrl.substring(0,1) == '/') 
        {
            requestedUrl = requestedUrl.substring(1);
        }
    }

    var reqBody = "";

    req.on('data', function(chunk) {
        reqBody += chunk;
    });

    req.on('end', function() {
        var jsonObject = JSON.parse(reqBody);

        if(requestedUrl != 'GetRecommendations') {
            ProcessRequest(res, jsonObject);
        } else {
            ProcessRecommendationRequest(res, jsonObject);
        }
    });
});

//I don't think I should do this in production because the code continues
createdServer.on('error', function(err) {
    console.error("AN ERROR OCCURRED WITH THE SERVER: " + err.stack);
});

createdServer.listen(internalPort);
 
console.log("Started Node.js server");

function ProcessRequest(res, jsonEvaluation) 
{
    //With this one we need to send the data to the server too
    var predictionData = ProduceRecommendation(jsonEvaluation);

    jsonEvaluation.Recommendation = predictionData;

    var preProcessedString = JSON.stringify(jsonEvaluation);

    res.end(preProcessedString);
};

function ProcessRecommendationRequest(res, jsonObject)
{
    //This will have to take into account the username

    jsonObject.Recommendation = ProduceRecommendation(jsonObject);
 
    var preProcessedString = JSON.stringify(jsonObject);

    res.end(preProcessedString);
};

function ProduceRecommendation(jsonEvaluation) 
{
    fs.readFile(movieDataFilePath, (localErr, movieData) => {
        if(localErr) {
            throw localErr;
        }
        
        var allMovieText = movieData.toString();
     
        if(typeof(allMovieText) == "undefined") 
        {
            return "allLocalText is undefined";
        }
     
        var allMovieTextLines = allMovieText.split(/\r\n|\n/);
       
        if(typeof(allLocalTextLines) == "undefined") 
        {
            return "allLocalTextLines is undefined";
        }

        //Go through all lines and see what the user requested
        console.log("Working out a recommendation for: " + jsonEvaluation.UserID);

        var userLines = jsonEvaluation.UserVector;
      

        return ; 
    });
}

function SendUserViewToDataCentre(jsonObject) 
{
    var requestOptions = {
        url: dataCentreURL,
        method: 'POST',
        encoding: null,
        form: jsonString
    };

    request.post(requestOptions, function(error,response,body) {
        if(error) {
            console.error("There was an error requesting content from Data Center: " + error);
        } else {
            //Receive JSON body and write it to remote results
            var returnedJson = JSON.parse(body);
            
            var completedString = "";

            returnedJson.results.forEach(function(result) {
                completedString += result[0] + " " + result[1] + ";\r\n";
            });

            fs.writeFile(machineLearningRemoteResultsFilePath, completedString, (err) => {
                if(err) {
                    console.log("Error with writing to remote file: " + err);
                } 
            });
        }
    });   
}

function GetMoviesFromDataCentre() 
{
    request.get(dataCentreMoviesURL, function(error,response,body) {
        if(error) {
            console.error("There was an error requesting content from Data Center: " + error);
        } else {
           //Receive JSON body and write it to remote results
            var returnedJson = JSON.parse(body);

            var completedString = "";

            returnedJson.results.forEach(function(result) {
                completedString += result.MovieTitle + result.Year + result.PercentageHorror + result.ContainsViolence+ ";\r\n";
            });

            fs.writeFile(movieDataFilePath, completedString, (err) => {
                if(err) {
                    console.log("Error with writing to remote file: " + err);
                } 
            });
        }
    });   
}

GetMoviesFromDataCentre()
