/* rol.js
 *
 * Encapsulates all creep roles.
 *
 */ 
var Globals     = require('globals');
var Harvester   = require('role.harvester');
var Upgrader    = require('role.upgrader');
var Builder     = require('role.builder');
var Reclaimer   = require('role.reclaimer');
var Distributor = require('role.distributor');
var Soldier     = require('role.soldier');
var Special     = require('role.special');

var exports = module.exports = {};

// define role functions
var roles = {
    harvester:   Harvester,
    upgrader:    Upgrader,
    builder:     Builder,
    reclaimer:   Reclaimer,
    distributor: Distributor,
    soldier:     Soldier,
};

function initialize(creep) {
    // if any fields are missing,
    // something could've gone wrong with the creep's
    // memory, so just wipe it
    var missing = false;
    for (var f in Globals.CREEP_MEMORY) {
        missing = !(f in creep.memory);
        if (missing) break;
    }
    if (missing) {
        creep.memory = Object.assign({}, Globals.CREEP_MEMORY);
    }
}

exports.run = function(creep) {

    // init
    initialize(creep);
    var state = creep.memory.state;

    // announce change in state
    if (state != creep.memory.statePrev) {
        creep.say(Globals.STATE_STRING[state]);
    }

    // run the role's state machine
    state = roles[creep.memory.role].run(creep);


    // end
    creep.memory.statePrev = creep.memory.state;
    creep.memory.state = state;

};
