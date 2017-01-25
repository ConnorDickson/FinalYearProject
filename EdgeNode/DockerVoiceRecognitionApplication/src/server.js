var util = require('util');
var os = require('os');
var http = require('http');
var fs = require('fs');
var spawn = require('child_process').spawn;
var qs = require('querystring');

console.log("Starting...");

var externalPort = process.env.port || 3003;

var createdServer = http.createServer(function (req, res) 
{
    console.log('Received Request\n');

    //Set error handlers
    req.on('error', function(err) 
    {
        console.error("REQUEST ERROR:\n" + err.stack);
    });

    res.on('error', function(err)
    {
        console.error("RESPONSE ERROR:\n" + err.stack);
    });

    console.log(req.headers);

    if(req.method == 'POST') {
        var body = [];
 
        req.on('data', function(chunk) {
            body.push(chunk);
        });
    
        req.on('end', function() {
            //console.log('body:\n' + body);
            //var postData = qs.parse(body);
            var postData = Buffer.concat(body);
            console.log(postData.length);
            fs.writeFileSync("../SavedFile/output.wav", postData);
            
            console.log("The write happened successfully");
      
            var childProcessResponse = "";
       
            var command = spawn('sh', ['../SH/ProcessVoiceFile.sh']);
        
            command.stdout.on('data', function(data) {
                childProcessResponse += data;
        	console.log(data);
            });
        
            command.stderr.on('data', function(data) {
        	console.log(data);
                //childProcessResponse += data;
            });
        
            command.on('exit', function(code) {
                //res.end(childProcessResponse);
        	    res.write(childProcessResponse);
        	    res.end();
            });
        });
    }

    

    
//        fs.writeFile("../SavedFile/output.wav", body, 'binary', function(err) {
//            if(err) {
//                console.log("An error occurred with the write operation");
//            } else {
//                console.log("The write happened successfully");
//    
//                var childProcessResponse = "";
//              
//               // fs.readFile("../SavedFile/text.txt", function(err, data) {
//               //     if(err) {
//               //         childProcessResponse += "Error: " + err;
//               //     } else {
//               //         childProcessResponse += data;
//               //     }
//               // });
//            
//                var command = spawn('sh', ['../SH/ProcessVoiceFile.sh']);
//            
//                command.stdout.on('data', function(data) {
//                    childProcessResponse += data;
//            	console.log(data);
//                });
//            
//                command.stderr.on('data', function(data) {
//            	console.log(data);
//                    childProcessResponse += data;
//                });
//            
//                command.on('exit', function(code) {
//                    //res.end(childProcessResponse);
//            	res.write(childProcessResponse);
//            	res.end();
//                });
//            }
//        }); 
});

//I don't think I should do this in production because the code continues
createdServer.on('error',function(err)
{
    console.error("AN ERROR OCCURRED WITH THE SERVER: " + err.stack);
});

createdServer.listen(externalPort);

console.log("Started Node.js server");
