//@ts-check
const { QuickMessage } = require('../helperfunctions.js');

module.exports = {
    name: 'levelsettings',
    aliases: ['levelsetting', 'lvlsettings', 'lvlsetting', 'lvlsett'],
    short_desc: 'Changes settings related to leveling.',
    long_desc: 'Changes settings related to the level system. Subcommands:\n`enable/disable`, `setlevelupmessage`, `setxp`, `setlevelupmessagechannel`, `ignoredchannels`.\n\nUse \`help levelsystem\` for an in-depth explanation of each sub-command.',
    usage: '<subcommand> [...arguments]',
    permissions: 'BAN_MEMBERS',
    cooldown: 2,
    execute(msg, args, tags, databases) {
        // Declare important variables
        const guild_db = databases.guilds;
        const db_guild = guild_db.findOne({ guild_id: msg.guild.id });
        const user_db = databases.users;
        // Return if no arguments
        if (!args.lowercase.length) {
            return msg.channel.send({ embed: {
                "color": 0xcf2d2d,
                "title": ":octagonal_sign: Error!",
                "description": `:question: Not enough arguments! Use \`${db_guild.prefix}help levelsettings\` for help.`
            }});
        }
        // check for subcommand with switch/case
        let channel;
        switch (args.lowercase[0]) {
            case 'setlevelupmessage':
                if(!args.lowercase[1]) return msg.channel.send({ embed: {
                    color: 0xcf2d2d,
                    title: ":octagonal_sign: Error!",
                    description: `:question: No arguments! Use \`${db_guild.prefix}help levelsettings\` for help.`
                }});
                args.original.splice(0, 2);
                switch (args.lowercase[1]) {
                    case 'title':
                        if (!args.lowercase[2]) {
                            db_guild.levelSystem.levelup_message.title = undefined;
                            guild_db.update(db_guild);
                            return msg.channel.send({ embed: {
                                color: 2215713,
                                description: `:x: Removed message title.`
                            }});            
                        }
                        db_guild.levelSystem.levelup_message.title = args.original.join(' ');
                        guild_db.update(db_guild);
                        return msg.channel.send({ embed: {
                            color: 2215713,
                            description: `:repeat: Updated the levelup title to \`${db_guild.levelSystem.levelup_message.title}\`.`
                        }});
                    case 'description':
                        if (!args.lowercase[2]) {
                            db_guild.levelSystem.levelup_message.description = undefined;
                            guild_db.update(db_guild);
                            return msg.channel.send({ embed: {
                                color: 2215713,
                                description: `:x: Removed message description.`
                            }});            
                        }
                        db_guild.levelSystem.levelup_message.description = args.original.join(' ');
                        guild_db.update(db_guild);
                        return msg.channel.send({ embed: {
                            color: 2215713,
                            description: `:repeat: Updated the levelup description to \`${db_guild.levelSystem.levelup_message.description}\`.`
                        }});
                    case 'image':
                        if (!args.lowercase[2]) return msg.channel.send({ embed: {
                            color: 0xcf2d2d,
                            title: ":octagonal_sign: Error!",
                            description: `:question: No arguments! Use \`${db_guild.prefix}help levelsettings\` for help.`
                        }});
                        switch (args.lowercase[2]) {
                            case 'true':
                                db_guild.levelSystem.levelup_image = true;
                                guild_db.update(db_guild);
                                return msg.channel.send({ embed: {
                                    color: 2215713,
                                    description: `:white_check_mark: Added image to the levelup message.`
                                }});        
                            case 'false':
                                db_guild.levelSystem.levelup_image = false;
                                guild_db.update(db_guild);
                                return msg.channel.send({ embed: {
                                    color: 2215713,
                                    description: `:x: Removed image from the levelup message.`
                                }});        
                            default:
                                return msg.channel.send({ embed: {
                                    color: 0xcf2d2d,
                                    title: ":octagonal_sign: Error!",
                                    description: `:question: Not enough arguments! Use \`${db_guild.prefix}help levelsettings\` for help.`
                                }});                            
                        }
                }
            case 'setxp':
                if (!tags.users.size) return msg.channel.send({ embed: {
                    color: 0xcf2d2d,
                    title: ":octagonal_sign: Error!",
                    description: `:no_pedestrians: No user tagged! Use \`${db_guild.prefix}help levelsettings\` for help.`
                }});
                let user = user_db.findOne({user_id: tags.users.first().id});
                if (args.lowercase.length < 3) {
                    return msg.channel.send({ embed: {
                        "color": 0xcf2d2d,
                        "title": ":octagonal_sign: Error!",
                        "description": `:question: Not enough argument! Use \`${db_guild.prefix}help levelsettings\` for help.`
                    }});
                }
                if (user == null) {
                    return msg.channel.send({ embed: {
                        "color": 0xcf2d2d,
                        "title": ":octagonal_sign: Error!",
                        "description": ":no_pedestrians: User not found!"
                    }});
                }
                user.xp = args.lowercase[2]-0;
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
                user.level = level;
                user_db.update(user);
                return msg.channel.send({ embed: {
                    "color": 2215713,
                    "description": `:sparkles: Updated ${tags.users.first().username}'s XP level to ${args.lowercase[2]}.`
                }});
            case 'disable':
            case 'enable':
                let type;
                if (args.lowercase[0] == 'disable') {
                    db_guild.levelSystem.enabled = false;
                    type = ':x: Disabled';
                } else {
                    db_guild.levelSystem.enabled = true;
                    type = ':white_check_mark: Enabled';
                }
                guild_db.update(db_guild);
                return msg.channel.send({ embed: {
                    "color": 2215713,
                    "description": `${type} the level system.`
                }});
            case 'levelupmessage':
            case 'levelmessage':
            case 'setlevelupmessagechannel':
                if (!args.lowercase[1]) {
                    db_guild.levelSystem.update_channel = undefined;
                    guild_db.update(db_guild);
                    return msg.channel.send({ embed: {
                        color: 2215713,
                        description: `:x: Removed update channel.`
                    }});    
                }
                channel = tags.channels.first() || msg.guild.channels.cache.find(channel_object => channel_object ? channel_object.name === args.lowercase[1] : undefined);
                if (!channel) return msg.channel.send({ embed: {
                    "color": 0xcf2d2d,
                    "title": ":octagonal_sign: Error!",
                    "description": `:question: Invalid channel!`
                }});
                db_guild.levelSystem.update_channel = channel.id;
                guild_db.update(db_guild);
                return msg.channel.send({ embed: {
                    color: 2215713,
                    description: `:repeat: Set update channel to ${channel}.`
                }});
            case 'ignoredchannels':
                channel = tags.channels.first() || msg.guild.channels.cache.find(channel_object => channel_object ? channel_object.name === args.lowercase[2] : undefined);
                if (!channel) return msg.channel.send({ embed: {
                    "color": 0xcf2d2d,
                    "title": ":octagonal_sign: Error!",
                    "description": `:question: Invalid channel!`
                }});
                switch (args.lowercase[1]) {
                    case 'add':
                        if (db_guild.levelSystem.disallowed_channels.includes(channel.id)) return msg.channel.send({ embed: {
                            "color": 0xcf2d2d,
                            "title": ":octagonal_sign: Error!",
                            "description": `:question: That channel is already ignored!`
                        }});
                        db_guild.levelSystem.disallowed_channels.push(channel.id);
                        guild_db.update(db_guild);
                        return msg.channel.send({ embed: {
                            color: 2215713,
                            description: `:repeat: Now ignoring ${channel}.`
                        }});
                    case 'remove':
                        if (!db_guild.levelSystem.disallowed_channels.includes(channel.id)) return msg.channel.send({ embed: {
                            "color": 0xcf2d2d,
                            "title": ":octagonal_sign: Error!",
                            "description": `:question: That channel is not ignored!`
                        }});
                        const index = db_guild.levelSystem.disallowed_channels.indexOf(channel.id);
                        db_guild.levelSystem.disallowed_channels.splice(index, 1);
                        guild_db.update(db_guild);
                        return msg.channel.send({ embed: {
                            color: 2215713,
                            description: `:repeat: No longer ignoring ${channel}.`
                        }});
                    default:
                        return msg.channel.send({ embed: {
                            "color": 0xcf2d2d,
                            "title": ":octagonal_sign: Error!",
                            "description": `:question: Not enough arguments! Use \`${db_guild.prefix}help levelsettings\` for help.`
                        }});        
                }
            case 'levelroles':
            case 'roles':
                const role = tags.roles.first() || msg.guild.roles.cache.find(role_object => role_object ? role_object.name === args.lowercase[3] : undefined);
                switch (args.lowercase[1]) {
                    case 'add':
                        if (isNaN(args[2]) && isNaN(parseFloat(args[2]))) {
                            return QuickMessage.invalid_argument(msg.channel);
                        }
                        break;
                    case 'remove':
                        break;
                    default:
                        break;
                }
            default:
                return msg.channel.send({ embed: {
                    "color": 0xcf2d2d,
                    "title": ":octagonal_sign: Error!",
                    "description": `:question: Invalid argument! Use \`${db_guild.prefix}help levelsettings\` for help.`
                }});
        }
    }
}