var Globals = require('globals');
var RoomControl = require('room_control');


module.exports.loop = function () {

    // CUSTOM EXECUTION TRIGGER
    //==================================
    if ('trigger' in Memory) {
        if (Memory.trigger) {
            console.log("Custom trigger!");
            Memory.trigger = false;
        }
    } else {
        Memory.trigger = false;
    }

    // EXECUTE ROOM CONTROL
    //==================================
    for (var r in Game.rooms) {
        RoomControl.control.run(Game.rooms[r]);
    }

    // MEMORY CLEANUP
    //==================================
    for (var name in Memory.creeps) {
        if (!Game.creeps[name]) {
            delete Memory.creeps[name];
            console.log("Clearing creep memory: ", name);
        }
    }

}
