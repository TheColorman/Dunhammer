//@ts-check
const { apiFunctions } = require("../../helperfunctions");

module.exports = {
    name: 'allowbots',
    shortDesc: 'Allows/disallows reaction to other bots.',
    aliases: ['bots'],
    longDesc: 'If this is set to true, Dunhammer will treat other bots as regular users.',
    usage: '[true/false]',
    permissions: 'BAN_MEMBERS',
    cooldown: 2,
    async execute(msg, args, tags, databases, interaction) {
        if (interaction) {  // Acknowledge slash command if it exists
            await msg.client.api.interactions(interaction.id, interaction.token).callback.post({ data: {
                type: 5,
            }});
        }
        const guild = databases.guilds.findOne({ guild_id: msg.guild.id});
        if (!args.lowercase.length) {
            return msg.channel.send({ embed: {
                "color": 2215713,
                "description": guild.allowbots ? ":white_check_mark: Bots are treated as users." : ":x: Bots are ignored."
            }});
        }
        if (!["true", "false"].includes(args.lowercase[0])) return msg.channel.send({ embed: {
            "color": 0xcf2d2d,
            "title": ":octagonal_sign: Error!",
            "description": `:question: Invalid argument! Use \`${guild.prefix}help allowbots\` for help.`
        }});

        if (args.lowercase[0] == "true") {
            guild.allowbots = true;
            databases.guilds.update(guild);
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
            guild.allowbots = false;
            databases.guilds.update(guild);

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