module.exports = {
    name: 'allowbots',
    short_desc: 'Allows/disallows reaction to other bots.',
    aliases: ['bots'],
    long_desc: 'If this is set to true, Dunhammer will treat other bots as regular users.',
    usage: '[true/false]',
    permissions: 'BAN_MEMBERS',
    cooldown: 2,
    execute(msg, args, taggedUsers, taggedMembers, guild, guild_db, user_db, user, args_original_case_with_command) {
        if (!args.length) {
            return msg.channel.send({ embed: {
                "color": 2215713,
                "description": (guild.allowbots ? ":white_check_mark: Bots are treated as users." : ":x: Bots are ignored.")
            }});
        }
        if (!["true", "false"].includes(args[0])) return msg.channel.send({ embed: {
            "color": 0xcf2d2d,
            "title": ":octagonal_sign: Error!",
            "description": `:question: Invalid argument! Use \`${guild.prefix}help allowbots\` for help.`
        }});

        if (args[0] == "true") {
            guild.allowbots = true;
            return msg.channel.send({ embed: {
                "color": 2215713,
                "description": ":white_check_mark: Bots will now be treated as normal users."
            }});
        } else {
            guild.allowbots = false;
            return msg.channel.send({ embed: {
                "color": 2215713,
                "description": ":x: Bots will now be ignored."
            }});
        }
    }
}