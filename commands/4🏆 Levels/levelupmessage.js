//@ts-check

module.exports = {
    name: "levelupmessage",
    aliases: ["lvlupmessage", "levelupmsg", "lvlupmsg", "setlevelupmessage", "setlvlupmessage", "setlevelupmsg", "setlvlupmsg"],
    short_desc: "Changes the levelup message.",
    long_desc: "Changes different properties of the levelup message.\n\n`title` and `description` can include the following text ingredients:\n`{username}` - Username of the member (e.g. Dunhammer).\n`{tag}` - Tag of the member (e.g. Dunhammer#2797).\n`{username}` - Username of the member on this server (e.g. Bot Overlord).\n`{level}` - The newly achieved level.\n`{xp}` - The total amount of xp the member has gotten.\n\n**Settings:**\n`title [text]`\nUpdates the title. Leave blank for no title.\n\n`description [text]`\nUpdates the description. Leave blank for no description.\n\n`image <true/false>`\nEnables or disables the displayed image.\n\n**Default levelup message:**\n`title`: Congratulations {username}, you reached level {level}!\n`description`:\n`image`: true",
    usage: "<setting> [change]",
    permissions: "BAN_MEMBERS",
    cooldown: 2,
    execute(msg, args, tags, databases) {
        const guild_db = databases.guilds;
        const db_guild = guild_db.findOne({ guild_id: msg.guild.id });

        if(!args.lowercase[0]) return msg.channel.send({ embed: {
            color: 0xcf2d2d,
            title: ":octagonal_sign: Error!",
            description: `:question: No arguments! Use \`${db_guild.prefix}help levelupmessage\` for help.`
        }});
        args.original.splice(0, 2);
        switch (args.lowercase[0]) {
            case 'title':
                if (!args.lowercase[1]) {
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
                if (!args.lowercase[1]) {
                    db_guild.levelSystem.levelup_message.description = undefined;
                    guild_db.update(db_guild);
                    return msg.channel.send({ embed: {
                        color: 2215713,
                        description: `:x: Removed levelup description.`
                    }});            
                }
                db_guild.levelSystem.levelup_message.description = args.original.join(' ');
                guild_db.update(db_guild);
                return msg.channel.send({ embed: {
                    color: 2215713,
                    description: `:repeat: Updated the levelup description to \`${db_guild.levelSystem.levelup_message.description}\`.`
                }});
            case 'image':
                if (!args.lowercase[1]) return msg.channel.send({ embed: {
                    color: 0xcf2d2d,
                    title: ":octagonal_sign: Error!",
                    description: `:question: No arguments! Use \`${db_guild.prefix}help levelupmessage\` for help.`
                }});
                switch (args.lowercase[1]) {
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
                            description: `:question: Not enough arguments! Use \`${db_guild.prefix}help levelupmessage\` for help.`
                        }});                            
                }
        };
    }
}