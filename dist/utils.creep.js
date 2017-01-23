/* utils.js
 *
 * Set of common utilities and routines.
 *
 */ 
'use strict';

var Globals = require('globals');
var Utils = require('utils');

var exports = module.exports = {};


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
        var source = creep.pos.findClosestByRange(FIND_SOURCES_ACTIVE);
        var sourceInfo = Utils.getCachedSourceInfoInRoom(source.id, creep.room);

        // check source occupancy
        if (sourceInfo !== null &&
            sourceInfo.occupancy < sourceInfo.maxOccupancy) {
            availableSource = source;
        } else {
            availableSource = null;
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
    if (source !== null) {
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
        target = creep.pos.findClosestByRange(FIND_MY_STRUCTURES, {
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

