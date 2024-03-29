// Setup
// eslint-disable-next-line no-unused-vars
const { Client, Intents, Collection, Message, MessageAttachment } = require('discord.js'),
    { REST } = require('@discordjs/rest'),
    { Routes } = require('discord-api-types/v9'),
    { botToken, mysqlPassword } = require('./token.json'),
    config = require('./config.json'),
    { mysql_login: mysqlLogin, admins } = require('./config.json'),
    fs = require('fs'),
    MySQL = require('./sql/sql.js'),
    DunhammerEvents = require('./dunhammerEvents'),
    levelsystem = require('./levelsystem'),

    client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILD_VOICE_STATES ] });

// Event emitter
const Events = DunhammerEvents;

// Load commands
client.commands = new Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.name, command);
}

// this is stupid. im adding a property so i can keep track of all running collectors, because 2 collectors in the same channel is a bad idea
client.collectors = [];

// Songqueue
client.songQueue = new Collection();

// Yes im doing this again
process.on('uncaughtException', async (err) => {
    console.error("DUNHAMMER HAS CRASHED, PREVENTING SHUTDOWN. ERROR:");
    console.error(err);
});


// xp gain cooldown
const levelTimestamps = new Collection(),
    minuteTimestamps = new Collection(),

// Start MySQL connection 🤣
    sql = new MySQL(Object.assign({}, mysqlLogin, { password: mysqlPassword }));

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
            name: `V${require('./package.json').version} | ${newStatus}`,
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
        
        //// const guildPartials = await client.guilds.fetch();
        //// guildPartials.forEach(async partial => {
        ////     const
        ////         guild = await partial.fetch(),
        ////         channels = await guild.channels.fetch(),
        ////         channel = channels.find(channel => channel.type == "GUILD_TEXT" && new RegExp("bot|command|console|cmd").test(channel.name));
        ////     console.log((channel || { id: null }).id);
        //// });
        //// eslint-disable-next-line no-unreachable
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
        
                const rest = new REST({ version: '9' }).setToken(botToken);

                const commands = [];
                
                for (const command of client.commands.values()) {
                    commands.push(command.ApplicationCommandData);
                }

                (async () => {
                    try {
                        console.log('Started refreshing application (/) commands.');
                
                        await rest.put(
                            Routes.applicationGuildCommands(client.user.id, guildID),
                            { body: commands },
                        );
                
                        console.log('Successfully reloaded application (/) commands.');
                        message.channel.send("Successfully reloaded application (/) commands.");
                    } catch (error) {
                        console.error(error);
                        message.channel.send("Failed to reload application (/) commands.");
                    }
                })();
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
        
                const rest = new REST({ version: '9' }).setToken(botToken);

                const commands = [];
                
                for (const command of client.commands.values()) {
                    commands.push(command.ApplicationCommandData);
                }

                (async () => {
                    try {
                        console.log('Started refreshing application (/) commands.');
                
                        await rest.put(
                            Routes.applicationCommands(client.user.id),
                            { body: commands },
                        );
                
                        console.log('Successfully reloaded application (/) commands.');
                        message.channel.send("Successfully reloaded application (/) commands.");
                    } catch (error) {
                        console.error(error);
                        message.channel.send("Failed to reload application (/) commands.");
                    }
                })();
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
                    }, {
                        type: "BUTTON",
                        label: "Guild members",
                        customId: "admincommands.reloaddatabase.guildmembers",
                        style: "SECONDARY"
                    }, {
                        type: "BUTTON",
                        label: "User badges",
                        customId: "admincommands.reloaddatabase.userbadges",
                        style: "SECONDARY",
                    }]
                }]
            });
        }
        switch (type) {
            case "guilds": {
                message.update({
                    content: "<a:discord_loading:821347252085063680> Reloading `guilds` database",
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
                        }, {
                            type: "BUTTON",
                            label: "Guild members",
                            customId: "admincommands.reloaddatabase.guildmembers",
                            style: "SECONDARY",
                            disabled: true
                        }, {
                            type: "BUTTON",
                            label: "User badges",
                            customId: "admincommands.reloaddatabase.userbadges",
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
                            }, {
                                type: "BUTTON",
                                label: "Guild members",
                                customId: "admincommands.reloaddatabase.guildmembers",
                                style: "SECONDARY",
                                disabled: true
                            }, {
                                type: "BUTTON",
                                label: "User badges",
                                customId: "admincommands.reloaddatabase.userbadges",
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
                    content: "<a:discord_loading:821347252085063680> Reloading `guildlevelsystem` database...",
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
                        }, {
                            type: "BUTTON",
                            label: "Guild members",
                            customId: "admincommands.reloaddatabase.guildmembers",
                            style: "SECONDARY",
                            disabled: true
                        }, {
                            type: "BUTTON",
                            label: "User badges",
                            customId: "admincommands.reloaddatabase.userbadges",
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
                            }, {
                                type: "BUTTON",
                                label: "Guild members",
                                customId: "admincommands.reloaddatabase.guildmembers",
                                style: "SECONDARY",
                                disabled: true
                            }, {
                                type: "BUTTON",
                                label: "User badges",
                                customId: "admincommands.reloaddatabase.userbadges",
                                style: "SECONDARY",
                                disabled: true
                            }]
                        }]
                    });
                });
                break;
            }
            case "guildmembers": {
                const messageComponents = [{
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
                    }, {
                        type: "BUTTON",
                        label: "Guild members",
                        customId: "admincommands.reloaddatabase.guildmembers",
                        style: "SECONDARY",
                        disabled: true
                    }, {
                        type: "BUTTON",
                        label: "User badges",
                        customId: "admincommands.reloaddatabase.userbadges",
                        style: "SECONDARY",
                        disabled: true
                    }]
                }];

                await message.update({ content: "<a:discord_loading:821347252085063680> Reloading `guildusers` database...", components: messageComponents });

                const msg = await message.channel.send(`<a:discord_loading:821347252085063680> Reloading ` + `${client.guilds.cache.size} guilds...`);

                const updateMessage = async (description) => msg.edit({ content: description ? "\n\n" + description : "" });
                const guilds = await client.guilds.fetch();

                updateMessage("Fetching guilds and members from Discord...");
                let i = 0;
                for (const guildPartial of guilds.values()) {
                    i++;
                    const guild = await guildPartial.fetch();
                    const members = await guild.members.fetch();
                    
                    if (i % 5 === 0) { updateMessage(`Fetching guilds and members from Discord...\n\nFetching guild ${i}/${guilds.size} with ${members.size} members...`); }

                    members.forEach(member => {
                        sql.updateDBGuildMember(member);
                    });
                }
                
                const DBGuildMembers = await sql.get("guildusers");

                updateMessage("Fetching guilds and members from database and comparing with Discord...");
                let iterations = 0;
                for (const DBGuildMember of DBGuildMembers) {
                    iterations++;
                    try {
                        const guild = await client.guilds.fetch(DBGuildMember.guildid);
                        if (iterations % 50 === 0) { updateMessage(`Fetching guilds and members from database and comparing with Discord...\n\nComparing member ${iterations}/${DBGuildMembers.length}...`); }
                        try {
                            const member = await guild.members.fetch(DBGuildMember.userid);
                            sql.updateDBGuildMember(member);
                        } catch (error) {
                            sql.update("guildusers", {
                                inGuild: false,
                            }, `\`guildid\` = "${DBGuildMember.guildid}" AND \`userid\` = "${DBGuildMember.userid}"`);
                        }
                    } catch (error) {
                        message.channel.send(`🚫 Error while fetching guild ${DBGuildMember.guildid} from Discord.\n\n\`\`\`${error.message}\`\`\``);
                    }
                }

                updateMessage("Fetching guilds and members from database and comparing with Discord...\n\nDone!");

                message.message.edit({
                    content: `:white_check_mark: Done, updated members in all ${guilds.size} guilds.`,
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
                        }, {
                            type: "BUTTON",
                            label: "Guild members",
                            customId: "admincommands.reloaddatabase.guildmembers",
                            style: "SECONDARY",
                            disabled: true
                        }, {
                            type: "BUTTON",
                            label: "User badges",
                            customId: "admincommands.reloaddatabase.userbadges",
                            style: "SECONDARY",
                            disabled: true
                        }]
                    }]
                });
                break;
            }
            case "userbadges": {
                message.update({
                    content: "<a:discord_loading:821347252085063680> Reloading badges `badges` portion of `users` database...",
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
                        }, {
                            type: "BUTTON",
                            label: "Guild members",
                            customId: "admincommands.reloaddatabase.guildmembers",
                            style: "SECONDARY",
                            disabled: true
                        }, {
                            type: "BUTTON",
                            label: "User badges",
                            customId: "admincommands.reloaddatabase.userbadges",
                            style: "SECONDARY",
                            disabled: true
                        }]
                    }]
                });
                const guilds = await client.guilds.fetch();
                let currentGuild = 0;
                const users = [];
                // Loop through all guilds
                for (const guildPartial of guilds.values()) {
                    currentGuild++;
                    message.message.edit({
                        content: `Guild ${currentGuild}/${guilds.size}`
                    });
                    // Fetch members using guild partial
                    const
                        guild = await guildPartial.fetch(),
                        members = await guild.members.fetch();

                    // Loop through all members
                    for (const member of members.values()) {
                        const user = member.user;
                        if (users.indexOf(user) === -1) { users.push(user); }

                        Events.emit("levelupServer", sql, member);
                        Events.emit("command", sql, member, null);
                    }
                }
                Promise.all(users).then(() => {
                    // Loop throug all users
                    for (const user of users.values()) {
                        Events.emit("levelupGlobal", sql, user);
                        Events.emit("payment", sql, user.id, 0);
                    }
                });
                message.message.edit({
                    content: `:white_check_mark: Done, updated badges for all members in all ${guilds.size} guilds.`,
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
                        }, {
                            type: "BUTTON",
                            label: "Guild members",
                            customId: "admincommands.reloaddatabase.guildmembers",
                            style: "SECONDARY",
                            disabled: true
                        }, {
                            type: "BUTTON",
                            label: "User badges",
                            customId: "admincommands.reloaddatabase.userbadges",
                            style: "SECONDARY",
                            disabled: true
                        }]
                    }]
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
                message.message.removeAttachments().then(async () => {
                    message.update({
                        content: `Server levelup debug`,
                        files: [await require('./levelsystem').createLevelupImageServer(message.message, 15, sql)],
                        components: [{
                            type: "ACTION_ROW",
                            components: [{
                                type: "BUTTON",
                                label: "refresh",
                                customId: "admincommands.levelupimage.server",
                                style: "PRIMARY",
                                emoji: "🔄"
                            }]
                        }]
                    });
                });
                break;
            }
            case "global": {
                message.message.removeAttachments().then(async () => {
                    message.update({
                        content: `Global levelup debug.`,
                        files: [await require('./levelsystem').createLevelupImageGlobal(message.message, 15, sql)],
                        components: [{
                            type: "ACTION_ROW",
                            components: [{
                                type: "BUTTON",
                                label: "refresh",
                                customId: "admincommands.levelupimage.global",
                                style: "PRIMARY",
                                emoji: "🔄"
                            }]
                        }]
                    });
                });
            }
        }
    },
    // This is either the worst idea ever, or the best idea ever.
    // Admin command that executes a string as code, and returns the result.
    execute: async (message) => {
        const sendMessage = (content, result) => message.reply({ content: "```js\n" + content + "\n```\n```\n" + result + "\n```" });
        // Remove command name from message content
        const content = message.content.slice(".execute".length);
        try {
            const result = await eval(content);
            
            sendMessage(content, result).catch(() => {
                let stringed = JSON.stringify(result);
                if (!stringed) stringed = "No output.";
                const buffer = Buffer.from(stringed, 'utf-8');
                const attachment = new MessageAttachment(buffer, "result.txt");
                message.channel.send({
                    content: "Result:", 
                    files: [attachment]
                });
            });
        } catch (e) {
            sendMessage(content, e).catch(() => {
                let stringed = JSON.stringify(e);
                if (!stringed) stringed = "No output.";
                const buffer = Buffer.from(stringed, 'utf-8');
                const attachment = new MessageAttachment(buffer, "result.txt");
                message.channel.send({
                    content: "Error:",
                    files: [attachment]
                });
            });
        }
    }
}



client.on("messageCreate", async message => {
    if (message.author.bot) return;
    levelsystem.xpGain(message, sql, Events, levelTimestamps, minuteTimestamps);

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
    if (interaction.channel.type == "DM") return interaction.reply({
        content: "DM commands not currently supported, check back soon!"
    });

    // Check if interaction user is in the database
    interaction.DBGuildMember = await sql.getDBGuildMember(interaction.member);
    interaction.DBUser = await sql.getDBUser(interaction.user);

    const command = client.commands.get(interaction.commandName);

    try {
        await command.execute(
            interaction,
            sql,
            Events,
        )
        Events.emit("command", sql, interaction.member, interaction.commandName, interaction.channel);
    } catch (err) {
        console.error(err);
        try {
            await interaction.reply({ "content": "something went wrong. either my code is bad or you fucked something up, and my code is never bad.", embeds: [] , ephemeral: true });
        } catch(e) {    // You may call it "shit code", I call it "*functional code*""
            if (e.name == "Error [INTERACTION_ALREADY_REPLIED]") await interaction.editReply({ "content": "something went wrong. either my code is bad or you fucked something up, and my code is never bad.", embeds: [], ephemeral: true });
            else if (e.name == "Unknown interaction") console.log("Timed out");
            else {
                console.log("Aight, wtf just happened");
                console.error(e);
            }
        }
    }
});

// Buttons and Select Menus
client.on('interactionCreate', async interaction => {
    if (!(interaction.isButton() || interaction.isSelectMenu())) return;
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
        // -- Button event listeners. --
        // 2nd argument is always sql object for database function, 3rd is always Event object,
        // Further arguments are on a case-by-case basis if
        // further information is needed as a data store.
        //! ^ Storing information in the button ID is a terrible idea
        await command[interactionInfo[2]](interaction, sql, Events, interactionInfo[3]);
    } catch(err) {
        console.error(err);
        try {
            await interaction.reply({ "content": "something went wrong. it was probably your fault, because if it wasnt, it would be my fault and i dont want that.", ephemeral: true });
        } catch(e) {
            if (e.name == "Error [INTERACTION_ALREADY_REPLIED]") await interaction.editReply({ "content": "something went wrong. it was probably your fault, because if it wasnt, it would be my fault and i dont want that.", ephemeral: true });
            else if (e.name == "Unknown interaction") console.log("Timed out");
            else {
                console.log("Aight, wtf just happened");
                console.error(e);
            }
        }
    }
    
});
//#endregion

// Clear xp limits every minute
setInterval(() => {
    minuteTimestamps.clear();
}, 1000 * 60);

// Add new guilds to database
client.on("guildCreate", async (guild) => {
    // Add new guild to database
    await sql.getDBGuild(guild);
    await sql.getDBGuildLevelsystem(guild);

    // Find member that invited bot
    const permissions = guild.me.permissions.has("VIEW_AUDIT_LOG");
    if (!permissions) return;
    const log = await guild.fetchAuditLogs({ type: "BOT_ADD" });
    const user = log.entries.first().executor;

    // Emit event
    Events.emit("newGuild", sql, user);
});

//#region Update existing database entries
client.on("guildUpdate", async (_oldGuild, newGuild) => {
    await sql.updateDBGuild(newGuild);
});

client.on("guildMemberUpdate", async (_oldMember, newMember) => {
    await sql.updateDBGuildMember(newMember);
    await sql.updateDBUser(newMember.user);
});

client.on("guildMemberRemove", async (member) => {
    const DBGuildMembers = await sql.get("guildusers", `\`guildid\` = "${member.guild.id}" AND \`userid\` = "${member.id}"`);
    if (DBGuildMembers.length) {
        await sql.update("guildusers", {
            inGuild: false
        }, `\`guildid\` = "${member.guild.id}" AND \`userid\` = "${member.id}"`);
    }
});

client.on("guildMemberAdd", async (member) => {
    await sql.updateDBGuildMember(member);
});
//#endregion

client.login(botToken);