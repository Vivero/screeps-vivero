/* role.distributor.js
 *
 * Defines functionality of the distributor role.
 *
 */ 
var Globals = require('globals');
var Utils = require('utils');

var exports = module.exports = {};

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
            if (target != null) {
                if (creep.carry.energy > 0) {
                    state = Globals.STATE_DISTRIBUTE;
                } else {
                    state = Globals.STATE_WITHDRAW;
                }
                break;
            }

            // check if there are dropped resources to pick up
            target = Utils.setDroppedResourceTarget(creep, RESOURCE_ENERGY);
            if (target != null) {
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
            if (target != null) {
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
            if (target != null) {
                var withdrawAmount = Math.min(creep.carryCapacity - _.sum(creep.carry), target.store[RESOURCE_ENERGY]);
                if (creep.withdraw(target, RESOURCE_ENERGY, withdrawAmount) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(target);
                }
            } else {
                state = Globals.STATE_IDLE;
            }

            if (creep.carry.energy >= creep.carryCapacity) {
                var target = Utils.setTowerTarget(creep);
                if (target != null) {
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
            if (target != null) {
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
            if (target != null) {
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
