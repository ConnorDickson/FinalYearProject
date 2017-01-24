var util = require('util');
var os = require('os');
var http = require('http');
var fs = require('fs');
var spawn = require('child_process').spawn;

console.log("Starting...");

var externalPort = process.env.port || 3003;

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

    var body = "";

    req.on('data', function(chunk) {
        body += chunk;
    });

    req.on('end', function() {
        console.log('body: ' + body);
    });

    fs.writeFile("../SavedFile/text.txt", "Test file writing to disk", function(err) {
        if(err) {
            console.log("An error occurred with the write operation");
        } else {
            console.log("The write happened successfully");
        }
    });
  
    var childProcessResponse = "";
  
    fs.readFile("../SavedFile/text.txt", function(err, data) {
        if(err) {
            childProcessResponse += "Error: " + err;
        } else {
            childProcessResponse += data;
        }
    });

    var command = spawn('sh', ['../SH/ProcessVoiceFile.sh']);

    command.stdout.on('data', function(data) {
        childProcessResponse += data;
    });

    command.stderr.on('data', function(data) {
        //childProcessResponse += data;
    });

    command.on('exit', function(code) {
        res.end(childProcessResponse);
    });
});

//I don't think I should do this in production because the code continues
createdServer.on('error',function(err)
{
    console.error("AN ERROR OCCURRED WITH THE SERVER: " + err.stack);
});

createdServer.listen(externalPort);

console.log("Started Node.js server");
