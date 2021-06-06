// eslint-disable-next-line no-unused-vars
const MySQL = require("../../sql/sql"),
    // eslint-disable-next-line no-unused-vars
    Discord = require("discord.js"),

    { apiFunctions } = require("../../helperfunctions");

module.exports = {
    name: "levelupmessage",
    aliases: ["lvlupmessage", "levelupmsg", "lvlupmsg", "setlevelupmessage", "setlvlupmessage", "setlevelupmsg", "setlvlupmsg"],
    shortDesc: "Changes the levelup message.",
    longDesc: "Changes different properties of the levelup message.\n\n`title` and `description` can include the following text ingredients:\n`{username}` - Username of the member (e.g. Dunhammer).\n`{tag}` - Tag of the member (e.g. Dunhammer#2797).\n`{level}` - The newly achieved level.\n`{xp}` - The total amount of xp the member has gotten.\n\n**Settings:**\n`title [text]`\nUpdates the title. Leave blank for no title.\n\n`description [text]`\nUpdates the description. Leave blank for no description.\n\n`image <true/false>`\nEnables or disables the displayed image.\n\n**Default levelup message:**\n`title`: Congratulations {username}, you reached level {level}!\n`description`:\n`image`: true",
    usage: "<setting> [change]",
    permissions: "BAN_MEMBERS",
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
            args.lowercase[0] = interaction.data.options
        }

        const DBGuildLevelsystem = await sql.getGuildLevelsystemInDB(msg.guild),
            levelupMessage = JSON.parse(DBGuildLevelsystem.levelupMessage),
            DBGuild = await sql.getGuildInDB(msg.guild);

        if (!args.lowercase[0]) {
            const replyEmbed = {
                color: 2215713,
                title: `${levelupMessage.title ? levelupMessage.title : "No title"}`,
                description: `${levelupMessage.description ? levelupMessage.description : "No description"}`,
                fields: [{
                    name: "Image",
                    value: `${DBGuildLevelsystem.levelupImage ? "true" : "false"}`
                }]
            }
            if (interaction) {
                return await apiFunctions.interactionEdit(msg.client, interaction, msg.channel, replyEmbed);
            } else {
                return msg.channel.send({ embed: replyEmbed});
            }
        }
        if (interaction) {
            apiFunctions.interactionEdit(msg.client, interaction, msg.channel);
            interaction.data.options.forEach(option => {
                switch (option.name) {
                    case "title":
                        title(msg, option.value.toLowerCase() == "none" ? undefined : option.value, DBGuildLevelsystem, levelupMessage, sql);
                        break;
                    case "description":
                        description(msg, option.value.toLowerCase() == "none" ? undefined : option.value, DBGuildLevelsystem, levelupMessage, sql);
                        break;
                    case "image":
                        image(msg, `${option.value}`, DBGuildLevelsystem, sql);
                        break;
                }
            });
            return;
        }

        args.original.splice(0, 1);
        switch (args.lowercase[0]) {
            case 'title':
                return title(msg, args.original.join(" "), DBGuildLevelsystem, levelupMessage, sql);
            case 'description':
                return description(msg, args.original.join(" "), DBGuildLevelsystem, levelupMessage, sql);
            case 'image':
                return image(msg, args.lowercase[1], DBGuildLevelsystem, sql, DBGuild);
        }
    }
}

/**
 * 
 * @param {Discord.Message} msg DiscordJS message
 * @param {String} newTitle New title
 * @param {DBGuildLevelsystem} levelSystem LevelSystem object
 * @param {Object} levelupMessage LevelupMessage embed object
 * @param {MySQL} sql MySQL object
 * @returns 
 */
async function title(msg, newTitle, levelSystem, levelupMessage, sql) {
    if (!newTitle) {
        levelupMessage.title = undefined;
        sql.update("guild-levelsystem", { levelupMessage: JSON.stringify(levelupMessage) }, `id = ${levelSystem.id}`);
        const replyEmbed = {
            color: 2215713,
            description: `:x: Removed message title.`
        }
        return msg.channel.send({ embed: replyEmbed});
    }
    levelupMessage.title = newTitle;
    sql.update("guild-levelsystem", { levelupMessage: JSON.stringify(levelupMessage) }, `id = ${levelSystem.id}`);
    const replyEmbed = {
        color: 2215713,
        description: `:repeat: Updated the levelup title to \`${levelupMessage.title}\`.`
    }
    return msg.channel.send({ embed: replyEmbed});
}

async function description(msg, newDescription, levelSystem, levelupMessage, sql) {
    if (!newDescription) {
        levelupMessage.description = undefined;
        sql.update("guild-levelsystem", { levelupMessage: JSON.stringify(levelupMessage) }, `id = ${levelSystem.id}`);
        const replyEmbed = {
            color: 2215713,
            description: `:x: Removed levelup description.`
        }
        return msg.channel.send({ embed: replyEmbed});
    }
    levelupMessage.description = newDescription;
    sql.update("guild-levelsystem", { levelupMessage: JSON.stringify(levelupMessage) }, `id = ${levelSystem.id}`);
    const replyEmbed = {
        color: 2215713,
        description: `:repeat: Updated the levelup description to \`${levelupMessage.description}\`.`
    }
    return msg.channel.send({ embed: replyEmbed});
}

async function image(msg, bool, levelSystem, sql, DBGuild) {
    if (!bool) {
        const replyEmbed = {
            color: 2215713,
            title: ":information_source: Image is currently set to",
            description: `\`${levelSystem.levelupImage}\``
        }
        return msg.channel.send({ embed: replyEmbed});
    }
    let replyEmbed = {}
    switch (bool) {
        case 'true':
            levelSystem.levelupImage = true;
            sql.update("guild-levelsystem", levelSystem, `id = ${levelSystem.id}`);
            replyEmbed = {
                color: 2215713,
                description: `:white_check_mark: Added image to the levelup message.`
            }
            return msg.channel.send({ embed: replyEmbed});
        case 'false':
            levelSystem.levelupImage = false;
            sql.update("guild-levelsystem", levelSystem, `id = ${levelSystem.id}`);
            replyEmbed = {
                color: 2215713,
                description: `:x: Removed image from the levelup message.`
            }
            return msg.channel.send({ embed: replyEmbed});
        default:
            replyEmbed = {
                color: 0xcf2d2d,
                title: ":octagonal_sign: Error!",
                description: `:question: Not enough arguments! Use \`${DBGuild.prefix}help levelupmessage\` for help.`
            }
            return msg.channel.send({ embed: replyEmbed});
    }
}