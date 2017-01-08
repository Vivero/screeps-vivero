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

var stateMachine = {};

// STATE_IDLE
//==============================================================================
stateMachine[Globals.STATE_IDLE] = function(creep) {

    // if carrying energy, store it
    if (creep.carry.energy > 0) {
        var target = UtilsCreep.setContainerStoreTarget(creep);
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
        var source = UtilsCreep.setSource(creep);
        if (source !== null) {
            creep.memory.stateStack.pop();
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
    if (creep.memory.source !== null) {
        var source = Game.getObjectById(creep.memory.source);
        if (source !== null) {
            if (creep.pos.inRangeTo(source, 1)) {
                creep.memory.stateStack.pop();
            } else {
                var err = creep.moveTo(source);
            }
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

    // transfer resources
    var target = UtilsCreep.setContainerStoreTarget(creep);
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
    }
};

// STATE_HARVEST
//==============================================================================
stateMachine[Globals.STATE_HARVEST] = function(creep) {

    // go store if full
    if (_.sum(creep.carry) >= creep.carryCapacity) {
        creep.memory.stateStack.pop();
        creep.memory.stateStack.push(Globals.STATE_STORE);
        return;
    }

    // harvest the source
    if (creep.memory.source !== null) {
        var source = UtilsCreep.setSource(creep);
        if (source !== null) {

            var err = creep.harvest(source);
            if (err === ERR_NOT_IN_RANGE) {
                creep.memory.stateStack.push(Globals.STATE_MOVE);
            } else if (err != OK) {
                creep.memory.source = null;
                creep.memory.stateStack.pop();
                creep.memory.stateStack.push(Globals.STATE_IDLE);
            }
        }

        else {
            creep.memory.source = null;
            creep.memory.stateStack.pop();
            creep.memory.stateStack.push(Globals.STATE_IDLE);
        }
    }
};

exports.run = function(creep) {

    // run the current state
    stateMachine[creep.memory.stateStack[creep.memory.stateStack.length - 1]](creep);

    // return the latest state
    return creep.memory.stateStack[creep.memory.stateStack.length - 1];
};

