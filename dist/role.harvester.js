/* role.harvester.js
 *
 * Defines functionality of the harvester role.
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
                var target = Utils.setStorageTarget(creep);
                if (target != null) {
                    state = Globals.STATE_STORE;
                } else {
                    state = Globals.STATE_IDLE;
                }
            } else {
                var source = Utils.setSourceTarget(creep);
                if (source != null) {
                    state = Globals.STATE_HARVEST;
                } else {
                    state = Globals.STATE_IDLE;
                }
            }
            break;
            

        // State: STORE
        //==========================
        case Globals.STATE_STORE:
            var target = Utils.setStorageTarget(creep);
            if (target != null) {
                if (creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(target);
                }
            } else {
                state = Globals.STATE_IDLE;
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
                state = Globals.STATE_IDLE;
            }

            if (creep.carry.energy >= creep.carryCapacity) {
                var target = Utils.setStorageTarget(creep);
                if (target != null) {
                    state = Globals.STATE_STORE;
                } else {
                    state = Globals.STATE_IDLE;
                }
            }
            break;
            

        //==========================
        default:
            state = Globals.STATE_IDLE;
    }

    return state;
};
