/* role.builder.js
 *
 * Defines functionality of the builder role.
 *
 */ 
'use strict';

var Globals = require('globals');
var Utils = require('utils');
var UtilsCreep = require('utils.creep');

var exports = module.exports = {};

// finite state machine
var FSM = {};


// find a build site, and set it as the creep's target
function buildTarget(creep) {

    // find container or storage structure
    var target = UtilsCreep.setBuildTarget(creep);

    // return true if a source was found (it will be set in creep memory)
    return (target !== null);
}

// find a repairable structure, and set it as the creep's target
function repairTarget(creep) {

    // find container or storage structure
    var target = UtilsCreep.setRepairTarget(creep);

    // return true if a source was found (it will be set in creep memory)
    return (target !== null);
}

// find a potential energy container, and set it as the creep's target
function storageTarget(creep) {

    // find container or storage structure
    var target = UtilsCreep.setStorageOrContainerWithdrawTarget(creep);

    // return true if a source was found (it will be set in creep memory)
    return (target !== null);
}

// find a potential energy source, and set it as the creep's target
function sourceTarget(creep) {

    // find container or storage structure
    var target = UtilsCreep.setSourceTarget(creep);

    // return true if a source was found (it will be set in creep memory)
    return (target !== null);
}


// STATE_IDLE
//==============================================================================
FSM[Globals.STATE_IDLE] = function(creep) {

    // if carrying energy, use it
    if (creep.carry.energy > 0) {
        if (buildTarget(creep)) {
            creep.memory.stateStack.push(Globals.STATE_BUILD);
            return;
        } else if (repairTarget(creep)) {
            creep.memory.stateStack.push(Globals.STATE_REPAIR);
            return;
        }
    }

    // otherwise look for a source to harvest
    else if ((_.sum(creep.carry) < creep.carryCapacity) && sourceTarget(creep)) {
        if (storageTarget(creep)) {
            creep.memory.stateStack.push(Globals.STATE_WITHDRAW);
            return;
        } else if (sourceTarget(creep)) {
            creep.memory.stateStack.push(Globals.STATE_HARVEST);
            return;
        }
    }

    // if not, go hang out at the controller
    creep.memory.target = creep.room.controller.id;
    creep.memory.moveRange = 3;
    creep.memory.stateStack.push(Globals.STATE_MOVE);
};

// STATE_WITHDRAW
//==============================================================================
FSM[Globals.STATE_WITHDRAW] = function(creep) {

    // finish when full
    if (_.sum(creep.carry) >= creep.carryCapacity) {
        creep.memory.target = null;
        creep.memory.stateStack.pop();
        return;
    }

    // get the storage target from memory
    var target = UtilsCreep.getWithdrawableTarget(creep, RESOURCE_ENERGY);

    if (target !== null) {

        // move if the target is far
        if (!creep.pos.inRangeTo(target, 1)) {
            creep.memory.moveRange = 1;
            creep.memory.stateStack.push(Globals.STATE_MOVE);
            return;
        }

        // amount to withdraw is the lesser of what the creep can carry, or 
        // the amount the target has
        var amount = Math.min(creep.carryCapacity - _.sum(creep.carry), 
            target.store.energy);
        var err = creep.withdraw(target, RESOURCE_ENERGY, amount);
        if (err !== OK) {
            creep.memory.target = null;
            creep.memory.stateStack.pop();
            Utils.warn(creep.name + ".STATE_WITHDRAW: withdraw failed! (" + err + ")");
        }
    } else {
        creep.memory.target = null;
        creep.memory.stateStack.pop();
    }
};

// STATE_HARVEST
//==============================================================================
FSM[Globals.STATE_HARVEST] = function(creep) {

    // finish when full
    if (_.sum(creep.carry) >= creep.carryCapacity) {
        creep.memory.target = null;
        creep.memory.stateStack.pop();
        return;
    }

    // get the harvest target from memory
    var target = UtilsCreep.setSourceTarget(creep);

    if (target !== null) {
        
        // move if the target is far
        if (!creep.pos.inRangeTo(target, 1)) {
            creep.memory.moveRange = 1;
            creep.memory.stateStack.push(Globals.STATE_MOVE);
            return;
        }

        var err = creep.harvest(target);
        if (err !== OK) {
            creep.memory.target = null;
            creep.memory.stateStack.pop();
            Utils.warn(creep.name + ".STATE_HARVEST: harvest failed! (" + err + ")");
        }
    } else {
        creep.memory.target = null;
        creep.memory.stateStack.pop();
    }
};

// STATE_BUILD
//==============================================================================
FSM[Globals.STATE_BUILD] = function(creep) {

    // finish when empty
    if (creep.carry.energy === 0) {
        creep.memory.target = null;
        creep.memory.stateStack.pop();
        return;
    }

    // set the room controller as the target
    var target = UtilsCreep.setBuildTarget(creep);

    if (target !== null) {
        
        // move if the target is far
        if (!creep.pos.inRangeTo(target, 3)) {
            creep.memory.moveRange = 3;
            creep.memory.stateStack.push(Globals.STATE_MOVE);
            return;
        }

        var err = creep.build(target);
        if (err !== OK) {
            creep.memory.target = null;
            creep.memory.stateStack.pop();
            Utils.warn(creep.name + ".STATE_BUILD: build failed! (" + err + ")");
        }
    } else {
        creep.memory.target = null;
        creep.memory.stateStack.pop();
    }
};

// STATE_REPAIR
//==============================================================================
FSM[Globals.STATE_REPAIR] = function(creep) {

    // finish when empty
    if (creep.carry.energy === 0) {
        creep.memory.target = null;
        creep.memory.stateStack.pop();
        return;
    }

    // set the room controller as the target
    var target = UtilsCreep.setRepairTarget(creep);

    if (target !== null) {
        
        // move if the target is far
        if (!creep.pos.inRangeTo(target, 3)) {
            creep.memory.moveRange = 3;
            creep.memory.stateStack.push(Globals.STATE_MOVE);
            return;
        }

        var err = creep.repair(target);
        if (err !== OK) {
            creep.memory.target = null;
            creep.memory.stateStack.pop();
            Utils.warn(creep.name + ".STATE_REPAIR: repair failed! (" + err + ")");
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

        // min range from build/repair sites is 3. otherwise, it's 1
        var range = ('moveRange' in creep.memory) ? creep.memory.moveRange : 1;

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

