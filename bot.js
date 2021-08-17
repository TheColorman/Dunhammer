// eslint-disable-next-line no-unused-vars
const { Client, Intents, Collection, Message } = require('discord.js'),
    { botToken, mysqlPassword } = require('./token.json'),
    config = require('./config.json'),
    { mysql_login: mysqlLogin, admins } = require('./config.json'),
    fs = require('fs'),
    MySQL = require('./sql/sql.js'),

    client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.DIRECT_MESSAGES, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MEMBERS], partials: ['CHANNEL'] });

// Load commands
client.commands = new Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.name, command);
}

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
});
// Slash commands
client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const command = client.commands.get(interaction.commandName);

    try {
        await command.execute(
            interaction,
            sql
        )
    } catch (err) {
        console.error(err);
        await interaction.reply({ "content": "something went wrong. it was probably your fault, because if it wasnt, it would be my fault and i dont want that.", ephemeral: true });
    }
});
client.login(botToken);