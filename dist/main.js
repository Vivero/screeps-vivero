/* main.js
 *
 * Entry point routine for Screeps.
 *
 */ 
'use strict';

var Globals = require('globals');
var RoomControl = require('room_control');
var Utils = require('utils');

function initialize() {

    // initialize commands buffer
    if (!('commands' in Memory)) {
        Memory.commands = Object.assign({}, Globals.GAME_MEMORY.commands);
    }


    // survey the creep population
    for (var r in Game.rooms) {
        Game.rooms[r].memory.population = Object.assign({}, Globals.ROOM_MEMORY_OBJS.population);
    }
    for (var c in Game.creeps) {
        var creep = Game.creeps[c];
        var room = creep.room;
        if (!(_.includes(room.memory.population[creep.memory.role], creep.id))) {
            room.memory.population[creep.memory.role].push(creep.id);
        }
    }
}

function cleanup() {
    // clean up creep memory
    for (var name in Memory.creeps) {
        if (!Game.creeps[name]) {
            delete Memory.creeps[name];
            console.log("Clearing creep memory: ", name);
        }
    }

    // check for CPU overruns
    if (Game.cpu.getUsed() > (Game.cpu.tickLimit * 0.9)) {
        Utils.err("WARNING: CPU OVERRUN! used: " + Game.cpu.getUsed().toFixed(2) + ", limit: " + Game.cpu.tickLimit + ", bucket: " + Game.cpu.bucket);
    }
}


module.exports.loop = function () {

    // INITIALIZE
    //==================================
    initialize();

    // EXECUTE ROOM CONTROL
    //==================================
    for (var r in Game.rooms) {
        RoomControl.run(Game.rooms[r]);
    }

    // CLEANUP
    //==================================
    cleanup();

};
