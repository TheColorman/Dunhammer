// eslint-disable-next-line no-unused-vars
const { Client, Intents, Collection, Message } = require('discord.js'),
    { botToken, mysqlPassword } = require('./token.json'),
    config = require('./config.json'),
    { mysql_login: mysqlLogin, admins } = require('./config.json'),
    fs = require('fs'),
    MySQL = require('./sql/sql.js'),

    client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.DIRECT_MESSAGES, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MEMBERS], partials: ['CHANNEL'] });
client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
});
client.login(botToken);