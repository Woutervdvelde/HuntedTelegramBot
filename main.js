require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');

const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

// Bot commands
const commands = [];
fs.readdirSync('./commands').forEach(file => {
    commands.push(require(`./commands/${file}`));
});

// Bot actions
bot.on('message', (msg) => {
    const text = msg.text.toLowerCase();

    const command = commands.find(command => '/' + command.name === text);
    if (!(command && command.middleware(msg))) return;

    command.execute(bot, msg);
});

const sendStartMessage = (chatId) => {
    const keyboard = {
        inline_keyboard: [
            [
                { text: '-5', callback_data: 'interval-5' },
                { text: '-1', callback_data: 'interval-1' },
                { text: 'Current', callback_data: 'interval-current' },
                { text: '+1', callback_data: 'interval+1' },
                { text: '+5', callback_data: 'interval+5' }
            ],
        ],
    };

    const options = {
        reply_markup: JSON.stringify(keyboard),
    };

    bot.sendMessage(chatId, 'Choose an interval:', options);
}

bot.on('location', (msg) => {
    const { latitude, longitude } = msg.location;
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, `Latitude: ${latitude}\nLongitude: ${longitude}`);
})

bot.on('edited_message', msg => {
    if (msg.location) {
        const { latitude, longitude } = msg.location;
        const chatId = msg.chat.id;
        bot.sendMessage(chatId, `Latitude: ${latitude}\nLongitude: ${longitude}`);
    }
})

bot.on('polling_error', (error) => {
    console.log(error);
});