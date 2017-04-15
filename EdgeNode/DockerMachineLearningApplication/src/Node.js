//https://www.burakkanber.com/blog/machine-learning-in-js-k-nearest-neighbor-part-1/
//http://jsfiddle.net/bkanber/hevFK/?utm_source=website&utm_medium=embed&utm_campaign=hevFK
//This code is based on the website above, it had to be adapted for my system

//Constructor
var Node = function(object) {
    for (var key in object)
    {
        this[key] = object[key];
    }
};

//Method on the node object to measure distance between this node and all of it's neighbours
Node.prototype.measureDistances = function(title_range_obj, year_range_obj, percent_horror_range_obj, percent_comedy_range_obj, percent_action_range_obj, percent_adventure_range_obj, percent_fantasy_range_obj, percent_romance_range_obj, contains_violence_range_obj, contains_sexual_scenes_range_obj, contains_drug_use_range_obj, contains_flashing_images_range_obj) {

    //Find out the range of the metric passed in
    var year_range = year_range_obj.max - year_range_obj.min;
    var percent_horror_range = percent_horror_range_obj.max - percent_horror_range_obj.min;
    var percent_comedy_range = percent_comedy_range_obj.max - percent_comedy_range_obj.min;
    var percent_action_range = percent_action_range_obj.max - percent_action_range_obj.min;
    var percent_adventure_range = percent_adventure_range_obj.max - percent_adventure_range_obj.min;
    var percent_fantasy_range = percent_fantasy_range_obj.max - percent_fantasy_range_obj.min;
    var percent_romance_range = percent_romance_range_obj.max - percent_romance_range_obj.min;
    
    //For each of the neighbours calculate the distance between that node and this node
    for (var i in this.neighbors)
    {
        /* Just shortcut syntax */
        var neighbor = this.neighbors[i];

        var delta_year = neighbor.Year - this.Year;
        delta_year = (delta_year) / year_range;

        var delta_percent_horror = neighbor.PercentageHorror - this.PercentageHorror;
        delta_percent_horror = (delta_percent_horror) / percent_horror_range;

        var delta_percent_comedy = neighbor.PercentageComedy - this.PercentageComedy;
        delta_percent_comedy = (delta_percent_comedy) / percent_comedy_range;

        var delta_percent_action = neighbor.PercentageAction - this.PercentageAction;
        delta_percent_action = (delta_percent_action) / percent_action_range;

        var delta_percent_adventure = neighbor.PercentageAdventure - this.PercentageAdventure;
        delta_percent_adventure = (delta_percent_adventure) / percent_adventure_range;

        var delta_percent_fantasy = neighbor.PercentageFantasy - this.PercentageFantasy;
        delta_percent_fantasy = (delta_percent_fantasy) / percent_fantasy_range;

        var delta_percent_romance = neighbor.PercentageRomance - this.PercentageRomance;
        delta_percent_romance = (delta_percent_romance) / percent_romance_range;

        var sqrtResult = Math.sqrt(delta_year*delta_year + 
                                      delta_percent_horror*delta_percent_horror + 
                                      delta_percent_comedy*delta_percent_comedy + 
                                      delta_percent_action*delta_percent_action + 
                                      delta_percent_adventure*delta_percent_adventure + 
                                      delta_percent_fantasy*delta_percent_fantasy + 
                                      delta_percent_romance*delta_percent_romance);

        neighbor.distance = sqrtResult;
    }
};

//Sort the neighbours by distance as to find the closest one
Node.prototype.sortByDistance = function() {
    this.neighbors.sort(function (a, b) {
        return a.distance - b.distance;
    });
};

//Setup the return methods of the module
module.exports = {
    Node
};

