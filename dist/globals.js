/* globals.js
 *
 * Store global constants and functions.
 *
 */ 
var exports = module.exports = {};


// AI LOGIC
//======================================
exports.STATE_IDLE          =   0;
exports.STATE_BUILD         =  10;
exports.STATE_HARVEST       =  20;
exports.STATE_REPAIR        =  30;
exports.STATE_STORE         =  40;
exports.STATE_UPGRADE       =  50;
exports.STATE_DISTRIBUTE    =  60;
exports.STATE_WITHDRAW      =  70;
exports.STATE_PICKUP        =  80;
exports.STATE_ATTACK        =  90;
exports.STATE_RALLY         = 100;

exports.STATE_TWR_IDLE      = 500;
exports.STATE_TWR_REPAIR    = 510;
exports.STATE_TWR_HEAL      = 520;
exports.STATE_TWR_ATTACK    = 530;

var STATE_STRING = {};
STATE_STRING[exports.STATE_IDLE]          = 'idle';
STATE_STRING[exports.STATE_BUILD]         = 'building';
STATE_STRING[exports.STATE_HARVEST]       = 'harvesting';
STATE_STRING[exports.STATE_REPAIR]        = 'repairing';
STATE_STRING[exports.STATE_STORE]         = 'storing';
STATE_STRING[exports.STATE_UPGRADE]       = 'upgrading';
STATE_STRING[exports.STATE_DISTRIBUTE]    = 'distribute';
STATE_STRING[exports.STATE_WITHDRAW]      = 'withdraw';
STATE_STRING[exports.STATE_PICKUP]        = 'pickup';
STATE_STRING[exports.STATE_ATTACK]        = 'attacking';
STATE_STRING[exports.STATE_RALLY]         = 'rallying';
exports.STATE_STRING = STATE_STRING;

exports.ACTION_NONE         = 1000;
exports.ACTION_BUILDING     = 1010;
exports.ACTION_REPAIRING    = 1020;



// CREEPS
//======================================

// creep body part costs
/*
 * MOVE     = 50
 * WORK     = 100
 * CARRY    = 50
 * ATTACK   = 80
 * R_ATTACK = 150
 * HEAL     = 250
 * CLAIM    = 600
 * TOUGH    = 10
 *
**/

// creep body types
//--------------------------------------

// helper function. example:
//   bodyPartMaker(WORK, 2, CARRY, 4, MOVE, 3)
//
function bodyPartMaker() {
    var bodyType = [];
    for (var a = 0; a < arguments.length; a += 2) {
        for (var num = 0; num < arguments[a+1]; num++) {
            bodyType.push(arguments[a]);
        }
    }
    return bodyType;
}


exports.CREEP_ROLES = [
    'harvester',
    'upgrader',
    'builder',
    'reclaimer',
    'distributor',
    'soldier',
];


exports.CREEP_CLASS = {
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
        bodyPartMaker(WORK, 2, CARRY, 1, MOVE, 1), // 300
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


// harvesters
exports.TYPE_H_CLASS_1 = [WORK, CARRY, CARRY, MOVE, MOVE]; // 300
exports.TYPE_H_CLASS_2 = [WORK, WORK, WORK, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE]; // 600
exports.TYPE_H_CLASS_3 = [WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE]; // 750

// upgraders
exports.TYPE_U_CLASS_1 = [WORK, CARRY, CARRY, CARRY, MOVE]; // 300
exports.TYPE_U_CLASS_2 = [WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE]; // 800

// builders
exports.TYPE_B_CLASS_1 = [WORK, WORK, CARRY, CARRY, MOVE, MOVE]; // 400
exports.TYPE_B_CLASS_2 = [WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE]; // 500
exports.TYPE_B_CLASS_3 = [WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE]; // 800

// reclaimers
exports.TYPE_R_CLASS_1 = [TOUGH, CLAIM, MOVE, MOVE]; // 710

// distributors
exports.TYPE_D_CLASS_1 = [CARRY, CARRY, MOVE, MOVE]; // 200
exports.TYPE_D_CLASS_2 = [CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE]; // 400
exports.TYPE_D_CLASS_3 = [CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE]; // 600
exports.TYPE_D_CLASS_4 = [CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE]; // 800

// soldiers
exports.TYPE_S_CLASS_1 = [TOUGH, ATTACK, MOVE]; // 140
exports.TYPE_S_CLASS_2 = [TOUGH, ATTACK, MOVE, MOVE]; // 190
exports.TYPE_S_CLASS_3 = [TOUGH, TOUGH, ATTACK, ATTACK, MOVE, MOVE, MOVE, MOVE]; // 380
exports.TYPE_S_CLASS_4 = [
    TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, 
    ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, 
    MOVE, MOVE, MOVE, MOVE,
    MOVE, MOVE, MOVE, MOVE,
]; // 100 + 480 + 400 = 980


// MEMORY STRUCTURES
//--------------------------------------
exports.CREEP_MEMORY = {
    role:       null,
    state:      exports.STATE_IDLE,
    statePrev:  exports.STATE_IDLE,
    lastAction: exports.ACTION_NONE,
    target:     null,
    source:     null,
    flag:       null,
};

exports.getCreepRoleMemory = function(role) {
    var memory = null;
    if (_.includes(exports.CREEP_ROLES, role)) {
        memory = Object.assign({}, exports.CREEP_MEMORY);
        memory.role = role;
    }
    return memory;
}

var room_mem = {
    sources:    [],
    population: {},
    towers:     [],
    autoBuild:  {
        lastExecTime: 0,
    },
};
for (var r in exports.CREEP_ROLES) {
    var role = exports.CREEP_ROLES[r];
    room_mem.population[role] = [];
}
exports.ROOM_MEMORY = room_mem;

exports.GAME_MEMORY = {
    commands: {},
};


// SPAWN CONTROL
//======================================
exports.populationLevels = [];
exports.populationLevels.push({
    harvester: 3,
    upgrader: 1,
    builder: 1,
});
exports.populationLevels.push({
    harvester: 3,
    upgrader: 2,
    builder: 2,
});
exports.populationLevels.push({
    harvester: 3,
    upgrader: 2,
    builder: 2,
    distributor: 1,
});



// GAME FIELD
//======================================

// repairability thresholds
exports.MAX_WALL_LEVEL = 300000;
exports.MAX_RAMPART_LEVEL = 100000;
exports.REPAIR_THRESHOLD_PCT = 0.7;

// storage thresholds
exports.TOWER_ENERGY_THRESHOLD_PCT = 0.9;

