//@ts-check
// eslint-disable-next-line no-unused-vars
const MySQL = require("../../sql/sql"),
    // eslint-disable-next-line no-unused-vars
    Discord = require("discord.js"),
    { administrators } = require("../../config.json");

module.exports = {
    name: 'reloaddatabase',
    shortDesc: 'Reloads the database.',
    longDesc: 'Reloads the entire database for this guild. This command can only be used by the bot owner.',
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
    async execute(msg, args, tags, sql) {
        const DBGuild = await sql.getGuildInDB(msg.guild);
        if (!administrators.includes(msg.author.id)) {
            return msg.channel.send({ embed: {
                "color": 0xcf2d2d,
                "title": ":octagonal_sign: Error!",
                "description": `:no_entry: You don't have access to \`${DBGuild.prefix}reloaddatabase\`!`
            }});
        }
        const mainMessage = "<a:discord_loading:821347252085063680> Refreshing database... (This will take a while).";
        let statusMessage = "";
        const message = await msg.channel.send({ embed: {
            color: 49919,
            description: `${mainMessage}\n\n${statusMessage}`
        }});
        
        statusMessage = `${statusMessage}Checking Guild status in database`;
        message.edit({ embed: {
            color: 49919,
            description: `${mainMessage}\n\n\`\`\`\n${statusMessage}\n\`\`\``
        }});
        const DSGuilds = msg.client.guilds.cache.map(guild => guild);
        for (let guildIndex = 0; guildIndex < DSGuilds.length; guildIndex++) {
            const guild = DSGuilds[guildIndex];
            statusMessage = cutLineBreaks(`${statusMessage}\n-------------------------------\nChecking guild "${guild.name}" in databases (${guildIndex+1}/${DSGuilds.length})`, 10);
            message.edit({ embed: {
                color: 49919,
                description: `${mainMessage}\n\n\`\`\`\n${statusMessage}\n\`\`\``
            }});
            await sql.getGuildInDB(guild);
            await sql.getGuildLevelsystemInDB(guild);
            await sql.update(`guilds`, { name: guild.name }, `id = ${guild.id}`);
            const DSGuildMembers = (await guild.members.fetch()).map(member => member);
            statusMessage = cutLineBreaks(`${statusMessage}\n    Checking ${DSGuildMembers.length} members in guild`, 10);
            message.edit({ embed: {
                color: 49919,
                description: `${mainMessage}\n\n\`\`\`\n${statusMessage}\n\`\`\``
            }});
            for (let memberIndex = 0; memberIndex < DSGuildMembers.length; memberIndex++) {
                const member = DSGuildMembers[memberIndex];
                await sql.getGuildUserInDB(guild, member);
                await sql.update(`guild-users`, { nickname: member.nickname }, `userid = ${member.id} AND guildid = ${guild.id}`)
            }

            statusMessage = cutLineBreaks(`${statusMessage}\n        Adding missing members to user database`, 10);
            message.edit({ embed: {
                color: 49919,
                description: `${mainMessage}\n\n\`\`\`\n${statusMessage}\n\`\`\``
            }});
            for (let memberIndex = 0; memberIndex < DSGuildMembers.length; memberIndex++) {
                const member = DSGuildMembers[memberIndex];
                await sql.getUserInDB(member.user);
            }

            statusMessage = cutLineBreaks(`${statusMessage}\n    Verifying status of guild users in database`, 10);
            message.edit({ embed: {
                color: 49919,
                description: `${mainMessage}\n\n\`\`\`\n${statusMessage}\n\`\`\``
            }});
            const DBGuildUsers = await sql.get(`guild-users`, `guildid = ${guild.id}`);
            DBGuildUsers.forEach(async DBGuildMember => {
                const DSGuildMember = guild.member(DBGuildMember.userid);
                await sql.update(`guild-users`, { inGuild: !!DSGuildMember }, `guildid = ${DBGuildMember.guildid} AND userid = ${DBGuildMember.userid}`)
                try {
                    await msg.client.users.fetch(DBGuildMember.userid);
                } catch(err) {
                    if (err.message == "Unknown User") await sql.delete(`guild-users`, `guildid = ${guild.id} AND userid = ${DBGuildMember.userid}`);
                    else {
                        console.log("error message");
                        console.error(err);
                    }
                }
            });
        }

        return message.edit({ embed: {
            color: 2215713,
            description: `~~:white_check_mark: Refreshing database... (This will take a while).~~ Done!\n\n\`\`\`\n${statusMessage}\n\`\`\``
        }}).then(() => {
            return msg.channel.send({ embed: {
                color: 2215713,
                description: `:white_check_mark: Finished refreshing database.`
            }});
        });
    }
}

/**
 * Limits the amount of linebreaks in a string (used for a console-like effect when editing an embed, to make sure the message doesnt just get taller and taller)
 * @param {String} string Message string
 * @param {Number} linebreaks Amount of allowed linebreaks
 * @returns {String} String with cut linebreaks
 */
function cutLineBreaks(string, linebreaks) {
    return string.match(/\n/g).length > linebreaks ? string.split("\n").slice(-string.match(/\n/g).length).join("\n") : string;
}