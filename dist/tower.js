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

// finite state machine
var FSM = {};

// this tower
var tower = null;


// find a hostile target, and set it as the tower's target
function hostileTarget(creep) {

    // find hostile creep
    var target = UtilsStructure.setHostileCreepTarget(creep);

    // return true if a target was found (it will be set in tower memory)
    return (target !== null);
}


// STATE_TWR_IDLE
//==============================================================================
FSM[Globals.STATE_TWR_IDLE] = function(towerInfo) {

    // if holding energy, check for hostile creeps
    if (tower.energy > 0 && hostileTarget(towerInfo)) {
        towerInfo.stateStack.push(Globals.STATE_TWR_ATTACK);
        return;
    }

}

// STATE_TWR_ATTACK
//==============================================================================
FSM[Globals.STATE_TWR_ATTACK] = function(towerInfo) {

    // finish when run out of energy
    if (tower.energy === 0) {
        towerInfo.target = null;
        towerInfo.stateStack.pop();
        return;
    }

    // set hostile target
    var target = UtilsStructure.setHostileCreepTarget(towerInfo);

    if (target !== null) {
        tower.attack(target);
    }

}


exports.run = function(towerInfo) {

    // initialize the state
    tower = Game.getObjectById(towerInfo.id);
    if (!tower) return;

    // get current state
    var currentState = towerInfo.stateStack[towerInfo.stateStack.length - 1];

    // run
    FSM[currentState](towerInfo);

    // return the latest state
    return towerInfo.stateStack[towerInfo.stateStack.length - 1];
};
