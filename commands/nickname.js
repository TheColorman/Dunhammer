// eslint-disable-next-line no-unused-vars
const Discord = require('discord.js'),
    // eslint-disable-next-line no-unused-vars
    MySQL = require('../sql/sql');

module.exports = {
    name: "nickname",
    ApplicationCommandData: {
        name: "nickname",
        description: "Changes a users nickname",
        type: 1,
        options: [{
            type: 6,
            name: "user",
            description: "User to change nickname for.",
            required: true
        }, {
            type: 3,
            name: "nickname",
            description: "Users new nickname",
            required: true
        }]
    },
    /**
     * Command execution
     * @param {Discord.CommandInteraction} interaction Interaction object
     * @param {MySQL} sql MySQL custom object
     */
    async execute(interaction) {
        // check for manage_nicknames perms
        const hasPerms = interaction.channel.permissionsFor(interaction.guild.me).has("MANAGE_NICKNAMES")
        if (!hasPerms) return interaction.reply({
            embeds: [{
                "color": 0xF14B46,
                "description": "I need the `Manage Nicknames` permission to change nicknames!"
            }]
        });

        // check role hiarchy
        const member = interaction.options.data[0].member,
            clientHighestRole = interaction.guild.me.roles.highest,
            memberHighestRole = member.roles.highest;
        if (clientHighestRole.position < memberHighestRole.position) return interaction.reply({
            embeds: [{
                "color": 0xF14B46,
                "description": `❌ I can't change ${member}s nickname as their role ${memberHighestRole} is higher than my role, ${clientHighestRole}!`
            }]
        });

        const oldNick = member.displayName,
            newNick = interaction.options.data[1].value;
        
        member.setNickname(newNick, `Changed with /nickname by ${interaction.user.tag}`).then(() => {
            interaction.reply({
                embeds: [{
                    "color": 0x7BA043,
                    "description": `Changed ${interaction.options.data[0].member} nickname: \`${oldNick} => ${newNick}\``     
                }]
            });
        });
    }
}

