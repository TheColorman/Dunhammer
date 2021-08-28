// eslint-disable-next-line no-unused-vars
const Discord = require('discord.js'),
    // eslint-disable-next-line no-unused-vars
    MySQL = require('../sql/sql');

module.exports = {
    name: "leaderboard",
    ApplicationCommandData: {
        name: "leaderboard",
        description: "View xp leaderboard.",
        options: [
            {
                type: "USER",
                name: "user",
                description: "User to search for"
            }, {
                type: "ROLE",
                name: "role",
                description: "Role to filter by"
            }, {
                type: "STRING",
                name: "filter",
                description: "Filter type",
                choices: [
                    {
                        name: "With role",
                        value: "whitelist"
                    }, {
                        name: "Without role",
                        value: "blacklist"
                    }
                ]
            }, {
                type: "STRING",
                name: "type",
                description: "Type of leaderboard to show",
                choices: [
                    {
                        name: "Server",
                        value: "server"
                    }, {
                        name: "Global",
                        value: "global"
                    }
                ]
            }
        ]
    },
    /**
     * Command execution
     * @param {Discord.CommandInteraction} interaction Interaction object
     * @param {MySQL} sql MySQL custom object
     */
    async execute(interaction, sql) {
        const
            reply = await interaction.reply({
                embeds: [{
                    "color": 0x2F3136,
                    "description": `<a:discord_loading:821347252085063680>`
                }], 
                fetchReply: true 
            }),
            user = interaction.options.getUser('user') || interaction.user,
            role = interaction.options.getRole('role'),
            filter = interaction.options.getString('filter'),
            type = interaction.options.getString('type') || "server",


            { list, page } = await getServer(interaction, sql);

        reply.edit({
            embeds: [{
                title: `🏆 ${interaction.guild.name}'s Leaderboard`,
                description: `<@${list.map(member => member.userid).join(">\n<@")}>`
            }]
        });
    }
}

/**
 * @param {Discord.CommandInteraction} interaction 
 * @param {MySQL} sql 
 * @param {String} page 
 */
async function getServer(interaction, sql, page) {
    page ||= 1;
    const
        user = interaction.options.getUser('user') || interaction.user,
        member = await interaction.guild.members.fetch(user),
        DBGuildMember = await sql.getDBGuildMember(member),
        role = interaction.options.getRole('role'),
        filter = interaction.options.getString('filter'),

        GuildMemberDB = await sql.get("guildusers", `guildid = ${interaction.guild.id}`, `xp DESC`),
        // Filter by role, check if filter is blacklist and continue accordingly
        GuildMemberDBFiltered = role ?
            GuildMemberDB.filter(DBGuildMember => filter && filter == "blacklist" ?
                !JSON.parse(DBGuildMember.roles).includes(role.id) :
                JSON.parse(DBGuildMember.roles).includes(role.id)) :
            GuildMemberDB,
        memberIndex = GuildMemberDBFiltered.findIndex(DBGuildMember => DBGuildMember.userid == user.id),
        maxPage = Math.ceil(GuildMemberDBFiltered.length / 10),
        currentPage = Math.min(page, maxPage),
        topTen = GuildMemberDBFiltered.splice(10 * (currentPage - 1), currentPage * 10);
    
    return {
        list: topTen,
        page: currentPage
    }
}