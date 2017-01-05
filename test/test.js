// test.js
var _ = require('lodash');

var MOVE     = 'move';
var WORK     = 'work';
var CARRY    = 'carry';
var ATTACK   = 'attack';
var R_ATTACK = 'ranged_attack';
var HEAL     = 'heal';
var CLAIM    = 'claim';
var TOUGH    = 'tough';

var BODYPART_COST = {
    "move": 50,
    "work": 100,
    "attack": 80,
    "carry": 50,
    "heal": 250,
    "ranged_attack": 150,
    "tough": 10,
    "claim": 600,
};

function bodyPartMaker() {
    var bodyType = [];
    for (var a = 0; a < arguments.length; a += 2) {
        for (var num = 0; num < arguments[a+1]; num++) {
            bodyType.push(arguments[a]);
        }
    }
    
    return bodyType;
}

var CREEP_CLASS = {
    harvester: [
        bodyPartMaker(WORK, 1, CARRY, 2, MOVE, 2), // 300
        bodyPartMaker(WORK, 3, CARRY, 3, MOVE, 3), // 600
        bodyPartMaker(WORK, 4, CARRY, 4, MOVE, 4), // 800
    ],

    upgrader: [
        bodyPartMaker(WORK, 1, CARRY, 3, MOVE, 1), // 300
        bodyPartMaker(WORK, 4, CARRY, 4, MOVE, 4), // 800
    ],

    builder: [
        bodyPartMaker(WORK, 2, CARRY, 2, MOVE, 2), // 400
        bodyPartMaker(WORK, 2, CARRY, 2, MOVE, 4), // 500
        bodyPartMaker(WORK, 4, CARRY, 4, MOVE, 4), // 800
    ],

    reclaimer: [
        bodyPartMaker(TOUGH, 2, CLAIM, 1, MOVE, 2), // 710
    ],

    distributor: [
        bodyPartMaker(CARRY, 2, MOVE, 2), // 200
        bodyPartMaker(CARRY, 4, MOVE, 4), // 400
        bodyPartMaker(CARRY, 8, MOVE, 4), // 600
        bodyPartMaker(CARRY, 8, MOVE, 8), // 800
    ],

    soldier: [
        bodyPartMaker(TOUGH,  1, ATTACK, 1, MOVE, 1), // 140
        bodyPartMaker(TOUGH,  2, ATTACK, 2, MOVE, 4), // 380
        bodyPartMaker(TOUGH, 10, ATTACK, 6, MOVE, 8), // 100 + 480 + 400 = 980
    ],
}

function getCreepBodyCost(body) {
    var cost = 0;
    for (var part in body) {
        cost += BODYPART_COST[body[part]];
    }
    return cost;
}

function getBestCreepClass(room, role) {
    // determine available energy capacity
    var energyCap = room.energyCapacityAvailable;

    // get creep classes for the role
    var creepClasses = CREEP_CLASS[role];
    
    var bodyType = null;

    // get the most expensive class that is still buildable
    var idx = -1;
    var creepCost = 0;
    for (var c in creepClasses) {
        var classCost = getCreepBodyCost(creepClasses[c]);
        if (classCost <= energyCap && classCost >= creepCost) {
            idx = c;
            creepCost = classCost;
        }
    }
    
    if (idx >= 0) {
        bodyType = creepClasses[idx];
    }
    return bodyType;
}

var b1 = bodyPartMaker(TOUGH, 1, WORK, 1, MOVE, 4);

console.log(b1);
console.log("Cost: " + getCreepBodyCost(b1));

var e = 100;
var r = 'soldier';
var body = getBestCreepClass({energyCapacityAvailable: e}, r);
var cost = getCreepBodyCost(body);
console.log("Given " + e + ", build: " + body + " (" + cost + ")");
