onload = () => 
{
    var sendTime = 1.0;
    var receiveTime = 1.0;
    
    const webview = document.getElementById("WebView");
    
    const loadstart = () => 
    {
        document.getElementById("requestTime").innerHTML = "Started Request";
        sendTime = (new Date()).getTime();
    }
    
    const loadstop = () => 
    {
        receiveTime = (new Date()).getTime();
        
        document.getElementById("requestTime").innerHTML = "Total Request Time: " + ((receiveTime - sendTime)/1000).toFixed(2) + " seconds";
    }
    
    webview.addEventListener('did-start-loading', loadstart);
    webview.addEventListener('did-stop-loading', loadstop);
}

function NavigateHome() 
{
    window.location.href = "../index.html";
}

function NavigateBrowser() 
{
    var url = "http://edgepi01:3000/?url=" + document.getElementById("urlAddress").value;
    var browser = document.getElementById("WebView");
    browser.setAttribute("src", url);
}