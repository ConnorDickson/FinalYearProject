let completeResults = null;
let previousResults = [];
let failedLoad = false;
let clearCacheRequest = false;

window.onload = function() {
    completeResults = null;
    previousResults = [];
    failedLoad = false;
    clearCacheRequest = false; 
};

//setting up event handlers for when the webview element makes a request.
//code executes when the page is first opened 
onload = () => 
{
    var sendTime = 1.0;
    var receiveTime = 1.0;
        
    const webview = document.getElementById("WebView");
    
    //start the timer for the request
    const loadstart = () => 
    {
        sendTime = (new Date()).getTime();
        console.log("Start Request: " + sendTime);
    }
    
    //end the timer (if the request didn't fail) and add this to the results array
    //total the results array and display total time to the user
    const loadstop = () => 
    {
        if(!failedLoad) 
        { 
            receiveTime = (new Date()).getTime();
            var resultTime = ((receiveTime - sendTime)/1000);
            
            if(!clearCacheRequest) {
                previousResults.push(resultTime);
            }
            
            console.log("End Request and pushed " + resultTime);

            if(previousResults.length > 0 && !clearCacheRequest)  {
                var totalTime = previousResults.reduce(add,0);
                var resultingString = "Results: ";
                
                if(completeResults != null) {
                    completeResults.forEach(function (completedResult) {
                            resultingString += completedResult.toFixed(2) + " ";
                    });   
                }                
                
                resultingString += totalTime.toFixed(2);
                document.getElementById("requestResult").innerHTML = resultingString;
            }
            
            //if ClearCache result don't print
            //We know the timings of this 
            if(clearCacheRequest) 
            {
                document.getElementById("requestResult").innerHTML = "Cleared Cache";
                clearCacheRequest = false;
            }
        }
    }
    
    //record the fact that the request failed
    const failload = (err) => 
    {
        failedLoad = true;
        document.getElementById("requestResult").innerHTML = "Request failed";
    }
    
    //attach event handlers
    webview.addEventListener('did-start-loading', loadstart);
    webview.addEventListener('did-stop-loading', loadstop);
    webview.addEventListener('did-fail-load', failload);
}

function performExperiment() 
{
    if(document.getElementById("urlAddress").value == "") 
    {
        return;
    }
    
    //Execute Warmup
    document.getElementById("requestResult").innerHTML = "Warmup Time: ";
    var totalNumberOfRequests = 10;
    var timeBetweenRequests = 30000;
        
    completeResults = [];
    previousResults = [];

    //Clear cache after X time and print to UI saying that's what is going to happen
    for(var requestNumber = 0; requestNumber < totalNumberOfRequests; requestNumber++) 
    {        
        setTimeout(NavigateBrowser, (timeBetweenRequests * requestNumber));
    }
    
    //Print the last result to the UI and clear the cache before the experiment
    setTimeout(ClearCache, (timeBetweenRequests * totalNumberOfRequests));
    
    //Execute experiment
    setTimeout(executeExperiment, (timeBetweenRequests * totalNumberOfRequests) + timeBetweenRequests);
}

function performExperimentWithoutCache() 
{
    //Execute Warmup
    document.getElementById("requestResult").innerHTML = "Warmup Time: ";
    var totalNumberOfRequests = 10;
    var timeBetweenRequests = 10000;
    
    //Clear cache after X time and print to UI saying that's what is going to happen
    for(var requestNumber = 0; requestNumber < totalNumberOfRequests; requestNumber++) 
    {        
        setTimeout(NavigateBrowser, (timeBetweenRequests * requestNumber));
    }
    
    //Execute experiment
    setTimeout(executeExperimentWithoutCache, (timeBetweenRequests * totalNumberOfRequests));
}

function executeExperiment() 
{
    document.getElementById("requestResult").innerHTML = "Requests: ";
    //10 cached and 10 new
    var totalNumberOfRequests = 20;
    var timeBetweenRequests = 30000;
    var timeToClearCache = 5000;
    
    completeResults = [];
    previousResults = [];
    
    //Clear cache after X time and print to UI saying that's what is going to happen
    for(var requestNumber = 0; requestNumber < totalNumberOfRequests; requestNumber++) 
    {
        if((requestNumber % 2) == 0 && requestNumber != 0) 
        {
            setTimeout(ClearCache, ((timeBetweenRequests * requestNumber) - timeToClearCache));
        }
        
        setTimeout(NavigateBrowser, (timeBetweenRequests * requestNumber));
    }
}

function executeExperimentWithoutCache() 
{
    document.getElementById("requestResult").innerHTML = "Requests (Without Cache): ";
    //10 cached and 10 new
    var totalNumberOfRequests = 10;
    var timeBetweenRequests = 10000;
        
    //Clear cache after X time and print to UI saying that's what is going to happen
    for(var requestNumber = 1; requestNumber < totalNumberOfRequests; requestNumber++) 
    {
        setTimeout(NavigateBrowser, (timeBetweenRequests * requestNumber));
    }
}

//used to help reduce the data in the previous results array
function add(a,b) 
{
    return parseFloat(a) + parseFloat(b);
}

//return home
function NavigateHome() 
{
    window.location.href = "../index.html";
}

//gets the URL the user entered and starts the request (utalising the event handlers above)
function NavigateBrowser() 
{
    console.log("New Request");
    
    if(!clearCacheRequest && completeResults != null && previousResults.length > 0) {
        var totalTime = previousResults.reduce(add,0);
        completeResults.push(totalTime);
    }
    
    previousResults = [];
    failedLoad = false;

    var url = "";
    
    url += document.getElementById("urlAddress").value;
    
    var browser = document.getElementById("WebView");
    browser.setAttribute("src", url);
}

//executes the clear cache request
function ClearCache() 
{
    console.log("Clearing Cache");
    clearCacheRequest = true;
    var url = "http://edgepi01:3000/ClearCache";
    
    var browser = document.getElementById("WebView");
    browser.setAttribute("src", url);
}