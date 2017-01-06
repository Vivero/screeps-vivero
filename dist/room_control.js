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

exports.control = {

    /** @param {Room} room **/
    run: function(room) {

        // INIT MEMORY
        //======================================================================
        /*for (var m in Globals.ROOM_MEMORY) {
            if (!(m in room.memory)) {
                room.memory[m] = JSON.parse(JSON.stringify(Globals.ROOM_MEMORY[m]));
            }
        }*/
        var memInitFields = [
            'population',
            'autoBuild',
        ];
        for (var f in memInitFields) {
            var field = memInitFields[f];
            if (!(field in room.memory)) {
                room.memory[field] = Object.assign({}, Globals.ROOM_MEMORY[field]);
            }
        }


        // CACHE SOURCES
        //======================================================================
        if (!('sources' in room.memory)) {
            room.memory.sources = [];

            var sources = room.find(FIND_SOURCES);
            for (var s in sources) {
                var source = sources[s];
                var sourceInfo = {
                    id: source.id,
                    occupancy: 0,
                    maxOccupancy: Utils.calculateSourceMaxOccupancy(source),
                    roadBuilt: false,
                };
                room.memory.sources.push(sourceInfo);
            }
        }


        // SURVEY TOWERS
        //==============================
        if (!('towers' in room.memory)) {
            room.memory.towers = [];
        }
        var towers = room.find(FIND_MY_STRUCTURES, {
            filter: (structure) => {
                return (structure.structureType === STRUCTURE_TOWER);
            }
        });
        if (room.memory.towers.length < towers.length) {
            for (var t in towers) {
                var tower = towers[t];
                if (!(_.find(room.memory.towers, {'id': tower.id}))) {
                    var towerInfo = {
                        id: tower.id,
                        target: null,
                        state: Globals.STATE_TWR_IDLE,
                        statePrev: Globals.STATE_TWR_IDLE,
                    }
                    room.memory.towers.push(towerInfo);
                }
            }
        }


        // SURVEY SOURCES
        //==============================
        for (var s in room.memory.sources) {
            var sourceInfo = room.memory.sources[s];
            var source = Game.getObjectById(sourceInfo.id);
            var nearbyCreeps = source.pos.findInRange(FIND_MY_CREEPS, 1);
            room.memory.sources[s].occupancy = nearbyCreeps.length;
        }


        // SURVEY CREEP POPULATION
        //==============================
        room.memory.population = Object.assign({}, Globals.ROOM_MEMORY.population);
        var creeps = room.find(FIND_MY_CREEPS, {
            filter: (creep) => {
                return (!creep.spawning);
            }
        });
        for (var c in creeps) {
            var creep = creeps[c];
            if (!_.includes(room.memory.population[creep.memory.role], creep.id)) {
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

    }

};