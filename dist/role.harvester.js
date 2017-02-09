/* role.harvester.js
 *
 * Defines functionality of the harvester role.
 *
 */ 
'use strict';

var Globals = require('globals');
var Utils = require('utils');
var UtilsCreep = require('utils.creep');

var exports = module.exports = {};

// finite state machine
var FSM = {};

// get this creep's WORK body part count
var workParts = 0;


// find a potential storage target, and set it as the creep's target
function storageTarget(creep) {

    // find container or spawn or extension
    //var target = UtilsCreep.setContainerStoreTarget(creep);
    var target = UtilsCreep.setSpawnExtensionContainerStoreTarget(creep);
    
    // or spawn or extension
    //target = (target === null) ? UtilsCreep.setSpawnOrExtensionStoreTarget(creep) : target;
    
    // or storage
    target = (target === null) ? UtilsCreep.setStorageStoreTarget(creep) : target;
    
    // return true if a target was found (it will be set in creep memory)
    return (target !== null);
}

// find a potential energy source, and set it as the creep's target
function sourceTarget(creep) {

    // find container
    var target = UtilsCreep.setSourceTarget(creep);

    // return true if a source was found (it will be set in creep memory)
    return (target !== null);
}


// STATE_IDLE
//==============================================================================
FSM[Globals.STATE_IDLE] = function(creep) {

    // if carrying energy, store it
    if (creep.carry.energy > 0 && storageTarget(creep)) {
        creep.memory.stateStack.push(Globals.STATE_STORE);
        return;
    }

    // otherwise look for a source to harvest
    else if ((_.sum(creep.carry) < creep.carryCapacity) && sourceTarget(creep)) {
        creep.memory.stateStack.push(Globals.STATE_HARVEST);
        return;
    }

    // if not, go hang out at a spawn
    var targets = creep.room.find(FIND_MY_SPAWNS);
    if (targets.length && !creep.pos.inRangeTo(targets[0], 5)) {
        creep.memory.target = targets[0].id;
        creep.memory.targetRange = 3;
        creep.memory.stateStack.push(Globals.STATE_MOVE);
    } else {
        creep.memory.target = null;
    }
};

// STATE_STORE
//==============================================================================
FSM[Globals.STATE_STORE] = function(creep) {

    // go idle if empty
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
            creep.memory.targetRange = 1;
            creep.memory.stateStack.push(Globals.STATE_MOVE);
            return;
        }

        var err = creep.harvest(target);
        if (err !== OK) {
            creep.memory.target = null;
            creep.memory.stateStack.pop();
            Utils.warn(creep.name + ".STATE_HARVEST: harvest failed! (" + err + ")");
        } else {
            creep.room.memory.stats.energyIntake += 2 * workParts;
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

    // get creep stats
    workParts = UtilsCreep.getBodyPartTypeCount(creep, WORK);

    // run the current state
    FSM[creep.memory.stateStack[creep.memory.stateStack.length - 1]](creep);

    // return the latest state
    return creep.memory.stateStack[creep.memory.stateStack.length - 1];
};

