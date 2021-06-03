//@ts-check
// eslint-disable-next-line no-unused-vars
const MySQL = require("../../sql/sql"),
    // eslint-disable-next-line no-unused-vars
    Discord = require("discord.js");

const { apiFunctions } = require("../../helperfunctions");

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

        const guild_db = databases.guilds;
        const db_guild = guild_db.findOne({ guild_id: msg.guild.id });

        if (!args.lowercase[0]) {
            const replyEmbed = {
                color: 2215713,
                title: `${db_guild.levelSystem.levelup_message.title ? db_guild.levelSystem.levelup_message.title : "No title"}`,
                description: `${db_guild.levelSystem.levelup_message.description ? db_guild.levelSystem.levelup_message.description : "No description"}`,
                fields: [{
                    name: "Image",
                    value: `${db_guild.levelSystem.levelup_image ? "true" : "false"}`
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
                        title(msg, guild_db, db_guild, option.value.toLowerCase() == "none" ? undefined : option.value);
                        break;
                    case "description":
                        description(msg, guild_db, db_guild, option.value.toLowerCase() == "none" ? undefined : option.value);
                        break;
                    case "image":
                        image(msg, guild_db, db_guild, `${option.value}`);
                        break;
                }
            });
            return;
        }

        args.original.splice(0, 1);
        switch (args.lowercase[0]) {
            case 'title':
                return title(msg, guild_db, db_guild, args.original.join(" "));
            case 'description':
                return description(msg, guild_db, db_guild, args.original.join(" "));
            case 'image':
                return image(msg, guild_db, db_guild, args.lowercase[1]);
        }
    }
}

async function title(msg, guild_db, db_guild, newTitle) {
    if (!newTitle) {
        db_guild.levelSystem.levelup_message.title = undefined;
        guild_db.update(db_guild);
        const replyEmbed = {
            color: 2215713,
            description: `:x: Removed message title.`
        }
        return msg.channel.send({ embed: replyEmbed});
    }
    db_guild.levelSystem.levelup_message.title = newTitle;
    guild_db.update(db_guild);
    const replyEmbed = {
        color: 2215713,
        description: `:repeat: Updated the levelup title to \`${db_guild.levelSystem.levelup_message.title}\`.`
    }
    return msg.channel.send({ embed: replyEmbed});
}

async function description(msg, guild_db, db_guild, newDescription) {
    if (!newDescription) {
        db_guild.levelSystem.levelup_message.description = undefined;
        guild_db.update(db_guild);
        const replyEmbed = {
            color: 2215713,
            description: `:x: Removed levelup description.`
        }
        return msg.channel.send({ embed: replyEmbed});
    }
    db_guild.levelSystem.levelup_message.description = newDescription;
    guild_db.update(db_guild);
    const replyEmbed = {
        color: 2215713,
        description: `:repeat: Updated the levelup description to \`${db_guild.levelSystem.levelup_message.description}\`.`
    }
    return msg.channel.send({ embed: replyEmbed});
}

async function image(msg, guild_db, db_guild, bool) {
    if (!bool) {
        const replyEmbed = {
            color: 2215713,
            title: ":information_source: Image is currently set to",
            description: `\`${db_guild.levelSystem.levelup_image}\``
        }
        return msg.channel.send({ embed: replyEmbed});
    }
    let replyEmbed = {}
    switch (bool) {
        case 'true':
            db_guild.levelSystem.levelup_image = true;
            guild_db.update(db_guild);
            replyEmbed = {
                color: 2215713,
                description: `:white_check_mark: Added image to the levelup message.`
            }
            return msg.channel.send({ embed: replyEmbed});
        case 'false':
            db_guild.levelSystem.levelup_image = false;
            guild_db.update(db_guild);
            replyEmbed = {
                color: 2215713,
                description: `:x: Removed image from the levelup message.`
            }
            return msg.channel.send({ embed: replyEmbed});
        default:
            replyEmbed = {
                color: 0xcf2d2d,
                title: ":octagonal_sign: Error!",
                description: `:question: Not enough arguments! Use \`${db_guild.prefix}help levelupmessage\` for help.`
            }
            return msg.channel.send({ embed: replyEmbed});
    }
}