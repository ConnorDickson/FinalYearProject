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
}).listen(externalPort);

proxyServer.on('error',function(err) {
    console.error("ERROR WITH PROXY SERVER:\n" + err.stack);
});

var createdServer = http.createServer(function (req, res) 
{
    //Set error handlers
    req.on('error', function(err) 
    {
        console.error("REQUEST ERROR:\n" + err.stack);
    });

    res.on('error', function(err)
    {
        console.error("RESPONSE ERROR:\n" + err.stack);
    });

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
createdServer.on('error',function(err)
{
    console.error("AN ERROR OCCURRED WITH THE SERVER: " + err.stack);
});

createdServer.listen(internalPort);
 
console.log("Started Node.js server");

function PreProcessRequest(requestedUrl, res, reqBody) {
    console.log("Making POST request to " + requestedUrl); 

    console.log("Received: " + reqBody);

    var jsonRecieved = JSON.parse(reqBody);

    var answer = jsonRecieved.Choice1 + "," + jsonRecieved.Choice2 + "," + jsonRecieved.Choice3 + "," + jsonRecieved.Choice4 + '\r\n';

    var preProcessedData;

    if(answer.includes("Query")) {
        preProcessedData = PreProcessData(jsonRecieved);
    } else {
        //got to make this work for concurrent requests
        fs.appendFileSync(machineLearningFilePath, answer);
        preProcessedData = "Saved results to disk";
    }    

    jsonRecieved.PreProcessedData = preProcessedData;
    
    var preProcessedString = JSON.stringify(jsonRecieved);

    console.log("Updated JSON: " + preProcessedString);

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

function PreProcessData(jsonString) {
    console.log("Pre processing data");
    var allText = fs.readFileSync(machineLearningFilePath).toString();
    
    if(typeof(allText) == "undefined") {
        console.log("allText: " + allText);
        return "allText is undefined";
    }

    console.log("Read text: " + typeof(allText) + " " + allText);
    
    var allTextLines = allText.split(/\r\n|\n/);
   
    if(typeof(allTextLines) == "undefined") {
        console.log("allTextLines: " + allTextLines);
        return "allTextLines is undefined";
    }  
   
    console.log("Read: " + allTextLines.length + " lines");

    var choiceOnes = [];
    var choiceTwos = [];
    var choiceThrees = [];
    var choiceFours = [];

    for(i = 0; i < allTextLines.length; i++) {
        var lineEntry = allTextLines[i].split(',');

        if(lineEntry == '') {
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
    
    if(jsonString.Choice1 == "Query") {
        result += "The first choice will be evaluated\r\n";
    }

    if(jsonString.Choice2 == "Query") {
        result += "The second choice will be evaluated\r\n";
    } 

    if(jsonString.Choice3 == "Query") {
        result += "The third choice will be evaluated\r\n";
    }

    if(jsonString.Choice4 == "Query") {
        result += "The fourth choice will be evaluated\r\n";
    } 

    return result;
}

function MakeGetRequest(requestedUrl, res) {
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
