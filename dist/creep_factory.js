/* creep_factory.js
 *
 * Encapsulates the logic to determine creep spawning behavior.
 *
 */ 
var Globals = require('globals');
var Utils = require('utils');

var exports = module.exports = {};

exports.run = function(room) {

    // determine current Room Control Level
    var rcl = room.controller.level;

    // determine population levels
    var harvesters = 0;
    var upgraders = 0;
    var builders = 0;

    switch (rcl) {
        case 0:
            harvesters = 1;
            upgraders = 1;
            builders = 1;
            break;

        default:
            harvesters = 1;
            upgraders = 1;
            builders = 1;
    }

    // determine total available energy (spawns + extensions)
    var energyCap = room.energyCapacityAvailable;

    // determine number of sources in the room
    var numSources = room.memory.sources.length;

    // total available mining spots
    var maxOccupancy = _.sum(room.memory.sources, 'maxOccupancy');

    // harvesters to build
    var numHarvesters = Math.ceil(maxOccupancy / 2);

    //console.log("Max occ: " + maxOccupancy + ", build: " + numHarvesters);

    // get spawn
    var spawns = room.find(FIND_MY_SPAWNS);

    // spawn harvesters
    var harvesterBody = Utils.getBestCreepClass(room, 'harvester');
    var harvesterMemory = Object.assign({}, Globals.CREEP_MEMORY);
    harvesterMemory.role = 'harvester';
    for (var s in spawns) {
        var spawn = spawns[s];
        if (spawn.spawning == null) {
            if (room.memory.population['harvester'].length < numHarvesters) {
                if (spawn.canCreateCreep(harvesterBody) == OK) {
                    spawn.createCreep(harvesterBody, undefined, harvesterMemory);
                }
            }
        }
    }

    // spawn upgrader
    var upgraderBody = Utils.getBestCreepClass(room, 'upgrader');
    var upgraderMemory = Object.assign({}, Globals.CREEP_MEMORY);
    upgraderMemory.role = 'upgrader';
    for (var s in spawns) {
        var spawn = spawns[s];
        if (spawn.spawning == null) {
            if (room.memory.population['upgrader'].length < 1) {
                if (spawn.canCreateCreep(upgraderBody) == OK) {
                    spawn.createCreep(upgraderBody, undefined, upgraderMemory);
                }
            }
        }
    }

    // spawn builder
    var builderBody = Utils.getBestCreepClass(room, 'builder');
    var builderMemory = Object.assign({}, Globals.CREEP_MEMORY);
    builderMemory.role = 'builder';
    for (var s in spawns) {
        var spawn = spawns[s];
        if (spawn.spawning == null) {
            if (room.memory.population['builder'].length < 3) {
                if (spawn.canCreateCreep(builderBody) == OK) {
                    spawn.createCreep(builderBody, undefined, builderMemory);
                }
            }
        }
    }

};
