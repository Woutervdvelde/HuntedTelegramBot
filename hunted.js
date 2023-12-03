class Location {
    constructor() {
        this.lat = null;
        this.long = null;
    }
}

module.exports = class Hunted {
    constructor(id, first_name = 'John Doe') {
        this.id = id;
        this.first_name = first_name;
        this.location = new Location();
    }
}