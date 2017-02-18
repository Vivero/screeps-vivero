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

    if (room.memory.commands.clearSpawnQueue) {
        room.memory.commands.clearSpawnQueue = false;
        room.memory.spawnQueueLoPriority = [];
    }

    // determine current Room Control Level
    var rcl = room.controller.level;

    // determine population levels
    var population = {};
    var spawnQueueHPCount = _.countBy(room.memory.spawnQueueHiPriority);
    var spawnQueueLPCount = _.countBy(room.memory.spawnQueueLoPriority);
    for (var r in Globals.CREEP_ROLES) {
        var role = Globals.CREEP_ROLES[r];
        population[role] = room.memory.population[role].length;
        if (role in spawnQueueHPCount) population[role] += spawnQueueHPCount[role];
        if (role in spawnQueueLPCount) population[role] += spawnQueueLPCount[role];
    }

    // calculate statistics
    var currentTime = Game.time;
    var deltaTime = currentTime - room.memory.stats.lastExecTime;
    if (deltaTime >= Globals.ROOM_ENERGY_AVERAGE_TIME || room.memory.commands.computeStatistics) {
        room.memory.stats.lastExecTime = currentTime;
        if (room.memory.commands.computeStatistics) {
            room.memory.commands.printReport = true;
            room.memory.commands.computeStatistics = false;
        }

        room.memory.stats.energyIntakeAvg = room.memory.stats.energyIntake / 
            deltaTime;
        room.memory.stats.energySpentAvg = room.memory.stats.energySpent / deltaTime;

        room.memory.stats.energyNetAverage = room.memory.stats.energyIntakeAvg - room.memory.stats.energySpentAvg;


        // statistics-based spawning
        //----------------------------------------------------------------------
        
        // spawn harvesters
        var maxRoomEnergyExtractionParts = room.memory.sources.length * 5 * 1.5;
        var maxRoomEnergyExtractionRate = room.memory.sources.length * 10;

        // total harvester work parts
        var harvesterWorkParts = 0;
        for (var c in room.memory.population.harvester) {
            var creep = Game.getObjectById(room.memory.population.harvester[c]);
            //harvesterWorkParts += UtilsCreep.getBodyPartTypeCount(creep, WORK);
        }
        //console.log("harvesterWorkParts = " + harvesterWorkParts + ", maxRoomEnergyExtractionParts = " + maxRoomEnergyExtractionParts);

        // total available mining spots
        var maxOccupancy = _.sum(room.memory.sources, 'maxOccupancy');

        if (room.memory.stats.energyIntakeAvg < maxRoomEnergyExtractionRate) {
            for (var i = 0; i < 2; i++) {
                if (population.harvester < (maxOccupancy * 1.5))
                    room.memory.spawnQueueLoPriority.push('harvester');
            }
        }

        if (harvesterWorkParts <= maxRoomEnergyExtractionParts) {
            room.memory.spawnQueueLoPriority.push('harvester');
        }

        // spawn builders
        var builderIdleFraction = (room.memory.stats.creepCycleCounter.builder.total > 0) ? room.memory.stats.creepCycleCounter.builder.idle / room.memory.stats.creepCycleCounter.builder.total : 1.0;
        if (builderIdleFraction < 0.10) {
            room.memory.spawnQueueLoPriority.push('builder');
        }

        // spawn distributors
        var distributorIdleFraction = (room.memory.stats.creepCycleCounter.distributor.total > 0) ? room.memory.stats.creepCycleCounter.distributor.idle / room.memory.stats.creepCycleCounter.distributor.total : 1.0;
        if (distributorIdleFraction < 0.10) {
            room.memory.spawnQueueLoPriority.push('distributor');
        }

        // spawn upgraders
        for (var i = population.upgrader; i < (room.controller.level + 4); i++) {
            room.memory.spawnQueueLoPriority.push('upgrader');
        }

        // spawn soldiers
        if (population.soldier < 2) {
            room.memory.spawnQueueLoPriority.push('soldier');
        }
        //----------------------------------------------------------------------

        // reset statistics
        room.memory.stats.energyIntake = 0;
        room.memory.stats.energySpent = 0;
        for (var r in Globals.CREEP_ROLES) {
            var role = Globals.CREEP_ROLES[r];
            room.memory.stats.creepCycleCounter[role].idle = 0;
            room.memory.stats.creepCycleCounter[role].total = 0;
        }
    }

    // determine total available energy (spawns + extensions)
    //var energyCap = room.energyCapacityAvailable;

    // minimum populations
    //--------------------------------------------------------------------------

    // push a high priority harvester if there are zero harvesters right now,
    // and either the queue is empty, or the first queued spawn is not already
    // a high priority harvester
    var harvesterPopulationIsZero = (room.memory.population.harvester.length == 0);
    var spawnQueueIsEmpty = (room.memory.spawnQueueHiPriority.length == 0);
    var firstQueuedSpawnIsHiPriorityHarvester = !spawnQueueIsEmpty && room.memory.spawnQueueHiPriority[0] === 'harvester';
    if (harvesterPopulationIsZero &&
        (spawnQueueIsEmpty || !firstQueuedSpawnIsHiPriorityHarvester)) {
        room.memory.spawnQueueHiPriority.splice(0, 0, 'harvester');
    }

    var criticalRoles = ['upgrader', 'builder', 'distributor', 'soldier'];
    for (var r in criticalRoles) {
        var role = criticalRoles[r];
        if (room.memory.population[role] < 1 &&
            !_.includes(room.memory.spawnQueueHiPriority, role)) {
            room.memory.spawnQueueHiPriority.push(role);
        }
    }

    // spawn creeps
    var spawns = room.find(FIND_MY_SPAWNS);
    for (var s in spawns) {
        var spawn = spawns[s];
        if (spawn.spawning === null) {
            var role = room.memory.spawnQueueHiPriority[0];
            if (role !== undefined) {

                var body = UtilsCreep.getBestBuildableCreepClass(room, role);
                var mem = Globals.getCreepRoleMemory(role);

                if (spawn.canCreateCreep(body) === OK) {
                    var err = spawn.createCreep(body, undefined, mem);
                    if (_.isString(err)) {
                        room.memory.spawnQueueHiPriority.shift();
                        room.memory.stats.energySpent += UtilsCreep.getCreepBodyCost(body);
                        continue;
                    }
                }
            }

            role = room.memory.spawnQueueLoPriority[0];
            if (role !== undefined) {

                var body = UtilsCreep.getBestPossibleCreepClass(room, role);
                var mem = Globals.getCreepRoleMemory(role);

                if (spawn.canCreateCreep(body) === OK) {
                    var err = spawn.createCreep(body, undefined, mem);
                    if (_.isString(err)) {
                        room.memory.spawnQueueLoPriority.shift();
                        room.memory.stats.energySpent += UtilsCreep.getCreepBodyCost(body);
                        continue;
                    }
                }
            }
        }
    }


    // print summary
    if (Game.time % room.memory.stats.reportRate === 0 ||
        room.memory.commands.printReport) {

        console.log('<span style="color:yellow;">' + "Room Stats Summary - " + Game.time + '</span>');
        console.log('<span style="color:yellow;">' + "=/=/=/=/=/=/=/=/=/=/=/=/=/=/=/=/=/=/\n" + '</span>');

        console.log("* Last Time            " + room.memory.stats.lastExecTime);
        //console.log("*");
        //console.log("* Energy Intake        " + room.memory.stats.energyIntake);
        //console.log("* Energy Spent         " + room.memory.stats.energySpent);
        console.log("*");
        console.log("* Energy Intake Rate   " + room.memory.stats.energyIntakeAvg);
        console.log("* Energy Spent Rate    " + room.memory.stats.energySpentAvg);
        console.log("* Energy Net Rate      " + room.memory.stats.energyNetAverage);
        console.log("*");
        console.log("* Builder Cycles       (" + room.memory.stats.creepCycleCounter.builder.idle +
            " idle / " + room.memory.stats.creepCycleCounter.builder.total + " total)");
        console.log("* Distributor Cycles   (" + room.memory.stats.creepCycleCounter.distributor.idle +
            " idle / " + room.memory.stats.creepCycleCounter.distributor.total + " total)");

        console.log();
        console.log("-- Queues --");
        var queue = " ";
        for (var q in room.memory.spawnQueueHiPriority) {
            var role = room.memory.spawnQueueHiPriority[q];
            queue += (role + " ");
        }
        console.log("HP: " + queue);
        queue = " ";
        for (var q in room.memory.spawnQueueLoPriority) {
            var role = room.memory.spawnQueueLoPriority[q];
            queue += (role + " ");
        }
        console.log("LP: " + queue);
        console.log(JSON.stringify(population));

        console.log("\n\n");

        room.memory.commands.printReport = false;
    }

};
