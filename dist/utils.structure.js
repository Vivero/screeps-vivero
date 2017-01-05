/* utils.structure.js
 *
 * Set of common utilities and routines.
 * Sub-module focused on routines for structures.
 *
 */ 
var Globals = require('globals');

var exports = module.exports = {};

exports.setRepairTarget = function(towerInfo) {
    // initialize target
    var target = null;
    var found = false;
    var tower = Game.getObjectById(towerInfo.id);

    // retrieve from memory
    if (towerInfo.target != null) {
        var structure = Game.getObjectById(towerInfo.target);

        var range = tower.pos.getRangeTo(structure);

        if (structure != null && 'structureType' in structure && range < 10) {
            var repairHitsLevel = (structure.structureType === STRUCTURE_WALL) ? Globals.MAX_WALL_LEVEL : 
                (structure.structureType === STRUCTURE_RAMPART ? Globals.MAX_RAMPART_LEVEL : structure.hitsMax);

            if (structure.hits < repairHitsLevel) {
                target = structure;
                found = true;
                towerInfo.target = structure.id;
            }
        }
    }

    // otherwise find new target
    if (!found) {
        target = tower.pos.findClosestByRange(FIND_STRUCTURES, {
            filter: (structure) => {
                return (structure.structureType === STRUCTURE_WALL && 
                        structure.hits < Globals.MAX_WALL_LEVEL) ||
                       (structure.structureType === STRUCTURE_RAMPART && 
                        structure.hits < Globals.MAX_RAMPART_LEVEL) ||
                       (structure.structureType !== STRUCTURE_WALL &&
                        structure.structureType !== STRUCTURE_RAMPART &&
                        structure.hits < (structure.hitsMax * Globals.REPAIR_THRESHOLD_PCT));
            }
        });

        if (target != null) {
            var range = tower.pos.getRangeTo(target);
            if (range < 10) {
                towerInfo.target = target.id;
            } else {
                towerInfo.target = null;
                target = null;
            }
            
        }
    }

    return target;
}


exports.setHostileCreepTarget = function(towerInfo) {
    // initialize target
    var target = null;
    var found = false;
    var tower = Game.getObjectById(towerInfo.id);

    // retrieve from memory
    if (towerInfo.target != null) {
        var hostile = Game.getObjectById(towerInfo.target);

        if (hostile != null && ('my' in hostile) && !hostile.my) {
            target = hostile;
            found = true;
            towerInfo.target = hostile.id;
        }
    }

    // otherwise find new target
    if (!found) {
        target = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);

        if (target != null) {
            towerInfo.target = target.id;
        }
    }

    return target;
}


