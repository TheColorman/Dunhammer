//@ts-check
const fetch = require('node-fetch');
const { apiFunctions } = require('../../helperfunctions');

module.exports = {
    name: 'help',
    short_desc: 'Commands and other help.',
    long_desc: 'Shows a list of commands if used without arguments, and help for specific commands if used with arguments.',
    usage: '[command name]',
    aliases: ['h', 'commands'],
    cooldown: 2,
    async execute(msg, args, tags, databases, interaction) {
        if (interaction) {
            await msg.client.api.interactions(interaction.id, interaction.token).callback.post({ data: {
                type: 5,
            }});
        }

        const guild = databases.guilds.findOne({ guild_id: msg.guild.id});
        const { commandCategories } = msg.client;
        let reply_embed = {"title": "Error!", "color": 49919}

        if (args.lowercase.length == 0) {
            reply_embed = {
                color: 49919,
                title: ":scroll: List of commands",
                description: `:question: Send \`${guild.prefix}help <command name>\` for command-specific help.`,
                fields: []
            }
            let index = -1;
            commandCategories.forEach((categoryCommands, categoryName) => {
                index++;
                reply_embed.fields.push({ name: categoryName.substring(1), value: "", inline: true });  // Cut off 1 because each category starts with a number
                categoryCommands.forEach((commandFile, commandName) => {
                    reply_embed.fields[index].value = `${reply_embed.fields[index].value}\n\`${commandFile.name}\` - ${commandFile.short_desc}`
                });
                if (!((index) % 3)) {   // This works for some reason (makes 2 columns instead of 3)
                    reply_embed.fields.push({ name: "\u200B", value: "\u200B", inline: true });
                    index++;
                }
            });
            if (interaction) {
                return await apiFunctions.interactionEdit(msg.client, interaction, msg.channel, reply_embed);
            } else {
                return msg.channel.send({ embed: reply_embed});
            }
        }

        
        const name = args.lowercase[0].toLowerCase();
        let command;
        commandCategories.forEach(category => {
            category.forEach((cmd, cmd_name) => {
                const com = (cmd_name == name || cmd.aliases && cmd.aliases.includes(name)) ? cmd : undefined;
                if (com) command = com;
            });
        });
        if (name == "me") {
            const replyEmbed = {
                "color": 0xcf2d2d,
                "title": ":octagonal_sign: Error!",
                "description": "<:YAGOO:796872938460282972> You haven't signed up for Dunham+, if you would like to get personalized help, please sign up [here](https://www.paypal.me/dunhammer)."
            }
            if (interaction) {
                return await apiFunctions.interactionEdit(msg.client, interaction, msg.channel, replyEmbed);
            } else {
                return msg.channel.send({ embed: replyEmbed});
            }
        }

        if (!command) {
            const replyEmbed = {
                "color": 0xcf2d2d,
                "title": ":octagonal_sign: Error!",
                "description": `:question: \`${name}\` isn't a valid command! Send \`${guild.prefix}help\` for a list of commands.`
            }
            if (interaction) {
                return await apiFunctions.interactionEdit(msg.client, interaction, msg.channel, replyEmbed);
            } else {
                return msg.channel.send({ embed: replyEmbed});
            }
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
        if (interaction) {
            return await apiFunctions.interactionEdit(msg.client, interaction, msg.channel, reply_embed);
        } else {
            return msg.channel.send({ embed: reply_embed});
        }
    }
}