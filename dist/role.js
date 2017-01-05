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

exports.run = function(creep) {

    // initialize the state
    if (!('state' in creep.memory) || creep.memory.state == null) {
        creep.memory.state = Globals.STATE_IDLE;
        creep.memory.statePrev = Globals.STATE_IDLE;
    }
    var state = creep.memory.state;

    // failsafe: in case memory gets wiped
    if (!('role' in creep.memory) || ('role' in creep.memory && !(creep.memory.role in roles))) {
        creep.memory.role = 'harvester';
        creep.memory.state = Globals.STATE_IDLE;
        creep.memory.statePrev = Globals.STATE_IDLE;
    }

    // override behavior
    if (('override' in creep.memory) && creep.memory.override) {
        creep.moveTo(Game.flags["Rally Alpha"]);
    }
    else {

        // announce change in state
        if (state != creep.memory.statePrev) {
            creep.say(Globals.STATE_STRING[state]);
        }

        // run the role's state machine
        state = roles[creep.memory.role].run(creep);

    }
    

    // end
    creep.memory.statePrev = creep.memory.state;
    creep.memory.state = state;

};
