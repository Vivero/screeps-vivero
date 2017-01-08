/* utils.js
 *
 * Set of common utilities and routines.
 *
 */ 
var Globals = require('globals');

var exports = module.exports = {};


exports.warn = function(str) {
    console.log('<span style="color:yellow;">' + str + '</span>');
}


exports.is = function(type, obj) {
    var className = Object.prototype.toString.call(obj).slice(8, -1);
    return obj !== undefined && obj !== null && className === type;
}


exports.isStructure = function(obj) {
    return (obj != null) && ('structureType' in obj);
}


exports.getCachedSourceInfoInRoom = function(sourceId, room) {
    var sourceInfo = null;

    if (sourceId != null) {
        // loop over cached sources info
        for (var s in room.memory.sources) {
            var src = room.memory.sources[s];

            // return a matching Game Object ID
            if (src.id === sourceId) {
                sourceInfo = src;
                break;
            }
        }
    }

    return sourceInfo;
}


exports.getCachedSourceInfo = function(sourceId) {
    var found = false;
    var sourceInfo = null;

    if (sourceId != null) {
        // loop over visible rooms
        for (var r in Game.rooms) {
            sourceInfo = exports.getCachedSourceInfoInRoom(sourceId, Game.rooms[r])
            if (sourceInfo != null) break;
        }
    }

    return sourceInfo;
}


exports.calculateSourceMaxOccupancy = function(source) {
    var sourceX = source.pos.x;
    var sourceY = source.pos.y;
    var maxOccupancy = 0;

    for (var x = sourceX - 1; x <= sourceX + 1; x++) {
        for (var y = sourceY - 1; y <= sourceY + 1; y++) {
            if (!(x == sourceX && y == sourceY)) {
                var roomPos = source.room.getPositionAt(x, y);
                var roomPosInfo = roomPos.look();
                var terrainInfo = _.find(roomPosInfo, function(info) {
                    return (info.type == 'terrain');
                });
                if ((terrainInfo.terrain == 'plain') || (terrainInfo.terrain == 'swamp')) {
                    maxOccupancy += 1;
                }
            }
        }
    }

    return maxOccupancy;
};


exports.setBuildTarget = function(creep) {
    // initialize target
    var target = null;
    var found = false;
    if (!('target' in creep.memory)) {
        creep.memory.target = null;
    }

    // retrieve from memory
    if (creep.memory.target != null) {
        var obj = Game.getObjectById(creep.memory.target);

        if (exports.is('ConstructionSite', obj)) {
            target = obj;
            found = true;
            creep.memory.target = target.id;
        }
    }

    // otherwise find new target
    if (!found) {
        target = creep.pos.findClosestByRange(FIND_CONSTRUCTION_SITES);
        if (target != null) {
            creep.memory.target = target.id;
        }
    }

    return target;
}


exports.setRepairTarget = function(creep) {
    // initialize target
    var target = null;
    var found = false;
    if (!('target' in creep.memory)) {
        creep.memory.target = null;
    }

    // retrieve from memory
    if (creep.memory.target != null) {
        var structure = Game.getObjectById(creep.memory.target);

        if (structure != null && 'structureType' in structure) {
            var repairHitsLevel = (structure.structureType === STRUCTURE_WALL) ? Globals.MAX_WALL_LEVEL : 
                (structure.structureType === STRUCTURE_RAMPART ? Globals.MAX_RAMPART_LEVEL : structure.hitsMax);

            if (structure.hits < repairHitsLevel) {
                target = structure;
                found = true;
                creep.memory.target = structure.id;
            }
        }
    }

    // otherwise find new target
    if (!found) {
        // prioritize newly built ramparts
        target = creep.pos.findClosestByRange(FIND_STRUCTURES, {
            filter: (structure) => {
                return (structure.structureType === STRUCTURE_RAMPART &&
                        structure.hits == 1);
            }
        });

        // otherwise search for other targets
        if (target == null) {
            target = creep.pos.findClosestByRange(FIND_STRUCTURES, {
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
        }

        if (target != null) {
            creep.memory.target = target.id;
        }
    }

    return target;
}


exports.setStorageTarget = function(creep) {
    // initialize target
    var target = null;
    var found = false;
    if (!('target' in creep.memory)) {
        creep.memory.target = null;
    }

    // retrieve from memory
    if (creep.memory.target != null) {
        var structure = Game.getObjectById(creep.memory.target);

        if ((structure != null) &&
            ('structureType' in structure) &&
            (((structure.structureType === STRUCTURE_EXTENSION ||
               structure.structureType === STRUCTURE_SPAWN) &&
               structure.energy < structure.energyCapacity) ||
             ((structure.structureType === STRUCTURE_CONTAINER ||
               structure.structureType === STRUCTURE_STORAGE) && 
               _.sum(structure.store) < structure.storeCapacity))) {
            target = structure;
            found = true;
            creep.memory.target = target.id;
        }
    }

    // otherwise find new target
    if (!found) {
        // first try to find spawns or extensions
        target = creep.pos.findClosestByRange(FIND_MY_STRUCTURES, {
                filter: (structure) => {
                    return (
                        (structure.structureType === STRUCTURE_EXTENSION || 
                         structure.structureType === STRUCTURE_SPAWN) &&
                         structure.energy < structure.energyCapacity);
                }
        });
        if (target != null) {
            creep.memory.target = target.id;
        } else {
            // try to find storage containers
            target = creep.pos.findClosestByRange(FIND_STRUCTURES, {
                    filter: (structure) => {
                        return ((structure.structureType === STRUCTURE_CONTAINER ||
                            structure.structureType === STRUCTURE_STORAGE) &&
                            _.sum(structure.store) < structure.storeCapacity);
                    }
            });
            if (target != null) {
                creep.memory.target = target.id;
            }
        }
    }

    return target;
}


exports.setTowerTarget = function(creep) {
    // initialize target
    var target = null;
    var found = false;
    if (!('target' in creep.memory)) {
        creep.memory.target = null;
    }

    // retrieve from memory
    if (creep.memory.target != null) {
        var structure = Game.getObjectById(creep.memory.target);

        if ((structure != null) && 
            ('structureType' in structure) &&
            (structure.structureType === STRUCTURE_TOWER) &&
            (structure.energy < structure.energyCapacity)) {
            target = structure;
            found = true;
            creep.memory.target = target.id;
        }
    }

    // otherwise find new target
    if (!found) {
        
        var target = creep.pos.findClosestByRange(FIND_MY_STRUCTURES, {
                filter: (structure) => {
                    return ((structure.structureType === STRUCTURE_TOWER) &&
                         (structure.energy < (structure.energyCapacity * Globals.TOWER_ENERGY_THRESHOLD_PCT)));
                }
        });
        if (target != null) {
            creep.memory.target = target.id;
        }
    }

    return target;
}


exports.setDroppedResourceTarget = function(creep, resourceType) {
    // initialize target
    var target = null;
    var found = false;
    if (!('target' in creep.memory)) {
        creep.memory.target = null;
    }

    // retrieve from memory
    if (creep.memory.target != null) {
        var drop = Game.getObjectById(creep.memory.target);

        if (drop != null && 
            ('resourceType' in drop) &&
            (drop.resourceType === resourceType) &&
            (drop.amount >= 50)) {
            target = drop;
            found = true;
            creep.memory.target = target.id;
        }
    }

    // otherwise find new target
    if (!found) {
        
        target = creep.pos.findClosestByRange(FIND_DROPPED_RESOURCES, {
                filter: (drop) => {
                    return (drop.resourceType === resourceType);
                }
        });
        if (target != null) {
            creep.memory.target = target.id;
        }
    }

    return target;
}
