module.exports = {
    name: 'ping',
    description: 'Test command',
    middleware(msg) {
        return true;
    },
    async execute(bot, msg) {
        const chatId = msg.chat.id;
        bot.sendMessage(chatId, 'Pong!');
    }
}