// eslint-disable-next-line no-unused-vars
const Discord = require('discord.js'),
    // eslint-disable-next-line no-unused-vars
    MySQL = require('../sql/sql');

module.exports = {
    name: "settings",
    ApplicationCommandData: {
        name: "settings",
        description: "Change any bot settings.",
        options: [
            {
                type: "CHANNEL",
                name: "ignore_channel",
                description: "Prevents xp gain in the specified channel"
            }, {
                type: "BOOLEAN",
                name: "disable_levelsystem",
                description: "Disables the levelling system"
            }
        ]
    },
    /**
     * Command execution
     * @param {Discord.CommandInteraction} interaction Interaction object
     * @param {MySQL} sql MySQL custom object
     */
    async execute(interaction, sql) {
        if (!interaction.options.data.length) {
            return interaction.reply({
                content: "Settings will soon be available on https://dunhammer.colorman.me.\nIn the meantime you can use the options provided with /settings."
            });
        }

        const embed = {
                color: 0x7BA043,
                description: ""
            },
            DBGuildLevelsystem = await sql.getDBGuildLevelsystem(interaction.guild);
        for (const option of interaction.options.data) {
            switch (option.name) {
                case "ignore_channel": {
                    const hasPerms = interaction.member.permissionsIn(option.channel).has("MANAGE_CHANNELS");
                    if (!hasPerms) return interaction.reply({
                        embeds: [{
                            color: 0xad3737,
                            description: "You need the \"Manage channel\" permission in this channel to use `ignore_channel`!"
                        }],
                        ephemeral: true
                    });
            
                    const ignoredChannels = JSON.parse(DBGuildLevelsystem.ignoredChannels);
                    
                    if (ignoredChannels.includes(option.channel.id)) {
                        ignoredChannels.splice(ignoredChannels.findIndex((id) => id == option.channel.id), 1);
                        embed.description = embed.description.concat(`❎ No longer ignoring ${option.channel}.\n`);
                    } else {
                        ignoredChannels.push(option.channel.id);
                        embed.description = embed.description.concat(`✅ Now ignoring ${option.channel}.\n`);
                    }
                    sql.update("guildlevelsystem", {
                        ignoredChannels: JSON.stringify(ignoredChannels)
                    }, `id = ${interaction.guild.id}`);
                    break;
                }
                case "disable_levelsystem": {
                    const hasPerms = interaction.member.permissionsIn(interaction.channel).has("KICK_MEMBERS");
                    if (!hasPerms) return interaction.reply({
                        embeds: [{
                            color: 0xad3737,
                            description: "You need the \"Kick members\" permission to use `disable-levelsystem`!"
                        }],
                        ephemeral: true
                    });
                    embed.description = embed.description.concat(`${option.value ? "❎ Disabled" : "✅ Enabled"} the levelsystem.`);
                    sql.update("guildlevelsystem", {
                        enabled: !option.value
                    }, `id = ${interaction.guild.id}`);
                }
            }
        }
        return interaction.reply({
            embeds: [embed]
        });
    }
}