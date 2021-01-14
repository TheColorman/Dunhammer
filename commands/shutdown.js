//@ts-check
module.exports = {
    name: 'shutdown',
    short_desc: 'Shuts down the bot.',
    long_desc: 'Shuts down the bot. The bot cannot be turned on through Discord, and this command can only be used by the bot owner',
    execute(msg, args, tags, databases) {
        const guild = databases.guilds.findOne({ guild_id: msg.guild.id });
        if (['298842558610800650'].includes(msg.author.id.toString())) {
            msg.channel.send({ embed: {
                "color": 2215713,
                "title": ":zzz: Shutting down..."
            }}).then(m => process.exit(1));
        } else {
            msg.channel.send({ embed: {
                "color": 0xcf2d2d,
                "title": ":octagonal_sign: Error!",
                "description": `:no_entry: You don't have access to \`${guild.prefix}shutdown\`!`
            }});
        }
    }
}