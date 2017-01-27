var util = require('util');
var os = require('os');
var http = require('http');
var fs = require('fs');
var spawn = require('child_process').spawn;

console.log("Starting...");

var externalPort = process.env.port || 3003;

var createdServer = http.createServer(function (req, res) 
{
    console.log('Received Request');

    //Set error handlers
    req.on('error', function(err) 
    {
        console.error("REQUEST ERROR:\n" + err.stack);
    });

    res.on('error', function(err)
    {
        console.error("RESPONSE ERROR:\n" + err.stack);
    });

    if(req.method == 'POST') {
        var body = [];
 
        req.on('data', function(chunk) {
            body.push(chunk);
        });
    
        req.on('end', function() {
            var postData = Buffer.concat(body);
            fs.writeFileSync("../SavedFile/output.wav", postData);
            
            console.log("Wrote file to disk successfully");
      
            var childProcessResponse = "";
       
            var command = spawn('sh', ['../SH/ProcessVoiceFile.sh']);
        
            command.stdout.on('data', function(data) {
                childProcessResponse += data;
        	//console.log(data);
            });
        
            command.stderr.on('data', function(data) {
                //console.log(data);
                //childProcessResponse += data;
            });
        
            command.on('exit', function(code) {
        	res.write(childProcessResponse);
                console.log("CPU Average in the last min: " + os.loadavg()[0]);
                ExecuteRemoteVoiceRecognition();
        	res.end();
            });
        });
    }
});

//I don't think I should do this in production because the code continues
createdServer.on('error',function(err)
{
    console.error("AN ERROR OCCURRED WITH THE SERVER: " + err.stack);
});

createdServer.listen(externalPort);

console.log("Started Node.js server");

function ExecuteRemoteVoiceRecognition() 
{
   var data = fs.readFileSync("../SavedFile/output.wav"),
       client,
       request;
    
    client = http.createClient(3000, "connor-pc");
    
    request = client.request('POST', '/api/voicerecognition', {
        'Host': 'connor-pc',
        'Port': 3000,
        'User-Agent': 'Node.JS',
        'Content-Type': 'application/octet-stream',
        'Content-Length': data.length
    });

    request.write(data);
    request.end();

    request.on('error', function (err) {
        console.log("ERROR with request: " + err);
    });

    request.on('response', function (response) {
        var responseData = "";
        response.setEncoding('utf8');

        response.on('data', function (chunk) {
            responseData += chunk;
        });

        response.on('end', function () {
            console.log(responseData);
        });
    });
}
