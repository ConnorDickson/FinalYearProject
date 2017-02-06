var previousResults = [];
var failedLoad = false;

onload = () => 
{
    var sendTime = 1.0;
    var receiveTime = 1.0;
        
    const webview = document.getElementById("WebView");
    
    const loadstart = () => 
    {
        sendTime = (new Date()).getTime();
        document.getElementById("requestResult").innerHTML = "Started Request";
    }
    
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
    
    const failload = (err) => 
    {
        failedLoad = true;
        document.getElementById("requestResult").innerHTML = "Request failed";
    }
    
    webview.addEventListener('did-start-loading', loadstart);
    webview.addEventListener('did-stop-loading', loadstop);
    webview.addEventListener('did-fail-load', failload);
}

function add(a,b) {
    return parseFloat(a) + parseFloat(b);
}

function ClearResults() 
{
    previousResults = [];
    failedLoad = false;
}

function NavigateHome() 
{
    window.location.href = "../index.html";
}

function NavigateBrowser() 
{
    ClearResults();

    var url = "";
    
    url += document.getElementById("urlAddress").value;
    
    var browser = document.getElementById("WebView");
    browser.setAttribute("src", url);
}

function ClearCache() {
    ClearResults();
    
    var url = "http://edgepi01:3000/ClearCache";
    
    var browser = document.getElementById("WebView");
    browser.setAttribute("src", url);
}