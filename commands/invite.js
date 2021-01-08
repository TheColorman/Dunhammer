module.exports = {
    name: 'invite',
    short_desc: 'Sends a Dunhammer invite link.',
    long_desc: 'Sends an invite link for Dunhammer.',
    aliases: ['inv'],
    cooldown: 2,
    execute(msg, args, taggedUsers, taggedMembers, guild) {
        return msg.channel.send({ embed: {
            color: 49919,
            description: ":robot: To invite me to a server, please choose one of the following:\n[Full access](https://discord.com/api/oauth2/authorize?client_id=671681661296967680&permissions=2088234238&scope=bot).\n[Limited access](https://discord.com/api/oauth2/authorize?client_id=671681661296967680&permissions=1812327488&scope=bot).\n\n",
            fields: [{
                name: "Note:",
                value: "Limited access invite may be changed as the bot is updated, since new commands can require different permissions."
            }]
        }});
    }
}