//Took the basis from here: http://stackoverflow.com/questions/20318822/how-to-create-a-stopwatch-using-javascript
//Which linked to here: http://jsbin.com/IgaXEVI/167/edit?html,js,output
//But I altered it so it does not update all the time as I only need the final answer

var Stopwatch = function(elem) {
    var timer = createTimer();
    var clock = 0;

    // append elements     
    elem.appendChild(timer);

    // private functions
    function createTimer() {
        return document.createElement("span");
    }

    function start() {
        offset = Date.now();
    }

    function stop() {
        clock += delta();
        render();
    }

    function reset() {
        clock = 0;
        timer.innerHTML = "Processing...";
    }

    function render() {
        timer.innerHTML = "Time: " + clock/1000 + " seconds."; 
    }

    function delta() {
        var now = Date.now();
        return  (now - offset);
    }

    // public API
    this.start  = start;
    this.stop   = stop;
    this.reset  = reset;
};