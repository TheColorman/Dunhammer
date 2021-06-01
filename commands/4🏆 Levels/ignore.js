//@ts-check

const { apiFunctions } = require("../../helperfunctions");

module.exports = {
    name: "ignore",
    aliases: ["ignorechannel"],
    shortDesc: "Prevent xp from bein gained in a channel.",
    longDesc: "Toggles whether or not the levelsystem ignores a channel. Channels are chosen by either tagging the channel (e.g. #levelups) or by typing out the channel name (e.g. levelups).",
    usage: "<channel>",
    permissions: "BAN_MEMBERS",
    cooldown: 2,
    async execute(msg, args, tags, databases, interaction) {
        if (interaction) {  // Acknowledge slash command if it exists
            await msg.client.api.interactions(interaction.id, interaction.token).callback.post({ data: {
                type: 5,
            }});
        }

        const guild_db = databases.guilds;
        const db_guild = guild_db.findOne({ guild_id: msg.guild.id });

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

        if (db_guild.levelSystem.disallowed_channels.includes(channel.id)) {
            const index = db_guild.levelSystem.disallowed_channels.indexOf(channel.id);
            db_guild.levelSystem.disallowed_channels.splice(index, 1);
            guild_db.update(db_guild);
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
            db_guild.levelSystem.disallowed_channels.push(channel.id);
            guild_db.update(db_guild);
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