/* tower.js
 *
 * Defines functionality of towers.
 *
 */ 
'use strict';

var Globals = require('globals');
var Utils = require('utils');
var UtilsStructure = require('utils.structure');

var exports = module.exports = {};

exports.run = function(towerInfo) {

    // initialize the state
    var tower = Game.getObjectById(towerInfo.id);
    if (!tower) return;
    
    var state = towerInfo.state;


    // state machine
    switch (state) {

        // State: IDLE
        //==========================
        case Globals.STATE_TWR_IDLE:
            var target = null;

            // check for hostile creeps
            target = UtilsStructure.setHostileCreepTarget(towerInfo);
            if (target !== null && tower.energy > 0) {
                state = Globals.STATE_TWR_ATTACK;
                break;
            }

            // check if there are repair sites
            target = UtilsStructure.setRepairTarget(towerInfo);
            if (target !== null && tower.energy > 0) {
                state = Globals.STATE_TWR_REPAIR;
                break;
            }
            break;
            

        // State: REPAIR
        //==========================
        case Globals.STATE_TWR_REPAIR:
            var target = null;

            if (tower.energy <= 0) {
                state = Globals.STATE_TWR_IDLE;
                break;
            }

            target = UtilsStructure.setRepairTarget(towerInfo);
            if (target !== null) {
                tower.repair(target);
            } else {
                state = Globals.STATE_TWR_IDLE;
            }
            break;
            

        // State: ATTACK
        //==========================
        case Globals.STATE_TWR_ATTACK:
            var target = null;

            if (tower.energy <= 0) {
                state = Globals.STATE_TWR_IDLE;
                break;
            }

            target = UtilsStructure.setHostileCreepTarget(towerInfo);
            if (target !== null) {
                tower.attack(target);
            } else {
                state = Globals.STATE_TWR_IDLE;
            }
            break;
            

        //==========================
        default:
            state = Globals.STATE_TWR_IDLE;
    }

    // end
    towerInfo.statePrev = towerInfo.state;
    towerInfo.state = state;
};
