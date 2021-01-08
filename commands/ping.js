module.exports = {
    name: 'ping',
    aliases: ['pong'],
    short_desc: "Measure delay between send-receive.",
    long_desc: 'Measures the timestamp delay in miliseconds between the ping message and reply message.',
    cooldown: 5,
    execute(msg) {
        let reply_embed = {
            "color": 2215713,
            "description": ":ping_pong: Pong!"
        }
        msg.channel.send({ embed: reply_embed}).then((reply) => {
            let ping = reply.createdTimestamp - msg.createdTimestamp;
            reply_embed.description = ":ping_pong: Pong! `(" + ping + " ms)`";
            reply.edit({ embed: reply_embed});
        });
    }
}