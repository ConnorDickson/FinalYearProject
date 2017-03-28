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
        if ( ! this.nodes[i].type)
        {
            /*
            * If the node is an unknown type, clone the nodes list and then measure distances.
            */

            /* Clone nodes */
            this.nodes[i].neighbors = [];
            for (var j in this.nodes)
            {
                if ( ! this.nodes[j].type) {
                    continue;
                }
                
                this.nodes[i].neighbors.push( new Node(this.nodes[j]) );
            }

            /* Measure distances */
            this.nodes[i].measureDistances(this.areas, this.rooms);

            /* Sort by distance */
            this.nodes[i].sortByDistance();

            /* Guess type */
            console.log(this.nodes[i].guessType(this.k));
        }
    }
};

NodeList.prototype.calculateRanges = function() {
    this.areas = {min: 1000000, max: 0};
    this.rooms = {min: 1000000, max: 0};
    for (var i in this.nodes)
    {
        if (this.nodes[i].rooms < this.rooms.min)
        {
            this.rooms.min = this.nodes[i].rooms;
        }

        if (this.nodes[i].rooms > this.rooms.max)
        {
            this.rooms.max = this.nodes[i].rooms;
        }

        if (this.nodes[i].area < this.areas.min)
        {
            this.areas.min = this.nodes[i].area;
        }

        if (this.nodes[i].area > this.areas.max)
        {
            this.areas.max = this.nodes[i].area;
        }
    }
};


NodeList.prototype.printKNN = function() {
    for (var i in this.nodes)
    {
        if (!this.nodes[i].type)
        {
            for(var j = 0; j < this.k; j ++) {
                var nearestNode = this.nodes[i].neighbors[j];
                console.log("NN " + j + ":\nRooms: " + nearestNode.rooms + "\nArea: " + nearestNode.area + "\nType: " + nearestNode.type);
            }
        }
    }
};

module.exports = {
    NodeList
};

