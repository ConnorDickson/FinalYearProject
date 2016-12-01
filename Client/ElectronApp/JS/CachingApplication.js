var previousResults = [];

onload = () => 
{
    var sendTime = 1.0;
    var receiveTime = 1.0;
    
    const webview = document.getElementById("WebView");
    
    const loadstart = () => 
    {
        sendTime = (new Date()).getTime();
        document.getElementById("requestTime").innerHTML = "Started Request";
    }
    
    const loadstop = () => 
    {
        receiveTime = (new Date()).getTime();
        var resultTime = ((receiveTime - sendTime)/1000).toFixed(2);
        previousResults.push(resultTime);
        document.getElementById("requestTime").innerHTML = "Total Request Time: " + previousResults.toString() + " seconds";
    }
    
    webview.addEventListener('did-start-loading', loadstart);
    webview.addEventListener('did-stop-loading', loadstop);
}

function ClearResults() 
{
    previousResults = [];
}

function NavigateHome() 
{
    window.location.href = "../index.html";
}

function NavigateBrowser() 
{
    ClearResults();
    
    var useCachingApplication = document.getElementById("useCachingApplicationCheckbox").checked;
    
    var url = "";
    
    if(useCachingApplication) 
    {
        url += "http://edgepi01:3000/?url="    
    }
    
    url += document.getElementById("urlAddress").value;
    
    var browser = document.getElementById("WebView");
    browser.setAttribute("src", url);
}