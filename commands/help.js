module.exports = {
    name: 'help',
    short_desc: 'Commands and other help.',
    long_desc: 'Shows a list of commands if used without arguments, and help for specific commands if used with arguments.',
    usage: '[command name]',
    aliases: ['h', 'commands'],
    cooldown: 2,
    execute(msg, args, taggedUsers, taggedMembers, guild) {
        const { commands } = msg.client;
        let reply_embed = {"title": "Error!", "color": 49919}

        if (args.length == 0) {
            reply_embed = {
                "color": 49919,
                "title": ":scroll: List of commands",
                "description": `:question: Send \`${guild.prefix}help <command name>\` for command-specific help`,
                "fields": [{
                    "name": "Command",
                    "value": "empty",
                    "inline": true
                }, {
                    "name": "Description",
                    "value": "empty",
                    "inline": true
                }, {
                    "name": "Other",
                    "value": ":asterisk:`syntax`\n:arrow_up: `levelsystem`"
                }]
            }
            let names = [];
            let descriptions = [];
            names.push(commands.map(command => command.name).join('`\n`'));
            descriptions.push(commands.map(command => command.short_desc).join('`\n`'));
            names = "`" + names + "`";
            descriptions = "`" + descriptions + "`";
            reply_embed.fields[0].value = names;
            reply_embed.fields[1].value = descriptions;
            return msg.channel.send({ embed: reply_embed });
        }

        
        const name = args[0].toLowerCase();
        const command = commands.get(name) || commands.find(command => command.aliases && command.aliases.includes(name));
        if (["syntax", "levelsystem", "me"].includes(name)) {
            switch (name) {
                case "syntax":
                    return msg.channel.send({ embed: {
                        "title": ":asterisk: Command syntax",
                        "color": 49919,
                        "description": `When using the \`${guild.prefix}help\` command, some symbols such as \`<>\` and \`[]\` may appear. They are explained here:`,
                        "fields": [{
                            "name": "Argument",
                            "value": "`[argument]`\n`<argument>`",
                            "inline": true
                        }, {
                            "name": "Meaning",
                            "value": "Optional argument\nRequired argument",
                            "inline": true
                        }]
                    }});
                case "levelsystem":
                    return msg.channel.send({ embed: {
                        color: 49919,
                        title: ":arrow_up: Level system",
                        description: `The level system promotes activity in a server and gives users a sense of pride and accomplishment when they send messages and gain levels.\n\`${guild.prefix}levels [subcommand]\` controls the level system and the subcommands are shown here.`,
                        fields: [{
                            name: "`disable/enable` " + (guild.levelSystem.enabled ? ":white_check_mark:" : ":x:"),
                            value: "`" + guild.prefix + "levelsettings <setting>`.\nDisables or enables the levelsystem across the server. Note that everyones leveldata will not be reset."
                        }, {
                            name: "`setlevelupmessage`",
                            value: "`" + guild.prefix + "levelsettings setlevelupmessage <message>`.\nChanges the message displayed whenever someone levels up. Supports the following custom text ingredients:\n`{user}` - The users tag.\n`{nickname}` - The users nickname on the server.\n`{level}` - The users level\n`{xp}` - The total amount of xp the user has gained.\nThe default message is `Congratulations {user}, you reached level {level}!`"
                        }, {
                            name: "`setxp`",
                            value: `\`${guild.prefix}levelsettings setxp <user> <xp_amount>\`\nSets a users XP on the server.`
                        }, {
                            name: `\`setupdatechannel\``,
                            value: `\`${guild.prefix}levelsettings setchannel [channel name]\`\nSets which channel the levelup message should be sent in. If no channel name is provided, the message will be sent in response to the user leveling up.`
                        }]
                    }});
                case "me":
                    return msg.channel.send({ embed: {
                        "color": 0xcf2d2d,
                        "title": ":octagonal_sign: Error!",
                        "description": "<:YAGOO:796872938460282972> You haven't signed up for Dunham+, if you would like to get personalized help, please sign up [here](https://www.paypal.me/dunhammer)."
                    }});
            }

        }

        if (!command) {
            return msg.channel.send({ embed: {
                "color": 0xcf2d2d,
                "title": ":octagonal_sign: Error!",
                "description": `:question: \`${name}\` isn't a valid command! Send \`${guild.prefix}help\` for a list of commands.`
            } });
        }

        reply_embed = {
            "title": `:question: Help for \`${guild.prefix}${command.name}\``,
            "color": 49919,
            "fields": [{
                "name": "Desciption",
                "value": `${command.long_desc}`,
                "inline": true
            }, {
                "name": "Aliases",
                "value": `None!`,
                "inline": true
            }, {
                "name": "Usage",
                "value": `\`${guild.prefix}${command.name} ${command.usage || ""}\``
            }, {
                "name": "Cooldown",
                "value": `\`${command.cooldown || 3}\` seconds`,
                "inline": true
            }]
        }

        if (command.aliases) reply_embed.fields[1].value = `\`${command.aliases.join("\n")}\``;
        if (command.permissions) {
            const authorPerms = msg.channel.permissionsFor(msg.member);
            if (!authorPerms || !authorPerms.has(command.permissions)) {
                reply_embed.fields[4] = {"name": "Notice!", "value": "You don't have permission to use this command!"}
            }
        }
        return msg.channel.send({ embed: reply_embed });

    }
}