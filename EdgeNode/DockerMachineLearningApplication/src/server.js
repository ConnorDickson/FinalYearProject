//Import required modules
var util = require('util');
var cpu = require('./cpu');
var os = require('os');
var http = require('http');
var request = require('request');
var httpProxy = require('http-proxy');
var fs = require('fs');
var Node = require('./Node.js').Node;
var NodeList = require('./NodeList.js').NodeList;

//Global variables
var externalPort = process.env.port || 3005;
var internalPort = 3502;
var movieDataFilePath = "../MLResults/MovieVectors.txt";
var dataCentreGetMoviesURL = "http://connor-pc:3000/api/MachineLearning/GetMovies";
var dataCentreWatchRandomMovieURL = "http://connor-pc:3000/api/MachineLearning/WatchRandomMovie";
var dataCentreWatchMovieURL = "http://connor-pc:3000/api/MachineLearning/WatchMovie";
//var dataCentreGetMoviesURL = "http://connor-laptop:3000/api/MachineLearning/GetMovies";
//var dataCentreWatchRandomMovieURL = "http://connor-laptop:3000/api/MachineLearning/WatchRandomMovie";
//var dataCentreWatchMovieURL = "http://connor-laptop:3000/api/MachineLearning/WatchMovie";

console.log("Starting...");

//Send requests to internal server
var proxyServer = httpProxy.createProxyServer({
    target: 'http://localhost:' + internalPort,
    toProxy: true
});

//Handled errors with the proxy
proxyServer.on('error', function(err) {
    console.error("ERROR WITH PROXY SERVER:\n" + err.stack);
});

//Listen on the port that wil be made available with the deployment script
proxyServer.listen(externalPort);

//Create the internal server
var createdServer = http.createServer(function (req, res) {
    cpu.cpuStart();

    //Set error handlers
    req.on('error', function(err) {
        console.error("REQUEST ERROR:\n" + err.stack);
    });

    res.on('error', function(err) {
        console.error("RESPONSE ERROR:\n" + err.stack);
    });

    console.log("Method: req.method: " + req.method);

    //verify it's the type of request wanted
    if(req.method != 'POST') 
    {
        res.end("Please make a POST request");
        return;
    }

    var requestedUrl = req.url;

    console.log("Requested URL: " + requestedUrl);
 
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

    //Receive POST JSON data
    var reqBody = "";

    req.on('data', function(chunk) {
        reqBody += chunk;
    });

    req.on('end', function() {
        console.log("Req body: " + reqBody);

        //Validate the server receieved valid JSON
        try 
        {
            var jsonObject = JSON.parse(reqBody);
        }
        catch(err) 
        {
            console.log("Did not receive valid JSON: " + err.message);
            res.end(err.message);
            return;
        }

        //Route requests
        if(requestedUrl == 'GetRecommendations') 
        { 
            console.log("Recommendation Request");
            ProduceRecommendationAndEndRequest(jsonObject, res);
        } 
        else if(requestedUrl == 'WatchRandomMovie') 
        {
            SendRequestToDataCentreAndProduceRecommendation(res, jsonObject, dataCentreWatchRandomMovieURL);
        } 
        else if (requestedUrl == 'WatchMovie') 
        {
            console.log(reqBody);
            SendRequestToDataCentreAndProduceRecommendation(res, jsonObject, dataCentreWatchMovieURL);
        }
    });
});

//I don't think I should do this in production because the code continues
createdServer.on('error', function(err) {
    console.error("AN ERROR OCCURRED WITH THE SERVER: " + err.stack);
});

createdServer.listen(internalPort);
 
console.log("Started Node.js server");

//This is a generic method that makes a post request to the URL provided with the JSON data provided 
// and produces a recommendation based on the information returned
function SendRequestToDataCentreAndProduceRecommendation(res, jsonObject, dataCentreURL) 
{
    var jsonData = JSON.stringify(jsonObject);

    var requestOptions = {
        url: dataCentreURL,
        method: 'POST',
        form: jsonData
    };

    request.post(requestOptions, function(error, response, body) {
        console.log("Watch Movie Status Code: " + response.statusCode);
        if(error) 
        {
            console.error("There was an error requesting content from Data Center: " + error);
        } 
        else 
        {
            var jsonObject = JSON.parse(body); 
            ProduceRecommendationAndEndRequest(jsonObject, res);
        }
    });   
}

//Use K-NN to produce a recommendation and then send the result back as part of the message to the client
function ProduceRecommendationAndEndRequest(jsonObject, res) 
{
    console.log("Handling recommendation");
    
    //Read the file on disk async as to now block other operations
    fs.readFile(movieDataFilePath, (localErr, movieData) => {
        if(localErr) 
        {
            console.log("Local Error: " + localErr);
            throw localErr;
        }
        
        var allMovieText = movieData.toString();
     
        if(typeof(allMovieText) == "undefined") 
        {
            console.log("allMovieText is undefined");
            return "allMovieText is undefined";
        }
     
        var allMovieTextLines = allMovieText.split(/\r\n|\n/);
       
        if(typeof(allMovieTextLines) == "undefined") 
        {
            console.log("allMovieTextLines is undefined");
            return "allMovieTextLines is undefined";
        }

        //Go through all lines and see what the user requested
        console.log("Working out a recommendation for: " + jsonObject.UserID);

        //If the user has watched a movie during this request add it to 
        // the average results before producing a recommendation
        if(typeof(jsonObject.Results) != 'undefined' && jsonObject.Results.length > 0) 
        {
            AddNewMovieToAverageResults(jsonObject);
        }

        
        if(jsonObject.AverageResults == null || typeof(jsonObject.AverageResults) == 'undefined' || jsonObject.AverageResults == "null") 
        {
            console.log("Average Results was undefined");
        } 
        else 
        {
            //Perform KNN
            var nearestNeighbour = KNearestNeighbour(allMovieTextLines, jsonObject.AverageResults);
            jsonObject.Recommendation = nearestNeighbour;
        }
        
        var load = cpu.cpuEnd();
        jsonObject.EdgeCPUInfo = load.percent;

        //End the request with the required data
        var jsonString = JSON.stringify(jsonObject);
        res.end(jsonString);
    });
}

function AddNewMovieToAverageResults(jsonObject) 
{
    //If the user did not have a previous average (this is their first movie) the average is just the movie
    if(jsonObject.AverageResults == null || typeof(jsonObject.AverageResults) == 'undefined' || jsonObject.AverageResults == "null") 
    {
        if(typeof(jsonObject.Results) == 'undefined' || jsonObject.Results.length == 0) 
        {
            return;
        }

        jsonObject.AverageResults = jsonObject.Results[0];
    } 
    else 
    {
        //If the user has watched movies before add the new movie to the average
        jsonObject.AverageResults.Year = (jsonObject.AverageResults.Year + jsonObject.Results[0].Year)/2;
        jsonObject.AverageResults.PercentageHorror = (jsonObject.AverageResults.PercentageHorror + jsonObject.Results[0].PercentageHorror)/2;
        jsonObject.AverageResults.PercentageComedy = (jsonObject.AverageResults.PercentageComedy + jsonObject.Results[0].PercentageComedy)/2;
        jsonObject.AverageResults.PercentageAction = (jsonObject.AverageResults.PercentageAction + jsonObject.Results[0].PercentageAction)/2;
        jsonObject.AverageResults.PercentageAdventure = (jsonObject.AverageResults.PercentageAdventure + jsonObject.Results[0].PercentageAdventure)/2;
        jsonObject.AverageResults.PercentageFantasy = (jsonObject.AverageResults.PercentageFantasy + jsonObject.Results[0].PercentageFantasy)/2;
        jsonObject.AverageResults.PercentageRomance = (jsonObject.AverageResults.PercentageRomance + jsonObject.Results[0].PercentageRomance)/2;
    }
}

function KNearestNeighbour(allMovieTextLines, movie) 
{
    //This 3 determins k nn
    nodes = new NodeList(3);

    //add all the movies to the nodelist
    for (var i = 0; i < allMovieTextLines.length; i++)
    {
        var stringToParse = allMovieTextLines[i];
        if(stringToParse == "") 
        {
            continue;
        }
        var movieToAdd = JSON.parse(stringToParse);
        nodes.add( new Node(movieToAdd));
    }

    //Add the value that we want to find the closest movie to (the average of the movies)
    movie.evaluate = true;
    nodes.add(new Node(movie));
    //Perform KNN
    nodes.determineUnknown();
    //Return KNN
    var nearestNeighbours = nodes.getNN();

    //Ensure the recommendation isn't the movie they just watched
    if(nearestNeighbours[0].ID == movie.ID) 
    {
        return nearestNeighbours[1];
    } 
    else 
    {
        return nearestNeighbours[0];
    }
}

//Send the user's movie watched to the data centre to be stored
function SendUserViewToDataCentre(jsonObject) 
{
    var requestOptions = {
        url: dataCentreSendViewDataURL,
        method: 'POST',
        form: jsonString
    };

    request.post(requestOptions, function(error, response, body) {
        if(error) 
        {
            console.error("There was an error requesting content from Data Center: " + error);
        } 
        else 
        {
            //Receive JSON body and write it to remote results
            var returnedJson = JSON.parse(body);
            
            var completedString = "";

            returnedJson.Results.forEach(function(result) {
                completedString += result[0] + " " + result[1] + ";\r\n";
            });

            fs.writeFile(machineLearningRemoteResultsFilePath, completedString, (err) => {
                if(err) 
                {
                    console.log("Error with writing to remote file: " + err);
                } 
            });
        }
    });   
}

//Retreive K-Means clustered movies from the data centre upon deployment
function GetMoviesFromDataCentre() 
{
    request.get(dataCentreGetMoviesURL, function(error,response,body) {
        if(error) 
        {
            console.error("There was an error requesting content from Data Center: " + error);
        } 
        else 
        { 
            //Receive JSON body and write it to remote results
            var returnedJson = JSON.parse(body);

            var completedString = "";

            //Get collection of movies for writing to disk
            returnedJson.Results.forEach(function(result) {
                 completedString += JSON.stringify(result) + "\r\n";
            });

            //Write movies to disk
            fs.writeFile(movieDataFilePath, completedString, (err) => {
                if(err) 
                {
                    console.log("Error with writing to remote file: " + err);
                } 
                else 
                {
                    console.log("Finished writing subset of movies to disk");
                }
            });
        }
    });   
}

//Make call upon deployment
GetMoviesFromDataCentre();
