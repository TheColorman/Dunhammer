// eslint-disable-next-line no-unused-vars
const { Client, Intents, Collection, Message } = require('discord.js'),
    { botToken, mysqlPassword } = require('./token.json'),
    config = require('./config.json'),
    { mysql_login: mysqlLogin, admins } = require('./config.json'),
    fs = require('fs'),
    MySQL = require('./sql/sql.js'),
    levelsystem = require('./levelsystem'),

    client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MEMBERS] });

// Load commands
client.commands = new Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.name, command);
}


// xp gain cooldown
const levelTimestamps = new Collection(),
    minuteTimestamps = new Collection(),

// Start MySQL connection 🤣
    sql = new MySQL(Object.assign({}, mysqlLogin, { password: mysqlPassword}));

// Random status setter
let statuses = [...config.statuses];
function updateStatus() {
    if (!statuses.length) statuses = [...config.statuses];
    const randomIndex = Math.floor(Math.random() * statuses.length),
        newStatus = statuses[randomIndex];
    statuses.splice(randomIndex, 1);

    console.log(`Setting status: [${newStatus}], ${statuses.length} remaining.`);

    client.user.setPresence({
        activities: [{
            name: `V3.0.0 under development! | ${newStatus}`,
            type: 'PLAYING'
        }]
    });
}

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
    // Timed status update
    updateStatus();
    setInterval(() => {
        updateStatus();
    }, 3600000);   // 3600000 = 1 hour, default

});

const adminCommands = {
    /**
     * 
     * @param {Message} message 
     */
    debug: async (message) => {
        message.channel.send({ content: "welcome to the debug zone" });
    },
    /**
     * 
     * @param {Message} message 
     */
    registercommands: async (message, type) => {
        if (!type) {
            return message.reply({
                content: "What commands would you like to update?",
                components: [{
                    type: "ACTION_ROW",
                    components: [{
                        type: "BUTTON",
                        label: "Guild",
                        customId: "admincommands.registercommands.guild",
                        style: "SECONDARY"
                    }, {
                        type: "BUTTON",
                        label: "Global",
                        customId: "admincommands.registercommands.global",
                        style: "DANGER"
                    }]
                }]
            });
        }
        switch(type) {
            case "guild": {
                const guildID = message.guild ? message.guild.id : message.content.split(" ")[1];
                if (!guildID) return message.reply({ content: "No Guild ID!" });
                message.update({
                    content: `Registering slash commands in guild with ID ${guildID}... `,
                    components: [{
                        type: "ACTION_ROW",
                        components: [{
                            type: "BUTTON",
                            label: "Guild",
                            customId: "admincommands.registercommands.guild",
                            style: "SECONDARY",
                            disabled: true
                        }, {
                            type: "BUTTON",
                            label: "Global",
                            customId: "admincommands.registercommands.global",
                            style: "DANGER",
                            disabled: true
                        }]
                    }]    
                });
        
                client.commands.each(command => {
                    message.channel.send({ content: `Registering ${command.name}`});
                    client.application.commands.create(command.ApplicationCommandData, guildID);
                });        
                break;
            }
            case "global": {
                message.update({
                    content: `Registering slash commands globally...`,
                    components: [{
                        type: "ACTION_ROW",
                        components: [{
                            type: "BUTTON",
                            label: "Guild",
                            customId: "admincommands.registercommands.guild",
                            style: "SECONDARY",
                            disabled: true
                        }, {
                            type: "BUTTON",
                            label: "Global",
                            customId: "admincommands.registercommands.global",
                            style: "DANGER",
                            disabled: true
                        }]
                    }]    
                });
        
                client.commands.each(command => {
                    message.channel.send({ content: `Registering ${command.name}`});
                    client.application.commands.create(command.ApplicationCommandData);
                });        
                break;
            }
        }

    },
    // Message here can also be an interaction if a button is pressed.
    reloaddatabase: async (message, type) => {
        if (!type) {
            return message.reply({
                content: "What databases would you like to reload?",
                components: [{
                    type: "ACTION_ROW",
                    components: [{
                        type: "BUTTON",
                        label: "Guilds",
                        customId: "admincommands.reloaddatabase.guilds",
                        style: "SECONDARY"
                    }, {
                        type: "BUTTON",
                        label: "Guild levelsystems",
                        customId: "admincommands.reloaddatabase.guildlevelsystem",
                        style: "SECONDARY"
                    }]
                }]
            });
        }
        switch (type) {
            case "guilds": {
                message.update({
                    content: "<a:discord_loading:821347252085063680> Reloading Guild database",
                    components: [{
                        type: "ACTION_ROW",
                        components: [{
                            type: "BUTTON",
                            label: "Guilds",
                            customId: "admincommands.reloaddatabase.guilds",
                            style: "SECONDARY",
                            disabled: true
                        }, {
                            type: "BUTTON",
                            label: "Guild levelsystems",
                            customId: "admincommands.reloaddatabase.guildlevelsystem",
                            style: "SECONDARY",
                            disabled: true
                        }]
                    }]
                });
                client.guilds.fetch().then(async collection => {
                    collection.each(async guild => {
                        sql.getDBGuild(guild);
                    });
                    message.message.edit({
                        content: `:white_check_mark: Done, all ${collection.size} guilds now up to date in database.`,
                        components: [{
                            type: "ACTION_ROW",
                            components: [{
                                type: "BUTTON",
                                label: "Guilds",
                                customId: "admincommands.reloaddatabase.guilds",
                                style: "SECONDARY",
                                disabled: true
                            }, {
                                type: "BUTTON",
                                label: "Guild levelsystems",
                                customId: "admincommands.reloaddatabase.guildlevelsystem",
                                style: "SECONDARY",
                                disabled: true
                            }]
                        }]
                    });
                });

                break;
            }
            case "guildlevelsystem": {
                message.update({
                    content: "<a:discord_loading:821347252085063680> Reloading Guild Levelsystem database...",
                    components: [{
                        type: "ACTION_ROW",
                        components: [{
                            type: "BUTTON",
                            label: "Guilds",
                            customId: "admincommands.reloaddatabase.guilds",
                            style: "SECONDARY",
                            disabled: true
                        }, {
                            type: "BUTTON",
                            label: "Guild levelsystems",
                            customId: "admincommands.reloaddatabase.guildlevelsystem",
                            style: "SECONDARY",
                            disabled: true
                        }]
                    }]
                });
                client.guilds.fetch().then(async collection => {
                    collection.each(async guild => {
                        sql.getDBGuildLevelsystem(guild);
                    });
                    message.message.edit({
                        content: `:white_check_mark: Done, all ${collection.size} guild levelsystems now up to date in database.`,
                        components: [{
                            type: "ACTION_ROW",
                            components: [{
                                type: "BUTTON",
                                label: "Guilds",
                                customId: "admincommands.reloaddatabase.guilds",
                                style: "SECONDARY",
                                disabled: true
                            }, {
                                type: "BUTTON",
                                label: "Guild levelsystems",
                                customId: "admincommands.reloaddatabase.guildlevelsystem",
                                style: "SECONDARY",
                                disabled: true
                            }]
                        }]
                    });
                });
                break;
            }
            default: {
                message.message.reply({ content: "You find yourself in a mysterious place..." });
            }
        }
    },
    // Shows the levelupimage
    levelupimage: async (message, type) => {
        if (!type) {
            return message.reply({
                content: "What image would you like to send?",
                components: [{
                    type: "ACTION_ROW",
                    components: [{
                        type: "BUTTON",
                        label: "Server",
                        customId: "admincommands.levelupimage.server",
                        style: "SECONDARY"
                    }, {
                        type: "BUTTON",
                        label: "Global",
                        customId: "admincommands.levelupimage.global",
                        style: "SECONDARY"
                    }]
                }]
            });
        }
        switch (type) {
            case "server": {
                message.update({
                    content: `${message.member}\n{levelupMessage}`,
                    files: [await levelsystem.createLevelupImageServer()],
                    components: []
                });
                break;
            }
            case "global": {
                message.update({
                    content: `Congratulations ${message.user}! You reached level 10 on the Global Dunhammer Leaderboard and gained ${10 * 10} <:DunhammerCoin:878740195078463519>.`,
                    files: [await levelsystem.createLevelupImageGlobal()],
                    components: []
                });
            }
        }
    }
}



client.on("messageCreate", async message => {
    // levelsystem.xpGain(message, sql, levelTimestamps, minuteTimestamps);

    if (!message.content.startsWith(".")) return;
    const command = message.content.split(" ")[0].substr(1);
    // Check if admin
    if (Object.keys(adminCommands).includes(command.toLowerCase())) {
        if (!admins.includes(message.author.id)) return message.reply({ content: "Looks like you're not a Dunhammer admin bucko <:gunshootright734567:844129117002530847>" });
        adminCommands[command.toLowerCase()](message);
    }
});

//#region Interaction events
// Slash commands
client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    // Check if interaction user is in the database
    sql.getDBGuildMember(interaction.member);
    sql.getDBUser(interaction.user);

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

// Buttons
client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;

    // Split up interactions customId to use in admin commands
    const interactionInfo = interaction.customId.split(".");
    if (interactionInfo[0] == "admincommands") {
        // Reject if not admin
        if (!admins.includes(interaction.user.id)) return interaction.reply({ content: `${interaction.member} looks like you're not a Dunhammer admin bucko <:gunshootright734567:844129117002530847>` });
        // Run admin command using interaction customId
        adminCommands[interactionInfo[1]](interaction, interactionInfo[2]);
        return;
    }
    // Some commands have special event receivers
    const command = client.commands.get(interactionInfo[1]);
    try {
        await command[interactionInfo[2]](interaction)
    } catch(err) {
        console.error(err);
        await interaction.reply({ "content": "something went wrong. it was probably your fault, because if it wasnt, it would be my fault and i dont want that.", ephemeral: true });
    }
    
});
//#endregion

// Clear xp limits every minute
setInterval(() => {
    minuteTimestamps.clear();
}, 1000 * 60);
client.login(botToken);