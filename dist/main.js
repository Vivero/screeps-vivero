/* main.js
 *
 * Entry point routine for Screeps.
 *
 */ 
'use strict';

var Globals = require('globals');
var RoomGovernor = require('room.governor');
var Utils = require('utils');

function initialize() {

    
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
    if (Game.cpu.getUsed() > (Game.cpu.tickLimit * 0.9) ||
        Game.cpu.bucket < 1000) {
        Utils.err("WARNING: CPU USAGE! used: " + Game.cpu.getUsed().toFixed(2) + ", limit: " + Game.cpu.tickLimit + ", bucket: " + Game.cpu.bucket);
    }
}


module.exports.loop = function () {

    // INITIALIZE
    //==================================
    initialize();

    // EXECUTE ROOM CONTROL
    //==================================
    for (var r in Game.rooms) {
        RoomGovernor.run(Game.rooms[r]);
    }

    // CLEANUP
    //==================================
    cleanup();

};
