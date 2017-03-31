var previousResults = [];
var failedLoad = false;

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
        document.getElementById("requestResult").innerHTML = "Started Request";
    }
    
    //end the timer (if the request didn't fail) and add this to the results array
    //total the results array and display total time to the user
    const loadstop = () => 
    {
        if(!failedLoad) 
        { 
            receiveTime = (new Date()).getTime();
            var resultTime = ((receiveTime - sendTime)/1000).toFixed(2);
            previousResults.push(resultTime);
            var totalTime = previousResults.reduce(add,0);
            document.getElementById("requestResult").innerHTML = "Total Request Time: " + totalTime + " seconds";   
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

//used to help reduce the data in the previous results array
function add(a,b) {
    return parseFloat(a) + parseFloat(b);
}

//Called when the go button is pressed so a new request can be recorded
function ClearResults() 
{
    previousResults = [];
    failedLoad = false;
}

//return home
function NavigateHome() 
{
    window.location.href = "../index.html";
}

//gets the URL the user entered and starts the request (utalising the event handlers above)
function NavigateBrowser() 
{
    ClearResults();

    var url = "";
    
    url += document.getElementById("urlAddress").value;
    
    var browser = document.getElementById("WebView");
    browser.setAttribute("src", url);
}

//executes the clear cache request
function ClearCache() {
    ClearResults();
    
    var url = "http://edgepi01:3000/ClearCache";
    
    var browser = document.getElementById("WebView");
    browser.setAttribute("src", url);
}