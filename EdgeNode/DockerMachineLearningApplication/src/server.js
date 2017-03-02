var util = require('util');
var os = require('os');
var http = require('http');
var request = require('request');
var httpProxy = require('http-proxy');
var fs = require('fs');

var externalPort = process.env.port || 3005;
var internalPort = 3502;
var machineLearningFilePath = "../MLResults/prevResults.txt";

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

    PrintComputerInformation();

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

    var reqBody = "";

    req.on('data', function(chunk) {
        reqBody += chunk;
    });

    req.on('end', function() {
        console.log("Received " + req.method + " request.");

        if(req.method == 'POST') {
            PreProcessRequest(requestedUrl, res, reqBody);
        } else {
            MakeGetRequest(requestedUrl, res);
        }
    });
});

//I don't think I should do this in production because the code continues
createdServer.on('error', function(err) {
    console.error("AN ERROR OCCURRED WITH THE SERVER: " + err.stack);
});

createdServer.listen(internalPort);
 
console.log("Started Node.js server");

function PreProcessRequest(requestedUrl, res, reqBody) 
{
    console.log("Making POST request to " + requestedUrl); 

    var jsonEvaluation = JSON.parse(reqBody);

    var answer = jsonEvaluation.Choice1 + "," + jsonEvaluation.Choice2 + "," + jsonEvaluation.Choice3 + "," + jsonEvaluation.Choice4 + '\r\n';

    var preProcessedData;

    //Here could be an example of when the data centre does not need to be queried?
    //We can handle all requests here if we have enough training data
    //However do we need to query it if we don't have enough training data on the edge node? Or just make it that we always do?

    var queryCount = jsonQueryCount(jsonEvaluation);
    if(queryCount == 1) {
        preProcessedData = PreProcessData(jsonEvaluation);
    } else if(queryCount > 1) {
        preProcessedData = "Too many queries";
    } else {
        //got to make this work for concurrent requests
        fs.appendFileSync(machineLearningFilePath, answer);
        preProcessedData = "Saved results to disk";
    }    

    jsonEvaluation.PreProcessedData = preProcessedData;
    
    var preProcessedString = JSON.stringify(jsonEvaluation);

    var requestOptions = {
        url: requestedUrl,
        method: 'POST',
        encoding: null,
        form: preProcessedString
    };

    request.post(requestOptions, function(error,response,body) {
        if(error) {
            console.error("There was an error requesting content from Data Center: " + error);
        } else {
            console.log("Received info from Data Center");
            res.end(body);
        }
    });
};

function jsonQueryCount(json) 
{
    var queryCount = 0;
    var queryText = 'Query';
    
    if(json.Choice1 == queryText) 
    {
        queryCount++;
    }
    
    if(json.Choice2 == queryText) 
    {
        queryCount++;
    }
    
    if(json.Choice3 == queryText) 
    {
        queryCount++;
    }
    
    if(json.Choice4 == queryText) 
    {
        queryCount++;
    }
    
    return queryCount;
}

function PreProcessData(jsonEvaluation) 
{
    console.log("Pre processing data");

    var allText = fs.readFileSync(machineLearningFilePath).toString();
    
    if(typeof(allText) == "undefined") 
    {
        console.log("allText: " + allText);
        return "allText is undefined";
    }
 
    var allTextLines = allText.split(/\r\n|\n/);
   
    if(typeof(allTextLines) == "undefined") 
    {
        console.log("allTextLines: " + allTextLines);
        return "allTextLines is undefined";
    }  
   
    console.log("Read: " + allTextLines.length + " lines");
    
    //var result = SplitLinesIntoArray(allTextLines, jsonString);
    var result = EvaluateProbability(allTextLines, jsonEvaluation);

    return result;
}

function EvaluateProbability(allTextLines, jsonEvaluation) 
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
        console.log("Evaluating textLine: " + textLine);

        if(textLine == predictedChoices) 
        {
            totalCount++;
        }
    });

    return totalCount;
}

function MakeGetRequest(requestedUrl, res) 
{
    console.log("Making GET request for: " + requestedUrl);

     var requestOptions = {
        url: requestedUrl,
        method: 'GET',
        encoding: null
    };

    request(requestOptions, function(error,response,body) {
        if(error) {
            console.error("There was an error requesting content from Data Center: " + error);
        } else {
            console.log("Received info from Data Center: " + body);
            res.end(body);
        }
    });   
};

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

function PrintComputerInformation() 
{
    var ifaces = os.networkInterfaces();
    Object.keys(ifaces).forEach(function (ifname) {
      var alias = 0;
    
      ifaces[ifname].forEach(function (iface) {
        if ('IPv4' !== iface.family || iface.internal !== false) {
          // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
          return;
        }
    
        if (alias >= 1) {
          // this single interface has multiple ipv4 addresses
          console.log(ifname + ':' + alias, iface.address);
        } else {
          // this interface has only one ipv4 adress
          console.log(ifname, iface.address);
        }
        ++alias;
      });
    });
}
