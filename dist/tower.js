/* tower.js
 *
 * Defines functionality of towers.
 *
 */ 
'use strict';

var Globals = require('globals');
var Utils = require('utils');
var UtilsTower = require('utils.tower');

var exports = module.exports = {};

// finite state machine
var FSM = {};

// this tower
var tower = null;


// find a hostile target, and set it as the tower's target
function hostileTarget(towerInfo) {

    // find hostile creep
    var target = UtilsTower.setHostileCreepTarget(towerInfo);

    // return true if a target was found (it will be set in tower memory)
    return (target !== null);
}


// find a heal-able target, and set it as the tower's target
function healTarget(towerInfo) {

    // find my creep
    var target = UtilsTower.setHealCreepTarget(towerInfo);

    // return true if a target was found (it will be set in tower memory)
    return (target !== null);
}


// STATE_TWR_IDLE
//==============================================================================
FSM[Globals.STATE_TWR_IDLE] = function(towerInfo) {

    // if holding energy, check for hostile creeps
    if (tower.energy > 0) {
        if (hostileTarget(towerInfo)) {
            towerInfo.stateStack.push(Globals.STATE_TWR_ATTACK);
            return;
        }
        
        if (healTarget(towerInfo)) {
            towerInfo.stateStack.push(Globals.STATE_TWR_HEAL);
            return;
        }
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
    var target = UtilsTower.setHostileCreepTarget(towerInfo);

    if (target !== null) {
        tower.attack(target);
    } else {
        towerInfo.target = null;
        towerInfo.stateStack.pop();
    }

}

// STATE_TWR_HEAL
//==============================================================================
FSM[Globals.STATE_TWR_HEAL] = function(towerInfo) {

    // finish when run out of energy
    if (tower.energy === 0) {
        towerInfo.target = null;
        towerInfo.stateStack.pop();
        return;
    }

    // set hostile target
    var target = UtilsTower.setHealCreepTarget(towerInfo);

    if (target !== null) {
        tower.heal(target);
    } else {
        towerInfo.target = null;
        towerInfo.stateStack.pop();
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
