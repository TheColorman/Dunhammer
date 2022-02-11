// eslint-disable-next-line no-unused-vars
const Discord = require('discord.js'),
    // eslint-disable-next-line no-unused-vars
    MySQL = require('../sql/sql');

module.exports = {
    name: "play",
    ApplicationCommandData: {
        name: "play",
        description: "Play a song from YouTube.",
        type: "CHAT_INPUT",
        options: [{
            type: "STRING",
        }]
    },
    module: 1,
    /**
     * Command execution
     * @param {Discord.CommandInteraction} interaction Interaction object
     * @param {MySQL} sql MySQL custom object
     */
    async execute(interaction, _sql, Events) {
        Events.emit("ping", _sql, interaction.member, false, interaction.channel);
        interaction.reply({
            embeds: [{
                "color": 0x2F3136,
                "description": `<a:discord_loading:821347252085063680>`
            }],
            fetchReply: true
        }).then(async (reply) => {
            reply.edit({
                embeds: [{
                    "color": 0x7BA043,
                    "description": `Pong! \`(${reply.createdTimestamp - interaction.createdTimestamp} ms)\``
                }],
                components: [{
                    type: "ACTION_ROW",
                    components: [{
                        type: "BUTTON",
                        label: "Measure again",
                        customId: "commands.ping.repeat",
                        style: "SUCCESS"
                    }]
                }]
            });
        });
    },
}