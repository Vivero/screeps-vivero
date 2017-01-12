/* role.soldier.js
 *
 * Defines functionality of the soldier role.
 * Soldiers attack hostiles by melee.
 *
 */ 
'use strict';

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

            // check for hostile creeps
            target = Utils.Offense.setHostileCreepTarget(creep);
            if (target != null) {
                state = Globals.STATE_ATTACK;
                break;
            }

            // check for rally flags
            if ('rally' in Game.flags) {
                creep.memory.flag = 'rally';
                state = Globals.STATE_RALLY;
                break;
            }

            break;


        // State: RALLY
        //==========================
        case Globals.STATE_RALLY:
            creep.moveTo(Game.flags[creep.memory.flag]);

            // check for hostile creeps
            var target = null;
            target = Utils.Offense.setHostileCreepTarget(creep);
            if (target != null) {
                state = Globals.STATE_ATTACK;
                break;
            }

            break;


        // State: ATTACK
        //==========================
        case Globals.STATE_ATTACK:
            creep.moveTo(creep.memory.flag);

            // check for hostile creeps
            var target = null;
            target = Utils.Offense.setHostileCreepTarget(creep);
            if (target != null) {
                if (creep.attack(target) == ERR_NOT_IN_RANGE) {
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

