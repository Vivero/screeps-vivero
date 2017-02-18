/* utils.js
 *
 * Set of common utilities and routines.
 *
 */ 
'use strict';

var Globals = require('globals');
var Utils = require('utils');

var exports = module.exports = {};


exports.getBodyPartTypeCount = function(creep, bodyPartType) {
    var count = 0;
    for (var b in creep.body) {
        var bodyPart = creep.body[b];
        if (bodyPart.hits > 0 && bodyPart.type === bodyPartType) count += 1;
    }
    return count;
}


exports.getCreepBodyCost = function(body) {
    var cost = 0;
    for (var part in body) {
        cost += BODYPART_COST[body[part]];
    }
    return cost;
};


function getBestCreepClass(role, energyLimit) {
    var bodyType = null;

    // get creep classes for the role
    var creepClasses = Globals.CREEP_CLASS[role];

    // get the most expensive class that is still buildable
    var idx = -1;
    var creepCost = 0;
    for (var c in creepClasses) {
        var classCost = exports.getCreepBodyCost(creepClasses[c]);
        if (classCost <= energyLimit && classCost >= creepCost) {
            idx = c;
            creepCost = classCost;
        }
    }
    
    bodyType = (idx >= 0) ? creepClasses[idx] : null;
    return bodyType;
}


exports.getBestBuildableCreepClass = function(room, role) {
    return getBestCreepClass(role, room.energyAvailable);
};


exports.getBestPossibleCreepClass = function(room, role) {
    return getBestCreepClass(role, room.energyCapacityAvailable);
};


exports.findAvailableSource = function(creep) {
    var availableSource = null;

    // check for sources adjacent to creep
    var adjacentSources = creep.pos.findInRange(FIND_SOURCES, 1);
    availableSource = _.find(adjacentSources, function(s) {
        return s.energy > 0;
    });

    // otherwise find new source
    if (!availableSource) {
        var rangeToSources = [];
        for (var s in creep.room.memory.sources) {
            var sourceInfo = creep.room.memory.sources[s];
            var source = Game.getObjectById(sourceInfo.id);
            if (source.energy > 0)
                rangeToSources.push([sourceInfo, creep.pos.getRangeTo(source)]);
        }
        
        if (rangeToSources.length == 0) {
            return null;
        }

        rangeToSources.sort(function(a, b) {
            return (a[1] === b[1]) ? 0 : ((a[1] < b[1]) ? -1 : 1);
        });

        availableSource = null;
        for (var s in rangeToSources) {
            var info = rangeToSources[s][0];
            if (info.occupancy < info.maxOccupancy) {
                availableSource = Game.getObjectById(info.id);
                break;
            }
        }
    }

    return availableSource;
};


exports.setSourceTarget = function(creep) {
    // initialize harvestable source
    var target = null;
    var found = false;

    // retrieve from memory
    var source = Game.getObjectById(creep.memory.target);
    if (source !== null && source instanceof Source) {
        var sourceInfo = Utils.getCachedSourceInfoInRoom(source.id, creep.room);
        if ((sourceInfo !== null) &&
            (source.energy > 0) &&
            (sourceInfo.occupancy < sourceInfo.maxOccupancy)) {

            found = true;
            target = source;
            creep.memory.target = source.id;
        }
    }

    // otherwise find new target
    if (!found) {
        source = exports.findAvailableSource(creep);
        if (source !== null) {
            creep.memory.target = source.id;
            target = source;
        }
    }

    return target;
};


function setStructureTarget(creep, validTarget) {
    // initialize target spawn/extension
    var target = null;
    var found = false;

    // retrieve from memory
    if (creep.memory.target !== null) {
        var structure = Game.getObjectById(creep.memory.target);

        if (Utils.isStructure(structure) && validTarget(structure)) {
            target = structure;
            found = true;
        }
        creep.memory.target = found ? target.id : null;
    }

    // otherwise find new target
    if (!found) {
        target = creep.pos.findClosestByRange(FIND_STRUCTURES, {
            filter: (structure) => {
                return validTarget(structure);
            }
        });
        creep.memory.target = (target !== null) ? target.id : null;
    }

    return target;
}


exports.setSpawnOrExtensionStoreTarget = function(creep) {
    
    // target validation function
    var validTarget = function(target) { 
        return ((target.structureType === STRUCTURE_SPAWN ||
                 target.structureType === STRUCTURE_EXTENSION) &&
                (target.energy < target.energyCapacity));
    };

    return setStructureTarget(creep, validTarget);
};


exports.setSpawnExtensionContainerStoreTarget = function(creep) {
    
    // target validation function
    var validTarget = function(target) { 
        var isSpawnExtension = 
            (target.structureType === STRUCTURE_SPAWN ||
             target.structureType === STRUCTURE_EXTENSION) &&
            (target.energy < target.energyCapacity);
        var isContainer = 
            (target.structureType === STRUCTURE_CONTAINER) &&
            (_.sum(target.store) < target.storeCapacity);
        return isSpawnExtension || isContainer;
    };

    return setStructureTarget(creep, validTarget);
};


exports.setSpawnStoreTarget = function(creep) {
    
    // target validation function
    var validTarget = function(target) { 
        return ((target.structureType === STRUCTURE_SPAWN) &&
                (target.energy < target.energyCapacity));
    };

    return setStructureTarget(creep, validTarget);
};


exports.setExtensionStoreTarget = function(creep) {
    
    // target validation function
    var validTarget = function(target) { 
        return (target.structureType === STRUCTURE_EXTENSION &&
                (target.energy < target.energyCapacity));
    };

    return setStructureTarget(creep, validTarget);
};


exports.setContainerStoreTarget = function(creep) {
    
    // target validation function
    var validTarget = function(target) { 
        return ((target.structureType === STRUCTURE_CONTAINER) &&
                (_.sum(target.store) < target.storeCapacity));
    };

    return setStructureTarget(creep, validTarget);
};


exports.setStorageStoreTarget = function(creep) {
    
    // target validation function
    var validTarget = function(target) { 
        return ((target.structureType === STRUCTURE_STORAGE) &&
                (_.sum(target.store) < target.storeCapacity));
    };

    return setStructureTarget(creep, validTarget);
};


exports.setTowerStoreTarget = function(creep) {
    
    // target validation function
    var validTarget = function(target) { 
        return ((target.structureType === STRUCTURE_TOWER) &&
                (target.energy < target.energyCapacity));
    };

    return setStructureTarget(creep, validTarget);
};


exports.setStorageOrContainerWithdrawTarget = function(creep) {
    
    // target validation function
    var validTarget = function(target) { 
        return ((target.structureType === STRUCTURE_CONTAINER ||
                 target.structureType === STRUCTURE_STORAGE) &&
                ('energy' in target.store) &&
                (target.store.energy > 0));
    };

    return setStructureTarget(creep, validTarget);
};


exports.setContainerWithdrawTarget = function(creep) {
    
    // target validation function
    var validTarget = function(target) { 
        return ((target.structureType === STRUCTURE_CONTAINER) &&
                ('energy' in target.store) &&
                (target.store.energy > 0));
    };

    return setStructureTarget(creep, validTarget);
};


exports.setStorageWithdrawTarget = function(creep) {
    
    // target validation function
    var validTarget = function(target) { 
        return ((target.structureType === STRUCTURE_STORAGE) &&
                ('energy' in target.store) &&
                (target.store.energy > 0));
    };

    return setStructureTarget(creep, validTarget);
};


exports.setDroppedResourceTarget = function(creep) {
    
    // initialize target spawn/extension
    var target = null;
    var found = false;

    // target validation function
    var validTarget = function(target) {

        var pathToTarget = PathFinder.search(creep.pos, {pos: target.pos, range: 1}, {
            // We need to set the defaults costs higher so that we
            // can set the road cost lower in `roomCallback`
            plainCost: 2,
            swampCost: 10,

            roomCallback: function(roomName) {
                var room = Game.rooms[roomName];
                if (!room) return;
                var costs = new PathFinder.CostMatrix;

                room.find(FIND_STRUCTURES).forEach(function(structure) {
                    if (structure.structureType === STRUCTURE_ROAD) {
                        // Favor roads over plain tiles
                        costs.set(structure.pos.x, structure.pos.y, 1);
                    } else if (structure.structureType !== STRUCTURE_CONTAINER && 
                               structure.structureType !== STRUCTURE_RAMPART) {
                        // Can't walk through non-walkable buildings
                        costs.set(structure.pos.x, structure.pos.y, 0xff);
                    }
                });

                // Avoid creeps in the room
                /*room.find(FIND_CREEPS).forEach(function(creep) {
                    costs.set(creep.pos.x, creep.pos.y, 0xff);
                });*/

                return costs;
            }
        });

        return (!pathToTarget.incomplete &&
                (target.amount > pathToTarget.path.length));
    };

    // retrieve from memory
    if (creep.memory.target !== null) {
        var resource = Game.getObjectById(creep.memory.target);

        if (resource !== null && 
            resource instanceof Resource) {
            target = resource;
            found = true;
        }
        creep.memory.target = found ? resource.id : null;
    }

    // otherwise find new target
    if (!found) {
        target = creep.pos.findClosestByRange(FIND_DROPPED_ENERGY, {
            filter: (structure) => {
                return validTarget(structure);
            }
        });
        creep.memory.target = (target !== null) ? target.id : null;
    }

    return target;
};


exports.setBuildTarget = function(creep) {
    // initialize target spawn/extension
    var target = null;
    var found = false;

    // retrieve from memory
    if (creep.memory.buildTarget !== null) {
        var site = Game.getObjectById(creep.memory.buildTarget);

        if (site !== null && 'progress' in site) {
            target = site;
            found = true;
        }
        creep.memory.buildTarget = found ? target.id : null;
        creep.memory.target = found ? target.id : null;
    }

    // otherwise find new target
    if (!found) {
        target = creep.pos.findClosestByRange(FIND_CONSTRUCTION_SITES, {
            filter: (site) => {
                return site.my;
            }
        });
        creep.memory.buildTarget = (target !== null) ? target.id : null;
        creep.memory.target = (target !== null) ? target.id : null;
    }

    return target;
};


exports.setRepairTarget = function(creep) {
    // initialize target spawn/extension
    var target = null;
    var found = false;

    // target validation function
    function validTarget(target) { 
        return (structure.structureType === STRUCTURE_WALL && 
                structure.hits < Globals.MAX_WALL_LEVEL) ||
               (structure.structureType === STRUCTURE_RAMPART && 
                structure.hits < Globals.MAX_RAMPART_LEVEL) || 
               (structure.structureType !== STRUCTURE_WALL &&
                structure.structureType !== STRUCTURE_RAMPART &&
                structure.hits < structure.hitsMax);
    }

    // retrieve from memory
    if (creep.memory.repairTarget !== null) {
        var structure = Game.getObjectById(creep.memory.repairTarget);

        if (Utils.isStructure(structure) && validTarget(structure)) {
            target = structure;
            found = true;
        }
        creep.memory.repairTarget = found ? target.id : null;
        creep.memory.target = found ? target.id : null;
    }

    // otherwise find new target
    if (!found) {
        // prioritize ramparts with 1 hit
        target = creep.pos.findClosestByRange(FIND_STRUCTURES, {
            filter: (structure) => {
                return  (structure.structureType === STRUCTURE_RAMPART && 
                         structure.hits == 1);
            }
        });
        // if none, look for other repairables
        if (target === null) {
            target = creep.pos.findClosestByRange(FIND_STRUCTURES, {
                filter: (structure) => {
                    return  (structure.structureType === STRUCTURE_WALL && 
                             structure.hits < Globals.MAX_WALL_LEVEL) ||
                            (structure.structureType === STRUCTURE_RAMPART && 
                             structure.hits < (Globals.MAX_RAMPART_LEVEL * Globals.REPAIR_THRESHOLD_PCT)) || 
                            (structure.structureType !== STRUCTURE_WALL &&
                             structure.structureType !== STRUCTURE_RAMPART &&
                             structure.hits < (structure.hitsMax * Globals.REPAIR_THRESHOLD_PCT));
                }
            });
        }
        creep.memory.repairTarget = (target !== null) ? target.id : null;
        creep.memory.target = (target !== null) ? target.id : null;
    }

    return target;
};


exports.getStorableTarget = function(creep) {

    // target validation function
    function validTarget(target) {
        return (target !== null) &&
               (('store' in target && _.sum(target.store) < target.storeCapacity) ||
                ('energy' in target && target.energy < target.energyCapacity));
    }

    // retrieve from memory
    var target = Game.getObjectById(creep.memory.target);
    if (!validTarget(target)) {
        target = null;
        creep.memory.target = null;
    }

    return target;
};


exports.getWithdrawableTarget = function(creep, resourceType) {

    // target validation function
    function validTarget(target) {
        return ((target !== null) &&
                ('store' in target) &&
                (resourceType in target.store) &&
                (target.store[resourceType] > 0));
    }

    // retrieve from memory
    var target = Game.getObjectById(creep.memory.target);
    if (!validTarget(target)) {
        target = null;
        creep.memory.target = null;
    }

    return target;
};

exports.getPickupTarget = function(creep) {

    // target validation function
    function validTarget(target) {
        return ((target !== null) &&
                target instanceof Resource);
    }

    // retrieve from memory
    var target = Game.getObjectById(creep.memory.target);
    if (!validTarget(target)) {
        target = null;
        creep.memory.target = null;
    }

    return target;
};

exports.getAttackableTarget = function(creep) {

    // target validation function
    function validTarget(target) {
        return ((target !== null) &&
                ('my' in target) && !target.my);
    }

    // retrieve from memory
    var target = Game.getObjectById(creep.memory.target);
    if (!validTarget(target)) {
        target = null;
        creep.memory.target = null;
    }

    return target;
};

