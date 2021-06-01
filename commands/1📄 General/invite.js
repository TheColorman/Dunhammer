//@ts-check

const { apiFunctions } = require("../../helperfunctions");

module.exports = {
    name: 'invite',
    shortDesc: 'Sends a Dunhammer invite link.',
    longDesc: 'Sends an invite link for Dunhammer.',
    aliases: ['inv'],
    cooldown: 2,
    async execute(msg, args, tags, databases, interaction) {
        if (interaction) {  // Acknowledge slash command if it exists
            await msg.client.api.interactions(interaction.id, interaction.token).callback.post({ data: {
                type: 5,
            }});
        }
        const replyEmbed = {
            color: 49919,
            description: ":robot: To invite me to a server, please choose one of the following:\n[Full access](https://discord.com/api/oauth2/authorize?client_id=671681661296967680&permissions=2088234238&scope=bot%20applications.commands).\n[Limited access](https://discord.com/api/oauth2/authorize?client_id=671681661296967680&permissions=1812327488&scope=bot%20applications.commands).\n\n",
            fields: [{
                name: "Note:",
                value: "Limited access invite may be changed as the bot is updated, since new commands can require different permissions."
            }]
        }
        if (interaction) {
            return await apiFunctions.interactionEdit(msg.client, interaction, msg.channel, replyEmbed);
        } else {
            return msg.channel.send({ embed: replyEmbed});
        }
    }
}