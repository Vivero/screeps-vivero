/* role.special.js
 *
 * Defines functionality of the special role.
 *
 */ 
'use strict';

var Globals = require('globals');
var Utils = require('utils');
var UtilsCreep = require('utils.creep');

var exports = module.exports = {};

var FSM = {};

// STATE_IDLE
//==============================================================================
FSM[Globals.STATE_IDLE] = function(creep) {

    // if not, go hang out at the controller
    if (!creep.pos.inRangeTo(creep.room.controller, 5)) {
        creep.memory.target = creep.room.controller.id;
        creep.memory.targetRange = 5;
        creep.memory.stateStack.push(Globals.STATE_MOVE);
    } else {
        creep.memory.target = null;
    }
    
};

// STATE_MOVE
//==============================================================================
FSM[Globals.STATE_MOVE] = function(creep) {

    // move to object if it's far away
    var target = Game.getObjectById(creep.memory.target);
    
    if (target !== null) {

        // how far away should we approach the target
        var range = creep.memory.targetRange;

        if (creep.pos.inRangeTo(target, range)) {
            creep.memory.stateStack.pop();
        } else {
            var err = creep.moveTo(target);
            if (err !== OK && err !== ERR_TIRED && err !== ERR_NO_PATH) {
                creep.memory.target = null;
                creep.memory.stateStack.pop();
                Utils.warn(creep.name + ".STATE_MOVE: moveTo failed! (range = " + 
                    range + ") (err = " + err + ")");
            }
        }
    } else {
        creep.memory.target = null;
        creep.memory.stateStack.pop();
    }
};

exports.run = function(creep) {

    // run the current state
    FSM[creep.memory.stateStack[creep.memory.stateStack.length - 1]](creep);

    // return the latest state
    return creep.memory.stateStack[creep.memory.stateStack.length - 1];
};

