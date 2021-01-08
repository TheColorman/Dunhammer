module.exports = {
    name: 'prefix',
    short_desc: 'Sets the bot\'s prefix for this server.',
    long_desc: 'Changes the server prefix. In case of multiple bots with the same prefix, tagging me as replacement for the prefix also works.',
    usage: '[prefix]',
    permissions: 'BAN_MEMBERS',
    cooldown: 5,
    execute(msg, args, taggedUsers, taggedMembers, guild, guild_db) {
        if (!args.length) {
            return msg.channel.send({ embed: {
                "color": 0xcf2d2d,
                "title": ":octagonal_sign: Error!",
                "description": `:question: No arguments! Use \`${guild.prefix}help prefix\` for help.`
            }});
        }
        let db_guild = guild_db.findOne({ guild_id: msg.guild.id.toString()});
        db_guild.prefix = args[0];
        guild_db.update(db_guild);
        return msg.channel.send({ embed: {
            "color": 2215713,
            "description": `:repeat: Updated server prefix to \`${args[0]}\`.`
        }});
    }
}