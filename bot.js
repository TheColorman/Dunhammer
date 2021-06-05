// Modules & config
const Discord = require('discord.js'),
    fs = require('fs'),
    MySQL = require("./sql/sql"),
    { CanvasImage } = require('./helperfunctions.js'),

    { presences } = require('./config.json'),
    { token, mysqlPassword } = require('./token.json'),
    // eslint-disable-next-line no-unused-vars
    { apiFunctions } = require('./helperfunctions');
// Database
const sql = new MySQL({ host: "phpmyadmin.head9x.dk", user: "Colorman", password: mysqlPassword, database: "colorman" }),


// Create a new Discord client
    client = new Discord.Client();
client.commandCategories = new Discord.Collection();
const cooldowns = new Discord.Collection(),
    levelTimestamps = new Discord.Collection(),

// Load the commands with their categories 
    commandFilesObj = {};
fs.readdirSync('./commands').forEach(folder => {
    commandFilesObj[folder] ||= fs.readdirSync(`./commands/${folder}`).filter(file => file.endsWith('.js'));
});

for (const folder of Object.keys(commandFilesObj)) {
    client.commandCategories.set(folder, new Discord.Collection());
    for (const file of commandFilesObj[folder]) {
        const command = require(`./commands/${folder}/${file}`);
        client.commandCategories.get(folder).set(command.name, command);
    }
}

// State of the art crash protection (don't do this)
process.on('uncaughtException', async (err) => {
    console.error("WARNING: PROGRAM WAS SUPPOSED TO BE TERMINATED. I hope you (I) know what you are (I am) doing.")
    console.error(err);
});

// When client is ready
let remainingPresences = Array.from(presences);
client.once('ready', () => {

    console.log(`${client.user.tag} is online.`);
    client.user.setStatus('online');
    refreshPresence();

    setInterval(() => {
        refreshPresence();
    }, 21600000);   // 21600000 = 6 hours, default
});

// Sets a presence with a 0.1% chance of a rare one
function refreshPresence() {
    const rare_presence = Math.random() > 0.99 ? "This message has a 0.1% chance of appearing, you're lucky!" : undefined;
    if (!remainingPresences.length) remainingPresences = Array.from(presences);

    const current_presence = remainingPresences[Math.floor(Math.random() * remainingPresences.length)];
    
    console.log(`Setting presence... ["${current_presence}"]`);
    
    remainingPresences.splice(remainingPresences.indexOf(current_presence), 1);
    client.user.setPresence({
        activity: {
            name: `.help | ${rare_presence || current_presence}`
        }
    });
}

// Commands
client.on("message", async (msg) => {
    // DM check
    if (msg.channel.type === "dm") {
        if (msg.author == client.user) return;
        if (msg.content.toLowerCase() == 'stop') {
            await sql.getUserInDB(msg.author);
            await sql.update("users", { unsubscribed: true }, `id = ${msg.author.id}`);
            return msg.channel.send({ embed: {
                color: 2215713,
                description: "You will no longer receive direct messages from Dunhamer.",
                footer: {
                    text: "If you want to receive messages again, reply with \"START\"."
                }
            }});
        }
        if (msg.content.toLowerCase() == 'start') {
            await sql.getUserInDB(msg.author);
            await sql.update("users", { unsubscribed: false }, `id = ${msg.author.id}`);
            return msg.channel.send({ embed: {
                color: 2215713,
                description: "You will now receive direct messages from Dunhamer.",
                footer: {
                    text: "If you want to disable direct messages again, reply with \"STOP\"."
                }
            }});
        }
        return msg.channel.send("Hey there.");
    }
    if (msg.webhookID) return;

    // Makes sure database entries exist
    const DBGuild = await sql.getGuildInDB(msg.guild);
    await levelsystem(msg, DBGuild);

    // Message variables
    const msgContentOriginal = msg.content;
    msg.content = msg.content.toLowerCase();
    const taggedUsers = msg.mentions.users,
        taggedMembers = msg.mentions.members,
        taggedChannels = msg.mentions.channels,
        taggedRoles = msg.mentions.roles,
        argsLowercase = msg.content.slice(DBGuild.prefix.length).split(/ +/),
        argsOriginal = msgContentOriginal.slice(DBGuild.prefix.length).split(/ +/),
        commandName = argsLowercase[0];
    argsLowercase.shift();
    argsOriginal.shift();
    
    // Emergency change prefix
    if (taggedUsers.first() == client.user && msg.content.includes("prefix")) {
        if (msg.content.split(" ")[1] == "prefix") {
            const authorPerms = msg.channel.permissionsFor(msg.member);
            if (!authorPerms || !authorPerms.has("BAN_MEMBERS")) {
                return msg.channel.send({ embed: {
                    "color": 0xcf2d2d,
                    "title": ":octagonal_sign: Error!",
                    "description": `:no_entry: You don't have permission to change the bot prefix!`
                }});
            }
            argsOriginal.shift();
            const newPrefix = msgContentOriginal.split(" ").splice(2).join(" ");
            DBGuild.prefix = newPrefix;
            await sql.update("guilds", DBGuild, `id = ${DBGuild.id}`);
            return msg.channel.send({ embed: {
                "color": 2215713,
                "description": `:repeat: Updated server prefix to \`${DBGuild.prefix}\`.`
            }});
        }
        return msg.channel.send({ embed: {
            color: 49919,
            description: `You can change my prefix using either\n**${DBGuild.prefix}prefix <new prefix>**\nor\n**${client.user} prefix <new prefix>**.`
        }});
    }
    // If no command given, terminate
    if (!msgContentOriginal.startsWith(DBGuild.prefix)) return;

    let command;
    client.commandCategories.forEach(category => {
        category.forEach((cmd, cmd_name) => {
            const com = cmd_name == commandName || cmd.aliases && cmd.aliases.includes(commandName) ? cmd : undefined;
            if (com) command = com;
        });
    });
    
    if (!command || DBGuild.ignoreBots && msg.author.bot) return;
    
    // Check command permissions
    if (command.permissions) {
        const authorPerms = msg.channel.permissionsFor(msg.member);
        if (!authorPerms || !authorPerms.has(command.permissions)) {
            return msg.channel.send({ embed: {
                "title": ":octagonal_sign: Error!",
                "color": 0xcf2d2d,
                "description": `:no_entry: You don't have access to \`${command.name}\`.`
            }});
        }
    }
    // Command cooldowns
    if (!cooldowns.has(command.name)) {     // Add a collection to each command, with user IDs and timestamps in them. If the Date.now() has not yet reached the timestamp, terminate.
        cooldowns.set(command.name, new Discord.Collection());
    }
    const now = Date.now(),
        timestamps = cooldowns.get(command.name),
        cooldownAmount = (command.cooldown || 3) * 1000;
    if (timestamps.has(msg.author.id)) {
        const expirationTime = timestamps.get(msg.author.id) + cooldownAmount;

        if (now < expirationTime) {
            const timeLeft = (expirationTime - now) / 1000;
            return msg.reply(`cooldown, ${timeLeft} seconds left.`);
        }
    }
    timestamps.set(msg.author.id, now);
    setTimeout(() => timestamps.delete(msg.author.id), cooldownAmount);

    // Execute command
    try {
        command.execute(msg, {
            lowercase: argsLowercase, 
            original: argsOriginal,
        }, {
            users: taggedUsers,
            members: taggedMembers,
            channels: taggedChannels,
            roles: taggedRoles,
        }, sql
        );
    } catch(err) {
        try {
            msg.channel.send({ embed: {
                "color": 0xcf2d2d,
                "title": "Error!",
                "fields": {
                    "name": ":octagonal_sign: Error:",
                    "value": `\`${err.message}\``
                }
            }});
        } catch (error2) {
            console.log("Unable to send error message error:");
            console.error(error2);
        }
        console.log("Original Error:");
        console.error(err);
    }
});

// SLASH COMMAND TESTING - most of the code is from the normal message recieve event code, but some parts are replaced to match interaction code
client.ws.on('INTERACTION_CREATE', async interaction => {
    const guild = await client.guilds.fetch(interaction.guild_id),
        msg = {
            author: await interaction.member.user,
            channel: await client.channels.fetch(interaction.channel_id),
            client: client,
            content: ".ping",
            createdTimestamp: Date.now(),
            guild: guild,
            id: interaction.id,
            member: await guild.members.fetch(interaction.member.user.id),
        },

        commandName = interaction.data.name;
    let command;
    client.commandCategories.forEach(category => {
        category.forEach((cmd, cmd_name) => {
            const com = cmd_name == commandName || cmd.aliases && cmd.aliases.includes(commandName) ? cmd : undefined;
            if (com) command = com;
        });
    });


    if (command.permissions) {
        const authorPerms = msg.channel.permissionsFor(msg.member);
        if (!authorPerms || !authorPerms.has(command.permissions)) {
            return client.api.interactions(interaction.id, interaction.token).callback.post({ data: {
                type: 4,
                data: {
                    embeds: [{
                        color: 0xcf2d2d,
                        title: ":octagonal_sign: Error!",
                        description: `:no_entry: You don't have access to \`${command.name}\``
                    }]
                }
            }});
        }
    }

    if (!cooldowns.has(command.name)) {
        cooldowns.set(command.name, new Discord.Collection());
    }
    const now = Date.now(),
        timestamps = cooldowns.get(command.name),
        cooldownAmount = (command.cooldown || 3) * 1000;
    if (timestamps.has(msg.author.id)) {
        const expirationTime = timestamps.get(msg.author.id) + cooldownAmount;

        if (now < expirationTime) {
            const timeLeft = (expirationTime - now) / 1000;
            return client.api.interactions(interaction.id, interaction.token).callback.post({ data: {
                type: 4,
                data: {
                    embeds: [{
                        color: 0xcf2d2d,
                        title: ":alarm_clock: Cooldown!",
                        description: `${timeLeft} seconds left.`
                    }]
                }
            }});
        }
    }
    timestamps.set(msg.author.id, now);
    setTimeout(() => timestamps.delete(msg.author.id), cooldownAmount);

    const args = [],
        arguments_lowercase = [];
    if (interaction.data.options) {
        interaction.data.options.forEach(option => {
            if (option.options) {
                args.push(option.name);
                option.options.forEach(nested_option => {
                    args.push(nested_option.value);
                });
            } else {
                args.push(`${option.value}` || `${option.name}`);
            }
        });
        args.forEach(argument => {
            arguments_lowercase.push(`${argument}`.toLowerCase());
        });
    }
    const userTags = new Discord.Collection(),
        memberTags = new Discord.Collection(),
        channelTags = new Discord.Collection(),
        roleTags = new Discord.Collection();
    if (interaction.data.options) {
        interaction.data.options.forEach(async option => {
            if (option.type == 6) {
                memberTags.set(option.value, await guild.members.fetch(option.value));
                userTags.set(option.value, memberTags.get(option.value).user);
            }
            if (option.type == 7) channelTags.set(option.value, await guild.channels.resolve(option.value));
            if (option.type == 8) roleTags.set(option.value, await guild.roles.fetch(option.value));
        });
    }

    try {
        command.execute(
            msg,    // msg
            { lowercase: arguments_lowercase, original: args}, // args
            { users: userTags, members: memberTags, channels: channelTags, roles: roleTags}, // tags
            sql,    // databases
            interaction // interaction
        );
    } catch(err) {
        console.error(err);
        client.api.interactions(interaction.id, interaction.token).callback.post({ data: {
            type: 4,
            data: {
                embeds: [{
                    color: 0xcf2d2d,
                    title: ":octagonal_sign: Error!",
                    description: `It seems this command doesn't work with slash commands! Have you tried using it with the bot prefix?`
                }]
            }
        }});
    }
});

// Levelsystem
async function levelsystem(msg, DBGuild) {   
    if (DBGuild.ignoreBots && msg.author.bot) return;
    const levelSystem = await sql.getGuildLevelsystemInDB(msg.guild);

    if (!levelSystem.enabled || JSON.parse(levelSystem.ignoredChannels).includes(msg.channel.id)) return;
    const DBGuildUser = await sql.getGuildUserInDB(msg.guild, msg.author),
    
    // Check if user cooldown is over
        now = Date.now(),
        cooldownAmount = 60 * 1000;
    if (levelTimestamps.has(msg.author.id)) {
        const expirationTime = levelTimestamps.get(msg.author.id) + cooldownAmount;
        if (now < expirationTime) return;
    }
    levelTimestamps.set(msg.author.id, now);
    setTimeout(() => levelTimestamps.delete(msg.author.id), cooldownAmount);

    // Calculate level
    DBGuildUser.xp += Math.floor(Math.random() * (25 - 15 + 1)) + 15;   // between 15 and 25 xp
    const xp = DBGuildUser.xp;
    
    let lower = 0,
        upper = 10000000000;    // max xp. equivalent to sending 500 million messages, which would take 951 years at 1 message/minute.
    while (lower + 1 < upper) {
        const middle = Math.floor((lower + upper)/2),
            level_xp = 5*(118*middle+2*middle*middle*middle)/6;
        if (level_xp > xp) {
            upper = middle;
        } else {
            lower = middle;
        }
    }
    const level = lower;
    await sql.update("guild-users", DBGuildUser, `guildid = ${DBGuildUser.guildid} AND userid = ${DBGuildUser.userid}`);
    
    // Congratulate if new level
    if (level > DBGuildUser.level) {
        DBGuildUser.level = level;
        const channel = levelSystem.levelupChannel ? await client.channels.fetch(levelSystem.levelupChannel) : msg.channel,
        // Roles
            levelSystemRoles = JSON.parse(levelSystem.roles);
        if (Object.prototype.hasOwnProperty.call(levelSystemRoles, level)) {
            const userLevelRoles = JSON.parse(DBGuildUser.levelRoles);
            if (!levelSystem.rolesCumulative) {
                for (const roleID of userLevelRoles) {
                    const role = await msg.guild.roles.fetch(roleID);
                    msg.member.roles.remove(role, "Levelroles.");
                }
            }
            const role = await msg.guild.roles.fetch(levelSystemRoles[level]);
            msg.member.roles.add(role, "Levelroles");
            channel.send({ embed: {
                color: JSON.parse(levelSystem.newroleMessage).color,
                description: replaceIngredients(JSON.parse(levelSystem.newroleMessage).description, msg.member, DBGuildUser, role)
            }});
            userLevelRoles.push(levelSystemRoles[level]);
        }
        await sql.update("guild-users", DBGuildUser, `guildid = ${DBGuildUser.guildid} AND userid = ${DBGuildUser.userid}`);

        const levelup_message = {
            color: JSON.parse(levelSystem.levelupMessage).color,
            title: JSON.parse(levelSystem.levelupMessage).title ? replaceIngredients(JSON.parse(levelSystem.levelupMessage).title, msg.member, DBGuildUser, "{role}") : "",
            description: JSON.parse(levelSystem.levelupMessage).description ? replaceIngredients(JSON.parse(levelSystem.levelupMessage).description, msg.member, DBGuildUser, "{role}") : ""
        }
        if (levelSystem.levelupImage) {
            await CanvasImage.levelup_image(msg.member, DBGuildUser, msg.guild, sql);
            const attachment = new Discord.MessageAttachment('./imageData/generated/level.png');
            levelup_message.image = {
                url: 'attachment://level.png'
            }
            return channel.send({ files: [attachment], embed: levelup_message });
        }
        return channel.send({ embed: levelup_message });
    }
}

/**
 * Extracts text ingredients from strings and returns the updated string. Current ingredients are
 * {username}, {level}, {xp}, {nickname}, {tag} and {role}
 * @param {string} string String to extract ingredients from
 * @param {Discord.GuildMember} member 
 * @param {Object} db_user 
 * @param {Discord.Role | string} role
 */
function replaceIngredients(string, member, DBGuildUser, role) {
    string = string.replace(/{username}/g, `${member.user.username}`);
    string = string.replace(/{level}/g, `${DBGuildUser.level}`);
    string = string.replace(/{xp}/g, `${DBGuildUser.xp}`);
    string = string.replace(/{nickname}/g, `${member.nickname || member.user.username}`);
    string = string.replace(/{tag}/g, `${member.user.tag}`);
    string = string.replace(/{role}/g, `${role}`);
    string = string.replace(/{user}/g, `${member.user.username}`);
    return string;
}

// Make sure we mark removed users so they don't break the program.
client.on("guildMemberRemove", async member => {
    const DBGuildUser = await sql.getGuildUserInDB(member.guild, member.user);
    DBGuildUser.inGuild = false;
    await sql.update("guild-users", DBGuildUser, `guildid = ${DBGuildUser.guildid} AND userid = ${DBGuildUser.userid}`)
});
client.on("guildMemberAdd", async member => {
    await sql.getUserInDB(member.user);
    await sql.getGuildUserInDB(member.guild, member.user);
});

// Get user roles - possibly more data in the future.
client.on("guildMemberUpdate", async (oldMember, newMember) => {
    const DBGuildUser = await sql.getGuildUserInDB(newMember.guild, newMember.user);
    if (DBGuildUser.roles != JSON.stringify(newMember.roles.cache.map(role => role.id))) {
        DBGuildUser.roles = JSON.stringify(newMember.roles.cache.map(role => role.id));
        await sql.update("guild-users", DBGuildUser, `guildid = ${DBGuildUser.guildid} AND userid = ${DBGuildUser.userid}`);
    }
});

client.on("userUpdate", async (oldUser, newUser) => {
    const DBUser = await sql.getUserInDB(oldUser),
        newDBUser = {
            id: newUser.id,
            username: newUser.username,
            tag: newUser.tag.slice(-4),
            unsubscribed: DBUser.unsubscribed
        }
    if (JSON.stringify(DBUser) != JSON.stringify(newDBUser)) {
        await sql.update("users", newDBUser, `id = ${newDBUser.id}`);
    }
});

// Add new guilds to database
client.on("guildCreate", async guild => {
    let invites = undefined;
    try {
        invites = await guild.fetchInvites();
    } catch (err) {
        invites = undefined;
    }
    (await guild.client.channels.fetch('850020534128345158')).send({ embed: {
        color: 0xffe487,
        title: "New guild!",
        description: `Someone added Dunhammer to ${guild.name}.\nGuild has ${guild.memberCount} members.\n\nInvites:\n${invites ? invites.first(5).join("\n") : "No invites :( (or no access)"}`
    }});
    await sql.getGuildInDB(guild);
});

// login
client.login(token);