//@ts-check

const { apiFunctions } = require("../../helperfunctions");

module.exports = {
    name: "levelupchannel",
    aliases: ["setlevelupchannel", "lvlupchannel", "levelupchnl", "lvlupchnl", "setlvlupchannel", "setlevelupchnl", "setlvlupchnl", "levelupmessagechannel", "lvlupmessagechannel", "levelupmsgchannel", "levelupmessagechnl", "lvlupmmsgchannel", "lvlupmessagechnl", "levelupmsgchnl", "lvlupmsgchnl", "setlevelupmessagechannel", "setlvlupmessagechannel", "setlevelupmsgchannel", "setlevelupmessagechnl", "setlvlupmsgchannel", "setlevelupmsgchnl", "setlvlupmessagechnl", "setlvlupmsgchnl"],
    shortDesc: "Choose which channel levelups are sent in.",
    longDesc: "Change wich channel to send levelups in. Channels are chosen by either tagging the channel (e.g. #levelups) or by typing out the channel name (e.g. levelups).\nLeave channel blank to send the updates in the channel the member leveled up in.",
    usage: "[channel]",
    permissions: "BAN_MEMBERS",
    cooldown: 5,
    async execute(msg, args, tags, databases, interaction) {
        if (interaction) {  // Acknowledge slash command if it exists
            await msg.client.api.interactions(interaction.id, interaction.token).callback.post({ data: {
                type: 5,
            }});
        }

        const guild_db = databases.guilds;
        const db_guild = guild_db.findOne({ guild_id: msg.guild.id });
        if (!args.lowercase[0]) {
            db_guild.levelSystem.update_channel = undefined;
            guild_db.update(db_guild);
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
        db_guild.levelSystem.update_channel = channel.id;
        guild_db.update(db_guild);
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