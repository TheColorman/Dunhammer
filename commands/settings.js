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
                type: 7,
                name: "levelup_channel",
                description: "The channel levelups are shown in"
            }, {
                type: 7,
                name: "ignore_channel",
                description: "Prevents xp gain in the specified channel"
            }, {
                type: 5,
                name: "levelsystem_disabled",
                description: "Disables the levelling system"
            }, {
                type: 5,
                name: "public_leaderboard",
                description: "Makes the leaderboard public the Dunhammer website"
            }, {
                type: 3,
                name: "levelup_message",
                description: "Changes message displayed when leveling up. Can use {username}, {nickname}, {level} and {total_xp}"
            }, {
                type: 3,
                name: "newrole_message",
                description: "Changes message displayed when getting new role. Can use {username}, {nickname}, {role} and {level}",
            }, {
                type: 5,
                name: "levelup_mention",
                description: "Changes whether a user is mentioned when they level up"
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
                case "levelsystem_disabled": {
                    const hasPerms = interaction.member.permissionsIn(interaction.channel).has("KICK_MEMBERS");
                    if (!hasPerms) return interaction.reply({
                        embeds: [{
                            color: 0xad3737,
                            description: "You need the \"Kick members\" permission to use `disable-levelsystem`!"
                        }],
                        ephemeral: true
                    });
                    embed.description = embed.description.concat(`${option.value ? "❎ Disabled" : "✅ Enabled"} the levelsystem.\n`);
                    sql.update("guildlevelsystem", {
                        enabled: !option.value
                    }, `id = ${interaction.guild.id}`);
                    break;
                }
                case "public_leaderboard": {
                    const hasPerms = interaction.member.permissionsIn(interaction.channel).has("BAN_MEMBERS");
                    if (!hasPerms) return interaction.reply({
                        embeds: [{
                            color: 0xad3737,
                            description: "You need the \"Ban members\" permission to use `public-leaderboard`!"
                        }],
                        ephemeral: true
                    });
                    embed.description = embed.description.concat(`${option.value ? "🌎 Made leaderboard public.\n" : "🔒 Made leaderboard private.\n"}`)
                    sql.update("guildlevelsystem", {
                        publicLeaderboard: option.value
                    }, `id = ${interaction.guild.id}`);
                    break;
                }
                case "levelup_message": {
                    const hasPerms = interaction.member.permissionsIn(interaction.channel).has("KICK_MEMBERS");
                    if (!hasPerms) return interaction.reply({
                        embeds: [{
                            color: 0xad3737,
                            description: "You need the \"Kick members\" permission to use `public-leaderboard`!"
                        }],
                        ephemeral: true
                    });
                    embed.description = embed.description.concat(`📝 New levelup message: \`${option.value}\`\n`);
                    sql.update("guildlevelsystem", {
                        levelupMessage: option.value
                    }, `id = ${interaction.guild.id}`);
                    break;
                }
                case "newrole_message": {
                    const hasPerms = interaction.member.permissionsIn(interaction.channel).has("KICK_MEMBERS");
                    if (!hasPerms) return interaction.reply({
                        embeds: [{
                            color: 0xad3737,
                            description: "You need the \"Kick members\" permission to use `public-leaderboard`!"
                        }],
                        ephemeral: true
                    });
                    embed.description = embed.description.concat(`📝 New newrole message: \`${option.value}\`\n`);
                    sql.update("guildlevelsystem", {
                        newroleMessage: option.value
                    }, `id = ${interaction.guild.id}`);
                    break;
                }
                case "levelup_mention": {
                    const hasPerms = interaction.member.permissionsIn(interaction.channel).has("MENTION_EVERYONE");
                    if (!hasPerms) return interaction.reply({
                        embeds: [{
                            color: 0xad3737,
                            description: "You need the \"Mention everyone\" permission to use `public-leaderboard`!"
                        }],
                        ephemeral: true
                    });
                    embed.description = embed.description.concat(`${option.value ? `✅ Enabled ` : `❎ Disabled `} levelup mention.\n`);
                    sql.update("guildlevelsystem", {
                        tagMember: option.value
                    }, `id = ${interaction.guild.id}`);
                    break;
                }
                case "levelup_channel": {
                    const hasPerms = interaction.member.permissionsIn(option.channel).has("MANAGE_CHANNELS");
                    if (!hasPerms) return interaction.reply({
                        embeds: [{
                            color: 0xad3737,
                            description: "You need the \"Manage channel\" permission in this channel to use `ignore_channel`!"
                        }],
                        ephemeral: true
                    });
                    const
                        levelupChannel = DBGuildLevelsystem.levelupChannel,
                        removeChannel = levelupChannel == option.channel.id;
                    embed.description = embed.description.concat(`${removeChannel ? `❎ Removed the levelup channel.` : `✅ ${option.channel} set as the levelup channel.`}\n`);
                    sql.update("guildlevelsystem", {
                        levelupChannel: removeChannel ? null : option.channel.id
                    }, `id = ${interaction.guild.id}`);
                }
            }
        }
        return interaction.reply({
            embeds: [embed]
        });
    }
}