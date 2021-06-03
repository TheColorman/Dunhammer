// eslint-disable-next-line no-unused-vars
const MySQL = require("../../sql/sql"),
    // eslint-disable-next-line no-unused-vars
    Discord = require("discord.js");

const { apiFunctions } = require("../../helperfunctions");

module.exports = {
    name: "ignore",
    aliases: ["ignorechannel"],
    shortDesc: "Prevent xp from bein gained in a channel.",
    longDesc: "Toggles whether or not the levelsystem ignores a channel. Channels are chosen by either tagging the channel (e.g. #levelups) or by typing out the channel name (e.g. levelups).",
    usage: "<channel>",
    permissions: "BAN_MEMBERS",
    cooldown: 2,
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

        const DBGuildLevelsystem = (await sql.get("guild-levelsystem", `id = ${msg.guild.id}`))[0];
        const ignoredChannels = JSON.parse(DBGuildLevelsystem.ignoredChannels);

        const channel = tags.channels.first() || msg.guild.channels.cache.find(channel_object => channel_object ? channel_object.name === args.lowercase[0] : undefined);
        if (!channel || ["voice", "category"].includes(channel.type)) {
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

        if (ignoredChannels.includes(channel.id)) {
            const index = ignoredChannels.indexOf(channel.id);
            ignoredChannels.splice(index, 1);
            DBGuildLevelsystem.ignoredChannels = JSON.stringify(ignoredChannels);
            await sql.update("guild-levelsystem", DBGuildLevelsystem, `id = ${DBGuildLevelsystem.id}`);
            const replyEmbed = {
                color: 2215713,
                description: `:repeat: No longer ignoring ${channel}.`
            }
            if (interaction) {
                return await apiFunctions.interactionEdit(msg.client, interaction.token, msg.channel, replyEmbed);
            } else {
                return msg.channel.send({ embed: replyEmbed});
            }    
        } else {
            ignoredChannels.push(channel.id);
            DBGuildLevelsystem.ignoredChannels = JSON.stringify(ignoredChannels);
            await sql.update("guild-levelsystem", DBGuildLevelsystem, `id = ${DBGuildLevelsystem.id}`);
            const replyEmbed = {
                color: 2215713,
                description: `:repeat: Now ignoring ${channel}.`
            }
            if (interaction) {
                return await apiFunctions.interactionEdit(msg.client, interaction.token, msg.channel, replyEmbed);
            } else {
                return msg.channel.send({ embed: replyEmbed});
            }    
        }
    }
}