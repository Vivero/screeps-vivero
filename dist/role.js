/* rol.js
 *
 * Encapsulates all creep roles.
 *
 */ 
var Globals = require('globals');

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
    for (var f in Globals.CREEP_MEMORY) {
        missing = !(f in creep.memory);
        if (missing) break;
    }
    if (missing) {
        creep.memory = Object.assign({}, Globals.CREEP_MEMORY);
    }

    // if the state stack is empty, initialize it,
    // but warn because it should never be empty
    if (creep.memory.stateStack.length == 0) {
        console.log("WARNING! " + creep.name + ": empty state stack!");
        creep.memory.stateStack = Object.assign({}, Globals.CREEP_MEMORY.stateStack);
    }
}

exports.run = function(creep) {

    // init
    initialize(creep);
    var startingState = creep.memory.stateStack[creep.memory.stateStack.length - 1];

    // announce change in state
    if (startingState != creep.memory.statePrev) {
        creep.say(Globals.STATE_STRING[startingState]);
    }

    // run the role's state machine
    roles[creep.memory.role].run(creep);

    // end
    creep.memory.statePrev = startingState;

};
