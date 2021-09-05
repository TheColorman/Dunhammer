// eslint-disable-next-line no-unused-vars
const Discord = require('discord.js'),
    // eslint-disable-next-line no-unused-vars
    MySQL = require('../sql/sql');

module.exports = {
    name: "help",
    ApplicationCommandData: {
        name: "help",
        description: "Displays help message.",
        options: [{
            type: "STRING",
            name: "command",
            description: "Command to get help for",
            choices: [{
                name: "/neko",
                value: "0"
            }, {
                name: "/profile",
                value: "1"
            }, {
                name: "/roles",
                value: "2"
            }, {
                name: "/settings",
                value: "3"
            }, {
                name: "/leaderboard",
                value: "4"
            }, {
                name: "/level",
                value: "5"
            }, {
                name: "/nickname",
                value: "6"
            }, {
                name: "/ping",
                value: "7"
            }, {
                name: "/help",
                value: "8"
            }, {
                name: "/badges",
                value: "9"
            }]
        }]
    },
    helpPages: [
        `Welcome to Dunhammer!
(invite Dunhammer [here](https://discord.com/api/oauth2/authorize?client_id=671681661296967680&permissions=1812327488&scope=bot%20applications.commands))
**Go to the next page for a list of commands**
All Dunhammer commands are performed using Slash Commands (type / to see them).
For easier setup, more features and profile settings, go to the website: https://dunhammer.colorman.me
(Website currently Work In Progress)

**Button Guide**
• ⏪⏩ - Jump to first/last page.
• ◀▶ - Go backwards/forwards by 1 page.
• 🔢 - Jump to specific page.

**Levelsystem**
The levelsystem is one of the main uses of Dunhammer.
You gain xp in a server by being active in conversations consistently.

There is both a Server-wide leaderboard, and a Global Dunhammer-wide leaderboard. When you level up on the Global leaderboard, you gain Coins <:DunhammerCoin:878740195078463519> that you can spend on various things on the website, such as a new background for your /level command.

If a server has decided to disable the levelsystem, you will still gain xp on the Global leaderboard.

You can opt out of the global leaderboard by going to https://dunhammer.colorman.me/disable.`,
        `\`/level\` - Displays your or a chosen users level.

\`/leaderboard\` - Displays the leaderboard.
  • \`user\`: Focused user.
  • \`role\`: Role to filter by.
  • \`filter\`: Type of role filter to use.
  • \`type\`: Type of leaderboard (Server or Global).

\`/badges\` - Show information about your badges.

\`profile\` - Change personal settings.
  • \`level_mentions\`: Change whether you get mentioned when leveling up Globally.`,
        `\`/help\` - You're already here!
  • \`command\` - Shows help related to a specific command.

\`/neko\` - Send a picture of a cat-girl by default.
  • \`sfw\`/\`nsfw\`/\`nsfw-gif\`: List of image types (not all are catgirls).

\`/ping\` - Displays bot latency.`,
        `\`settings\` - Changes various bot settings (mostly related to the levelsystem).
  • \`levelup_channel\`: Sets the levelup channel.
  • \`ignore_channel\`: Disables or enables xp gain in a channel (Server leaderboard only).
  • \`levelsystem_disabled\`: Disables or enables the levelsystem on this server.
  • \`public_leaderboard\`: Changes whether the leaderboard for this server is publicly visible on the Dunhammer website.
  • \`levelup_message\`: Changes the message displayed on levelup. The following text arguments will be replaced by their appropriate versions:
    ⦿ \`{username}\` | Replaced with the users Discord username.
    ⦿ \`{nickname}\` | Replaced with the users nickname on this server (if they have one).
    ⦿ \`{level}\` | Replaced with the new level that has been reached.
    ⦿ \`{total_xp}\` | Replaced with the total xp gained so far.
  • \`newrole_message\`: Similar to \`levelup_message\`, changes the message displayed when gaining a new level role. Supports following text arguments:
    ⦿ \`{username}\` | Same as \`levelup_message\`.
    ⦿ \`{nickname}\` | Same as \`levelup_message\`.
    ⦿ \`{role}\` | The new role gained.
    ⦿ \`{level}\` | Same as \`levelup_message\`.
  • \`levelup_mention\`: Changes whether members get mentioned when they level up.

\`roles\` - Changes what roles are awarded when reaching specific levels (Note: does not edit roles themselves.).
  • \`method\`: The method to use:
    ⦿ \`Add\` | Adds given role at given level.
    ⦿ \`Remove\` | Removes either the given role, or the role at the given level.
    ⦿ \`View\` | View all current level roles.
    ⦿ \`Reload\` | Reload all level roles on all users.
    ⦿ \`Toggle cumulative\` | Toggles whether roles are cumulative.
  • \`role\`: Role to perform given method on (does nothing if using the methods \`View\` or \`Reload\`)
  • \`level\`: Level to perform given method on (does nothing if using the methods \`View\` or \`Reload\`)

\`nickname\` - Changes the nickname of a user.`
    ],
    helpTitles: [
        `ℹ Help for Dunhammer`,
        `🏆 Levelsystem commands`,
        `:tada: General/Fun commands`,
        `:tools: Settings/Moderation commands`
    ],
    helpCommandPages: [
        `**__Sends a picture of a catgirl.__**
This command sends an anime picture.
The type of picture can be specified with the arguments \`sfw\`, \`nsfw\` or \`nsfw-gif\`, but they won't be explained here (you'll have to experiment for that 😉)

Clicking the "Report" button will remove the image. This is intended for the rare cases when an image is NSFW despite being in a SFW channel, and other cases where an image might be inappropriate.
The image will then be sent to the Dunhammer creator with some information.
Note: Anyone can report an image. Abuse will lead to a blacklist!`,
        `**__Change personal settings__**
This command is used to change settings on your profile.
It supports the following options:
\`level_mentions\`: Changes whether you get mentioned on a Global levelup.`,
        `**__Changes the roles received when reaching a specific level.__**
This command allows you to select a role that all users will gain when they reach the specified level.

This is usefull for purposes such as a role hierarchy based on server activity.

__The \`method\` option chooses how the command is performed and has the following choices:__
\`Add\`
Adds a level role. Required both \`role\` and \`level\` options are provided.

\`Remove\`
Removes a level role. Required either the \`role\` or \`level\` option.

\`View\`
Shows a list of level roles and the levels they are gained.

\`Reload\`
Reloads all level role of all users. Useful when adding new level roles, as people who have already passed the level will not receive the role otherwise.

\`toggle_cumulative\`
Toggles whether roles are cumulative. If false, users can only have 1 level role at a time, and loose all previous level roles upon gaining a new one.`,
        `**__Changes several bot settings.__**
The settings command is mostly used to change settings related to the levelsystem. The following settings can be changed:

  • \`levelup_channel\`: Sets the levelup channel. If the current levelup channel is chosen, the levelup channel will be removed and levelups can be sent in any channel.

  • \`ignore_channel\`: Disables or enables xp gain in a channel (Server leaderboard only).

  • \`levelsystem_disabled\`: Disables or enables the levelsystem on this server.

  • \`public_leaderboard\`: Changes whether the leaderboard for this server is publicly visible on the Dunhammer website.

  • \`levelup_message\`: Changes the message displayed on levelup. The following text arguments will be replaced by their appropriate versions:
    ⦿ \`{username}\` | Replaced with the users Discord username.
    ⦿ \`{nickname}\` | Replaced with the users nickname on this server (if they have one).
    ⦿ \`{level}\` | Replaced with the new level that has been reached.
    ⦿ \`{total_xp}\` | Replaced with the total xp gained so far.

  • \`newrole_message\`: Similar to \`levelup_message\`, changes the message displayed when gaining a new level role. Supports following text arguments:
    ⦿ \`{username}\` | Same as \`levelup_message\`.
    ⦿ \`{nickname}\` | Same as \`levelup_message\`.
    ⦿ \`{role}\` | The new role gained.
    ⦿ \`{level}\` | Same as \`levelup_message\`.

  • \`levelup_mention\`: Changes whether members get mentioned when they level up.`,
        `**__Displays either Server og Global leaderboard__**
Without options this command displays the Server leaderboard, focused on the command user.
The focused user will have a white line underneath their name, and the leaderboard will start on the page the user is on.

The command has the following options:
\`users\`
The user to focus on.

\`role\`
The role to filter by. The type of filter is selected using...

\`filter\`
You can filter either by users who have the selected role, or users who don't. The default filter is With role.

\`type\`
Show either Server og Global leaderboard. Default is server.`,
        `**__Displays your level__**
This command displays both your Server level and your Global leve.
The \`user\` option can be used to show someone else.

Backgrounds can be purchased with Coins <:DunhammerCoin:878740195078463519> on the website. You gain (your level * 10) Coins <:DunhammerCoin:878740195078463519> every time you level up, but more can be gained on the website:
https://dunhammer.colorman.me`,
        `**__Changes a users nickname on the server__**
Pretty self-explanatory.
Choose a \`user\` and a \`nickname\`, and their nickname will be updated.`,
        `**__Shows the bots latency__**
You bog-standard ping command. Shows the delay between you sending the ping command and Dunhammer sending a response.`,
        `**__What do you think this command does???__**
you get 1 guess`,
        `**__Shows your badges__**
The command is still Work In Progress.
In the future, badges will be displayed on your profile when you level up, and you will be able to see all your badges on the website.
Badges are a form of achievements, and they can be gained in numerous ways.`
    ],
    helpCommandTitles: [
        "Neko",
        "Profile",
        "Roles",
        "Settings",
        "Leaderboard",
        "Level",
        "Nickname",
        "Ping",
        "Help",
        "Badges"
    ],
    /**
     * Command execution
     * @param {Discord.CommandInteraction} interaction Interaction object
     * @param {MySQL} sql MySQL custom object
     */
    async execute(interaction) {
        if (!interaction.options.data.length) {
            return interaction.reply(this.createGeneral());
        }
        const command = interaction.options.data[0].value;
        interaction.reply({
            embeds: [{
                color: 0x3778ad,
                title: `Help for \`${this.helpCommandTitles[command]}\``,
                description: this.helpCommandPages[command]
            }]
        });
    },
    /**
     * @param {Discord.CommandInteraction} interaction 
     */
    createGeneral(page) {
        page ||= 0;
        page = Math.max(0, Math.min(page, this.helpTitles.length - 1));
        return {
            embeds: [{
                color: 0x3778ad,
                title: this.helpTitles[page],
                description: this.helpPages[page],
                footer: {
                    text: `Page ${page + 1}/4`
                }
            }],
            components: [{
                type: "ACTION_ROW",
                components: [{
                    type: "BUTTON",
                    customId: `commands.help.first`,
                    emoji: "⏪",
                    style: "PRIMARY"
                }, {
                    type: "BUTTON", 
                    customId: `commands.help.previous.${page - 1}`,
                    emoji: "◀",
                    style: "PRIMARY"
                }, {
                    type: "BUTTON",
                    customId: `commands.help.custom`,
                    emoji: "🔢",
                    style: "SECONDARY"
                }, {
                    type: "BUTTON",
                    customId: `commands.help.next.${page - - 1}`,
                    emoji: "▶",
                    style: "PRIMARY"
                }, {
                    type: "BUTTON",
                    customId: `commands.help.last`,
                    emoji: "⏩",
                    style: "PRIMARY"
                }]
            }]
        }
    },
    first(interaction) {
        interaction.update(this.createGeneral());
    },
    previous(interaction, _sql, page) {
        interaction.update(this.createGeneral(page));
    },
    custom(interaction) {   // This code is mostly copied from /leaderboard
        if (interaction.client.collectors.includes(interaction.channel.id)) {
            return interaction.reply({
                content: "Please wait until the previous request has been complete.",
                ephemeral: true
            });
        }
        const filter = message => message.author.id == interaction.user.id && !isNaN(message.content) && !isNaN(parseFloat(message.content));
        
        interaction.reply({
            content: `${interaction.member}, what page would you like to go to?`,
            fetchReply: true,
            deffered: true
        })
            .then((reply) => {  // It works, trust me 😎
                interaction.client.collectors.push(interaction.channel.id);
                interaction.channel.awaitMessages({ filter, max: 1, time: 15000, errors: ['time'] })
                    .then(async collected => {
                        const
                            message = collected.first(),
                            str = Math.round(message.content);
                        interaction.message.edit(this.createGeneral(str - 1));
                        try {   // In case someone decided to delete our message >:(
                            await collected.first().delete();
                        } catch(e0) {
                            // why tf do i even need a catch block at this point???
                        } finally {
                            try {
                                await reply.delete();
                            } catch(e1) {
                                // god this code is ass
                            } finally {
                                interaction.client.collectors.splice(interaction.client.collectors.indexOf(interaction.channel.id, 1));
                            }
                        }
                    })
                    .catch(async _collected => {
                        try {
                            await reply.delete();
                        } catch(e) {
                            // bitch
                        } finally {
                            interaction.client.collectors.splice(interaction.client.collectors.indexOf(interaction.channel.id, 1));
                        }
                    });
            });
    },
    next(interaction, _sql, page) {
        interaction.update(this.createGeneral(page));
    },
    last(interaction) {
        interaction.update(this.createGeneral(10));
    }
}