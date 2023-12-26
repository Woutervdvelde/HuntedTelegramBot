require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const Game = require('./game');
const sqlite3 = require('sqlite3').verbose();

const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });
Game.bot = bot;

// Bot commands
const commands = [];
fs.readdirSync('./commands').forEach(file => {
    commands.push(require(`./commands/${file}`));
});

// Create database tables if not exists
const db = new sqlite3.Database('./db.sqlite');
db.run(`CREATE TABLE IF NOT EXISTS game (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chat_id INTEGER,
    language TEXT,
    interval INTEGER,
    is_playing INTEGER,
    start_message_id INTEGER,
    location_interval INTEGER
)`);

db.run(`CREATE TABLE IF NOT EXISTS player (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id INTEGER,
    user_id INTEGER,
    type INTEGER
)`);

db.run(`CREATE TABLE IF NOT EXISTS location (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id INTEGER,
    latitude REAL,
    longitude REAL,
    timestamp INTEGER
)`);
db.close();

// Bot actions
bot.on('message', (msg) => {
    const text = msg.text?.toLowerCase();

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
bot.on('location', (msg) => {
    Game.handleLocation(msg);
})

bot.on('edited_message', msg => {
    if (msg.location)
        Game.handleLocation(msg);
})

// Callback queries used for inline keyboards
bot.on('callback_query', query => {
    const chatId = query.message.chat.id;
    const game = Game.getGameById(chatId);
    game?.handleCallbackQuery(query);

    bot.answerCallbackQuery(query.id);
});


bot.on('polling_error', (error) => {
    console.log(error);
})