module.exports = {
    name: 'reload',
    short_desc: 'Reloads a specific command.',
    long_desc: 'Reloads a specific command if it has been changed. This command is used purely for developer purposes.',
    usage: '<command name>',
    permissions: 'MANAGE_CHANNELS',
    cooldown: 2,
    execute(msg, args, taggedUsers, taggedMembers, guild) {
        if (!args.length) return msg.channel.send({ embed: {
            "color": 0xcf2d2d,
            "title": ":octagonal_sign: Error!",
            "description": `:question: No arguments! Use \`${guild.prefix}help reload\` for help.`
        }});
        const commandName = args[0];
        const command = msg.client.commands.get(commandName) || msg.client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
        
        if (!command) return msg.channel.send({ embed: {
            "color": 0xcf2d2d,
            "title": ":octagonal_sign: Error!",
            "description": `:question: No command with the name or alias \`${commandName}\`, use \`${guild.prefix}help\` to get a list of commands.`
        }});

        delete require.cache[require.resolve(`./${command.name}.js`)];
        try {
            const newCommand = require(`./${command.name}.js`);
            msg.client.commands.set(newCommand.name, newCommand);
            msg.channel.send({ embed: {
                "color": 2215713,
                "description": `:arrows_counterclockwise: Successfully reloaded \`${command.name}\`.`
            }});
        } catch(err) {
            console.error(err);
            msg.channel.send({ embed: {
                "color": 0xcf2d2d,
                "title": ":octagonal_sign: Error!",
                "description": `:exclamation: There was an error while reloading \`${command.name}\`!`,
                "fields": [{
                    "name": "Error:",
                    "value": `${err.message}`
                }]
            }});
        }
    }
}