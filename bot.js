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
    const guild_ids = client.guilds.cache.map((guild) => guild.id);
    let guild_db = guild_config.getCollection("guilds");
    for (id of guild_ids) {
        let guild = guild_db.findOne({guild_id: id});
        if (guild === null) {
            guild_db.insert({
                guild_id: id,
                prefix: '.',
                allowbots: false
            });
        }
    }
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
    if (msg.channel.type === "dm") {
        if (msg.author == client.user) return;
        return msg.channel.send({ embed: {
            color: 0xcf2d2d,
            title: ":octagonal_sign: Error!",
            description: ":no_entry: Dunhammer doesn't support DMs yet."
        }});
    }

    let guild_db = guild_config.getCollection("guilds");
    let guild = guild_db.findOne({guild_id: msg.guild.id.toString()});
    let user_db = guild_config.getCollection(msg.guild.id);
    if (user_db === null) {
        user_db = guild_config.addCollection(msg.guild.id, {
            unique: ["user_id"],
            autoupdate: true
        });
    }
    if (user_db.findOne({user_id: msg.author.id}) == null) {
        user_db.insert({
            user_id: msg.author.id,
            xp: 0,
            level: 0
        });
    }
    let user = user_db.findOne({ user_id: msg.author.id});

    let original_message_content = msg.content;
    msg.content = msg.content.toLowerCase();
    const taggedUsers = msg.mentions.users;
    const taggedMembers = msg.mentions.members;
    const taggedChannels = msg.mentions.channels;
    const args = msg.content.slice(guild.prefix.length).split(/ +/);
    const commandName = args[0];
    const args_original_case_with_command = original_message_content.slice(guild.prefix.length).split(/ +/);
    args.shift();

    if (taggedUsers.first() == client.user && args[0] == "prefix") {
        if (args.length < 2) return;
        guild.prefix = args[1];
        guild_db.update(guild);
        return msg.channel.send({ embed: {
            "color": 2215713,
            "description": `:repeat: Updated server prefix to \`${args[1]}\`.`
        }});
    }
    if (!msg.content.startsWith(guild.prefix)) return;



    const command = client.commands.get(commandName) || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
    
    if (!guild.allowbots) guild.allowbots = false;
    if (!command || (!guild.allowbots && msg.author.bot)) return;

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
            return msg.reply(`Cooldown, ${timeLeft} seconds left.`);
        }
    }
    timestamps.set(msg.author.id, now);
    setTimeout(() => timestamps.delete(msg.author.id), cooldownAmount);
    try {
        command.execute(msg, args, taggedUsers, taggedMembers, guild, guild_db, user_db, user, args_original_case_with_command, taggedChannels);
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
    if (msg.channel.type === "dm") return;
    let guild_db = guild_config.getCollection("guilds");
    let guild = guild_db.findOne({guild_id: msg.guild.id.toString()});
    let user_db = guild_config.getCollection(msg.guild.id);

    // Give guild a levelsystem
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
            "levelup_image": undefined,
            "cooldown_timestamps": {

            }
        }
    }
    let levelSystem = guild.levelSystem

    if (!levelSystem.enabled || levelSystem.disallowed_channels.includes(msg.channel.id)) return;
    
    guild_db.update(guild);

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
    let user = user_db.findOne({user_id: msg.author.id});
    user.xp += Math.floor(Math.random() * (25 - 15 + 1)) + 15;
    let xp = user.xp;

    let lower = 0;
    let upper = 10000000000;
    while (lower + 1 < upper) {
        let middle = Math.floor((lower + upper)/2);
        let level_xp = 5*(118*middle+2*middle*middle*middle)/6;
        if (level_xp > xp) {
            upper = middle;
        } else {
            lower = middle;
        }
    }
    let level = lower;
    if (level > user.level) {
        let channel = levelSystem.update_channel ? await client.channels.fetch(levelSystem.update_channel) : msg.channel;

        let reply = JSON.parse(JSON.stringify(levelSystem.levelup_message));
        //["{user}", "{rank}", "{level}", "{xp}"]
        if ((reply.title + reply.description).includes("{")) {
            let title = reply.title ? reply.title.replace(/{/g, "[{").replace(/}/g, "}]").split(/\[(.*?)\]/) : undefined;
            let description = reply.description ? reply.description.replace(/{/g, "[{").replace(/}/g, "}]").split(/\[(.*?)\]/) : undefined;
            let index = 0;
            while (title !== undefined && title[index] !== undefined) {
                index++;
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
                        title[index-1] = msg.member.nickname || msg.member.username;
                        break;
                    case '{tag}':
                        title[index-1] = msg.author.tag;
                        break;    
                }
            }
            index = 0;
            while (description !== undefined && description[index] !== undefined) {
                index++;
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
                        description[index-1] = msg.member.nickname || msg.member.username;
                        break;
                    case '{tag}':
                        description[index-1] = msg.author.tag;
                        break;
                }
            }
            reply.title = title ? title.join('') : '';
            reply.description = description ? description.join('') : '';
            user.level = level;
            user_db.update(user);
            if (levelSystem.levelup_image) {
                await CanvasImage.levelup_image(msg.member, user_db);
                const attachment = new Discord.MessageAttachment('./imageData/generated/level.png');
                reply.image = {
                    url: 'attachment://level.png'
                }
                return channel.send({ files: [attachment], embed: reply});
            }
        }
        channel.send({ embed: reply});
    }

});


client.login(token);

// fuck you
function print(message, message2 = '', message3 = '') {
    console.log(message, message2, message3);
}