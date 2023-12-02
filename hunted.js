class Location {
    constructor() {
        this.lat = null;
        this.long = null;
    }
}

module.exports = class Hunted {
    constructor(id) {
        this.id = id;
        this.location = new Location();
    }
}