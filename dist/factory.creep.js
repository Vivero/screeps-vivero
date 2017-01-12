/* creep_factory.js
 *
 * Encapsulates the logic to determine creep spawning behavior.
 *
 */ 
'use strict';

var Globals = require('globals');
var UtilsCreep = require('utils.creep');

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
    for (var s in spawns) {
        var spawn = spawns[s];
        if (spawn.spawning === null) {
            var body = null;
            var mem = null;
            
            // priority spawns
            //--------------------------
            if (room.memory.population.harvester.length < 3) {
                body = UtilsCreep.getBestBuildableCreepClass(room, 'harvester');
                mem = Globals.getCreepRoleMemory('harvester');
                if (spawn.canCreateCreep(body) == OK) {
                    spawn.createCreep(body, undefined, mem);
                }

            } else if (room.memory.population.upgrader.length < 5) {
                body = UtilsCreep.getBestPossibleCreepClass(room, 'upgrader');
                mem = Globals.getCreepRoleMemory('upgrader');
                if (spawn.canCreateCreep(body) == OK) {
                    spawn.createCreep(body, undefined, mem);
                }

            } else if (room.memory.population.builder.length < 2) {
                body = UtilsCreep.getBestPossibleCreepClass(room, 'builder');
                mem = Globals.getCreepRoleMemory('builder');
                if (spawn.canCreateCreep(body) == OK) {
                    spawn.createCreep(body, undefined, mem);
                }

            } else if (room.memory.population.distributor.length < 1) {
                body = UtilsCreep.getBestBuildableCreepClass(room, 'distributor');
                mem = Globals.getCreepRoleMemory('distributor');
                if (spawn.canCreateCreep(body) == OK) {
                    spawn.createCreep(body, undefined, mem);
                }

            } /*else if (!('soldier' in room.memory.population) || (room.memory.population['soldier'].length < 1)) {
                if (spawn.canCreateCreep(Globals.TYPE_S_CLASS_4) == OK) {
                    spawn.createCreep(Globals.TYPE_S_CLASS_4, undefined, Globals.MEM_TYPE_S);
                }

            } */else {

                // extra spawns
                //----------------------

            }
        }
    }




    /*

    // spawn harvesters
    var harvesterBody = Utils.getBestCreepClass(room, 'harvester');
    var harvesterMemory = Object.assign({}, Globals.CREEP_MEMORY);
    harvesterMemory.role = 'harvester';
    for (var s in spawns) {
        var spawn = spawns[s];
        if (spawn.spawning == null) {
            if (room.memory.population['harvester'].length < 3) {
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
            if (room.memory.population['upgrader'].length < 5) {
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
            if (room.memory.population['builder'].length < 2) {
                if (spawn.canCreateCreep(builderBody) == OK) {
                    spawn.createCreep(builderBody, undefined, builderMemory);
                }
            }
        }
    }

    */

};
