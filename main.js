require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const Game = require('./game');

const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });
Game.bot = bot;

// Bot commands
const commands = [];
fs.readdirSync('./commands').forEach(file => {
    commands.push(require(`./commands/${file}`));
});

// Bot actions
bot.on('message', (msg) => {
    const text = msg.text.toLowerCase();

    const command = commands.find(command => '/' + command.name === text);
    if (!command) return;
    const middleware = command.middleware(msg);
    if (middleware !== true) {
        bot.sendMessage(msg.chat.id, middleware);
        return;
    }

    command.execute(bot, msg);
});

// For location sharing
// bot.on('location', (msg) => {
//     const { latitude, longitude } = msg.location;
//     const chatId = msg.chat.id;
//     bot.sendMessage(chatId, `Latitude: ${latitude}\nLongitude: ${longitude}`);
// })

// bot.on('edited_message', msg => {
//     if (msg.location) {
//         const { latitude, longitude } = msg.location;
//         const chatId = msg.chat.id;
//         bot.sendMessage(chatId, `Latitude: ${latitude}\nLongitude: ${longitude}`);
//     }
// })

bot.on('polling_error', (error) => {
    console.log(error);
})

// Callback queries used for inline keyboards
bot.on('callback_query', query => {
    const chatId = query.message.chat.id;
    const game = Game.getGameById(chatId);
    game?.handleCallbackQuery(query);

    bot.answerCallbackQuery(query.id);
});