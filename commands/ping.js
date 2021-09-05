// eslint-disable-next-line no-unused-vars
const Discord = require('discord.js'),
    // eslint-disable-next-line no-unused-vars
    MySQL = require('../sql/sql');

module.exports = {
    name: "ping",
    ApplicationCommandData: {
        name: "ping",
        description: "Pings Discord."
    },
    /**
     * Command execution
     * @param {Discord.CommandInteraction} interaction Interaction object
     * @param {MySQL} sql MySQL custom object
     */
    async execute(interaction) {
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
    async repeat(interaction) {
        interaction.update({
            embeds: [{
                "color": 0x2F3136,
                "description": `<a:discord_loading:821347252085063680>`
            }], 
            fetchReply: true 
        }).then(async (reply) => {
            reply.edit({
                embeds: [{
                    "color": 0x7BA043,
                    "description": `Pong! \`(${reply.editedTimestamp - interaction.createdTimestamp} ms)\``
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
    }
}