class Location {
    constructor(lat, long) {
        this.lat = lat;
        this.long = long;
        this.timestamp = Date.now();
    }
}

module.exports = class Hunted {
    constructor(id, first_name = 'John Doe', game, bot) {
        this.id = id;
        this.game = game;
        this.bot = bot;
        this.first_name = first_name;
        this.location = new Location();
    }

    /**
     * Send initial message to hunted
     */
    sendInitialMessage() {
        this.bot.sendMessage(this.id, this.game.getMessage('hunted_initialize'));
    }

    /**
     * Update location of hunted
     * @param {*} location 
     */
    updateLocation(location) {
        const newLocation = new Location(location.latitude, location.longitude);
        this.location = newLocation;
    }
}