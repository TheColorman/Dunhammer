module.exports = {
    name: 'roadmap',
    short_desc: 'Sends a link to the roadmap.',
    aliases: ['trello', 'todo', 'to-do'],
    long_desc: 'If this is set to true, Dunhammer will treat other bots as regular users.',
    usage: '[true/false]',
    permissions: 'BAN_MEMBERS',
    cooldown: 2,
    execute(msg, args, taggedUsers, taggedMembers, guild, guild_db, user_db, user, args_original_case_with_command) {
        return msg.channel.send({ embed: {
            title: ":map: Roadmap",
            url: "https://trello.com/b/expgfSZa/dunhammer-roadmap",
            color: 49919
        }});
    }
}