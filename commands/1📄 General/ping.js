// eslint-disable-next-line no-unused-vars
const MySQL = require("../../sql/sql"),
    // eslint-disable-next-line no-unused-vars
    Discord = require("discord.js");

const { apiFunctions } = require('../../helperfunctions.js');

module.exports = {
    name: 'ping',
    aliases: ['pong'],
    shortDesc: "Measure delay between send-receive.",
    longDesc: 'Measures the timestamp delay in miliseconds between the ping message and reply message.',
    cooldown: 5,
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
        const sound = msg.content.includes("ping") ? "Pong" : "Ping";
        const pingCalc = await msg.channel.send("ping calculator");
        pingCalc.delete();
        const ping = new Date(pingCalc.id / 4194304 + 1420070400000) - new Date(msg.id / 4194304 + 1420070400000);
        const replyEmbed = {
            color: 2215713,
            description: `:ping_pong: ${sound}! \`(${ping} ms)\``,
        }

        if (interaction) {
            return await apiFunctions.interactionEdit(msg.client, interaction, msg.channel, replyEmbed);
        } else {
            return msg.channel.send({ embed: replyEmbed});
        }
    }
}