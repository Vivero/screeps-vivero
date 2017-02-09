/* role.soldier.js
 *
 * Defines functionality of the soldier role.
 * Soldiers attack hostiles by melee.
 *
 */ 
'use strict';

var Globals = require('globals');
var Utils = require('utils');
var UtilsCreep = require('utils.creep');
var UtilsOffense = require('utils.offense');

var exports = module.exports = {};

// finite state machine
var FSM = {};


// find a potential energy source, and set it as the creep's target
function hostileTarget(creep) {

    // find hostile creeps
    var target = UtilsOffense.setHostileCreepTarget(creep);

    // return true if a source was found (it will be set in creep memory)
    return (target !== null);
}


// STATE_IDLE
//==============================================================================
FSM[Globals.STATE_IDLE] = function(creep) {

    // if hostiles present, attack
    if (hostileTarget(creep)) {
        creep.memory.stateStack.push(Globals.STATE_ATTACK);

        var target = UtilsCreep.getAttackableTarget(creep);

        if (!creep.pos.inRangeTo(target, 1)) {
            creep.memory.stateStack.push(Globals.STATE_MOVE);
        }
        return;
    }

    // if not, go hang out at a spawn
    var targets = creep.room.find(FIND_MY_SPAWNS);
    if (targets.length && !creep.pos.inRangeTo(targets[0], 5)) {
        creep.memory.target = targets[0].id;
        creep.memory.targetRange = 5;
        creep.memory.stateStack.push(Globals.STATE_MOVE);
    } else {
        creep.memory.target = null;
    }
};

// STATE_ATTACK
//==============================================================================
FSM[Globals.STATE_ATTACK] = function(creep) {

    // get the hostile target from memory
    var target = UtilsCreep.getAttackableTarget(creep);

    if (target !== null) {
        
        // move if the target is far
        if (!creep.pos.inRangeTo(target, 1)) {
            creep.memory.targetRange = 1;
            creep.memory.stateStack.push(Globals.STATE_MOVE);
            return;
        }

        var err = creep.attack(target);
        if (err !== OK) {
            creep.memory.target = null;
            creep.memory.stateStack.pop();
            Utils.warn(creep.name + ".STATE_ATTACK: attack failed! (" + err + ")");
        }
    } else {
        creep.memory.target = null;
        creep.memory.stateStack.pop();
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
            if (err !== OK && err !== ERR_TIRED) {
                creep.memory.target = null;
                creep.memory.stateStack.pop();
                if (err !== ERR_NO_PATH) {
                    Utils.warn(creep.name + ".STATE_MOVE: moveTo failed! (" + err + ")");
                }
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


