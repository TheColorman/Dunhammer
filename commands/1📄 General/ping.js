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
        const reply_embed = {
            "color": 2215713,
            "description": `:ping_pong: ${sound}!`
        }
        msg.channel.send({ embed: reply_embed}).then((reply) => {
            let ping = reply.createdTimestamp - msg.createdTimestamp;
            reply_embed.description = `:ping_pong: ${sound}! \`(${ping} ms)\``;
            reply.edit({ embed: reply_embed});
        });
    }
}