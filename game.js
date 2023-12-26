const Hunted = require('./hunted');
const messages = require('./messages');
const sqlite3 = require('sqlite3').verbose();

module.exports = class Game {
    static games = [];
    static bot = null;

    constructor(groupId, language = 'en') {
        this.groupId = groupId;
        this.language = language;

        if (Game.games.find(game => game.groupId === groupId))
            throw new Error(this.getMessage('error_game_exists'));

        this.hunted = [];
        this.interval = 10;
        this.isPlaying = false;
        this.startMessage = null;
        this.locationInterval = null;

        Game.games.push(this);
        // Save game to database
        const db = new sqlite3.Database('./db.sqlite');
        db.run(`INSERT INTO game (chat_id, language, interval, is_playing, start_message_id, location_interval) VALUES (?, ?, ?, ?, ?, ?)`,
            [this.groupId, this.language, this.interval, this.isPlaying, this.startMessage?.message_id, this.locationInterval]);
    }

    /**
     * Adds hunted to the game by user id
     * @param {int} id 
     * @param {string} firstName
     * @returns {Hunted} - The created hunted object
     */
    addHunted(id, firstName) {
        if (Game.getGameByHuntedId(id)) return;
        const hunted = new Hunted(id, firstName, this, Game.bot);
        this.hunted.push(hunted);
        return hunted;
    }

    /**
     * Tries to return message in local language, if not found returns in english
     * @param {string} message - message key
     * @param {array} [args] - arguments to replace in message
     * @returns {string} message in local language
     */
    getMessage(messageKey, args = []) { return Game.getMessage(messageKey, this.language, args) };

    static getMessage(messageKey, language = 'en', args = []) {
        let message = messages[messageKey][language] || messages[messageKey].en;
        args.forEach(arg => message = message.replace(arg.key, arg.value));

        return message;
    }

    /**
     * Returns options for start message
     * @returns {object} - options for start message
     */
    getStartMessageOptions = () => {
        const keyboard = {
            inline_keyboard: [
                [
                    { text: '-5 min', callback_data: 'interval-5' },
                    { text: '-1 min', callback_data: 'interval-1' },
                    { text: '+1 min', callback_data: 'interval+1' },
                    { text: '+5 min', callback_data: 'interval+5' }
                ],
                [{ text: this.getMessage('keyboard_join_as_hunted'), callback_data: 'join_hunted' }],
                [{ text: this.getMessage('keyboard_start_game'), callback_data: 'start_game' }]
            ],
        };

        const options = {
            reply_markup: JSON.stringify(keyboard),
        };

        return options;
    }

    getStopMessageOptions = () => {
        const keyboard = {
            inline_keyboard: [
                [{ text: this.getMessage('keyboard_stop_game'), callback_data: 'stop_game' }]
            ],
        };

        const options = {
            reply_markup: JSON.stringify(keyboard),
        };

        return options;
    }

    /**
     * Returns game by group id
     * @param {int} groupId - group id
     * @returns {Game} - game
     */
    static getGameById(groupId) {
        return Game.games.find(game => game.groupId === groupId);
    }

    /**
     * Returns game by hunted id
     * @param {int} huntedId - hunted id
     * @returns {Game} - game
     */
    static getGameByHuntedId(huntedId) {
        return Game.games.find(game => game.hunted.find(hunted => hunted.id === huntedId));
    }

    /**
     * Returns hunted by hunted id
     * @param {int} huntedId 
     * @returns {Hunted} - hunted
     */
    static getHuntedById(huntedId) {
        const game = Game.getGameByHuntedId(huntedId);
        return game?.hunted.find(hunted => hunted.id === huntedId);
    }

    /**
     * Updates start message with current settings
     */
    updateStartMessage() {
        const args = [
            { key: '{interval}', value: this.interval },
            { key: '{hunted}', value: this.hunted.map(hunted => hunted.first_name).join('\n') }
        ];

        if (!this.isPlaying) {
            Game.bot.editMessageText(
                this.getMessage('game_initialize', args),
                {
                    chat_id: this.groupId,
                    message_id: this.startMessage.message_id,
                    ...this.getStartMessageOptions()
                }
            );
        } else {
            Game.bot.editMessageText(
                this.getMessage('game_started', args),
                {
                    chat_id: this.groupId,
                    message_id: this.startMessage.message_id,
                    ...this.getStopMessageOptions()
                }
            );
        }
    }

    /**
     * Handles callback query from inline keyboard
     * @param {*} query 
     */
    handleCallbackQuery(query) {
        const data = query.data;
        if (data === 'join_hunted')
            this.handleJoinHunted(query);
        else if (data === 'start_game')
            this.handleStartGame();
        else if (data.includes('interval'))
            this.handleIntervalChange(query);
        else if (data === 'stop_game')
            this.handleStopGame();
    }

    handleIntervalChange(query) {
        const interval = parseInt(query.data.replace('interval', ''));
        if (isNaN(interval)) return;

        this.interval += interval;
        if (this.interval < 1) this.interval = 1;
        this.updateStartMessage();
    }

    handleJoinHunted(query) {
        const userId = query.from.id;
        const firstName = query.from.first_name;

        const hunted = this.addHunted(userId, firstName);
        if (!hunted) return;

        hunted.sendInitialMessage();
        this.updateStartMessage();
    }

    handleStartGame() {
        this.isPlaying = true;
        this.updateStartMessage();
        this.locationInterval = setInterval(this.shareLocation.bind(this), this.interval * 60 * 1000);
    }

    handleStopGame() {
        clearInterval(this.locationInterval);
        Game.bot.sendMessage(this.groupId, this.getMessage('game_stopped'));
        Game.games = Game.games.filter(game => game.groupId !== this.groupId);
        delete this;
    }

    shareLocation() {
        this.hunted.forEach(async hunted => {
            if (!hunted.location.lat || !hunted.location.long) return;
            await Game.bot.sendMessage(
                this.groupId,
                this.getMessage(
                    'game_send_location',
                    [
                        { key: '{hunted}', value: hunted.first_name },
                        { key: '{timestamp}', value: new Date(hunted.location.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) }
                    ]
                ),
                { parse_mode: 'HTML' }
            );
            await Game.bot.sendLocation(this.groupId, hunted.location.lat, hunted.location.long);
        });
    }

    static handleLocation(msg) {
        const chatId = msg.chat.id;
        const hunted = Game.getHuntedById(chatId);
        if (!hunted) return;


        hunted.updateLocation(msg.location);
        // save location to database
        const db = new sqlite3.Database('./db.sqlite');
        db.run(`INSERT INTO location (player_id, latitude, longitude, timestamp) VALUES (?, ?, ?, ?)`,
            [hunted.id, hunted.location.lat, hunted.location.long, hunted.location.timestamp]);
        db.close();
    }
}