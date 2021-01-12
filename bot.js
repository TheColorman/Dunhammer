// Modules & config
const Discord = require('discord.js');
const fs = require('fs');
const loki = require('lokijs');

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
                "title": "Congratulations {user}, you reached level {level}!",
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
                        console.log(msg);
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
                await draw_level_image(msg.member, msg.author, user, user_db);
                const attachment = new Discord.MessageAttachment('./imageData/level.png');
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

// all this code is copied from level command
const { createCanvas, loadImage} = require('canvas');
async function draw_level_image(ds_member, ds_user, db_user, user_db) {
    let xp_total = db_user.xp;
    let level = db_user.level;
    let next_level = level+1;
    let xp_for_next_level = 5*(118*next_level+2*next_level*next_level*next_level)/6 - 5*(118*level+2*level*level*level)/6;
    let current_xp_minus_xp_for_current_level = xp_total - 5*(118*level+2*level*level*level)/6;

    let data = user_db.chain().simplesort('xp', true).data();
    let rank = data.findIndex(element => element.user_id == ds_member.id) + 1;

    // Creating the image
    //#region
    const canvas = createCanvas(1000, 300);
    const ctx = canvas.getContext('2d');
    const font = 'Arial';
    // set box size. 320 is whitespace + profile picture length
    ctx.font = 'bold 46px' + font;
    let username_text_length = ctx.measureText(ds_user.username).width;
    ctx.font = `36px${font}`;
    let tag_text_length = ctx.measureText(ds_user.tag.slice(-5)).width;
    canvas.width = Math.max(username_text_length + tag_text_length + 400, 1000);
          
    // background
    ctx.beginPath();
    ctx.rect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "black";
    ctx.fill();
    // username
    ctx.font = '36px' + font;
    ctx.fillStyle = "#A6A7AA";
    ctx.font = 'bold 60px' + font;
    ctx.fillStyle = "white";
    let username_text_height = ctx.measureText(ds_user.username).emHeightAscent;
    let username_text_width = ctx.measureText(ds_user.username).width;
    ctx.fillText(ds_user.username, 300, 50 + username_text_height);
    // tag
    ctx.font = '36px' + font;
    ctx.fillStyle = "#A6A7AA";
    ctx.fillText(ds_user.tag.slice(-5), 300 + username_text_width, 50  + username_text_height);
    // experience bar
    ctx.fillStyle = "#4a4a4a";
    roundRect(ctx, 290, 240, canvas.width - 320, 30, 16, true, false);  // background
    ctx.fillStyle = "#54b35d";
    roundRect(ctx, 290, 240, (current_xp_minus_xp_for_current_level/xp_for_next_level) * (canvas.width - 320), 30, 16, true, false);    // xp_total filled up
    // xp for next lvl
    ctx.font = '34px' + font;
    ctx.fillStyle = '#A6A7AA';
    let xp_requried_text = ctx.measureText(` / ${xp_for_next_level} xp_total`);
    let description_text_y = 240 - xp_requried_text.emHeightAscent + xp_requried_text.emHeightDescent;
    ctx.fillText(` / ${xp_for_next_level} xp`, canvas.width - xp_requried_text.width, description_text_y);
    // current xp_total
    ctx.font = '34px' + font;
    ctx.fillStyle = 'white';
    let xp_current_text = ctx.measureText(`${current_xp_minus_xp_for_current_level}`);
    ctx.fillText(`${current_xp_minus_xp_for_current_level}`, canvas.width - xp_requried_text.width - xp_current_text.width, description_text_y);
    // level
    let xp_text_width = xp_requried_text.width + xp_current_text.width;
    ctx.font = 'bold 80px' + font;
    ctx.fillStyle = "#54b35d";
    let level_number = ctx.measureText(`${level}`);
    ctx.fillText(`${level}`, canvas.width - level_number.width - xp_text_width - 30, description_text_y);
    // level text
    ctx.font = `34px ${font}`;
    let level_text = ctx.measureText(`LEVEL`);
    ctx.fillText(`LEVEL`, canvas.width - level_number.width - xp_text_width - 40 - level_text.width, description_text_y);
    // rank
    ctx.font = 'bold 80px' + font;
    ctx.fillStyle = "white";
    let rank_number = ctx.measureText(`${rank}`);
    ctx.fillText(`${rank}`, canvas.width - level_number.width - xp_text_width - 70 - level_text.width - rank_number.width, description_text_y);
    // rank text
    ctx.font = `34px ${font}`;
    let rank_text = ctx.measureText(`RANK`);
    ctx.fillText(`RANK`, canvas.width - level_number.width - xp_text_width - 80 - level_text.width - rank_number.width - rank_text.width, description_text_y);

    //#endregion

    let avatar_url = ds_user.displayAvatarURL({format: "png", dynamic: true, size: 256});
    let image = await loadImage(avatar_url);
    //avatar_url = 'https://cdn.discordapp.com/avatars/268400056242143232/a_14ebd6e94d2088ca8ec143b3095fb533.gif?size=256';

    // clip profile picture
    ctx.beginPath();
    ctx.arc(150, 150, 120, 0, 6.28, false);
    ctx.clip();
    ctx.drawImage(image, 30, 30, 240, 240);
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync('./imageData/level.png', buffer);
}

// Credits for this function to Juan Mendes on StackOverflow (https://stackoverflow.com/users/227299/juan-mendes)
/**
 * Draws a rounded rectangle using the current state of the canvas.
 * If you omit the last three params, it will draw a rectangle
 * outline with a 5 pixel border radius
 * @param {CanvasRenderingContext2D} ctx
 * @param {Number} x The top left x coordinate
 * @param {Number} y The top left y coordinate
 * @param {Number} width The width of the rectangle
 * @param {Number} height The height of the rectangle
 * @param {Number} [radius = 5] The corner radius; It can also be an object 
 *                 to specify different radii for corners
 * @param {Number} [radius.tl = 0] Top left
 * @param {Number} [radius.tr = 0] Top right
 * @param {Number} [radius.br = 0] Bottom right
 * @param {Number} [radius.bl = 0] Bottom left
 * @param {Boolean} [fill = false] Whether to fill the rectangle.
 * @param {Boolean} [stroke = true] Whether to stroke the rectangle.
 */
function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
    if (typeof stroke === 'undefined') {
      stroke = true;
    }
    if (typeof radius === 'undefined') {
      radius = 5;
    }
    if (typeof radius === 'number') {
      radius = {tl: radius, tr: radius, br: radius, bl: radius};
    } else {
      var defaultRadius = {tl: 0, tr: 0, br: 0, bl: 0};
      for (var side in defaultRadius) {
        radius[side] = radius[side] || defaultRadius[side];
      }
    }
    ctx.beginPath();
    ctx.moveTo(x + radius.tl, y);
    ctx.lineTo(x + width - radius.tr, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
    ctx.lineTo(x + width, y + height - radius.br);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
    ctx.lineTo(x + radius.bl, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
    ctx.lineTo(x, y + radius.tl);
    ctx.quadraticCurveTo(x, y, x + radius.tl, y);
    ctx.closePath();
    if (fill) {
      ctx.fill();
    }
    if (stroke) {
      ctx.stroke();
    }
}