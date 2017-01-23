/* role.distributor.js
 *
 * Defines functionality of the distributor role.
 *
 */ 
'use strict';

var Globals = require('globals');
var Utils = require('utils');

var exports = module.exports = {};

// finite state machine
var FSM = {};


// find a potential storage target, and set it as the creep's target
function storageTarget(creep) {

    // find spawn or extension
    var target = UtilsCreep.setSpawnOrExtensionStoreTarget(creep);
    
    // or a tower if no spawn found
    target = (target === null) ? UtilsCreep.setTowerStoreTarget(creep) : target;
    
    // return true if a target was found (it will be set in creep memory)
    return (target !== null);
}

// find a potential energy container, and set it as the creep's target
function withdrawTarget(creep) {

    // find container or storage structure
    var target = UtilsCreep.setStorageOrContainerWithdrawTarget(creep);

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
    } else {
        creep.memory.target = null;
        creep.memory.stateStack.pop();
    }
};






















exports.run = function(creep) {

    // initialize the state
    var state = creep.memory.state;

    // state machine
    switch (state) {

        // State: IDLE
        //==========================
        case Globals.STATE_IDLE:
            var target = null;
            var source = null;

            // check if there are tower sites to transfer to
            target = Utils.setTowerTarget(creep);
            if (target !== null) {
                if (creep.carry.energy > 0) {
                    state = Globals.STATE_DISTRIBUTE;
                } else {
                    state = Globals.STATE_WITHDRAW;
                }
                break;
            }

            // check if there are dropped resources to pick up
            target = Utils.setDroppedResourceTarget(creep, RESOURCE_ENERGY);
            if (target !== null) {
                if (target.amount > (creep.carryCapacity - _.sum(creep.carry))) {
                    state = Globals.STATE_STORE;
                } else {
                    state = Globals.STATE_PICKUP;
                }
            }
            break;
            

        // State: DISTRIBUTE
        //==========================
        case Globals.STATE_DISTRIBUTE:
            var target = null;

            if (creep.carry.energy <= 0) {
                state = Globals.STATE_IDLE;
                break;
            }

            target = Utils.setTowerTarget(creep);
            if (target !== null) {
                if (creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(target);
                }
            } else {
                state = Globals.STATE_IDLE;
            }
            break;
            

        // State: WITHDRAW
        //==========================
        case Globals.STATE_WITHDRAW:
            var target = Utils.setContainerTarget(creep, RESOURCE_ENERGY);
            if (target !== null) {
                var withdrawAmount = Math.min(creep.carryCapacity - _.sum(creep.carry), target.store[RESOURCE_ENERGY]);
                if (creep.withdraw(target, RESOURCE_ENERGY, withdrawAmount) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(target);
                }
            } else {
                state = Globals.STATE_IDLE;
            }

            if (creep.carry.energy >= creep.carryCapacity) {
                var target = Utils.setTowerTarget(creep);
                if (target !== null) {
                    state = Globals.STATE_DISTRIBUTE;
                } else {
                    state = Globals.STATE_IDLE;
                }
            }
            break;
            

        // State: PICKUP
        //==========================
        case Globals.STATE_PICKUP:
            var target = Utils.setDroppedResourceTarget(creep, RESOURCE_ENERGY);
            if (target !== null) {
                var err = creep.pickup(target);
                if (err == ERR_NOT_IN_RANGE) {
                    creep.moveTo(target);
                } else if (err == OK || err == ERR_FULL) {
                    state = Globals.STATE_STORE;
                } else {
                    console.log(creep.name + " error: " + err);
                }
            } else {
                state = Globals.STATE_IDLE;
            }

            break;
            

        // State: STORE
        //==========================
        case Globals.STATE_STORE:
            if (creep.carry.energy <= 0) {
                state = Globals.STATE_IDLE;
                break;
            }

            var target = Utils.setStorageTarget(creep);
            if (target !== null) {
                if (creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(target);
                }
            } else {
                state = Globals.STATE_IDLE;
            }

            break;
            

        //==========================
        default:
            state = Globals.STATE_IDLE;
    }

    return state;
};
