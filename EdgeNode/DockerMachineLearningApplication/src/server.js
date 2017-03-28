var util = require('util');
var os = require('os');
var http = require('http');
var request = require('request');
var httpProxy = require('http-proxy');
var fs = require('fs');
var Node = require('./Node.js').Node;
var NodeList = require('./NodeList.js').NodeList;

var externalPort = process.env.port || 3005;
var internalPort = 3502;
var movieDataFilePath = "../MLResults/MovieVectors.txt";
var dataCentreGetMoviesURL = "http://connor-pc:3000/api/MachineLearning/GetMovies";
var dataCentreWatchRandomMovieURL = "http://connor-pc:3000/api/MachineLearning/WatchRandomMovie";
var dataCentreWatchMovieURL = "http://connor-pc:3000/api/MachineLearning/WatchMovie";

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

        if(requestedUrl == 'GetRecommendations') { 
            console.log("Recommendation Request");
            ProduceRecommendationAndEndRequest(jsonObject, res);
        } else if(requestedUrl == 'WatchRandomMovie') {
            SendRequestToDataCentreAndProduceRecommendation(res, jsonObject, dataCentreWatchRandomMovieURL);
        } else if (requestedUrl == 'WatchMovie') {
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

function SendRequestToDataCentreAndProduceRecommendation(res, jsonObject, dataCentreURL) {
    var jsonData = JSON.stringify(jsonObject);

    var requestOptions = {
        url: dataCentreURL,
        method: 'POST',
        form: jsonData
    };

    request.post(requestOptions, function(error, response, body) {
        console.log("Watch Movie Status Code: " + response.statusCode);
        if(error) {
            console.error("There was an error requesting content from Data Center: " + error);
        } else {
            var jsonObject = JSON.parse(body); 
            ProduceRecommendationAndEndRequest(jsonObject, res);
        }
    });   
}

function ProduceRecommendationAndEndRequest(jsonObject, res) 
{
    console.log("Handling recommendation");

    fs.readFile(movieDataFilePath, (localErr, movieData) => {
        if(localErr) {
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
        
        //---------------------------------------------------
        // Need to produce an actual prediction
        
        console.log("Average Results: " + jsonObject.AverageResults);

        if(jsonObject.AverageResults == null || typeof(jsonObject.AverageResults) == 'undefined' || jsonObject.AverageResults == "null") {
            console.log("Average Results was undefined");
        } else {
            var movieJSONObject = KNearestNeighbour(allMovieTextLines, jsonObject.AverageResults);
            jsonObject.Recommendation = movieJSONObject;
        }
        
        var jsonString = JSON.stringify(jsonObject);
        res.end(jsonString);
    });
}

function KNearestNeighbour(allMovieTextLines, movie) {
    console.log("Average Year for NN evaluation: " + movie.Year);
    var randomNumber = Math.floor(Math.random() * 10000);
    var movieTextLine = allMovieTextLines[randomNumber];
    var movieJSONObject = JSON.parse(movieTextLine);

    return movieJSONObject;
}

function SendUserViewToDataCentre(jsonObject) 
{
    var requestOptions = {
        url: dataCentreSendViewDataURL,
        method: 'POST',
        form: jsonString
    };

    request.post(requestOptions, function(error, response, body) {
        if(error) {
            console.error("There was an error requesting content from Data Center: " + error);
        } else {
            //Receive JSON body and write it to remote results
            var returnedJson = JSON.parse(body);
            
            var completedString = "";

            returnedJson.Results.forEach(function(result) {
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
    request.get(dataCentreGetMoviesURL, function(error,response,body) {
        if(error) {
            console.error("There was an error requesting content from Data Center: " + error);
        } else {
           //Receive JSON body and write it to remote results
            var returnedJson = JSON.parse(body);

            var completedString = "";

            returnedJson.Results.forEach(function(result) {
                //completedString += result.Title + result.Year + result.PercentageHorror + result.ContainsViolence+ ";\r\n";
                completedString += JSON.stringify(result) + "\r\n";
            });

            fs.writeFile(movieDataFilePath, completedString, (err) => {
                if(err) {
                    console.log("Error with writing to remote file: " + err);
                } else {
                    console.log("Finished writing subset of movies to disk");
                }
            });
        }
    });   
}

GetMoviesFromDataCentre();



















//https://www.burakkanber.com/blog/machine-learning-in-js-k-nearest-neighbor-part-1/
//http://jsfiddle.net/bkanber/hevFK/?utm_source=website&utm_medium=embed&utm_campaign=hevFK
//This code is based on the website above, it had to be adapted for my system
var nodes;

var data = [
    {rooms: 1, area: 350, type: 'apartment'},
    {rooms: 2, area: 300, type: 'apartment'},
    {rooms: 3, area: 300, type: 'apartment'},
    {rooms: 4, area: 250, type: 'apartment'},
    {rooms: 4, area: 500, type: 'apartment'},
    {rooms: 4, area: 400, type: 'apartment'},
    {rooms: 5, area: 450, type: 'apartment'},

    {rooms: 7,  area: 850,  type: 'house'},
    {rooms: 7,  area: 900,  type: 'house'},
    {rooms: 7,  area: 1200, type: 'house'},
    {rooms: 8,  area: 1500, type: 'house'},
    {rooms: 9,  area: 1300, type: 'house'},
    {rooms: 8,  area: 1240, type: 'house'},
    {rooms: 10, area: 1700, type: 'house'},
    {rooms: 9,  area: 1000, type: 'house'},

    {rooms: 1, area: 800,  type: 'flat'},
    {rooms: 3, area: 900,  type: 'flat'},
    {rooms: 2, area: 700,  type: 'flat'},
    {rooms: 1, area: 900,  type: 'flat'},
    {rooms: 2, area: 1150, type: 'flat'},
    {rooms: 1, area: 1000, type: 'flat'},
    {rooms: 2, area: 1200, type: 'flat'},
    {rooms: 1, area: 1300, type: 'flat'},
];

var run = function() {
    //This 3 determins k nn
    nodes = new NodeList(3);
    
    for (var i in data)
    {
        nodes.add( new Node(data[i]) );
    }

    var random_rooms = Math.round( Math.random() * 10 );
    var random_area = Math.round( Math.random() * 2000 );
    nodes.add( new Node({rooms: random_rooms, area: random_area, type: false}) );
    nodes.determineUnknown();
    nodes.printKNN();
};

run();
