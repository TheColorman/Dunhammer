module.exports = {
    name: 'level',
    short_desc: 'Sends your/tagged users level.',
    long_desc: 'See your current level and how much experience is needed to get to the next one for either yourself or someone else.',
    usage: '[tagged user]',
    cooldown: 2,
    execute(msg, args, taggedUsers, taggedMembers, guild, guild_db, user_db, _user, args_original_case_with_command, taggedChannels) {
        let ds_user = args.length ? taggedMembers.first() : msg.member;
        let db_user = user_db.findOne({ user_id: ds_user.id });
        if (!db_user) return msg.channel.send({ embed: {
            color: 0xcf2d2d,
            title: ":octagonal_sign: Error!",
            description: ":no_pedestrians: User not found."
        }});
        let xp = db_user.xp;
        let level = db_user.level;
        let next_level = level+1;
        msg.channel.send({ embed: {
            color: 2215713,
            title: `:reminder_ribbon: ${ds_user.nickname} is currently level ${db_user.level}.`,
            description: `${xp} / ${5*(118*next_level+2*next_level*next_level*next_level)/6} xp required for next level.`
        }});
    }
}