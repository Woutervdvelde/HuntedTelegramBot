const Hunted = require('./hunted');

module.exports = class Game {
    static games = [];

    constructor(groupId) {
        if (Game.games.find(game => game.groupId === groupId))
            throw new Error('Game already exists');

        this.groupId = groupId;
        this.hunted = [];
        this.interval = 10;
    }

    addHunted(id) {
        this.hunted.push(new Hunted(id));
    }
}