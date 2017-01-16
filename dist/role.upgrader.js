/* role.upgrader.js
 *
 * Defines functionality of the upgrader role.
 *
 */ 
'use strict';

var Globals = require('globals');
var Utils = require('utils');
var UtilsCreep = require('utils.creep');

var exports = module.exports = {};

// finite state machine
var FSM = {};


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
        creep.memory.stateStack.push(Globals.STATE_UPGRADE);
        return;
    }

    // otherwise look for a source to harvest
    else if ((_.sum(creep.carry) < creep.carryCapacity)) {
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

// STATE_UPGRADE
//==============================================================================
FSM[Globals.STATE_UPGRADE] = function(creep) {

    // finish when empty
    if (creep.carry.energy === 0) {
        creep.memory.target = null;
        creep.memory.stateStack.pop();
        return;
    }

    // set the room controller as the target
    var target = creep.room.controller;
        
    // move if the target is far
    if (!creep.pos.inRangeTo(target, 3)) {
        creep.memory.stateStack.push(Globals.STATE_MOVE);
        return;
    }

    var err = creep.upgradeController(target);
    if (err !== OK) {
        creep.memory.target = null;
        creep.memory.stateStack.pop();
        Utils.warn(creep.name + ".STATE_UPGRADE: upgradeController failed! (" + err + ")");
    }
};

// STATE_MOVE
//==============================================================================
FSM[Globals.STATE_MOVE] = function(creep) {

    // move to object if it's far away
    var target = Game.getObjectById(creep.memory.target);
    
    if (target !== null) {

        // min range from controller is 3. otherwise, it's 1
        var range = (target.id === creep.room.controller.id) ? 3 : 1;

        if (creep.pos.inRangeTo(target, range)) {
            creep.memory.stateStack.pop();
        } else {
            var err = creep.moveTo(target);
            if (err !== OK && err !== ERR_TIRED && err !== ERR_NO_PATH) {
                creep.memory.target = null;
                creep.memory.stateStack.pop();
                Utils.warn(creep.name + ".STATE_MOVE: moveTo failed! (" + err + ")");
            }
        }
    }
};

exports.run = function(creep) {

    // run the current state
    FSM[creep.memory.stateStack[creep.memory.stateStack.length - 1]](creep);

    // return the latest state
    return creep.memory.stateStack[creep.memory.stateStack.length - 1];
};

