// eslint-disable-next-line no-unused-vars
const MySQL = require("../../sql/sql"),
    // eslint-disable-next-line no-unused-vars
    Discord = require("discord.js");

const { apiFunctions } = require("../../helperfunctions");

module.exports = {
    name: 'prefix',
    shortDesc: 'Sets the bot\'s prefix for this server.',
    longDesc: 'Changes the server prefix. In case of multiple bots with the same prefix, tagging me as replacement for the prefix also works.',
    usage: '[prefix]',
    permissions: 'BAN_MEMBERS',
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
        const guild_db = databases.guilds;
        const db_guild = guild_db.findOne({ guild_id: msg.guild.id });
        if (!args.lowercase.length) {
            return msg.channel.send({ embed: {
                "color": 0xcf2d2d,
                "title": ":octagonal_sign: Error!",
                "description": `:question: No arguments! Use \`${db_guild.prefix}help prefix\` for help.`
            }});
        }
        db_guild.prefix = args.original.join(` `);
        guild_db.update(db_guild);

        const replyEmbed = {
            "color": 2215713,
            "description": `:repeat: Updated server prefix to \`${db_guild.prefix}\`.`
        }
        if (interaction) {
            return await apiFunctions.interactionEdit(msg.client, interaction, msg.channel, replyEmbed);
        } else {
            return msg.channel.send({ embed: replyEmbed});
        }
    }
}