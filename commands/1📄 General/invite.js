// eslint-disable-next-line no-unused-vars
const MySQL = require("../../sql/sql"),
    // eslint-disable-next-line no-unused-vars
    Discord = require("discord.js"),

    { apiFunctions } = require("../../helperfunctions");

module.exports = {
    name: 'invite',
    shortDesc: 'Sends a Dunhammer invite link.',
    longDesc: 'Sends an invite link for Dunhammer.',
    aliases: ['inv'],
    cooldown: 2,
    /**
     * Command execution
     * @param {Discord.Message} msg Message object
     * @param {Object} args Argument object
     * @param {Array<String>} args.lowercase Lowercase arguments
     * @param {Array<String>} args.original Original arguments
     * @param {Object} tags Tag object
     * @param {Discord.Collection<string, Discord.User>} tags.users Collection of user tags
     * @param {Discord.Collection<string, Discord.GuildMember>} tags.members Collection of member tags
     * @param {Discord.Collection<string, Discord.TextChannel>} tags.channels Collection of channel tags
     * @param {Discord.Collection<string, Discord.Role>} tags.roles Collection of role tags
     * @param {MySQL} sql MySQL object
     * @param {Object} interaction Interaction object
     */
    async execute(msg, args, tags, sql, interaction) {
        if (interaction) {  // Acknowledge slash command if it exists
            await msg.client.api.interactions(interaction.id, interaction.token).callback.post({ data: {
                type: 5,
            }});
        }
        const replyEmbed = {
            color: 49919,
            description: `:robot: To invite me to a server, please choose one of the following:\n[Full access](https://discord.com/api/oauth2/authorize?client_id=${msg.client.user.id}&permissions=2088234238&scope=bot%20applications.commands).\n[Limited access](https://discord.com/api/oauth2/authorize?client_id=${msg.client.user.id}&permissions=1812327488&scope=bot%20applications.commands).\n\n`,
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