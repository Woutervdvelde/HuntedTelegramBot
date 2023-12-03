const Game = require('../game');

module.exports = {
    name: 'start',
    description: 'Start the game',
    middleware(msg) {
        return true;
    },
    async execute(bot, msg) {
        const chatId = msg.chat.id;
        try {
            const game = new Game(chatId, msg.from.language_code);
            const arguments = [
                { key: '{interval}', value: game.interval },
                { key: '{hunted}', value: game.hunted.map(hunted => hunted.first_name).join('\n') }
            ];
            const startMessage = await bot.sendMessage(
                chatId,
                game.getMessage('game_initialize', arguments),
                game.getStartMessageOptions()
            );
            game.startMessage = startMessage;
        } catch (error) {
            bot.sendMessage(chatId, error.message);
        }
    }
}