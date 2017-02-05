/* creep_factory.js
 *
 * Encapsulates the logic to determine creep spawning behavior.
 *
 */ 
'use strict';

var Globals = require('globals');
var Utils = require('utils');
var UtilsCreep = require('utils.creep');

var exports = module.exports = {};

exports.run = function(room) {

    // determine current Room Control Level
    var rcl = room.controller.level;

    // determine population levels
    var population = {};
    var spawnQueueCount = _.countBy(room.memory.spawnQueue, 'role');
    for (var r in Globals.CREEP_ROLES) {
        var role = Globals.CREEP_ROLES[r];
        population[role] = room.memory.population[role].length;
        if (role in spawnQueueCount) {
            population[role] += spawnQueueCount[role];
        }
    }

    // calculate statistics
    var lastExecTime = room.memory.stats.lastExecTime;
    var currentTime = Game.time;
    if ((currentTime - lastExecTime) >= Globals.ROOM_ENERGY_AVERAGE_TIME) {
        room.memory.stats.lastExecTime = currentTime;

        room.memory.stats.energyIntakeAvg = (room.memory.stats.energyIntake - room.memory.stats.energyIntakePrev) / 
            Globals.ROOM_ENERGY_AVERAGE_TIME;
        room.memory.stats.energySpentAvg = (room.memory.stats.energySpent - room.memory.stats.energySpentPrev) / Globals.ROOM_ENERGY_AVERAGE_TIME;

        room.memory.stats.energyNetAverage = room.memory.stats.energyIntakeAvg - room.memory.stats.energySpentAvg;

        room.memory.stats.energyIntakePrev = room.memory.stats.energyIntake;
        room.memory.stats.energySpentPrev = room.memory.stats.energySpent;


        // statistics-based spawning
        //var maxRoomEnergyExtractionRate = room.memory.source.length * 10;
        var maxRoomEnergyExtractionRate = 10;
        if (room.memory.stats.energyIntakeAvg < maxRoomEnergyExtractionRate) {
            room.memory.spawnQueue.push(new Globals.SpawnRequest('harvester', false));
        }
    }

    // determine total available energy (spawns + extensions)
    var energyCap = room.energyCapacityAvailable;

    // determine number of sources in the room
    var numSources = room.memory.sources.length;

    // total available mining spots
    var maxOccupancy = _.sum(room.memory.sources, 'maxOccupancy');

    // harvesters to build
    var numHarvesters = Math.ceil(maxOccupancy / 2);

    // minimum populations
    if (room.memory.population.harvester.length < 1 &&
        (room.memory.spawnQueue.length == 0 ||
         (room.memory.spawnQueue.length > 0 && 
          (room.memory.spawnQueue[0].role !== 'harvester' && !room.memory.spawnQueue[0].highPriority)))) {
        room.memory.spawnQueue.splice(0, 0, new Globals.SpawnRequest('harvester', true));
    }
    if (population.upgrader < 1) {
        room.memory.spawnQueue.push(new Globals.SpawnRequest('upgrader', false));
    }
    if (population.builder < 1) {
        room.memory.spawnQueue.push(new Globals.SpawnRequest('builder', false));
    }
    //if (population.distributor < 1) {
    //    room.memory.spawnQueue.push(new Globals.SpawnRequest('distributor', false));
    //}

    // spawn creeps
    var spawns = room.find(FIND_MY_SPAWNS);
    for (var s in spawns) {
        var spawn = spawns[s];
        if (spawn.spawning === null) {
            var request = room.memory.spawnQueue[0];
            if (request !== undefined) {

                var body = request.highPriority ? 
                    UtilsCreep.getBestBuildableCreepClass(room, request.role) :
                    UtilsCreep.getBestPossibleCreepClass(room, request.role);

                var mem = Globals.getCreepRoleMemory(request.role);

                if (spawn.canCreateCreep(body) === OK) {
                    var err = spawn.createCreep(body, undefined, mem);
                    if (_.isString(err)) {
                        room.memory.spawnQueue.shift();
                        room.memory.stats.energySpent += UtilsCreep.getCreepBodyCost(body);
                    }
                }
            }
        }
    }


    // print summary
    if (Game.time % Globals.ROOM_SUMMARY_PRINT_TIME === 0) {

        console.log('<span style="color:yellow;">' + "Room Stats Summary - " + Game.time + '</span>');
        console.log('<span style="color:yellow;">' + "=/=/=/=/=/=/=/=/=/=/=/=/=/=/=/=/=/=/\n" + '</span>');

        console.log("* Last Time            " + room.memory.stats.lastExecTime);
        console.log("*");
        console.log("* Energy Intake        " + room.memory.stats.energyIntake);
        console.log("* Energy Spent         " + room.memory.stats.energySpent);
        console.log("*");
        console.log("* Energy Intake Rate   " + room.memory.stats.energyIntakeAvg);
        console.log("* Energy Spent Rate    " + room.memory.stats.energySpentAvg);
        console.log("* Energy Net Rate      " + room.memory.stats.energyNetAverage);

        //console.log();
        //console.log("> Harvesters           " + population.harvester);
        //console.log("> Upgraders            " + population.upgrader);

        console.log();
        console.log("-- Queue --");
        var queue = " ";
        for (var q in room.memory.spawnQueue) {
            var req = room.memory.spawnQueue[q];
            queue += (req.role + " ");
        }
        console.log(queue);
        console.log(JSON.stringify(population));

        console.log("\n\n");
    }



    /*

    // get spawn
    var spawns = room.find(FIND_MY_SPAWNS);
    for (var s in spawns) {
        var spawn = spawns[s];
        if (spawn.spawning === null) {
            var body = null;
            var mem = null;
            
            // priority spawns
            //--------------------------
            if (room.memory.population.harvester.length < 2) {
                body = UtilsCreep.getBestBuildableCreepClass(room, 'harvester');
                mem = Globals.getCreepRoleMemory('harvester');
                if (spawn.canCreateCreep(body) == OK) {
                    spawn.createCreep(body, undefined, mem);
                }

            } else if (room.memory.population.upgrader.length < 2) {
                body = UtilsCreep.getBestPossibleCreepClass(room, 'upgrader');
                mem = Globals.getCreepRoleMemory('upgrader');
                if (spawn.canCreateCreep(body) == OK) {
                    spawn.createCreep(body, undefined, mem);
                }

            } else if (room.memory.population.builder.length < 1) {
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

            } else if (!('soldier' in room.memory.population) || (room.memory.population['soldier'].length < 1)) {
                if (spawn.canCreateCreep(Globals.TYPE_S_CLASS_4) == OK) {
                    spawn.createCreep(Globals.TYPE_S_CLASS_4, undefined, Globals.MEM_TYPE_S);
                }

            } else {

                // extra spawns
                //----------------------

            }
        }
    }

    */


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
