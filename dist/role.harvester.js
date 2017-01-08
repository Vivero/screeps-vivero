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

var stateMachine = {};

// STATE_IDLE
//==============================================================================
stateMachine[Globals.STATE_IDLE] = function(creep) {

    // if carrying energy, store it
    if (creep.carry.energy > 0) {
        // find container
        var target = UtilsCreep.setContainerStoreTarget(creep);

        // or a spawn if no container found
        target = (target === null) ? UtilsCreep.setSpawnOrExtensionStoreTarget(creep) : target;

        if (target !== null) {
            creep.memory.stateStack.push(Globals.STATE_STORE);

            if (!creep.pos.inRangeTo(target, 1)) {
                creep.memory.stateStack.push(Globals.STATE_MOVE);
            }

            return;
        }
    }

    // otherwise look for a source to harvest
    else if (_.sum(creep.carry) < creep.carryCapacity) {
        var source = UtilsCreep.setSourceTarget(creep);
        if (source !== null) {
            creep.memory.stateStack.push(Globals.STATE_HARVEST);

            if (!creep.pos.inRangeTo(source, 1)) {
                creep.memory.stateStack.push(Globals.STATE_MOVE);
            }

            return;
        }
    }
};

// STATE_MOVE
//==============================================================================
stateMachine[Globals.STATE_MOVE] = function(creep) {

    // move to object if it's far away
    var target = Game.getObjectById(creep.memory.target);
    if (target !== null) {
        if (creep.pos.inRangeTo(target, 1)) {
            creep.memory.stateStack.pop();
        } else {
            var err = creep.moveTo(target);
        }
    }
};

// STATE_STORE
//==============================================================================
stateMachine[Globals.STATE_STORE] = function(creep) {

    // go idle if empty
    if (creep.carry.energy === 0) {
        creep.memory.stateStack.pop();
        return;
    }

    // otherwise transfer resources to container
    var target = UtilsCreep.setContainerStoreTarget(creep);

    // or a spawn if no container found
    target = (target === null) ? UtilsCreep.setSpawnOrExtensionStoreTarget(creep) : target;

    if (target !== null) {

        // move if the target is far
        if (!creep.pos.inRangeTo(target, 1)) {
            creep.memory.stateStack.push(Globals.STATE_MOVE);
            return;
        }

        var amount = Math.min(target.storeCapacity - _.sum(target.store), creep.carry.energy);
        var err = creep.transfer(target, RESOURCE_ENERGY, amount);
        if (err != OK) {
            creep.memory.target = null;
            creep.memory.stateStack.pop();
            console.log(creep.name + " transfer failed! (" + err + ")");
        }
        return;
    }
};

// STATE_HARVEST
//==============================================================================
stateMachine[Globals.STATE_HARVEST] = function(creep) {

    // go store if full
    if (_.sum(creep.carry) >= creep.carryCapacity) {
        creep.memory.stateStack.pop();
        return;
    }

    // harvest the source
    var source = UtilsCreep.setSourceTarget(creep);
    if (source !== null) {
        var err = creep.harvest(source);
        if (err != OK) {
            creep.memory.source = null;
            creep.memory.stateStack.pop();
            Utils.warn(creep.name + " harvest failed! (" + err + ")");
        }
    }
};

exports.run = function(creep) {

    // run the current state
    stateMachine[creep.memory.stateStack[creep.memory.stateStack.length - 1]](creep);

    // return the latest state
    return creep.memory.stateStack[creep.memory.stateStack.length - 1];
};

