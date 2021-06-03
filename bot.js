// Modules & config
const Discord = require('discord.js');
const fs = require('fs');
const MySQL = require("./sql/sql");
const { CanvasImage } = require('./helperfunctions.js');

const { presences } = require('./config.json');
const { token, mysqlPassword } = require('./token.json');
// Database
const sql = new MySQL({ host: "phpmyadmin.head9x.dk", user: "Colorman", password: mysqlPassword, database: "colorman" });


// Create a new Discord client
const client = new Discord.Client();
client.commandCategories = new Discord.Collection();
const cooldowns = new Discord.Collection();
const levelTimestamps = new Discord.Collection();

// Load the commands with their categories 
const commandFilesObj = {};
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
            await getUserInDB(msg.author);
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
            await getUserInDB(msg.author);
            await sql.update("users", {
                unsubscribed: false
            }, `id = ${msg.author.id}`);
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
    const DBGuild = await getGuildInDB(msg.guild);

    // Message variables
    const msg_content_original = msg.content;
    msg.content = msg.content.toLowerCase();
    const taggedUsers = msg.mentions.users;
    const taggedMembers = msg.mentions.members;
    const taggedChannels = msg.mentions.channels;
    const taggedRoles = msg.mentions.roles;
    const argsLowercase = msg.content.slice(DBGuild.prefix.length).split(/ +/);
    const argsOriginal = msg_content_original.slice(DBGuild.prefix.length).split(/ +/);
    const commandName = argsLowercase[0];
    argsLowercase.shift();
    argsOriginal.shift();

    // Emergency change prefix
    if (taggedUsers.first() == client.user && msg.content.includes("prefix")) {
        if (argsLowercase[0] == "prefix") {
            const authorPerms = msg.channel.permissionsFor(msg.member);
            if (!authorPerms || !authorPerms.has("BAN_MEMBERS")) {
                return msg.channel.send({ embed: {
                    "color": 0xcf2d2d,
                    "title": ":octagonal_sign: Error!",
                    "description": `:no_entry: You don't have permission to change the bot prefix!`
                }});
            }
            argsOriginal.shift();
            await sql.update("guilds", { prefix: argsOriginal.join(" ") }, `id = ${DBGuild.id}`);
            DBGuild.prefix = argsOriginal.join(" ");
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
    if (!msg_content_original.startsWith(DBGuild.prefix)) return;

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
    const now = Date.now();
    const timestamps = cooldowns.get(command.name);
    const cooldownAmount = (command.cooldown || 3) * 1000;
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
    const guild = await client.guilds.fetch(interaction.guild_id);
    const msg = {
        author: await interaction.member.user,
        channel: await client.channels.fetch(interaction.channel_id),
        client: client,
        content: ".ping",
        createdTimestamp: Date.now(),
        guild: guild,
        id: interaction.id,
        member: await guild.members.fetch(interaction.member.user.id),
    }

    const commandName = interaction.data.name;
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
    const now = Date.now();
    const timestamps = cooldowns.get(command.name);
    const cooldownAmount = (command.cooldown || 3) * 1000;
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

    const args = [];
    const arguments_lowercase = [];
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
    const userTags = new Discord.Collection();
    const memberTags = new Discord.Collection();
    const channelTags = new Discord.Collection();
    const roleTags = new Discord.Collection();
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
client.on("message", async (msg) => {
    // DM check
    if (msg.channel.type === "dm" || msg.webhookID) return;
    const DBGuild = await getGuildInDB(msg.guild);
    
    if (DBGuild.ignoreBots && msg.author.bot) return;
    const levelSystem = await getGuildLevelsystemInDB(msg.guild);

    if (!levelSystem.enabled || JSON.parse(levelSystem.ignoredChannels).includes(msg.channel.id)) return;
    const DBGuildUser = await getGuildUserInDB(msg.guild, msg.author);
    
    // Check if user cooldown is over
    const now = Date.now();
    const cooldownAmount = 60 * 1000;
    if (levelTimestamps.has(msg.author.id)) {
        const expirationTime = levelTimestamps.get(msg.author.id) + cooldownAmount;
        if (now < expirationTime) return;
    }
    levelTimestamps.set(msg.author.id, now);
    setTimeout(() => levelTimestamps.delete(msg.author.id), cooldownAmount);

    // Calculate level
    DBGuildUser.xp += Math.floor(Math.random() * (25 - 15 + 1)) + 15;   // between 15 and 25 xp
    const xp = DBGuildUser.xp;
    
    let lower = 0;
    let upper = 10000000000;    // max xp. equivalent to sending 500 million messages, which would take 951 years at 1 message/minute.
    while (lower + 1 < upper) {
        const middle = Math.floor((lower + upper)/2);
        const level_xp = 5*(118*middle+2*middle*middle*middle)/6;
        if (level_xp > xp) {
            upper = middle;
        } else {
            lower = middle;
        }
    }
    const level = lower;
    await sql.update("guild-users", DBGuildUser, `id = ${DBGuildUser.id}`);
    
    // Congratulate if new level
    if (level > DBGuildUser.level) {
        DBGuildUser.level = level;
        const channel = levelSystem.levelupChannel ? await client.channels.fetch(levelSystem.levelupChannel) : msg.channel;
        // Roles
        if (typeof levelSystem.roles === 'object' && levelSystem.roles !== null && Object.prototype.hasOwnProperty.call(levelSystem.roles, level)) {
            if (!levelSystem.rolesCumulative) {
                for (const roleID of DBGuildUser.levelRoles) {
                    const role = await msg.guild.roles.fetch(roleID);
                    msg.member.roles.remove(role, "Levelroles.");
                }
            }
            const role = await msg.guild.roles.fetch(levelSystem.roles[level]);
            msg.member.roles.add(role, "Levelroles");
            channel.send({ embed: {
                color: JSON.parse(levelSystem.newroleMessage).color,
                description: replaceIngredients(JSON.parse(levelSystem.newroleMessage).description, msg.member, DBGuildUser, role)
            }});
            DBGuildUser.levelroles.push(levelSystem.roles[level]);
        }
        await sql.update("guild-users", DBGuildUser, `id = ${DBGuildUser.id}`);

        const levelup_message = {
            color: JSON.parse(levelSystem.levelupMessage).color,
            title: JSON.parse(levelSystem.levelupMessage).title ? replaceIngredients(JSON.parse(levelSystem.levelupMessage).title, msg.member, DBGuildUser, "{role}") : "",
            description: JSON.parse(levelSystem.levelupMessage).description ? replaceIngredients(JSON.parse(levelSystem.levelupMessage).description, msg.member, DBGuildUser, "{role}") : ""
        }
        if (levelSystem.levelupImage) {
            await CanvasImage.levelup_image(msg.member, DBGuildUser, msg.guild);
            const attachment = new Discord.MessageAttachment('./imageData/generated/level.png');
            levelup_message.image = {
                url: 'attachment://level.png'
            }
            return channel.send({ files: [attachment], embed: levelup_message });
        }
        return channel.send({ embed: levelup_message });
    }
});

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
    const DBGuildUser = await getGuildUserInDB(member.guild, member.user);
    DBGuildUser.inGuild = false;
    await sql.update("guild-users", DBGuildUser, `guildid = ${DBGuildUser.guildid} AND userid = ${DBGuildUser.userid}`)
});
client.on("guildMemberAdd", async member => {
    await getUserInDB(member.user);
    await getGuildUserInDB(member.guild, member.user);
});

// Get user roles - possibly more data in the future.
client.on("guildMemberUpdate", async (oldMember, newMember) => {
    const DBGuildUser = await getGuildUserInDB(newMember.guild, newMember.user);
    DBGuildUser.roles = newMember.roles.cache.map(role => role);
    await sql.update("guild-users", DBGuildUser, `guildid = ${DBGuildUser.guildid} AND userid = ${DBGuildUser.userid}`);
});

// Add new guilds to database
client.on("guildCreate", async guild => {
    await getGuildInDB(guild);
});

// Functions for checking databases, so the program doesn't try to run code on non-existent entries.
async function getUserInDB(user) {
    const DBUserArr = await sql.get("users", `id = ${user.id}`);
    if (!DBUserArr.length) {
        await sql.insert("users", {
            id: user.id,
            username: user.username,
            tag: user.tag.slice(-4),
            unsubscribed: false
        });
        return (await sql.get("users", `id = ${user.id}`))[0];
    }
    return DBUserArr[0];
}
async function getGuildInDB(guild) {
    const DBGuildArr = await sql.get("guilds", `id = ${guild.id}`);
    if (!DBGuildArr.length) {
        await sql.insert("guilds", {
            id: guild.id,
            name: guild.name,
            prefix: ".",
            ignoreBots: true
        });
        return (await sql.get("guilds", `id = ${guild.id}`))[0];
    }
    return DBGuildArr[0];
}
async function getGuildLevelsystemInDB(guild) {
    const DBGuildLevelsystemArr = await sql.get("guild-levelsystem", `id = ${guild.id}`);
    if (!DBGuildLevelsystemArr.length) {
        await sql.insert("guild-levelsystem", {
            id: guild.id,
            enabled: false,
            ignoredChannels: JSON.stringify([]),
            levelupChannel: null,
            levelupMessage: JSON.stringify({
                "color": 2215713,
                "title": "Congratulations {username}, you reached level {level}!",
                "description": ""
            }),
            newroleMessage: JSON.stringify({
                "color": 2215713,
                "description": "Congratulations {username}, you reached level {level} and gained the role {role}!"
            }),
            levelupImage: true,
            rolesCumulative: false,
            roles: null
        });
        return (await sql.get("guild-levelsystem", `id = ${guild.id}`))[0];
    }
    return DBGuildLevelsystemArr[0];
}
async function getGuildUserInDB(guild, user) {
    const DBGuildUserArr = await sql.get("guild-users", `guildid = ${guild.id} AND userid = ${user.id}`);
    if (!DBGuildUserArr.length) {
        const DBGuildLevelsystem = await getGuildLevelsystemInDB(guild);
        const levelSystemRoles = DBGuildLevelsystem.roles;
        const userRoles = (await guild.members.fetch(user.id)).roles.cache.map(item => item);
        const levelRoles = userRoles.filter(role => levelSystemRoles.includes(role));
        await sql.insert("guild-users", {
            userid: user.id,
            guildid: guild.id,
            xp: 0,
            level: 0,
            levelRoles: JSON.stringify(levelRoles),
            roles: JSON.stringify(userRoles),
            inGuild: true
        });
        return await sql.get("guild-users", `guildid = ${guild.id} AND userid = ${user.id}`)[0];
    }
    return DBGuildUserArr[0];
}

// login
client.login(token);