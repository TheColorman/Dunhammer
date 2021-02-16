//@ts-check

module.exports = {
    name: "setxp",
    short_desc: "Updates a members xp.",
    long_desc: "Changes the total amount of xp a member has gained. Total amount of xp is currently not visible anywhere, and the command functionality will be changed in the future.",
    usage: "<member> <xp>",
    permissions: "BAN_MEMBERS",
    cooldown: 2,
    execute(msg, args, tags, databases) {
        const db_guild = databases.guilds.findOne({ guild_id: msg.guild.id });
        const user_db = databases.users;

        let taggedmember = tags.members.first();
        if (!taggedmember && args.lowercase.length) {
            taggedmember = msg.guild.members.cache.find(member => args.original.join(" ").includes(member.user.tag));
        }        
        if (!taggedmember) return msg.channel.send({ embed: {
            color: 0xcf2d2d,
            title: ":octagonal_sign: Error!",
            description: `:no_pedestrians: No user tagged! Use \`${db_guild.prefix}help setxp\` for help.`
        }});
        let db_user = user_db.findOne({user_id: taggedmember.id});
        if (args.lowercase.length < 2) {
            return msg.channel.send({ embed: {
                "color": 0xcf2d2d,
                "title": ":octagonal_sign: Error!",
                "description": `:question: Not enough argument! Use \`${db_guild.prefix}help setxp\` for help.`
            }});
        }
        if (db_user == null) {
            return msg.channel.send({ embed: {
                "color": 0xcf2d2d,
                "title": ":octagonal_sign: Error!",
                "description": ":no_pedestrians: User not found!"
            }});
        }
        db_user.xp = parseInt(args.lowercase[taggedmember.user.tag.split(" ").length], 10) || parseInt(args.lowercase[1]);  // explanation in ../Moderation/nickname.js
        let xp = db_user.xp;
        let lower = 0;
        let upper = 10000000000;
        while (lower + 1 < upper) {
            let middle = Math.floor((lower + upper)/2);
            let level_xp = 5*(118*middle+2*middle*middle*middle)/6;
            if (level_xp > xp) {
                upper = middle;
            } else {
                lower = middle;
            }
        }
        let level = lower;
        db_user.level = level;
        user_db.update(db_user);
        return msg.channel.send({ embed: {
            "color": 2215713,
            "description": `:sparkles: Updated ${taggedmember}'s XP level to ${args.lowercase[1]}.`
        }});
    }
}