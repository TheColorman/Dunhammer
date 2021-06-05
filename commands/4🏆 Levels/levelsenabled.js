// eslint-disable-next-line no-unused-vars
const MySQL = require("../../sql/sql"),
    // eslint-disable-next-line no-unused-vars
    Discord = require("discord.js"),

    { apiFunctions } = require("../../helperfunctions");

module.exports = {
    name: "levelsenabled",
    aliases: ["enablelevels", "disablelevels", "enablelevelsystem", "disablelevelsystem"],
    shortDesc: "Enables/disables the level system.",
    longDesc: "Enables or disables the entire level system. Note that all level data is still saved, and turning the levelsysten off and on again will not reset any scores.",
    usage: "<true/false>",
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
        let type;
        if (args.lowercase[0] == 'false') {
            DBGuildLevelsystem.enabled = false;
            type = ':x: Disabled';
        } else if (args.lowercase[0] == 'true') {
            DBGuildLevelsystem.enabled = true;
            type = ':white_check_mark: Enabled';
        } else {
            return msg.channel.send({ embed: {
                color: 0xcf2d2d,
                title: ":octagonal_sign: Error!",
                description: ":question: Expected either `true` or `false`."
            }});
        }
        await sql.update("guild-levelsystem", DBGuildLevelsystem, `id = ${DBGuildLevelsystem.id}`);
        const replyEmbed = {
            "color": 2215713,
            "description": `${type} the level system.`
        }
        if (interaction) {
            return await apiFunctions.interactionEdit(msg.client, interaction, msg.channel, replyEmbed);
        } else {
            return msg.channel.send({ embed: replyEmbed});
        }
    }
}