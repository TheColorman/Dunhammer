const { apiFunctions } = require('../../helperfunctions.js');

module.exports = {
    name: 'ping',
    aliases: ['pong'],
    short_desc: "Measure delay between send-receive.",
    long_desc: 'Measures the timestamp delay in miliseconds between the ping message and reply message.',
    cooldown: 5,
    async execute(msg, args, tags, databases, interaction) {
        if (interaction) {  // Acknowledge slash command if it exists
            await msg.client.api.interactions(interaction.id, interaction.token).callback.post({ data: {
                type: 5,
            }});
        }
        const sound = msg.content.includes("ping") ? "Pong" : "Ping";
        const replyEmbed = {
            color: 2215713,
            description: `:ping_pong: ${sound}! \`(${ping} ms)\``,
        }
        if (interaction) {
            return await apiFunctions.interactionEdit(msg.client, interaction, msg.channel, replyEmbed);
        } else {
            return msg.channel.send({ embed: replyEmbed});
        }
        msg.channel.send({ embed: reply_embed}).then((reply) => {
            const ping = (new Date(reply.id / 4194304 + 1420070400000)) - (new Date(msg.id / 4194304 + 1420070400000));
            reply_embed.description = `:ping_pong: ${sound}! \`(${ping} ms)\``;
            reply.edit({ embed: reply_embed});
        });
    }
}