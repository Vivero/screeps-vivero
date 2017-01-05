/* role.reclaimer.js
 *
 * Defines functionality of the reclaimer role.
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
            state = Globals.STATE_IDLE;
            break;
            

        //==========================
        default:
            state = Globals.STATE_IDLE;
    }

    return state;
};

