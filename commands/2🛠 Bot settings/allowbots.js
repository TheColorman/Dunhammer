// eslint-disable-next-line no-unused-vars
const MySQL = require("../../sql/sql"),
    // eslint-disable-next-line no-unused-vars
    Discord = require("discord.js"),

    { apiFunctions } = require("../../helperfunctions");

module.exports = {
    name: 'allowbots',
    shortDesc: 'Allows/disallows reaction to other bots.',
    aliases: ['bots'],
    longDesc: 'If this is set to true, Dunhammer will treat other bots as regular users.',
    usage: '[true/false]',
    permissions: 'BAN_MEMBERS',
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
        const DBGuild = (await sql.get("guilds", `id = ${msg.guild.id}`))[0];
        if (!args.lowercase.length) {
            return msg.channel.send({ embed: {
                "color": 2215713,
                "description": !DBGuild.ignoreBots ? ":white_check_mark: Bots are treated as users." : ":x: Bots are ignored."
            }});
        }
        if (!["true", "false"].includes(args.lowercase[0])) return msg.channel.send({ embed: {
            "color": 0xcf2d2d,
            "title": ":octagonal_sign: Error!",
            "description": `:question: Invalid argument! Use \`${DBGuild.prefix}help allowbots\` for help.`
        }});

        if (args.lowercase[0] == "true") {
            DBGuild.ignoreBots = false;
            await sql.update("guilds", DBGuild, `id = ${DBGuild.id}`);
            const replyEmbed = {
                "color": 2215713,
                "description": ":white_check_mark: Bots will now be treated as normal users."
            }
            if (interaction) {
                return await apiFunctions.interactionEdit(msg.client, interaction, msg.channel, replyEmbed);
            } else {
                return msg.channel.send({ embed: replyEmbed});
            }
        } else {
            DBGuild.ignoreBots = true;
            await sql.update("guilds", DBGuild, `id = ${DBGuild.id}`);

            const replyEmbed = {
                "color": 2215713,
                "description": ":x: Bots will now be ignored."
            }
            if (interaction) {
                return await apiFunctions.interactionEdit(msg.client, interaction, msg.channel, replyEmbed);
            } else {
                return msg.channel.send({ embed: replyEmbed});
            }
        }
    }
}