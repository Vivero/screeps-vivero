/* utils.offense.js
 *
 * Set of common utilities and routines.
 * Sub-module focused on routines for offensive logic.
 *
 */ 
var Globals = require('globals');

var exports = module.exports = {};


exports.setHostileCreepTarget = function(creep) {
    // initialize target
    var target = null;
    var found = false;

    // retrieve from memory
    if (creep.memory.target != null) {
        var hostile = Game.getObjectById(creep.memory.target);

        if (hostile != null && ('my' in hostile) && !hostile.my) {
            target = hostile;
            found = true;
            creep.memory.target = hostile.id;
        }
    }

    // otherwise find new target
    if (!found) {
        target = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS);

        if (target != null) {
            creep.memory.target = target.id;
        }
    }

    return target;
}


