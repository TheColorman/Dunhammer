module.exports = {
    name: 'levelsettings',
    aliases: ['levelsetting', 'lvlsettings', 'lvlsetting', 'lvlsett'],
    short_desc: 'Changes settings related to leveling.',
    long_desc: 'Changes settings related to the level system. Subcommands:\n`enable/disable`, `setlevelupmessage`, `setxp`, `setlevelupmessagechannel`, `ignoredchannels`.\n\nUse \`help levelsystem\` for an in-depth explanation of each sub-command.',
    usage: '<subcommand> [...arguments]',
    permissions: 'BAN_MEMBERS',
    cooldown: 2,
    execute(msg, args, taggedUsers, taggedMembers, guild, guild_db, user_db, user, args_original_case_with_command, taggedChannels) {
        if (!args.length) {
            return msg.channel.send({ embed: {
                "color": 0xcf2d2d,
                "title": ":octagonal_sign: Error!",
                "description": `:question: Not enough arguments! Use \`${guild.prefix}help levelsettings\` for help.`
            }});
        }
        let channel;
        switch (args[0]) {
            case 'setlevelupmessage':
                if(!args[1]) return msg.channel.send({ embed: {
                    color: 0xcf2d2d,
                    title: ":octagonal_sign: Error!",
                    description: `:question: No arguments! Use \`${guild.prefix}help levelsettings\` for help.`
                }});
                args_original_case_with_command.splice(0, 3);
                switch (args[1]) {
                    case 'title':
                        if (!args[2]) {
                            guild.levelSystem.levelup_message.title = undefined;
                            guild_db.update(guild);
                            return msg.channel.send({ embed: {
                                color: 2215713,
                                description: `:x: Removed message title.`
                            }});            
                        }
                        guild.levelSystem.levelup_message.title = args_original_case_with_command.join(' ');
                        guild_db.update(guild);
                        return msg.channel.send({ embed: {
                            color: 2215713,
                            description: `:repeat: Updated the levelup title to \`${guild.levelSystem.levelup_message.title}\`.`
                        }});
                    case 'description':
                        if (!args[2]) {
                            guild.levelSystem.levelup_message.description = undefined;
                            guild_db.update(guild);
                            return msg.channel.send({ embed: {
                                color: 2215713,
                                description: `:x: Removed message description.`
                            }});            
                        }
                        guild.levelSystem.levelup_message.description = args_original_case_with_command.join(' ');
                        guild_db.update(guild);
                        return msg.channel.send({ embed: {
                            color: 2215713,
                            description: `:repeat: Updated the levelup description to \`${guild.levelSystem.levelup_message.description}\`.`
                        }});
                    case 'image':
                        if (!args[2]) return msg.channel.send({ embed: {
                            color: 0xcf2d2d,
                            title: ":octagonal_sign: Error!",
                            description: `:question: No arguments! Use \`${guild.prefix}help levelsettings\` for help.`
                        }});
                        switch (args[2]) {
                            case 'true':
                                guild.levelSystem.levelup_image = true;
                                guild_db.update(guild);
                                return msg.channel.send({ embed: {
                                    color: 2215713,
                                    description: `:white_check_mark: Added image to the levelup message.`
                                }});        
                            case 'false':
                                guild.levelSystem.levelup_image = false;
                                guild_db.update(guild);
                                return msg.channel.send({ embed: {
                                    color: 2215713,
                                    description: `:x: Removed image from the levelup message.`
                                }});        
                            default:
                                return msg.channel.send({ embed: {
                                    color: 0xcf2d2d,
                                    title: ":octagonal_sign: Error!",
                                    description: `:question: Not enough arguments! Use \`${guild.prefix}help levelsettings\` for help.`
                                }});                            }
                }
            case 'setxp':
                if (!taggedUsers.size) return msg.channel.send({ embed: {
                    color: 0xcf2d2d,
                    title: ":octagonal_sign: Error!",
                    description: `:no_pedestrians: No user tagged! Use \`${guild.prefix}help levelsettings\` for help.`
                }});
                let user = user_db.findOne({user_id: taggedUsers.first().id});
                if (args.length < 3) {
                    return msg.channel.send({ embed: {
                        "color": 0xcf2d2d,
                        "title": ":octagonal_sign: Error!",
                        "description": `:question: Not enough argument! Use \`${guild.prefix}help levelsettings\` for help.`
                    }});
                }
                if (user == null) {
                    return msg.channel.send({ embed: {
                        "color": 0xcf2d2d,
                        "title": ":octagonal_sign: Error!",
                        "description": ":no_pedestrians: User not found!"
                    }});
                }
                user.xp = args[2]-0;
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
                    "description": `:sparkles: Updated ${taggedUsers.first().username}'s XP level to ${args[2]}.`
                }});
            case 'disable':
            case 'enable':
                let type;
                if (args[0] == 'disable') {
                    guild.levelSystem.enabled = false;
                    type = ':x: Disabled';
                } else {
                    guild.levelSystem.enabled = true;
                    type = ':white_check_mark: Enabled';
                }
                guild_db.update(guild);
                return msg.channel.send({ embed: {
                    "color": 2215713,
                    "description": `${type} the level system.`
                }});
            case 'setlevelupmessagechannel':
                if (!args[1]) {
                    guild.levelSystem.update_channel = undefined;
                    guild_db.update(guild);
                    return msg.channel.send({ embed: {
                        color: 2215713,
                        description: `:x: Removed update channel.`
                    }});    
                }
                channel = taggedChannels.first() || msg.guild.channels.cache.find(channel_object => channel_object ? channel_object.name === args[1] : undefined);
                if (!channel) return msg.channel.send({ embed: {
                    "color": 0xcf2d2d,
                    "title": ":octagonal_sign: Error!",
                    "description": `:question: Invalid channel!`
                }});
                guild.levelSystem.update_channel = channel.id;
                guild_db.update(guild);
                return msg.channel.send({ embed: {
                    color: 2215713,
                    description: `:repeat: Set update channel to ${channel}.`
                }});
            case 'ignoredchannels':
                channel = taggedChannels.first() || msg.guild.channels.cache.find(channel_object => channel_object ? channel_object.name === args[2] : undefined);
                if (!channel) return msg.channel.send({ embed: {
                    "color": 0xcf2d2d,
                    "title": ":octagonal_sign: Error!",
                    "description": `:question: Invalid channel!`
                }});
                switch (args[1]) {
                    case 'add':
                        if (guild.levelSystem.disallowed_channels.includes(channel.id)) return msg.channel.send({ embed: {
                            "color": 0xcf2d2d,
                            "title": ":octagonal_sign: Error!",
                            "description": `:question: That channel is already ignored!`
                        }});
                        guild.levelSystem.disallowed_channels.push(channel.id);
                        guild_db.update(guild);
                        return msg.channel.send({ embed: {
                            color: 2215713,
                            description: `:repeat: Now ignoring ${channel}.`
                        }});
                    case 'remove':
                        if (!guild.levelSystem.disallowed_channels.includes(channel.id)) return msg.channel.send({ embed: {
                            "color": 0xcf2d2d,
                            "title": ":octagonal_sign: Error!",
                            "description": `:question: That channel is not ignored!`
                        }});
                        const index = guild.levelSystem.disallowed_channels.indexOf(channel.id);
                        guild.levelSystem.disallowed_channels.splice(index, 1);
                        guild_db.update(guild);
                        return msg.channel.send({ embed: {
                            color: 2215713,
                            description: `:repeat: No longer ignoring ${channel}.`
                        }});
                    default:
                        return msg.channel.send({ embed: {
                            "color": 0xcf2d2d,
                            "title": ":octagonal_sign: Error!",
                            "description": `:question: Not enough arguments! Use \`${guild.prefix}help levelsettings\` for help.`
                        }});        
                }
                break;
            default:
                return msg.channel.send({ embed: {
                    "color": 0xcf2d2d,
                    "title": ":octagonal_sign: Error!",
                    "description": `:question: Invalid argument! Use \`${guild.prefix}help levelsettings\` for help.`
                }});
        }
    }
}