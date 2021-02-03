module.exports = {
    name: 'debug',
    short_desc: 'Debug command.',
    long_desc: 'Debug command. Can only be used by bot owner, and is a placeholder for random testing.',
    execute(msg, args, tags, databases) {
        if (!['298842558610800650', '411240035841474590'].includes(msg.author.id)) {
            return msg.channel.send({ embed: {
                "color": 0xcf2d2d,
                "title": ":octagonal_sign: Error!",
                "description": `:no_entry: You don't have access to \`${guild.prefix}shutdown\`!`
            }});
        }

        
        msg.client.guilds.cache.each(guild => {
            guild.channels.cache.each(channel => {
                if (channel.id == "780446870035103774") {
                    console.log(`Error from guild ${guild.name}`);
                    console.log(`In channel ${channel.name}`);
                }
            });
        });
    }
}