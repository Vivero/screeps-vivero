/* role.distributor.js
 *
 * Defines functionality of the distributor role.
 *
 */ 
'use strict';

var Globals = require('globals');
var Utils = require('utils');
var UtilsCreep = require('utils.creep');

var exports = module.exports = {};

// finite state machine
var FSM = {};

// declares the end of the tick cycle
var cycleComplete = false;


// find a potential storage target, and set it as the creep's target
function storageTarget(creep, includeStorage) {

    // find tower
    var target = UtilsCreep.setTowerStoreTarget(creep);
    
    // or spawn or extension
    target = (target === null) ? UtilsCreep.setSpawnOrExtensionStoreTarget(creep) : target;
    
    // or storage
    target = (target === null && includeStorage) ? UtilsCreep.setStorageStoreTarget(creep) : target;
    
    // return true if a target was found (it will be set in creep memory)
    return (target !== null);
}

// find a potential energy container, and set it as the creep's target
function containerWithdrawTarget(creep) {

    // find container or storage structure
    var target = UtilsCreep.setContainerWithdrawTarget(creep);

    // return true if a source was found (it will be set in creep memory)
    return (target !== null);
}

// find a potential energy container, and set it as the creep's target
function storageWithdrawTarget(creep) {

    // find container or storage structure
    var target = UtilsCreep.setStorageWithdrawTarget(creep);

    // return true if a source was found (it will be set in creep memory)
    return (target !== null);
}

// find a dropped resource, and set it as the creep's target
function pickupTarget(creep) {

    // find container or storage structure
    var target = UtilsCreep.setDroppedResourceTarget(creep);

    // return true if a source was found (it will be set in creep memory)
    return (target !== null);
}


// STATE_IDLE
//==============================================================================
FSM[Globals.STATE_IDLE] = function(creep) {

    // if carrying energy, store it in a tower, extension, or storage
    if (creep.carry.energy > 0 && storageTarget(creep, true)) {
        creep.memory.stateStack.push(Globals.STATE_STORE);
        return;
    }

    // or pickup dropped resources
    if (_.sum(creep.carry) < creep.carryCapacity && pickupTarget(creep)) {
        creep.memory.stateStack.push(Globals.STATE_PICKUP);
        return;
    }

    // or withdraw energy from a container
    if (_.sum(creep.carry) < creep.carryCapacity && containerWithdrawTarget(creep)) {
        creep.memory.stateStack.push(Globals.STATE_WITHDRAW);
        return;
    }

    // if we reach this point, then there were no containers to withdraw from.
    // try getting some energy from storage
    if (_.sum(creep.carry) < creep.carryCapacity && storageTarget(creep, false) && storageWithdrawTarget(creep)) {
        creep.memory.stateStack.push(Globals.STATE_WITHDRAW);
        return;
    }

    // go hang out at a spawn
    var targets = creep.room.find(FIND_MY_SPAWNS);
    if (targets.length && !creep.pos.inRangeTo(targets[0], 5)) {
        creep.memory.target = targets[0].id;
        creep.memory.targetRange = 3;
        creep.memory.stateStack.push(Globals.STATE_MOVE);
    } else {
        creep.memory.target = null;
    }

    // increase the idle tick cycles counter for distributors in this room if we reach this point
    creep.room.memory.stats.creepCycleCounter.distributor.idle += 1;

    cycleComplete = true;
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
            creep.memory.targetRange = 1;
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
        cycleComplete = true;
    } else {
        creep.memory.target = null;
        creep.memory.stateStack.pop();
    }
};

// STATE_STORE
//==============================================================================
FSM[Globals.STATE_STORE] = function(creep) {

    // finish when empty
    if (creep.carry.energy === 0) {
        creep.memory.target = null;
        creep.memory.stateStack.pop();
        return;
    }

    // get the storage target from memory
    var target = UtilsCreep.getStorableTarget(creep);

    if (target !== null) {

        // move if the target is far
        if (!creep.pos.inRangeTo(target, 1)) {
            creep.memory.targetRange = 1;
            creep.memory.stateStack.push(Globals.STATE_MOVE);
            return;
        }

        // amount to store is the lesser of what the creep is carrying, or 
        // the amount the target can store
        var amount = Math.min(target.storeCapacity - _.sum(target.store), creep.carry.energy);
        var err = creep.transfer(target, RESOURCE_ENERGY, amount);
        if (err !== OK) {
            creep.memory.target = null;
            creep.memory.stateStack.pop();
            Utils.warn(creep.name + ".STATE_STORE: transfer failed! (" + err + ")");
        }
        cycleComplete = true;
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
            if (err !== OK && err !== ERR_TIRED && err !== ERR_NO_PATH) {
                creep.memory.target = null;
                creep.memory.stateStack.pop();
                Utils.warn(creep.name + ".STATE_MOVE: moveTo failed! (" + err + ")");
            }
            cycleComplete = true;
        }
    } else {
        creep.memory.target = null;
        creep.memory.stateStack.pop();
    }
};

// STATE_PICKUP
//==============================================================================
FSM[Globals.STATE_PICKUP] = function(creep) {

    // finish when full
    if (_.sum(creep.carry) >= creep.carryCapacity) {
        creep.memory.target = null;
        creep.memory.stateStack.pop();
        return;
    }

    // get the storage target from memory
    var target = UtilsCreep.getPickupTarget(creep);

    if (target !== null) {

        // move if the target is far
        if (!creep.pos.inRangeTo(target, 1)) {
            creep.memory.targetRange = 1;
            creep.memory.stateStack.push(Globals.STATE_MOVE);
            return;
        }

        // pick up the resource
        var err = creep.pickup(target);
        if (err !== OK) {
            creep.memory.target = null;
            creep.memory.stateStack.pop();
            Utils.warn(creep.name + ".STATE_PICKUP: pickup failed! (" + err + ")");
        }
        cycleComplete = true;
    } else {
        creep.memory.target = null;
        creep.memory.stateStack.pop();
    }
};

exports.run = function(creep) {

    // run state machine until we hit a terminal condition
    cycleComplete = false
    var stateCounter = 0;

    // increase the tick cycles counter for distributors in this room
    creep.room.memory.stats.creepCycleCounter.distributor.total += 1;

    //console.log(creep.name + ": stack " + creep.memory.stateStack.length + " ----------");

    // run the state machine
    while (!cycleComplete) {

        // get current state
        var currentState = creep.memory.stateStack[creep.memory.stateStack.length - 1];
        //console.log(creep.name + ": running " + Globals.STATE_STRING[currentState]);
        
        // run
        FSM[currentState](creep);

        // protect against infinite loop
        stateCounter++;
        if (stateCounter >= 10) {
            Utils.warn(creep.name + " got stuck!");
            break;
        }
    }
    

    // return the latest state
    return creep.memory.stateStack[creep.memory.stateStack.length - 1];
};

