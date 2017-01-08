/* globals.js
 *
 * Store global constants and functions.
 *
 */ 
var exports = module.exports = {};


// AI LOGIC
//==============================================================================
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

exports.STATE_STRING = {};
exports.STATE_STRING[exports.STATE_IDLE]        = 'idle';
exports.STATE_STRING[exports.STATE_BUILD]       = 'building';
exports.STATE_STRING[exports.STATE_HARVEST]     = 'harvesting';
exports.STATE_STRING[exports.STATE_REPAIR]      = 'repairing';
exports.STATE_STRING[exports.STATE_STORE]       = 'storing';
exports.STATE_STRING[exports.STATE_UPGRADE]     = 'upgrading';
exports.STATE_STRING[exports.STATE_DISTRIBUTE]  = 'distribute';
exports.STATE_STRING[exports.STATE_WITHDRAW]    = 'withdraw';
exports.STATE_STRING[exports.STATE_PICKUP]      = 'pickup';
exports.STATE_STRING[exports.STATE_ATTACK]      = 'attacking';
exports.STATE_STRING[exports.STATE_RALLY]       = 'rallying';

exports.ACTION_NONE         = 1000;
exports.ACTION_BUILDING     = 1010;
exports.ACTION_REPAIRING    = 1020;



// CREEPS
//==============================================================================

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
    'special',
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

    special: [
        bodyPartMaker(WORK, 1, CARRY, 1, MOVE, 2); // 200
    ],
}


// MEMORY STRUCTURES
//==============================================================================

// creep memory
exports.CREEP_MEMORY = {
    role:       'special',
    stateStack: [exports.STATE_IDLE],
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


// room memory
exports.ROOM_MEMORY_ARYS = [
    'sources',
    'towers',
];
exports.ROOM_MEMORY_OBJS = {
    population: {},
    autoBuild: {
        lastExecTime: 0,
    },
};
for (var r in exports.CREEP_ROLES) {
    var role = exports.CREEP_ROLES[r];
    exports.ROOM_MEMORY_OBJS.population[role] = [];
}


// game memory
exports.GAME_MEMORY = {
    commands: {},
};


// GAME WORLD
//==============================================================================

// repairability thresholds
exports.MAX_WALL_LEVEL = 50000;
exports.MAX_RAMPART_LEVEL = 10000;
exports.REPAIR_THRESHOLD_PCT = 0.7;

// storage thresholds
exports.TOWER_ENERGY_THRESHOLD_PCT = 0.9;

