// eslint-disable-next-line no-unused-vars
const MySQL = require("../../sql/sql"),
    // eslint-disable-next-line no-unused-vars
    Discord = require("discord.js"),

    { apiFunctions } = require('../../helperfunctions.js');

module.exports = {
    name: 'leaderboard',
    aliases: ['scoreboard', 'scores', 'leader'],
    shortDesc: 'Displays the leaderboard.',
    longDesc: 'Displays a leaderboard of the top 10 members on the server from the LevelSystem if it is enabled. If you/tagged user is not in top 10, it still shows your/tagged users score.',
    usage: '[user]',
    cooldown: 2,
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
        if (interaction) {  // Acknowledge slash command if it exists
            await msg.client.api.interactions(interaction.id, interaction.token).callback.post({ data: {
                type: 5,
            }});
        }

        const replyEmbed = {
                color: 49919,
                title: "<a:discord_loading:821347252085063680> Getting leaderboard...",
            },
            reply = interaction ? await apiFunctions.interactionEdit(msg.client, interaction, msg.channel, replyEmbed) : await msg.channel.send({ embed: replyEmbed });

        let taggedmember = tags.members.first();
        if (!taggedmember && args.lowercase.length) {
            const members = await msg.guild.members.fetch({ cache: false });
            taggedmember = await members.find(member => member.user.tag == args.original.join(" "));
        }
        let taggedrole = tags.roles.first();
        if (!taggedrole && args.lowercase.length) {
            const roles = await msg.guild.roles.fetch();
            taggedrole = await roles.cache.find(role => role.name.toLowerCase() == args.lowercase.join(" "));
        }

        const user_db = databases.users;
        
        for (const db_user of top_ten) {
            const ds_user = await msg.client.users.fetch(db_user.user_id);
            if (!msg.guild.member(ds_user)) {
                db_user.inGuild = false;
                user_db.update(db_user);
        taggedMember ||= msg.member;
            topTen = taggedrole ? userDB.filter(user => JSON.parse(user.roles).includes(taggedrole.id)) : await sql.get("guild-users", `guildid = ${msg.guild.id}`, `xp DESC`, 10),
            topTenArr = [];
        let index = 1,
            tagInTopTen = false;
            }
            let textDecor = "";
            if (taggedMember.id == DSUser.id) {
                textDecor = "__";
                tagInTopTen = true;
            }
            
            topTenArr.push(`${textDecor}#${index} - ${DSUser} - Level ${DBUser.level}${textDecor}`);
            index++;
        }
        const taggedDBUser = (await sql.get("guild-users", `guildid = ${msg.guild.id} AND userid = ${taggedMember.id}`))[0],
            hasRole = taggedrole ? JSON.parse(taggedDBUser.roles).includes(taggedrole.id) : true;
        if (!tagInTopTen && hasRole) {
            const rank = userDB.findIndex(user => user.userid == taggedMember.id),
                nextUser = userDB.find((_user, index) => index == rank-1),
                previousUser = userDB.find((_user, index) => index == rank+1);
            topTenArr.push("...");
            if (rank > 10) topTenArr.push(`#${rank} - <@!${nextUser.userid}> - Level ${nextUser.level}`);
            topTenArr.push(`__#${rank+1} - <@!${taggedMember.id}> - Level ${taggedDBUser.level}__`);
            if (previousUser) topTenArr.push(`#${rank+2} - <@!${previousUser.userid}> - Level ${previousUser.level}`);
        }
        return reply.edit({ embed: {
            color: 49919,
            title: `:trophy: Top 10 ${taggedrole ? `with role \`${taggedrole.name}\`` : ""}`,
            description: `${topTenArr.join('\n')}`
        }});
    }
}