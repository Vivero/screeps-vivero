/* room_control.js
 *
 * Encapsulates full control of a single room.
 *
 */ 
'use strict';

var Globals = require('globals');
var Utils = require('utils');
var Role = require('role');
var Tower = require('tower');
var FactoryCreep = require('factory.creep');
var FactoryConstruction = require('factory.construction');

var exports = module.exports = {};

function initialize(room) {
    // ROOM_MEMORY fields get initialized unless they already exist
    for (var f in Globals.ROOM_MEMORY_ARYS) {
        var field = Globals.ROOM_MEMORY_ARYS[f];
        if (!(field in room.memory)) {
            room.memory[field] = [];
        }
    }
    for (var field in Globals.ROOM_MEMORY_OBJS) {
        if (!(field in room.memory)) {
            room.memory[field] = Object.assign({}, Globals.ROOM_MEMORY_OBJS[field]);
        }
    }
}

exports.run = function(room) {

    // INIT MEMORY
    //======================================================================
    initialize(room);

    // monitor safe mode
    /*if (room.controller.safeMode === undefined && room.controller.safeModeAvailable > 0) {
        room.controller.activateSafeMode();
    }*/


    // CACHE SOURCES
    //======================================================================
    if (room.memory.sources.length === 0) {
        var sources = room.find(FIND_SOURCES);
        for (var s in sources) {
            var source = sources[s];
            room.memory.sources.push({
                id:             source.id,
                occupancy:      0,
                maxOccupancy:   Utils.calculateSourceMaxOccupancy(source),
                roadBuilt:      false,
            });
        }
    }


    // SURVEY TOWERS
    //==============================
    var towers = room.find(FIND_MY_STRUCTURES, {
        filter: { structureType: STRUCTURE_TOWER },
    });
    // add new towers
    for (var t in towers) {
        var tower = towers[t];
        if (room.memory.towers &&  !_.find(room.memory.towers, {'id': tower.id})) {
            room.memory.towers.push({
                id:         tower.id,
                target:     null,
                stateStack: [Globals.STATE_TWR_IDLE],
                statePrev:  Globals.STATE_TWR_IDLE,
            });
        }
    }
    // delete any old towers
    for (var t in room.memory.towers) {
        var towerInfo = room.memory.towers[t];
        var tower = Game.getObjectById(towerInfo.id);
        if (!tower) delete room.memory.towers[t];
    }



    // SURVEY SOURCES
    //==============================
    for (var s in room.memory.sources) {
        var source = Game.getObjectById(room.memory.sources[s].id);
        if (source !== null) {
            var nearbyCreeps = source.pos.findInRange(FIND_CREEPS, 1);
            room.memory.sources[s].occupancy = nearbyCreeps.length;
        }
    }


    // PROCESS COMMANDS BUFFER
    //==============================
    if (room.memory.commands.spawnSpecial) {
        var spawns = room.find(FIND_MY_SPAWNS);
        if (spawns.length) {
            var spawn = spawns[0];
            var body = Utils.getBestCreepClass(room, 'special');
            var mem = Globals.getCreepRoleMemory('special');
            if (spawn.canCreateCreep(body) == OK) {
                spawn.createCreep(body, undefined, mem);
                room.memory.commands.spawnSpecial = false;
            }
        }
    }


    // SPAWN NEW CREEPS
    //==============================
    FactoryCreep.run(room);


    // EXECUTE CREEP ROLES
    //==============================
    for (var p in room.memory.population) {
        for (var c in room.memory.population[p]) {
            var creep = Game.getObjectById(room.memory.population[p][c]);
            if (creep !== null && !creep.spawning) {
                Role.run(creep);
            }
        }
    }


    // EXECUTE TOWER ROLES
    //==============================
    for (var t in room.memory.towers) {
        Tower.run(room.memory.towers[t]);
    }


    // AUTOMATIC BUILDER
    //==============================
    //FactoryConstruction.run(room);

};
