// @ts-check
// Modules & config
const Discord = require('discord.js');
const fs = require('fs');
const loki = require('lokijs');
const { CanvasImage } = require('./helperfunctions.js');

const { presences } = require('./config.json');
const { token } = require('./token.json');

// Create a new Discord client
const client = new Discord.Client();
client.commandCategories = new Discord.Collection();
const cooldowns = new Discord.Collection();

// Load the commands with their categories 
const commandFilesObj = {};
fs.readdirSync('./commands').forEach(folder => {
    commandFilesObj[folder] ||= fs.readdirSync(`./commands/${folder}`).filter(file => file.endsWith('.js'));
});

// Database
var guild_config = new loki('./databases/guild_config.db', {
    autoload: true,
    autoloadCallback : configDatabseInitialize,
    autosave: true,
    autosaveInterval: 4000
});

// Implement the autoloadback referenced in loki constructor
function configDatabseInitialize() {
    var guilds = guild_config.getCollection("guilds");
    if (guilds === null) {
        guilds = guild_config.addCollection("guilds", {
            unique: ["guild_id"],
            autoupdate: true
        });
    }
    // kick off any program logic or start listening to external events
    runProgramLogic();
}

function runProgramLogic() {
    var guildCount = guild_config.getCollection("guilds").count();
    console.log("Number of guilds in database: " + guildCount);
}

for (const folder of Object.keys(commandFilesObj)) {
    client.commandCategories.set(folder, new Discord.Collection());
    for (const file of commandFilesObj[folder]) {
        const command = require(`./commands/${folder}/${file}`);
        client.commandCategories.get(folder).set(command.name, command);
    }
}

// State of the art crash protection (don't do this)
process.on('uncaughtException', (err, _origin) => {
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
    
    remainingPresences.splice(remainingPresences.indexOf(current_presence, 1));
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
        return msg.channel.send({
            embed: {
                color: 0xcf2d2d,
                title: ":octagonal_sign: Error!",
                description: ":no_entry: Dunhammer doesn't support DMs yet."
            }
        });
    }
    if (msg.webhookID) return;
    // Load databases
    const guild_db = guild_config.getCollection("guilds");  // guild database
    const user_db = get_user_db(msg.guild);
    const db_guild = get_db_guild(msg.guild);

    // Message variables
    const msg_content_original = msg.content;
    msg.content = msg.content.toLowerCase();
    const taggedUsers = msg.mentions.users;
    const taggedMembers = msg.mentions.members;
    const taggedChannels = msg.mentions.channels;
    const taggedRoles = msg.mentions.roles;
    const args_lowercase = msg.content.slice(db_guild.prefix.length).split(/ +/);
    const args_original = msg_content_original.slice(db_guild.prefix.length).split(/ +/);
    const commandName = args_lowercase[0];
    args_lowercase.shift();
    args_original.shift();

    // Emergency change prefix
    if (taggedUsers.first() == client.user && msg.content.includes("prefix")) {
        if (args_lowercase[0] == "prefix") {
            args_original.shift();
            db_guild.prefix = args_original.join(" ");
            return msg.channel.send({ embed: {
                "color": 2215713,
                "description": `:repeat: Updated server prefix to \`${db_guild.prefix}\`.`
            }});
        }
        return msg.channel.send({ embed: {
            color: 49919,
            description: `You can change my prefix using either\n**${db_guild.prefix}prefix <new prefix>**\nor\n**${client.user} prefix <new prefix>**.`
        }});
    }
    // If no command given, terminate
    if (!msg_content_original.startsWith(db_guild.prefix)) return;

    let command;
    client.commandCategories.forEach(category => {
        category.forEach((cmd, cmd_name) => {
            const com = (cmd_name == commandName || cmd.aliases && cmd.aliases.includes(commandName)) ? cmd : undefined;
            if (com) command = com;
        });
    });
    
    if (!command || (!db_guild.allowbots && msg.author.bot)) return;
    
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
        command.execute(msg, { lowercase: args_lowercase, original: args_original }, { users: taggedUsers, members: taggedMembers, channels: taggedChannels, roles: taggedRoles }, { guilds: guild_db, users: user_db });
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


// Levelsystem
client.on("message", async (msg) => {
    // DM check
    if (msg.channel.type === "dm" || msg.webhookID) return;
    const guild_db = guild_config.getCollection("guilds");
    const db_guild = get_db_guild(msg.guild);
    const db_user = get_db_user(msg.guild, msg.author);
    const user_db = get_user_db(msg.guild)
    const levelSystem = db_guild.levelSystem;

    if (!levelSystem.enabled || levelSystem.disallowed_channels.includes(msg.channel.id || (!db_guild.allowbots && msg.author.bot))) return;

    // Check if user cooldown is over
    const now = Date.now();
    const cooldownAmount = 60 * 1000;
    if (levelSystem.cooldown_timestamps.hasOwnProperty(msg.author.id)) {
        const expirationTime = levelSystem.cooldown_timestamps[msg.author.id] + cooldownAmount;
        if (now < expirationTime) return;
    }
    levelSystem.cooldown_timestamps[msg.author.id] = now;
    setTimeout(() => delete levelSystem.cooldown_timestamps[msg.author.id], cooldownAmount);
    guild_db.update(db_guild);

    // Calculate level
    db_user.xp += Math.floor(Math.random() * (25 - 15 + 1)) + 15;   // between 15 and 25 xp
    const xp = db_user.xp;
    
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
    user_db.update(db_user);
    
    // Congratulate if new level
    if (level > db_user.level) {
        db_user.level = level;
        const channel = levelSystem.update_channel ? await client.channels.fetch(levelSystem.update_channel) : msg.channel;
        // Roles
        if (levelSystem.roles.hasOwnProperty(level)) {
            if (!levelSystem.roles.cumulative) {
                for (let role_id of db_user.levelroles) {
                    const role = await msg.guild.roles.fetch(role_id);
                    msg.member.roles.remove(role, "Levelroles.");
                }
            }
            const role = await msg.guild.roles.fetch(levelSystem.roles[level]);
            msg.member.roles.add(role, "Levelroles");
            channel.send({ embed: {
                color: levelSystem.newrole_message.color,
                description: replaceIngredients(levelSystem.newrole_message.description, msg.member, db_user, role)
            }});
            db_user.levelroles.push(levelSystem.roles[level]);
        }
        user_db.update(db_user);

        const levelup_message = {
            color: levelSystem.levelup_message.color,
            title: replaceIngredients(levelSystem.levelup_message.title, msg.member, db_user, "{role}"),
            description: replaceIngredients(levelSystem.levelup_message.description, msg.member, db_user, "{role}")
        }
        if (levelSystem.levelup_image) {
            await CanvasImage.levelup_image(msg.member, user_db, msg.guild);
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
function replaceIngredients(string, member, db_user, role) {
    string = string.replace(/{username}/g, member.user.username);
    string = string.replace(/{level}/g, `${db_user.level}`);
    string = string.replace(/{xp}/g, `${db_user.xp}`);
    string = string.replace(/{nickname}/g, member.nickname || member.user.username);
    string = string.replace(/{tag}/g, member.user.tag);
    string = string.replace(/{role}/g, `${role}`);
    return string;
}

// Make sure we mark removed users so they don't break the program.
client.on("guildMemberRemove", member => {
    const user_db = get_user_db(member.guild);
    const db_user = get_db_user(member.guild, member.user);
    db_user.inGuild = false;
    user_db.update(db_user);
});
client.on("guildMemberAdd", member => {
    const user_db = get_user_db(member.guild);
    const db_user = get_db_user(member.guild, member.user);
    db_user.inGuild = true;
    user_db.update(db_user);
});

// Get user roles - possibly more data in the future.
client.on("guildMemberUpdate", (oldMember, newMember) => {
    const user_db = get_user_db(newMember.guild);
    const db_user = get_db_user(newMember.guild, newMember.user);
    db_user.roles = [];
    newMember.roles.cache.forEach(role => db_user.roles.push(role.id));
    user_db.update(db_user);
});

// Add new guilds to database
client.on("guildCreate", guild => {
    get_db_guild(guild);
});

// Functions for checking databases, so the program doesn't try to run code on non-existent entries.
function get_db_guild(guild) {
    const guild_id = guild.id;
    const guild_db = guild_config.getCollection("guilds");
    if (guild_db.findOne({ guild_id: guild_id }) === null ) {
        guild_db.insert({
            guild_id: guild_id,
            prefix: '.',
            allowbots: false,
            levelSystem: {
                enabled: false,
                disallowed_channels: [],
                update_channel: undefined,
                levelup_message: {
                    color: 2215713,
                    title: "Congratulations {username}, you reached level {level}!",
                    description: ''
                },
                newrole_message: {
                    color: 2215713,
                    description: "Congratulations {username}, you reached level {level} and gained the role {role}!"
                },
                levelup_image: true,
                cooldown_timestamps: {},
                roles: {
                    cumulative: false
                }
            },
            name: guild.name
        });
    }
    const db_guild = guild_db.findOne({ guild_id: guild_id });
    /// to be removed ///
    db_guild.levelSystem.roles ||= { cumulative: false };
    db_guild.levelSystem.newrole_message ||= {
        color: 2215713,
        description: "Congratulations {username}, you reached level {level} and gained the role {role}!"
    }
    db_guild.allowbots ||= false;
    db_guild.name ||= guild.name;
    guild_db.update(db_guild);
    /// ------------- ///
    return db_guild;
}
function get_user_db(guild) {
    const guild_id = guild.id;
    if (guild_config.getCollection(guild_id) === null ) {
        guild_config.addCollection(guild_id, {
            unique: ["user_id"],
            autoupdate: true
        });
    }
    return guild_config.getCollection(guild_id);
}
function get_db_user(guild, user) {
    const guild_id = guild.id;
    const user_id = user.id;
    const user_db = get_user_db(guild);
    if (user_db.findOne({ user_id: user_id }) === null) {
        user_db.insert({
            user_id: user_id,
            xp: 0,
            level: 0,
            levelroles: [],
            roles: [],
            inGuild: true
        });
    }
    const db_user = user_db.findOne({ user_id: user_id });
    /// to be removed ///
    db_user.levelroles ||= [];
    db_user.inGuild ||= true;
    user_db.update(db_user);
    /// ------------ ///
    return user_db.findOne({ user_id: user_id });
    
}

// login
client.login(token);