/* role.builder.js
 *
 * Defines functionality of the builder role.
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
            // check if there are sites to build
            if (creep.carry.energy > 0) {
                var target = Utils.setBuildTarget(creep);
                if (target != null) {
                    state = Globals.STATE_BUILD;
                } else {
                    target = Utils.setRepairTarget(creep);
                    if (target != null) {
                        state = Globals.STATE_REPAIR;
                    } else {
                        state = Globals.STATE_IDLE;
                    }
                }
            } else {
                // find either a source or a storage container
                var source = Utils.setSourceTarget(creep);
                if (source == null) {
                    source = Utils.setContainerTarget(creep, RESOURCE_ENERGY);
                }

                if (source != null) {
                    state = Globals.STATE_HARVEST;
                } else {
                    state = Globals.STATE_IDLE;
                }
            }
            break;
            

        // State: BUILD
        //==========================
        case Globals.STATE_BUILD:
            creep.memory.lastAction = Globals.ACTION_BUILDING;

            var target = Utils.setBuildTarget(creep);

            // special logic if building a rampart
            if (target != null && target.structureType === STRUCTURE_RAMPART) {
                var err = creep.build(target);
                if (err == ERR_NOT_IN_RANGE) {
                    creep.moveTo(target);
                } else if (err == OK) {
                    // assume rampart is built in a single shot. proceed directly to REPAIR
                    console.log(creep.name + " built a rampart");
                    creep.memory.target = null;
                    state = Globals.STATE_REPAIR;
                }
            }
            // otherwise just build it
            else if (target != null) {
                if (creep.build(target) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(target);
                }
            }
            // go idle if no target found
            else {
                state = Globals.STATE_IDLE;
            }

            // harvest when energy runs out
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

            // resume activity when energy is full
            if (creep.carry.energy >= creep.carryCapacity) {
                /*switch (creep.memory.lastAction) {
                    case Globals.ACTION_BUILDING:
                        state = Globals.STATE_BUILD;
                        break;

                    case Globals.ACTION_REPAIRING:
                        state = Globals.STATE_REPAIR;
                        break;

                    default:
                        state = Globals.STATE_IDLE;
                }*/
                state = Globals.STATE_IDLE;
            }
            break;
            

        // State: REPAIR
        //==========================
        case Globals.STATE_REPAIR:
            creep.memory.lastAction = Globals.ACTION_REPAIRING;

            var target = Utils.setRepairTarget(creep);
            if (target != null) {
                if (creep.repair(target) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(target);
                }
            } else {
                state = Globals.STATE_IDLE;
            }

            if (creep.carry.energy <= 0) {
                state = Globals.STATE_HARVEST;
            }
            break;


        //==========================
        default:
            state = Globals.STATE_IDLE;
    }

    return state;
};
