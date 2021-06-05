// eslint-disable-next-line no-unused-vars
const MySQL = require("../../sql/sql"),
    // eslint-disable-next-line no-unused-vars
    Discord = require("discord.js"),

    { apiFunctions } = require("../../helperfunctions");

module.exports = {
    name: "levelupchannel",
    aliases: ["setlevelupchannel", "lvlupchannel", "levelupchnl", "lvlupchnl", "setlvlupchannel", "setlevelupchnl", "setlvlupchnl", "levelupmessagechannel", "lvlupmessagechannel", "levelupmsgchannel", "levelupmessagechnl", "lvlupmmsgchannel", "lvlupmessagechnl", "levelupmsgchnl", "lvlupmsgchnl", "setlevelupmessagechannel", "setlvlupmessagechannel", "setlevelupmsgchannel", "setlevelupmessagechnl", "setlvlupmsgchannel", "setlevelupmsgchnl", "setlvlupmessagechnl", "setlvlupmsgchnl"],
    shortDesc: "Choose which channel levelups are sent in.",
    longDesc: "Change wich channel to send levelups in. Channels are chosen by either tagging the channel (e.g. #levelups) or by typing out the channel name (e.g. levelups).\nLeave channel blank to send the updates in the channel the member leveled up in.",
    usage: "[channel]",
    permissions: "BAN_MEMBERS",
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

        const DBGuildLevelsystem = await sql.getGuildLevelsystemInDB(msg.guild);
        if (!args.lowercase[0]) {
            DBGuildLevelsystem.levelupChannel = null;
            await sql.update("guild-levelsystem", DBGuildLevelsystem, `id = ${DBGuildLevelsystem.id}`);
            const replyEmbed = {
                color: 2215713,
                description: `:x: Removed update channel.`
            }
            if (interaction) {
                return await apiFunctions.interactionEdit(msg.client, interaction, msg.channel, replyEmbed);
            } else {
                return msg.channel.send({ embed: replyEmbed});
            }
        }
        const channel = tags.channels.first() || msg.guild.channels.cache.find(channel_object => channel_object ? channel_object.name === args.lowercase[0] : undefined);
        if (!channel) {
            const replyEmbed = {
                "color": 0xcf2d2d,
                "title": ":octagonal_sign: Error!",
                "description": `:question: Invalid channel!`
            }
            if (interaction) {
                return await apiFunctions.interactionEdit(msg.client, interaction, msg.channel, replyEmbed);
            } else {
                return msg.channel.send({ embed: replyEmbed});
            }
        }
        DBGuildLevelsystem.levelupChannel = channel.id;
        await sql.update("guild-levelsystem", DBGuildLevelsystem, `id = ${DBGuildLevelsystem.id}`);
        const replyEmbed = {
            color: 2215713,
            description: `:repeat: Set update channel to ${channel}.`
        }
        if (interaction) {
            await apiFunctions.interactionEdit(msg.client, interaction, msg.channel, replyEmbed);
        } else {
            msg.channel.send({ embed: replyEmbed});
        }
    }
}