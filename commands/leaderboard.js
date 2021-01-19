module.exports = {
    name: 'leaderboard',
    aliases: ['scorebaord', 'scores', 'leader'],
    short_desc: 'Displays the leaderboard.',
    long_desc: 'Displays a leaderboard of the top 10 members on the server from the LevelSystem if it is enabled. If you/tagged user is not in top 10, it still shows your/tagged users score.',
    usage: '[user]',
    cooldown: 2,
    async execute(msg, args, tags, databases) {
        const guild_db = databases.guilds;
        const db_guild = guild_db.findOne({ guild_id: msg.guild.id });
        const user_db = databases.users;
        const ds_member = tags.users.first() || msg.member;
        const db_user = user_db.findOne({ user_id: ds_member.id });

        const rank = user_db.chain().simplesort('xp', true).data().findIndex(element => element.user_id == db_user.id) + 1;
        
        const top_ten = user_db.chain().simplesort('xp', true).limit(10).data();
        let top_ten_names = [];
        let top_ten_levels = [];
        await top_ten.forEach(async (element, index) => {
            try {
                const ds_user = await msg.guild.members.fetch(element.user_id);
                const extra = ds_member.id == element.user_id ? "__" : "";
                top_ten_names.push(`${index+1}. ${extra}**${ds_user.nickname || ds_user.user.username}**${extra}`);
                top_ten_levels.push(element.level);
            } catch (err) {
                if (err.message === "Unknown Member" || err.message === "Unknown User") {
                    element.inGuild = false;
                    user_db.update(element);
                }
            }
        });
        console.log(rank);
        if (rank > 10) {
            top_ten_names.push(`${rank}. __**${ds_member.nickname || ds_member.user.username}**__`);
            top_ten_levels.push(db_user.level);
        }
        let reply = {
            color: 2215713,
            title: ":exclamation: This command is currently Work In Progress :exclamation:",
            fields: [{
                name: "Users",
                value: top_ten_names.join('\n'),
                inline: true
            }, {
                name: "Level",
                value: top_ten_levels.join('\n'),
                inline: true
            }]
        }
        return msg.channel.send({ embed: reply });
    }
}