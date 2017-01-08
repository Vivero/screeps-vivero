var Globals = require('globals');
var RoomControl = require('room_control');

function initialize() {

    // initialize commands buffer
    if (!('commands' in Memory)) {
        Memory.commands = Object.assign({}, Globals.GAME_MEMORY.commands);
    }
}

function cleanup() {
    // clean up creep memory
    for (var name in Memory.creeps) {
        if (!Game.creeps[name]) {
            delete Memory.creeps[name];
            console.log("Clearing creep memory: ", name);
        }
    }
}


module.exports.loop = function () {

    // INITIALIZE
    //==================================
    initialize();

    // EXECUTE ROOM CONTROL
    //==================================
    for (var r in Game.rooms) {
        RoomControl.run(Game.rooms[r]);
    }

    // CLEANUP
    //==================================
    cleanup();

}
