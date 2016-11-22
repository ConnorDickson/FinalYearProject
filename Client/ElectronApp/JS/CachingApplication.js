function NavigateHome() 
{
    window.location.href = "../index.html";
}

function NavigateBrowser() 
{
    var url = document.getElementById("urlAddress").value;
    var browser = document.getElementById("WebView");
    browser.setAttribute("src", url);
}