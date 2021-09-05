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

// this is stupid. im adding a property so i can keep track of all running collectors, because 2 collectors in the same channel is a bad idea
client.collectors = [];

// Yes im doing this again
process.on('uncaughtException', async (err) => {
    console.error("DUNHAMMER HAS CRASHED, PREVENTING SHUTDOWN. ERROR:");
    console.error(err);
});


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
        
        const guildPartials = await client.guilds.fetch();
        guildPartials.forEach(async partial => {
            const
                guild = await partial.fetch(),
                channels = await guild.channels.fetch(),
                channel = channels.find(channel => channel.type == "GUILD_TEXT" && new RegExp("bot|command|console|cmd").test(channel.name));
            console.log((channel || { id: null }).id);
        });
        // eslint-disable-next-line no-unreachable
        const ids = [
            "352395149332185088",
            "842380335148433438",
            "799590596284645376",
            "872623224268144691",
            "713156793039323158",
            "573158831421521921",
            "705698250833002576",
            "404676729379225601",
            "776203334692503602",
            "671093018157121546",
            "615996101501255875"
        ];
        ids.forEach(async channelId => {
            const channel = await client.channels.fetch(channelId);
            channel.send({
                content: `
:wave: Hello!
**Dunhammer just updated to version 3!**
__What does this mean for you?__
It means a better looking bot that takes full advantage of Discords net Interactions, such as buttons!
Sadly, this also means that Dunhammer no longer supports normal commands. All commands have to be accessed through Discords slash command menu (type "/" to see them).
If you can't see the commands, try inviting Dunhammer again using this link:
https://discord.com/api/oauth2/authorize?client_id=671681661296967680&permissions=1812327488&scope=bot%20applications.commands.

And don't worry, your settings and xp hasn't been reset or anything.

Now on to the fun stuff:
**New features!**
- As mentioned, there are now Interactions such as Buttons on several messages.
- Several rarely used commands have been removed (not really a feature though).
- All the code for Dunhammer has been completely rewritten (this shouldn't affect you other than Dunhammer being slightly faster).
**And the biggest feature:**
- Global Leaderboards and custom profiles (WIP)!
Dunhammer now has a Global Leaderboard, so you can show off your level in all servers with Dunhammer on it!
In the no-so-distant future Dunhammer will get a website with full support for custom profile backgrounds and a shop using the new Coins <:DunhammerCoin:878740195078463519>!

Thats about it, now go enjoy Dunhammer!`
            });
        });
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
                    }, {
                        type: "BUTTON",
                        label: "Guild members",
                        customId: "admincommands.reloaddatabase.guildmembers",
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
                        }, {
                            type: "BUTTON",
                            label: "Guild members",
                            customId: "admincommands.reloaddatabase.guildmembers",
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
                        }, {
                            type: "BUTTON",
                            label: "Guild members",
                            customId: "admincommands.reloaddatabase.guildmembers",
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
                            }]
                        }]
                    });
                });
                break;
            }
            case "guildmembers": {
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
                        }, {
                            type: "BUTTON",
                            label: "Guild members",
                            customId: "admincommands.reloaddatabase.guildmembers",
                            style: "SECONDARY",
                            disabled: true
                        }]
                    }]
                });
                const guilds = await client.guilds.fetch();
                guilds.forEach(async guildPartial => {
                    const
                        guild = await guildPartial.fetch(),
                        members = await guild.members.fetch();
                    
                    members.forEach(member => {
                        sql.updateDBGuildMember(member);
                    });
                });
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
    }
}



client.on("messageCreate", async message => {
    if (message.author.id != "298842558610800650") return;
    if (message.author.bot) return;
    levelsystem.xpGain(message, sql, levelTimestamps, minuteTimestamps);

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
        try {
            await interaction.reply({ "content": "something went wrong. it was probably your fault, because if it wasnt, it would be my fault and i dont want that.", ephemeral: true });
        } catch(e) {    // You may call it "shit code", I call it "*functional code*""
            if (e.name == "Error [INTERACTION_ALREADY_REPLIED]") await interaction.editReply({ "content": "something went wrong. it was probably your fault, because if it wasnt, it would be my fault and i dont want that.", ephemeral: true });
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
        // 2nd argument is always sql object for database function.
        // Further arguments are on a case-by-case basis if
        // further information is needed as a data store.
        await command[interactionInfo[2]](interaction, sql, interactionInfo[3])
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

// Add new guilds to database
client.on("guildCreate", async (guild) => {
    await sql.getDBGuild(guild);
    await sql.getDBGuildLevelsystem(guild);
});

//#region Update existing database entries
client.on("guildUpdate", async (oldGuild, newGuild) => {
    await sql.updateDBGuild(newGuild);
});

client.on("guildMemberUpdate", async (oldMember, newMember) => {
    await sql.updateDBGuildMember(newMember);
    await sql.updateDBUser(newMember.user);
});

client.on("guildMemberRemove", async (member) => {
    const DBGuildMembers = await sql.get("guildusers", `guildid = ${member.guild.id} AND userid = ${member.id}`);
    if (DBGuildMembers.length) {
        await sql.update("guildusers", {
            inGuild: false
        }, `guildid = ${member.guild.id} AND userid = ${member.id}`);
    }
});

client.on("guildMemberAdd", async (member) => {
    await sql.updateDBGuildMember(member);
});
//#endregion

client.login(botToken);