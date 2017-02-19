/* room.governor.js
 *
 * Encapsulates full control of a single room.
 *
 */ 
'use strict';

var Globals = require('globals');
var Utils = require('utils');


var exports = module.exports = {};

function initialize(room) {
    // get all sources
    if (room.memory.sources.length === 0) {
        var sources = room.find(FIND_SOURCES);
        for (var s in sources) {
            var source = sources[s];
            room.memory.sources.push({
                id:             source.id,
                occupancy:      0,
                maxOccupancy:   Utils.calculateSourceMaxOccupancy(source),
            });
        }
    }

    // create list of tasks
    if (!('tasks' in room.memory))
        room.memory.tasks = [];
}

function processTasks(room) {

    var sourceTasks = _.filter(room.memory.tasks, {'type': 'source'});

    // calculate source occupancy
    for (var s in room.memory.sources) {
        var source = Game.getObjectById(room.memory.sources[s].id);
        if (source !== null) {
            var nearbyCreeps = source.pos.findInRange(FIND_CREEPS, 1);
            room.memory.sources[s].occupancy = nearbyCreeps.length;
        }

        /*if (!_.find(sourceTasks, {'objId' : source.id})) {
            room.memory.tasks.push(new Globals.Task('source', source.id));
        }*/
    }



}

exports.run = function(room) {

    // INITIALIZE
    //======================================================================
    initialize(room);

    // COMPUTE TASKS
    //======================================================================
    processTasks(room);

};
