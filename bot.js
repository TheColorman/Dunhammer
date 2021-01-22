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
client.commands = new Discord.Collection();
const cooldowns = new Discord.Collection();

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

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


for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.name, command);
}

// Crash protection
process.on('beforeExit', (code) => {
    fs.writeFile('CRASH.txt', `Program exited with code ${code}.`, (err) => {});
    const spawn = require('child_process').spawn;
    const child = spawn('./bot.js', [], {
        detached: true,
        stdio: ['ignore', 'ignore', 'ignore']
    });
    child.unref();
});

// When client is ready
let rare_presence;
let presence_temp = [...presences];
let current_presence = "This is a bug";
client.once('ready', () => {
    console.log('Ready as ' + client.user.tag);
    client.user.setStatus('available');
    refreshPresence();

    setInterval(() => {
        refreshPresence();
    }, 21600000);   // 21600000 = 6 hours, default
});

function refreshPresence() {
    console.log("Setting presence...");
    if (Math.random() > 0.99) {
        rare_presence = "This message has a 0.1% chance of appearing, you're lucky!";
    } else {
        rare_presence = undefined;
    }
    if (presence_temp.length == 0) {
        presence_temp = [...presences];
    }
    current_presence = presence_temp[Math.floor(Math.random() * presence_temp.length)];
    for (let i of presence_temp) {
        if (i === current_presence) {
            presence_temp.splice(presence_temp.indexOf(i), 1);
        }
    }
    client.user.setPresence({
    	activity: {
            name: ".help | " + (rare_presence || current_presence)
        }
    });
}

// Commands
client.on("message", async (msg) => {
    // DM check
    if (msg.channel.type === "dm") {
        if (msg.author == client.user) return;
        return msg.channel.send({ embed: {
            color: 0xcf2d2d,
            title: ":octagonal_sign: Error!",
            description: ":no_entry: Dunhammer doesn't support DMs yet."
        }});
    }
    if (msg.webhookID) return;
    // Load databases
    const guild_db = guild_config.getCollection("guilds");  // guild database
    update_database(msg, guild_db);
    const user_db = guild_config.getCollection(msg.guild.id);
    const db_guild = guild_db.findOne({guild_id: msg.guild.id});

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
    if (taggedUsers.first() == client.user && msg.content.split(/ +/)[1] == "prefix") {
        if (args_lowercase.length < 1) return;
        db_guild.prefix = msg.content.substring(msg.content.indexOf("prefix ") + 7);
        guild_db.update(db_guild);
        return msg.channel.send({ embed: {
            "color": 2215713,
            "description": `:repeat: Updated server prefix to \`${db_guild.prefix}\`.`
        }});
    }
    // If no command given, terminate
    if (!msg_content_original.startsWith(db_guild.prefix)) return;

    const command = client.commands.get(commandName) || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
    
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
        msg.channel.send({ embed: {
            "color": 0xcf2d2d,
            "title": "Error!",
            "fields": {
                "name": ":octagonal_sign: Error:",
                "value": `\`${err.message}\``
            }
        }});
        console.error(err);
    }
});


// Levelsystem
client.on("message", async (msg) => {
    // DM check
    if (msg.channel.type === "dm" || msg.webhookID) return;
    const guild_db = guild_config.getCollection("guilds");
    update_database(msg, guild_db);
    const guild = guild_db.findOne({guild_id: msg.guild.id });
    const user_db = guild_config.getCollection(msg.guild.id);
    const db_user = user_db.findOne({ user_id: msg.author.id });
    const levelSystem = guild.levelSystem;

    if (!levelSystem.enabled || levelSystem.disallowed_channels.includes(msg.channel.id)) return;

    // Check if user cooldown is over
    const now = Date.now();
    const cooldownAmount = 60 * 1000;
    if (levelSystem.cooldown_timestamps.hasOwnProperty(msg.author.id)) {
        const expirationTime = levelSystem.cooldown_timestamps[msg.author.id] + cooldownAmount;
        if (now < expirationTime) return;
    }
    levelSystem.cooldown_timestamps[msg.author.id] = now;
    setTimeout(() => delete levelSystem.cooldown_timestamps[msg.author.id], cooldownAmount);
    guild_db.update(guild);

    // Calculate level
    db_user.xp += Math.floor(Math.random() * (25 - 15 + 1)) + 15;   // between 15 and 25 xp
    const xp = db_user.xp;

    let lower = 0;
    let upper = 10000000000;
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
    // Congratulate if new level
    if (level > db_user.level) {
        const channel = levelSystem.update_channel ? await client.channels.fetch(levelSystem.update_channel) : msg.channel;
        if (levelSystem.roles.hasOwnProperty(level)) {
            if (!levelSystem.roles.cumulative) {
                for (let role_id of db_user.levelroles) {
                    let role = await msg.guild.roles.fetch(role_id);
                    msg.member.roles.remove(role, "Levelroles.");
                }
            }
            const role = await msg.guild.roles.fetch(levelSystem.roles[level]);
            msg.member.roles.add(role, "Levelroles.");
            channel.send({ embed: {
                description: `Congratulations ${msg.author.username}, you reached level ${level} and gained the role ${role}!`
            }});
            db_user.levelroles.push(levelSystem.roles[level]);
            user_db.update(db_user);
        }
        // Get levelup message from database
        let reply = JSON.parse(JSON.stringify(levelSystem.levelup_message));

        if ((reply.title + reply.description).includes("{")) {
            let title = reply.title ? reply.title.replace(/{/g, "[{").replace(/}/g, "}]").split(/\[(.*?)\]/) : undefined;   // levelup title
            let description = reply.description ? reply.description.replace(/{/g, "[{").replace(/}/g, "}]").split(/\[(.*?)\]/) : undefined; // levelup description
            // Replace all instances of {username} e.g. with their respective variables
            for (let index = 0; title !== undefined && title[index] !== undefined; index++) {
                switch (title[index-1]) {
                    case '{username}':
                        title[index-1] = msg.author.username;
                        break;
                    case '{level}':
                        title[index-1] = level;
                        break;
                    case '{xp}':
                        title[index-1] = xp;
                        break;
                    case '{nickname}':
                        title[index-1] = msg.member ? msg.member.nickname : msg.author.username;
                        break;
                    case '{tag}':
                        title[index-1] = msg.author.tag;
                        break;    
                }
            }
            for (let index = 0; description !== undefined && description[index] !== undefined; index++) {
                switch (description[index-1]) {
                    case '{username}':
                        description[index-1] = msg.author.username;
                        break;
                    case '{level}':
                        description[index-1] = level;
                        break;
                    case '{xp}':
                        description[index-1] = xp;
                        break;
                    case '{nickname}':
                        description[index-1] = msg.member ? msg.member.nickname : msg.author.username;
                        break;
                    case '{tag}':
                        description[index-1] = msg.author.tag;
                        break;
                }
            }
            // Add the title and description to the reply
            reply.title = title ? title.join('') : ''; 
            reply.description = description ? description.join('') : '';
            db_user.level = level;
            user_db.update(db_user);
            // Add image if set to true
            if (levelSystem.levelup_image) {
                await CanvasImage.levelup_image(msg.member, user_db, msg.guild);
                const attachment = new Discord.MessageAttachment('./imageData/generated/level.png');
                reply.image = {
                    url: 'attachment://level.png'
                }
                return channel.send({ files: [attachment], embed: reply});
            }
            return channel.send({ embed: reply});
        }
    }
});

// Make sure we mark removed users so they don't break the program.
client.on("guildMemberRemove", member => {
    const user_db = guild_config.getCollection(member.guild.id);
    const db_user = user_db.findOne({ user_id: member.id });
    db_user.inGuild = false;
    user_db.update(db_user);
});
client.on("guildMemberAdd", member => {
    const user_db = guild_config.getCollection(member.guild.id);
    if (user_db.findOne({user_id: member.id}) == null) {
        user_db.insert({
            user_id: member.id,
            xp: 0,
            level: 0,
            levelroles: [],
            inGuild: true
        });
    }
    const db_user = user_db.findOne({ user_id: member.id });
    db_user.inGuild = true;
    user_db.update(db_user);
});

// Get use roles - possibly more data in the future.
client.on("guildMemberUpdate", (oldMember, newMember) => {
    if (guild_config.getCollection(newMember.guild.id) === null) {   
        guild_config.addCollection(newMember.guild.id, {
            unique: ["user_id"],
            autoupdate: true
        });
    }    
    const user_db = guild_config.getCollection(newMember.guild.id);
    if (user_db.findOne({user_id: newMember.id}) == null) {
        user_db.insert({
            user_id: newMember.id,
            xp: 0,
            level: 0,
            levelroles: [],
            inGuild: true
        });
    }
    const db_user = user_db.findOne({ user_id: newMember.id });
    db_user.roles = [];
    newMember.roles.cache.forEach(role => db_user.roles.push(role.id));
    user_db.update(db_user);
});

// Add new guilds to database
client.on("guildCreate", guild => {
    const guild_db = guild_config.getCollection("guilds");
    if (guild_db.findOne({guild_id: guild.id}) === null) {
        guild_db.insert({
            guild_id: guild.id,
            prefix: '.',
            allowbots: false
        });
    }
});

client.login(token);

// Make sure all databases are up to date
function update_database(msg, guild_db) {
    // Check for guild in global database
    if (guild_db.findOne({guild_id: msg.guild.id}) === null) {
        guild_db.insert({
            guild_id: msg.guild.id,
            prefix: '.',
            allowbots: false
        });
    }
    // Check for guild user database in global database
    if (guild_config.getCollection(msg.guild.id) === null) {   
        guild_config.addCollection(msg.guild.id, {
            unique: ["user_id"],
            autoupdate: true
        });
    }
    const user_db = guild_config.getCollection(msg.guild.id);
    // Check for user in guild user database
    if (user_db.findOne({user_id: msg.author.id}) == null) {
        user_db.insert({
            user_id: msg.author.id,
            xp: 0,
            level: 0,
            levelroles: [],
            roles: [],
            inGuild: true
        });
    }
    const guild = guild_db.findOne({guild_id: msg.guild.id});
    // Check for levelSystem in guild
    if (guild.levelSystem == undefined) {
        guild.levelSystem = {
            "enabled": false,
            "disallowed_channels": [],
            "update_channel": undefined,
            "levelup_message": {
                "color": 2215713,
                "title": "Congratulations {username}, you reached level {level}!",
                "description": ''
            },
            "levelup_image": true,
            "cooldown_timestamps": {},
            "roles": {
                "cumulative": false
            }
        }
    }
    const db_user = user_db.findOne({ user_id: msg.author.id });
    // Individual properies that may not be in older version of databases (will be updated manually in database when I feel like it)
    guild.levelSystem.roles ||= { cumulative: false };
    guild.allowbots ||= false;
    guild.name ||= msg.guild.name;
    db_user.levelroles ||= [];
    db_user.inGuild ||= true;
    guild_db.update(guild);
}

// fuck you
function print(message, message2 = '', message3 = '') {
    console.log(message, message2, message3);
}