//@ts-check
// eslint-disable-next-line no-unused-vars
const MySQL = require("../../sql/sql"),
    // eslint-disable-next-line no-unused-vars
    Discord = require("discord.js"),
    { administrators } = require("../../config.json");

module.exports = {
    name: 'shutdown',
    shortDesc: 'Shuts down the bot.',
    longDesc: 'Shuts down the bot. The bot cannot be turned on through Discord, and this command can only be used by the bot owner',
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
        const guild = databases.guilds.findOne({ guild_id: msg.guild.id });
        if (['298842558610800650', '411240035841474590'].includes(msg.author.id.toString())) {
            msg.channel.send({ embed: {
                "color": 2215713,
                "title": ":zzz: Shutting down..."
            }}).then(() => process.exit(1));
        } else {
            msg.channel.send({ embed: {
                "color": 0xcf2d2d,
                "title": ":octagonal_sign: Error!",
                "description": `:no_entry: You don't have access to \`${guild.prefix}shutdown\`!`
            }});
        }
    }
}