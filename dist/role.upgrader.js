/* role.upgrader.js
 *
 * Defines functionality of the upgrader role.
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
            // check if there are storage sites to transfer to
            if (creep.carry.energy > 0) {
                state = Globals.STATE_UPGRADE;
            } else {
                var source = Utils.setSourceTarget(creep);
                if (source != null) {
                    state = Globals.STATE_HARVEST;
                } else {
                    state = Globals.STATE_IDLE;
                }
            }
            break;
            

        // State: UPGRADE
        //==========================
        case Globals.STATE_UPGRADE:
            var target = creep.room.controller;
            if (creep.upgradeController(target) == ERR_NOT_IN_RANGE) {
                creep.moveTo(target);
            }

            if (creep.carry.energy <= 0) {
                state = Globals.STATE_HARVEST;
            }
            break;
            

        // State: HARVEST
        //==========================
        case Globals.STATE_HARVEST:
            var target = Utils.setSourceTarget(creep);
            if (target != null) {
                if (creep.harvest(target) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(target);
                }
            } else {
                // try to find a storage container
                target = Utils.setContainerTarget(creep, RESOURCE_ENERGY);
                if (target != null) {
                    var withdrawAmount = creep.carryCapacity - _.sum(creep.carry);
                    if (creep.withdraw(target, RESOURCE_ENERGY, withdrawAmount) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(target);
                    }
                } else {
                    state = Globals.STATE_IDLE;
                }
            }

            if (creep.carry.energy >= creep.carryCapacity) {
                state = Globals.STATE_UPGRADE;
            }
            break;
            

        //==========================
        default:
            state = Globals.STATE_IDLE;
    }

    return state;
};

