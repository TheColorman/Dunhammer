//@ts-check

const { apiFunctions } = require("../../helperfunctions");

module.exports = {
    name: "levelsenabled",
    aliases: ["enablelevels", "disablelevels", "enablelevelsystem", "disablelevelsystem"],
    shortDesc: "Enables/disables the level system.",
    longDesc: "Enables or disables the entire level system. Note that all level data is still saved, and turning the levelsysten off and on again will not reset any scores.",
    usage: "<true/false>",
    permissions: "BAN_MEMBERS",
    cooldown: 5,
    async execute(msg, args, tags, databases, interaction) {
        if (interaction) {  // Acknowledge slash command if it exists
            await msg.client.api.interactions(interaction.id, interaction.token).callback.post({ data: {
                type: 5,
            }});
        }

        const db_guild = databases.guilds.findOne({ guild_id: msg.guild.id });
        let type;
        if (args.lowercase[0] == 'false') {
            db_guild.levelSystem.enabled = false;
            type = ':x: Disabled';
        } else if (args.lowercase[0] == 'true') {
            db_guild.levelSystem.enabled = true;
            type = ':white_check_mark: Enabled';
        } else {
            return msg.channel.send({ embed: {
                color: 0xcf2d2d,
                title: ":octagonal_sign: Error!",
                description: ":question: Expected either `true` or `false`."
            }});
        }
        databases.guilds.update(db_guild);
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