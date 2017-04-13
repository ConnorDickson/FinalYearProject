//https://www.burakkanber.com/blog/machine-learning-in-js-k-nearest-neighbor-part-1/
//http://jsfiddle.net/bkanber/hevFK/?utm_source=website&utm_medium=embed&utm_campaign=hevFK
//This code is based on the website above, it had to be adapted for my system
var Node = require('./Node.js').Node;

var NodeList = function(k) {
    this.nodes = [];
    this.k = k;
};

NodeList.prototype.add = function(node) {
    this.nodes.push(node);
};

NodeList.prototype.determineUnknown = function() {
    this.calculateRanges();

    /*
    * Loop through our nodes and look for unknown types.
    */
    for (var i in this.nodes)
    {
        if (this.nodes[i].evaluate)
        {
            /* Clone nodes */
            this.nodes[i].neighbors = [];

            for (var j in this.nodes)
            {
                if (this.nodes[j].evaluate) {
                    continue;
                }
                
                this.nodes[i].neighbors.push(new Node(this.nodes[j]));
            }

            /* Measure distances */
           this.nodes[i].measureDistances(null, this.Year, this.PercentageHorror, this.PercentageComedy, this.PercentageAction, this.PercentageAdventure, this.PercentageFantasy, this.PercentageRomance, null, null, null, null);

            /* Sort by distance */
            this.nodes[i].sortByDistance();

            /* Guess type */
            this.nodes[i].guessType(this.k);
        }
    }
};

NodeList.prototype.calculateRanges = function() {
    this.Year = {min: 1000000, max: 0};
    this.PercentageHorror = {min: 1000000, max: 0};
    this.PercentageComedy = {min: 1000000, max: 0};
    this.PercentageAction = {min: 1000000, max: 0};
    this.PercentageAdventure = {min: 1000000, max: 0};
    this.PercentageFantasy = {min: 1000000, max: 0};
    this.PercentageRomance = {min: 1000000, max: 0};

    for (var i in this.nodes)
    {
        //Year
        if (this.nodes[i].Year < this.Year.min)
        {
            this.Year.min = this.nodes[i].Year;
        }

        if (this.nodes[i].Year > this.Year.max)
        {
            this.Year.max = this.nodes[i].Year;
        }

        //PercentageHorror
        if (this.nodes[i].PercentageHorror < this.PercentageHorror.min)
        {
            this.PercentageHorror.min = this.nodes[i].PercentageHorror;
        }

        if (this.nodes[i].PercentageHorror > this.PercentageHorror.max)
        {
            this.PercentageHorror.max = this.nodes[i].PercentageHorror;
        }

        //Percentage Comedy
        if (this.nodes[i].PercentageComedy < this.PercentageComedy.min)
        {
            this.PercentageComedy.min = this.nodes[i].PercentageComedy;
        }

        if (this.nodes[i].PercentageComedy > this.PercentageComedy.max)
        {
            this.PercentageComedy.max = this.nodes[i].PercentageComedy;
        }   
        
        //Percentage Action
        if (this.nodes[i].PercentageAction < this.PercentageAction.min)
        {
            this.PercentageAction.min = this.nodes[i].PercentageAction;
        }

        if (this.nodes[i].PercentageAction > this.PercentageAction.max)
        {
            this.PercentageAction.max = this.nodes[i].PercentageAction;
        }
        
        //Percentage Adventure
        if (this.nodes[i].PercentageAdventure < this.PercentageAdventure.min)
        {
            this.PercentageAdventure.min = this.nodes[i].PercentageAdventure;
        }

        if (this.nodes[i].PercentageAdventure > this.PercentageAdventure.max)
        {
            this.PercentageAdventure.max = this.nodes[i].PercentageAdventure;
        }
        
        //Percentage Fantasy
        if (this.nodes[i].PercentageFantasy < this.PercentageFantasy.min)
        {
            this.PercentageFantasy.min = this.nodes[i].PercentageFantasy;
        }

        if (this.nodes[i].PercentageFantasy > this.PercentageFantasy.max)
        {
            this.PercentageFantasy.max = this.nodes[i].PercentageFantasy;
        }
        
        //Percentage Romance
        if (this.nodes[i].PercentageRomance < this.PercentageRomance.min)
        {
            this.PercentageRomance.min = this.nodes[i].PercentageRomance;
        }

        if (this.nodes[i].PercentageRomance > this.PercentageRomance.max)
        {
            this.PercentageRomance.max = this.nodes[i].PercentageRomance;
        }
    }
};

NodeList.prototype.getNN = function() {
    for(var i in this.nodes) {
        if(this.nodes[i].evaluate) {
            var nearestNeighbours = [];
            nearestNeighbours.push(this.nodes[i].neighbors[this.k - 1]);
            nearestNeighbours.push(this.nodes[i].neighbors[this.k]);
            nearestNeighbours.push(this.nodes[i].neighbors[this.k + 1]);
            return nearestNeighbours;
        }
    }
};

module.exports = {
    NodeList
};
