/* rol.js
 *
 * Encapsulates all creep roles.
 *
 */
'use strict';

var Globals = require('globals');
var Utils = require('utils');

var exports = module.exports = {};

// define role functions from source files
var roles = {};
for (var r in Globals.CREEP_ROLES) {
    var role = Globals.CREEP_ROLES[r];
    roles[role] = require('role.' + role);
}

function initialize(creep) {
    // if any fields are missing,
    // something could've gone wrong with the creep's
    // memory, so just wipe it
    var missing = false;
    var blankMemory = Globals.getCreepRoleMemory(creep.role);
    for (var f in blankMemory) {
        missing = !(f in creep.memory);
        if (missing) break;
    }
    if (missing) {
        Utils.warn(creep.name + ".initialize: memory was corrupted!");
        creep.memory = blankMemory;
    }

    // if the state stack is empty, initialize it,
    // but warn because it should never be empty
    if (creep.memory.stateStack.length === 0) {
        Utils.warn(creep.name + ".initialize: empty state stack!");
        creep.memory.stateStack = Object.assign({}, Globals.CREEP_MEMORY.stateStack);
    }
}

exports.run = function(creep) {

    // init
    initialize(creep);
    var startingState = creep.memory.stateStack[creep.memory.stateStack.length - 1];

    // announce change in state
    if (startingState != Globals.STATE_IDLE && 
        startingState != Globals.STATE_MOVE &&
        startingState != creep.memory.statePrev) {
        creep.say(Globals.STATE_STRING[startingState]);
    }

    // run the role's state machine
    try {
        roles[creep.memory.role].run(creep);
    } catch (e) {
        Utils.err(creep.name + " (" + creep.memory.role + ") unexpected exception!\n" + e.stack);
    }
    

    // end
    creep.memory.statePrev = startingState;

};
