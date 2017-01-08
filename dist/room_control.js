/* room_control.js
 *
 * Encapsulates full control of a single room.
 *
 */ 
var Globals = require('globals');
var Utils = require('utils');
var Role = require('role');
var Tower = require('tower');
var CreepFactory = require('creep_factory');
var ConstructionFactory = require('construction_factory');

var exports = module.exports = {};

function initialize(room) {
    // ROOM_MEMORY fields get initialized unless they already exist
    for (var f in exports.ROOM_MEMORY_ARYS) {
        var field = exports.ROOM_MEMORY_ARYS[f];
        if (!(field in room.memory)) {
            room.memory[field] = [];
        }
    }
    for (var f in exports.ROOM_MEMORY_OBJS) {
        var field = exports.ROOM_MEMORY_OBJS[f];
        if (!(field in room.memory)) {
            room.memory[field] = Object.assign({}, exports.ROOM_MEMORY_OBJS[field]);
        }
    }
}

exports.run = function(room) {

    // INIT MEMORY
    //======================================================================
    initialize(room);


    // CACHE SOURCES
    //======================================================================
    if (room.memory.sources.length == 0) {
        var sources = room.find(FIND_SOURCES);
        room.memory.sources.push({
            id:             source.id,
            occupancy:      0,
            maxOccupancy:   Utils.calculateSourceMaxOccupancy(source),
            roadBuilt:      false,
        });
    }


    // SURVEY TOWERS
    //==============================
    var towers = room.find(FIND_MY_STRUCTURES, {
        filter: { structureType: STRUCTURE_TOWER },
    });
    if (room.memory.towers.length != towers.length) {
        for (var t in towers) {
            var tower = towers[t];
            if (!(_.find(room.memory.towers, {'id': tower.id}))) {
                room.memory.towers.push({
                    id:         tower.id,
                    target:     null,
                    state:      Globals.STATE_TWR_IDLE,
                    statePrev:  Globals.STATE_TWR_IDLE,
                });
            }
        }
    }


    // SURVEY SOURCES
    //==============================
    for (var s in room.memory.sources) {
        var source = Game.getObjectById(room.memory.sources[s].id);
        if (source != null) {
            var nearbyCreeps = source.pos.findInRange(FIND_CREEPS, 1);
            room.memory.sources[s].occupancy = nearbyCreeps.length;
        }
    }


    // SURVEY CREEP POPULATION
    //==============================
    room.memory.population = Object.assign({}, Globals.ROOM_MEMORY_OBJS.population);
    var creeps = room.find(FIND_MY_CREEPS, {
        filter: (creep) => {
            return (!creep.spawning);
        }
    });
    for (var c in creeps) {
        var creep = creeps[c];
        if (!(_.includes(room.memory.population[creep.memory.role], creep.id))) {
            room.memory.population[creep.memory.role].push(creep.id);
        }
    }


    // SPAWN NEW CREEPS
    //==============================
    CreepFactory.run(room);


    // EXECUTE CREEP ROLES
    //==============================
    for (var p in room.memory.population) {
        for (var c in room.memory.population[p]) {
            var creep = Game.getObjectById(room.memory.population[p][c]);
            if (creep != null) {
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
    //ConstructionFactory.run(room);

};
