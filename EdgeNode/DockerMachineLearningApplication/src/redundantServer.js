var util = require('util');
var os = require('os');
var http = require('http');
var request = require('request');
var httpProxy = require('http-proxy');
var fs = require('fs');

var externalPort = process.env.port || 3005;
var internalPort = 3502;
var machineLearningLocalResultsFilePath = "../MLResults/LocalResults.txt";
var machineLearningRemoteResultsFilePath = "../MLResults/RemoteResults.txt";
var dataCentreURL = "http://connor-pc:3000/api/MachineLearning/ProcessInfo";

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
            //This get request should produce a reccommendation and not query the DC
            console.log("Request was for recommendations");
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
    var answer = jsonEvaluation.UserID + ":" + jsonEvaluation.Choice1 + "," + jsonEvaluation.Choice2 + "," + jsonEvaluation.Choice3 + "," + jsonEvaluation.Choice4 + "," + jsonEvaluation.Choice5 + "," + jsonEvaluation.Choice6 + '\r\n';

    var preProcessedData;

    fs.appendFileSync(machineLearningLocalResultsFilePath, answer);
    preProcessedData = "Saved results to disk";    

    var predictionData = ProduceRecommendation(jsonEvaluation);

    jsonEvaluation.PreProcessedData = preProcessedData;
    jsonEvaluation.Recommendation = "This will be the result from a prediction method";

    var preProcessedString = JSON.stringify(jsonEvaluation);

    res.end(preProcessedString);
};

function ProduceRecommendation(jsonEvaluation) 
{
    //The way that a prediction needs to be made is to remove items and see which produces the highest prob
    //See picture and notes from meeting with Cassio

    fs.readFile(machineLearningLocalResultsFilePath, (localErr, localData) => {
        if(localErr) {
            throw localErr;
        }
        
        var allLocalText = localData.toString();
     
        if(typeof(allLocalText) == "undefined") 
        {
            return "allLocalText is undefined";
        }
     
        var allLocalTextLines = allLocalText.split(/\r\n|\n/);
       
        if(typeof(allLocalTextLines) == "undefined") 
        {
            return "allLocalTextLines is undefined";
        }

        fs.readFile(machineLearningRemoteResultsFilePath, (remoteErr, remoteData) => {
    
            if(remoteErr) {
                throw remoteErr;
            }
       
            var allRemoteText = remoteData.toString();

            if(typeof(allRemoteText) == "undefined") {
                return "allRemoteText is undefined";
            }

            var allRemoteTextLines = allRemoteText.split(/\r\n|\n/);

            if(typeof(allRemoteTextLines) == "undefined") {
                return "allRemoteTextLines is undefined";
            }
        
            //Go through all lines and see what the user requested
            console.log("Working out a recommendation for: " + jsonEvaluation.UserID);

            var userLines = [];

            allLocalTextLines.forEach(function(localLine) {
                console.log("Processing local line: " + localLine);

                if(localLine.startsWith(jsonEvaluation.UserID)) {
                    console.log("Current line is for this user");
                    userLines.push(localLine);
                }
            });

            var highestProbabilityAnswer = "";
            var highestProbabilityResult = 0;

            //Loop through all the users lines and remove one element to see which has the highest probability of showing up
            userLines.forEach(function(userLine) {
                var tempHighestAnswer = "";
                var tempHighestResult = 0;


                //Strip into anon data
                //Split into array of T and F






                for(var i = 0; i < 6; i++) {
                    console.log("UserLine: " + userLine);
                    var anonUserLine = userLine.substring(userLine.lastIndexOf(":") + 1, userLine.length);
                    console.log("AnonUserLine: " + anonUserLine);
                    var posStringToTest = anonUserLine.substr(0, i) + "T" + anonUserLine.substr(i + 1);
                    var negStringToTest = anonUserLine.substr(0, i) + "F" + anonUserLine.substr(i + 1);
                    console.log("Pos UserLine: " + posStringToTest); 
                    console.log("Neg UserLine: " + negStringToTest);            

                    //What we need this method to do is to count the frequency the answer shows up.
                    var posResult = EvaluateProbability(allLocalTextLines, allRemoteTextLines, posStringToTest); 
                    var negResult = EvaluateProbability(allLocalTextLines, allRemoteTextLines, negStringToTest);

                    if(posResult > tempHighestResult) {
                        tempHighestResult = posResult;
                        tempHighestAnswer = posStringToTest;
                    }

                    if(negResult > tempHighestResult) {
                        tempHighestResult = negResult;
                        tempHighestAnswer = negStringToTest;
                    }
                }

                if(tempHighestResult > highestProbabilityResult) {
                    //However if the user has already got this evaluation in their list we can't produce it as a recommendation
                    highestProbabilityAnswer = tempHighestAnswer;
                }
            });

            return highestProbabilityAnswer;
        }); 
    });
}

function EvaluateProbability(allLocalTextLines, allRemoteTextLines, jsonEvaluation)
{
    //We will be given a user line and we have all local and remote lines. 
    //Local lines have usernames that we need to strip
    //Remote data is just a pre-compressed count but we need to workout the prob of 
    // the value we want compared to the total count
    var result = 0.0;

    result = 0.0;    

    return result;
}

function Old_EvaluateProbability(allTextLines, userLine, jsonEvaluation)
{
    //So if we are given YY?Y
    //Need to work out max(P(YYYY), P(YYNY))

    var result = '';
    var yResults = 0;
    var nResults = 0;

    if(jsonEvaluation.Choice1 == "Query") 
    {
        yResults = Probability(allTextLines, "True", jsonEvaluation.Choice2, jsonEvaluation.Choice3, jsonEvaluation.Choice4);
        nResults = Probability(allTextLines, "False", jsonEvaluation.Choice2, jsonEvaluation.Choice3, jsonEvaluation.Choice4);
        result += "The first choice will be evaluated\r\n";        
    } 
    else if(jsonEvaluation.Choice2 == "Query") 
    {
        yResults = Probability(allTextLines, jsonEvaluation.Choice1, "True", jsonEvaluation.Choice3, jsonEvaluation.Choice4);
        nResults = Probability(allTextLines, jsonEvaluation.Choice2, "False", jsonEvaluation.Choice3, jsonEvaluation.Choice4);
        result += "The second choice will be evaluated\r\n";
    } 
    else if(jsonEvaluation.Choice3 == "Query") 
    {
        yResults = Probability(allTextLines, jsonEvaluation.Choice1, jsonEvaluation.Choice2, "True", jsonEvaluation.Choice4);
        nResults = Probability(allTextLines, jsonEvaluation.Choice1, jsonEvaluation.Choice2, "False", jsonEvaluation.Choice4);
        result += "The third choice will be evaluated\r\n";    
    }
    else if(jsonEvaluation.Choice4 == "Query") 
    {
        yResults = Probability(allTextLines, jsonEvaluation.Choice1, jsonEvaluation.Choice2, jsonEvaluation.Choice3, "True");
        nResults = Probability(allTextLines, jsonEvaluation.Choice1, jsonEvaluation.Choice2, jsonEvaluation.Choice3, "False");
        result += "The fourth choice will be evaluated\r\n"; 
    }

    if(yResults > nResults) {
        result += "The result is True";
    } else {
        result += "The result is False";
    }

    return result;
}

function Probability(allTextLines, choice1, choice2, choice3, choice4) 
{
    var predictedChoices = choice1 + "," + choice2 + "," + choice3 + "," + choice4;

    console.log("Evaluating prob: " + predictedChoices);

    var totalCount = 0;
    
    allTextLines.forEach(function(textLine) 
    {
        if(textLine == "") {
            return;
        }

        console.log("Evaluating textLine: " + textLine);

        if(textLine == predictedChoices) 
        {
            totalCount++;
        }
    });

    return totalCount;
}

function ProcessRecommendationRequest(res, jsonObject)
{
    //This will have to take into account the username

    jsonObject.Recommendation = ProduceRecommendation(jsonObject);
 
    var preProcessedString = JSON.stringify(jsonObject);

    res.end(preProcessedString);
};

function PostResultsToDataCentreAndUpdateResults() 
{
    console.log("Making POST request to update DC with current results"); 
    fs.readFile(machineLearningLocalResultsFilePath, (err, data) => {
        if(err) 
        {
            throw err;
        }

        var allText = data.toString();
 
        if(typeof(allText) == "undefined") 
        {
            return "allText is undefined";
        }
     
        var allTextLines = allText.split(/\r\n|\n/);
       
        if(typeof(allTextLines) == "undefined") 
        {
            return "allTextLines is undefined";
        }  
       
        var compressedResults = [];

        allTextLines.forEach(function(textLine) {
            if(textLine == "") 
            {
                return;
            }
            
            //Strip out userdata
            var anonData = textLine.substring(textLine.lastIndexOf(":") + 1, textLine.length);

            var updatedRecord = false;

            for(var i = 0; i < compressedResults.length; i++) {
                if(compressedResults[i][0] == anonData) {
                    compressedResults[i][1]++;
                    updatedRecord = true;
                }
            }
            
            if(!updatedRecord) {
                //This must be a new result
                compressedResults.push([anonData, 1]);
            }
        });

        //Get machine hostname
        var hostname = os.hostname();

        //Create JSON obj with hostname and summary of all the results currently stored on disk
        var jsonObject = {};
        
        jsonObject.hostname = hostname;
        jsonObject.results = compressedResults;

        var jsonString = JSON.stringify(jsonObject);

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
                    } else {
                        setTimeout(PostResultsToDataCentreAndUpdateResults, 30000);
                    }
                });
            }
        });   
    });
}

//This will send updated data about what is stored on disk to the data centre every 30 seconds
PostResultsToDataCentreAndUpdateResults();

function SplitLinesIntoArray(allTextLines, jsonString) 
{
    var choiceOnes = [];
    var choiceTwos = [];
    var choiceThrees = [];
    var choiceFours = [];

    for(i = 0; i < allTextLines.length; i++) 
    {
        var lineEntry = allTextLines[i].split(',');

        if(lineEntry == '') 
        {
            continue;
        }

        console.log("Entries: " + lineEntry);

        choiceOnes.push(lineEntry[0]);
        choiceTwos.push(lineEntry[1]);
        choiceThrees.push(lineEntry[2]);
        choiceFours.push(lineEntry[3]);
    }

    console.log("Read all results: " + choiceOnes + " " + choiceTwos + " " + choiceThrees + " " + choiceFours);

    var result = '';
    
    if(jsonString.Choice1 == "Query") 
    {
        var resultOnesTwos = f(choiceOnes, choiceTwos);
        var resultOnesThrees = f(choiceOnes, choiceThrees);
        var resultOnesFours = f(choiceOnes, choiceFours);
        var resultTwosThrees = f(choiceTwos, choiceThrees);
        var resultTwosFours = f(choiceTwos, choiceFours);
        var resultThreesFours = f(choiceThrees, choiceFours);
        result += "The first choice will be evaluated\r\n";
    }

    if(jsonString.Choice2 == "Query") 
    {
        result += "The second choice will be evaluated\r\n";
    } 

    if(jsonString.Choice3 == "Query") 
    {
        result += "The third choice will be evaluated\r\n";
    }

    if(jsonString.Choice4 == "Query") 
    {
        result += "The fourth choice will be evaluated\r\n";
    } 

    return result;
}

function f(a,b) 
{
    //#(a,b)/totalNum     
}
