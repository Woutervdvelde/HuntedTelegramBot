const Hunted = require('./hunted');
const messages = require('./messages');

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

        Game.games.push(this);
    }

    /**
     * Adds hunted to the game by user id
     * @param {int} id 
     * @param {string} firstName
     * @returns {boolean} - true if hunted was added, false if hunted already exists
     */
    addHunted(id, firstName) {
        if (this.hunted.find(hunted => hunted.id === id)) return false;

        this.hunted.push(new Hunted(id, firstName));
        return true;
    }

    /**
     * Tries to return message in local language, if not found returns in english
     * @param {string} message - message key
     * @param {array} [args] - arguments to replace in message
     * @returns {string} message in local language
     */
    getMessage(messageKey, args = []) {
        let message = messages[messageKey][this.language] || messages[messageKey].en;
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
        this.updateStartMessage();
    }

    handleJoinHunted(query) {
        const userId = query.from.id;
        const firstName = query.from.first_name;
        if (!this.addHunted(userId, firstName)) return;

        this.updateStartMessage();
    }

    handleStartGame() {
        this.isPlaying = true;
        this.updateStartMessage();
    }

    handleStopGame() {
        Game.bot.sendMessage(this.groupId, this.getMessage('game_stopped'));
        Game.games = Game.games.filter(game => game.groupId !== this.groupId);
        delete this;
    }
}