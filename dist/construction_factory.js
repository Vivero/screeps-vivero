/* construction_factory.js
 *
 * Encapsulates the logic to determine automatic placement of buildings.
 *
 */ 
var Globals = require('globals');
var Utils = require('utils');

var exports = module.exports = {};

exports.run = function(room) {

    // determine last time executed
    var lastExecTime = room.memory.autoBuild.lastExecTime;

    // get game time
    var currentTime = Game.time;

    // execute once every X ticks
    if ((currentTime - lastExecTime) > 10) {
        console.log("auto build!");
        room.memory.autoBuild.lastExecTime = currentTime;

        var spawns = room.find(FIND_MY_SPAWNS);
        var origin = spawns[0];
        var goal = Game.getObjectById(room.memory.sources[0].id);

        var ret = PathFinder.search(origin.pos, {pos: goal.pos, range: 1}, {
            // We need to set the defaults costs higher so that we
            // can set the road cost lower in `roomCallback`
            plainCost: 2,
            swampCost: 10,

            roomCallback: function(roomName) {

            let room = Game.rooms[roomName];
            // In this example `room` will always exist, but since PathFinder 
            // supports searches which span multiple rooms you should be careful!
            if (!room) return;
            let costs = new PathFinder.CostMatrix;

            room.find(FIND_STRUCTURES).forEach(function(structure) {
                if (structure.structureType === STRUCTURE_ROAD) {
                    // Favor roads over plain tiles
                    costs.set(structure.pos.x, structure.pos.y, 1);
                } else if (structure.structureType !== STRUCTURE_CONTAINER && 
                           (structure.structureType !== STRUCTURE_RAMPART ||
                            !structure.my)) {
                    // Can't walk through non-walkable buildings
                    costs.set(structure.pos.x, structure.pos.y, 0xff);
                }
            });

            return costs;
          },
        });

        //console.log(JSON.stringify(ret, null, 4));

        if (!ret.incomplete) {
            for (var p in ret.path) {
                var pos = ret.path[p];
                var look = room.lookAt(pos);
                var existingRoad = _.find(look, {
                    filter: (lookObj) => {
                        return ((lookObj.type === LOOK_STRUCTURES && 
                                 lookObj[LOOK_STRUCTURES] === STRUCTURE_ROAD) ||
                                (lookObj.type === LOOK_CONSTRUCTION_SITES));
                    }
                });

                //console.log(JSON.stringify(look, null, 4));

                if (!existingRoad) {
                    room.createConstructionSite(pos, STRUCTURE_ROAD);
                }
            }
        }
        
    }
    
};
