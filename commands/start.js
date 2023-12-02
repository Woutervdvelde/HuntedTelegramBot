const Game = require('../game');

module.exports = {
    name: 'start',
    description: 'Start the game',
    middleware(msg) {
        return true;
    },
    execute(bot, msg) {
        const chatId = msg.chat.id;
        bot.sendMessage(chatId, 'Game started!');
    }
}