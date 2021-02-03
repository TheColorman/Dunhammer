const { QuickMessage } = require('../helperfunctions.js');

module.exports = {
    name: 'leaderboard',
    aliases: ['scoreboard', 'scores', 'leader'],
    short_desc: 'Displays the leaderboard.',
    long_desc: 'Displays a leaderboard of the top 10 members on the server from the LevelSystem if it is enabled. If you/tagged user is not in top 10, it still shows your/tagged users score.',
    usage: '[user]',
    cooldown: 2,
    async execute(msg, args, tags, databases) {
        const reply = await msg.channel.send({ embed: {
            color: 49919,
            title: ":arrows_counterclockwise: Getting leaderboard..."
        }});
        let taggedmember = tags.members.first();
        if (!taggedmember && args.lowercase.length) {
            taggedmember = msg.guild.members.cache.find(member => member.user.tag == args.original[0]);
        }
        let taggedrole = tags.roles.first();
        if (!taggedrole && args.lowercase.length) {
            taggedrole = msg.guild.roles.cache.find(role => role.name == args.original.join(" "));
        }

        taggedmember ||= msg.member;
        const user_db = databases.users;
        console.log(obj);
        const top_ten = taggedrole ? user_db.chain().where(obj => obj.roles.includes(taggedrole.id)).simplesort('xp', true).limit(10).data() : user_db.chain().simplesort('xp', true).limit(10).data();
        
        const top_ten_array = [];
        let index = 1;
        let tag_in_top_ten = false;
        for (const db_user of top_ten) {
            let ds_user;
            try {
                ds_user = db_user.inGuild ? await msg.guild.members.fetch(db_user.user_id) : { id: db_user.user_id }
            } catch (err) {
                if (err.message === "Unknown User" || err.message === "Unknown Member") {
                    db_user.inGuild = false;
                    user_db.update(db_user);
                }
                ds_user = { id: db_user.user_id }
            }
            let text_decor = "";
            if (taggedmember.id == ds_user.id) {
                text_decor = "__";
                tag_in_top_ten = true;
            }
            
            top_ten_array.push(`${text_decor}#${index} - <@!${ds_user.id}> - Level ${db_user.level}${text_decor}`);
            index++;
        }
        const hasrole = taggedrole ? user_db.findOne({ user_id: taggedmember.id }).roles.includes(taggedrole.id) : true;
        if (!tag_in_top_ten && hasrole) {
            const rank = user_db.chain().simplesort('xp', true).data().findIndex(element => element.user_id == taggedmember.id);
            const next_user = user_db.chain().simplesort('xp', true).data().find((_element, index) => index == rank-1);
            const previous_user = user_db.chain().simplesort('xp', true).data().find((_element, index) => index == rank+1);
            top_ten_array.push("...");
            if (rank > 10) top_ten_array.push(`#${rank} - <@!${next_user.user_id}> - Level ${next_user.level}`);
            top_ten_array.push(`__#${rank+1} - <@!${taggedmember.id}> - Level ${user_db.findOne({ user_id: taggedmember.id }).level}__`);
            top_ten_array.push(`#${rank+2} - <@!${previous_user.user_id}> - Level ${previous_user.level}`);
        }
        return reply.edit({ embed: {
            color: 49919,
            title: `:trophy: Top 10 ${taggedrole ? `with role \`${taggedrole.name}\`` : ""}`,
            description: `${top_ten_array.join('\n')}`
        }});
    }
}