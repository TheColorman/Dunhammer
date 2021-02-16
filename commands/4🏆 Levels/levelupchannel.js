//@ts-check

module.exports = {
    name: "levelupchannel",
    aliases: ["setlevelupchannel", "lvlupchannel", "levelupchnl", "lvlupchnl", "setlvlupchannel", "setlevelupchnl", "setlvlupchnl", "levelupmessagechannel", "lvlupmessagechannel", "levelupmsgchannel", "levelupmessagechnl", "lvlupmmsgchannel", "lvlupmessagechnl", "levelupmsgchnl", "lvlupmsgchnl", "setlevelupmessagechannel", "setlvlupmessagechannel", "setlevelupmsgchannel", "setlevelupmessagechnl", "setlvlupmsgchannel", "setlevelupmsgchnl", "setlvlupmessagechnl", "setlvlupmsgchnl"],
    short_desc: "Choose which channel levelups are sent in.",
    long_desc: "Change wich channel to send levelups in. Channels are chosen by either tagging the channel (e.g. #levelups) or by typing out the channel name (e.g. levelups).\nLeave channel blank to send the updates in the channel the member leveled up in.",
    usage: "[channel]",
    permissions: "BAN_MEMBERS",
    cooldown: 5,
    execute(msg, args, tags, databases) {
        const guild_db = databases.guilds;
        const db_guild = guild_db.findOne({ guild_id: msg.guild.id });
        if (!args.lowercase[0]) {
            db_guild.levelSystem.update_channel = undefined;
            guild_db.update(db_guild);
            return msg.channel.send({ embed: {
                color: 2215713,
                description: `:x: Removed update channel.`
            }});    
        }
        const channel = tags.channels.first() || msg.guild.channels.cache.find(channel_object => channel_object ? channel_object.name === args.lowercase[0] : undefined);
        if (!channel) return msg.channel.send({ embed: {
            "color": 0xcf2d2d,
            "title": ":octagonal_sign: Error!",
            "description": `:question: Invalid channel!`
        }});
        db_guild.levelSystem.update_channel = channel.id;
        guild_db.update(db_guild);
        return msg.channel.send({ embed: {
            color: 2215713,
            description: `:repeat: Set update channel to ${channel}.`
        }});
    }
}