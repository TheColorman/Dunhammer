/* eslint-disable no-unused-vars */
// eslint-disable-next-line no-unused-vars
const MySQL = require("../../sql/sql"),
    // eslint-disable-next-line no-unused-vars
    Discord = require("discord.js"),

    { default: fetch } = require("node-fetch"),
    fs = require('fs'),
    FormData = require('form-data'),
    { administrators } = require("../../config.json");


module.exports = {
    name: 'debug',
    shortDesc: 'Debug command.',
    longDesc: 'Debug command. Can only be used by bot owner, and is a placeholder for random testing.',
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
        const DBGuild = await sql.getGuildInDB(msg.guild);
        if (!administrators.includes(msg.author.id)) {
            return msg.channel.send({ embed: {
                "color": 0xcf2d2d,
                "title": ":octagonal_sign: Error!",
                "description": `:no_entry: You don't have access to \`${DBGuild.prefix}debug\`!`
            }});
        }

        const client = msg.client,
        
        //#region Slash commands
        // console.log("help");
        // await client.api.applications(msg.client.user.id).commands.post({data: {
        //     name: 'help',
        //     description: 'Shows either a list of all commands, or shows help for a specific command.',
        //     options: [{
        //         type: 3,
        //         name: "command",
        //         description: "The command to get help for",
        //         required: false,
        //         choices: [{
        //             name: "Help",
        //             value: "help"
        //         }, {
        //             name: "Invite",
        //             value: "invite"
        //         }, {
        //             name: "Ping",
        //             value: "ping"
        //         }, {
        //             name: "Roadmap",
        //             value: "roadmap"
        //         }, {
        //             name: "Suggestion",
        //             value: "suggestion"
        //         }, {
        //             name: "AllowBots",
        //             value: "allowbots"
        //         }, {
        //             name: "Prefix",
        //             value: "prefix"
        //         }, {
        //             name: "Neko",
        //             value: "neko"
        //         }, {
        //             name: "Speak",
        //             value: "speak"
        //         }, {
        //             name: "Ignore",
        //             value: "ignore"
        //         }, {
        //             name: "Leaderboard",
        //             value: "leaderboard"
        //         }, {
        //             name: "Level",
        //             value: "level"
        //         }, {
        //             name: "LevelsEnabled",
        //             value: "levelsenabled"
        //         }, {
        //             name: "LevelUpChannel",
        //             value: "levelupchannel"
        //         }, {
        //             name: "LevelUpMessage",
        //             value: "levelupmessage"
        //         }, {
        //             name: "Roles",
        //             value: "roles"
        //         }, {
        //             name: "SetLevel",
        //             value: "setlevel"
        //         }, {
        //             name: "Nickname",
        //             value: "nickname"
        //         }, {
        //             name: "Me",
        //             value: "me"
        //         }]
        //     }]
        // }});   
        // console.log("ping");
        // await client.api.applications(msg.client.user.id).commands.post({data: {
        //     name: 'ping',
        //     description: 'Checks latency between Discord and the bot.'
        // }});
        // console.log("invite");
        // await client.api.applications(msg.client.user.id).commands.post({data: {
        //     name: 'invite',
        //     description: 'Sends an invite link for Dunhammer.'
        // }});
        // console.log("roadmap");
        // await client.api.applications(msg.client.user.id).commands.post({data: {
        //     name: 'roadmap',
        //     description: 'Sends a link for the Dunhammer roadmap.'
        // }});
        // console.log("suggestion");
        // await client.api.applications(msg.client.user.id).commands.post({data: {
        //     name: 'suggestion',
        //     description: 'Submits a suggestion directly to the roadmap. See /roadmap for more information.',
        //     options: [{
        //         type: 3,
        //         name: "suggestion",
        //         description: "The actual suggestion",
        //         required: true,
        //     }]
        // }});
        // console.log("allowbots");
        // await client.api.applications(msg.client.user.id).commands.post({data: {
        //     name: 'allowbots',
        //     description: 'Change whether bots are ignored by Dunhammer.',
        //     options: [{
        //         type: 5,
        //         name: "boolean",
        //         description: "True to acknowledge bots, False to ignore bots",
        //         required: true,
        //     }]
        // }});
        // console.log("prefix");
        // await client.api.applications(msg.client.user.id).commands.post({data: {
        //     name: 'prefix',
        //     description: 'Change the bot prefix. Prefix is used for making non-slash commands. Default prefix is ".".',
        //     options: [{
        //         type: 3,
        //         name: "prefix",
        //         description: "New prefix for Dunhammer",
        //         required: true,
        //     }]
        // }});
        // console.log("neko");
        // await client.api.applications(msg.client.user.id).commands.post({data: {
        //     name: 'neko',
        //     description: 'Sends a picture from nekos.life. Note that not all types will result in a catgirl.',
        //     options: [{
        //         type: 1,
        //         name: "SFW",
        //         description: "Send a SFW image",
        //         required: false,
        //         options: [{
        //             type: 3,
        //             name: "type",
        //             description: "The type of catgirl to send",
        //             choices: [{
        //                 name: "random",
        //                 value: "sfw"
        //             }, {
        //                 name: "tickle",
        //                 value: "tickle"
        //             }, {
        //                 name: "slap",
        //                 value: "slap"
        //             }, {
        //                 name: "poke",
        //                 value: "poke"
        //             }, {
        //                 name: "pat",
        //                 value: "pat"
        //             }, {
        //                 name: "kiss",
        //                 value: "kiss",
        //             }, {
        //                 name: "hug",
        //                 value: "hug"
        //             }, {
        //                 name: "fox girl",
        //                 value: "fox_girl"
        //             }, {
        //                 name: "feed",
        //                 value: "feed"
        //             }, {
        //                 name: "cuddle",
        //                 value: "cuddle"
        //             }, {
        //                 name: "neko gif",
        //                 value: "ngif"
        //             }, {
        //                 name: "kemonomimi",
        //                 value: "kemonomimi"
        //             }, {
        //                 name: "Holo",
        //                 value: "holo"
        //             }, {
        //                 name: "smug",
        //                 value: "smug"
        //             }, {
        //                 name: "baka",
        //                 value: "baka"
        //             }, {
        //                 name: "wallpaper",
        //                 value: "wallpaper"
        //             }, {
        //                 name: "genetically engineered catgirl",
        //                 value: "gecg"
        //             }, {
        //                 name: "avatar",
        //                 value: "avatar"
        //             }, {
        //                 name: "waifu",
        //                 value: "waifu"
        //             }, {
        //                 name: "meow",
        //                 value: "meow"
        //             }, {
        //                 name: "woof",
        //                 value: "woof"
        //             }, {
        //                 name: "goose",
        //                 value: "goose"
        //             }, {
        //                 name: "lizard",
        //                 value: "lizard"
        //             }]
        //         }]
        //     }, {
        //         type: 1,
        //         name: "NSFW",
        //         description: "Send a NSFW image",
        //         required: false,
        //         options: [{
        //             type: 3,
        //             name: "type",
        //             description: "The type of catgirl to send",
        //             choices: [{
        //                 name: "random",
        //                 value: "random"
        //             }, {
        //                 name: "hentai gif",
        //                 value: "Random_hentai_gif"
        //             }, {
        //                 name: "hentai",
        //                 value: "hentai"
        //             }, {
        //                 name: "pussy",
        //                 value: "pussy"
        //             }, {
        //                 name: "nsfw neko gif",
        //                 value: "nsfw_neko_gif"
        //             }, {
        //                 name: "lewd",
        //                 value: "lewd"
        //             }, {
        //                 name: "lesbian",
        //                 value: "les"
        //             }, {
        //                 name: "pussy lick",
        //                 value: "kuni"
        //             }, {
        //                 name: "cum",
        //                 value: "cum"
        //             }, {
        //                 name: "classic",
        //                 value: "classic"
        //             }, {
        //                 name: "boobs",
        //                 value: "boobs"
        //             }, {
        //                 name: "blowjob",
        //                 value: "bj"
        //             }, {
        //                 name: "anal",
        //                 value: "anal"
        //             }, {
        //                 name: "avatar",
        //                 value: "nsfw_avatar"
        //             }, {
        //                 name: "trap",
        //                 value: "trap"
        //             }, {
        //                 name: "solo gif",
        //                 value: "solog"
        //             }, {
        //                 name: "solo",
        //                 value: "solo"
        //             }, {
        //                 name: "girl masturbation gif",
        //                 value: "pwankg"
        //             }, {
        //                 name: "lewd kemo",
        //                 value: "lewdkemo"
        //             }, {
        //                 name: "lewd keta",
        //                 value: "keta"
        //             }, {
        //                 name: "lewd Holo",
        //                 value: "hololewd"
        //             }, {
        //                 name: "futa",
        //                 value: "futanari"
        //             }, {
        //                 name: "femdom",
        //                 value: "femdom"
        //             }, {
        //                 name: "feet gif",
        //                 value: "feetg"
        //             }, {
        //                 name: "feet",
        //                 value: "feet"
        //             }]
        //         }]
        //     }, {
        //         type: 1,
        //         name: "default",
        //         description: "Default, sends a catgirl",
        //         required: false,
        //     }]
        // }});
        // console.log("ignore");
        // await client.api.applications(msg.client.user.id).commands.post({data: {
        //     name: 'ignore',
        //     description: 'Prevent XP from being gained in chosen channels.',
        //     options: [{
        //         type: 7,
        //         name: "channel",
        //         description: "The channel to either ignore/unignore",
        //         required: true,
        //     }]
        // }});
        // console.log("leaderboard");
        // await client.api.applications(msg.client.user.id).commands.post({data: {
        //     name: 'leaderboard',
        //     description: 'Displays the server leaderboard.',
        //     options: [{
        //         type: 6,
        //         name: "user",
        //         description: "The user to focus on",
        //         required: false,
        //     }, {
        //         type: 8,
        //         name: "role",
        //         description: "The role to filter",
        //         required: false,
        //     }]
        // }});
        // console.log("level");
        // await client.api.applications(msg.client.user.id).commands.post({data: {
        //     name: 'level',
        //     description: 'Shows a user\'s level.',
        //     options: [{
        //         type: 6,
        //         name: "user",
        //         description: "Selected user",
        //         required: false,
        //     }]
        // }});
        // console.log("levelsenabled");
        // await client.api.applications(msg.client.user.id).commands.post({data: {
        //     name: 'levelsenabled',
        //     description: 'Changes whether the level system is enabled.',
        //     options: [{
        //         type: 5,
        //         name: "boolean",
        //         description: "True to enable levelsystem, False to disable",
        //         required: true,
        //     }]
        // }});
        // console.log("levelupchannel");
        // await client.api.applications(msg.client.user.id).commands.post({data: {
        //     name: 'levelupchannel',
        //     description: 'Change the levelup channel.',
        //     options: [{
        //         type: 7,
        //         name: "channel",
        //         description: "Selected channel",
        //         required: false,
        //     }]
        // }});
        // console.log("speak");
        // await client.api.applications(msg.client.user.id).commands.post({data: {
        //     name: 'speak',
        //     description: 'Speaks a message. Supports SSML.',
        //     options: [{
        //         type: 3,
        //         name: "message",
        //         description: "Text to speak",
        //         required: true
        //     }, {
        //         type: 7,
        //         name: "channel",
        //         description: "The voice channel to speak in. Default is the channel you are in",
        //         required: false,
        //     }, {
        //         type: 3,
        //         name: "gender",
        //         description: "The voice to use",
        //         choices: [{
        //             name: "Male",
        //             value: "MALE"
        //         }, {
        //             name: "Female",
        //             value: "FEMALE"
        //         }]
        //     }, {
        //         type: 3,
        //         name: "language_A-K",
        //         description: "The language to use, A-K. Default is English (US)",
        //         requried: false,
        //         choices: [{
        //             name: "Arabic",
        //             value: "ar-XA"
        //         }, {
        //             name: "Bengali (India)",
        //             value: "bn-IN"
        //         }, {
        //             name: "Chinese (Hong Kong)",
        //             value: "yue-HK"
        //         }, {
        //             name: "Czech (Czech Republic)",
        //             value: "cs-CZ"
        //         }, {
        //             name: "Danish (Denmark)",
        //             value: "da-DK"
        //         }, {
        //             name: "Dutch (Netherlands)",
        //             value: "nl-NL"
        //         }, {
        //             name: "English (Australia)",
        //             value: "en-AU"
        //         }, {
        //             name: "English (India)",
        //             value: "en-IN"
        //         }, {
        //             name: "English (UK)",
        //             value: "en-GB"
        //         }, {
        //             name: "English (US)",
        //             value: "en-US"
        //         }, {
        //             name: "Filipino (Philippines)",
        //             value: "fil-PH"
        //         }, {
        //             name: "Finnish (Finland)",
        //             value: "fi-FI"
        //         }, {
        //             name: "French (Canada)",
        //             value: "fr-CA"
        //         }, {
        //             name: "French (France)",
        //             value: "fr-FR"
        //         }, {
        //             name: "German (Germany)",
        //             value: "de-DE"
        //         }, {
        //             name: "Greek (Greece)",
        //             value: "el-GR"
        //         }, {
        //             name: "Gujarati (India)",
        //             value: "gu-IN"
        //         }, {
        //             name: "Hindi (India)",
        //             value: "hi-IN"
        //         }, {
        //             name: "Hungarian (Hungary)",
        //             value: "hu_HU"
        //         }, {
        //             name: "Indonesian (Indonesia)",
        //             value: "id-ID"
        //         }, {
        //             name: "Italian (Italy)",
        //             value: "it-IT"
        //         }, {
        //             name: "Japanese (Japan)",
        //             value: "ja-JP"
        //         }, {
        //             name: "Kannada (India)",
        //             value: "kn-IN"
        //         }, {
        //             name: "Korean (South Korea)",
        //             value: "ko-KR"
        //         }]
        //     }, {
        //         type: 3,
        //         name: "language_L-Z",
        //         description: "The language to use, L-Z. Default is English (US)",
        //         requried: false,
        //         choices: [{
        //             name: "Malayalam (India)",
        //             value: "ml-IN"
        //         }, {
        //             name: "Mandarin Chinese",
        //             value: "cmn-CN"
        //         }, {
        //             name: "Norwegian (Norway)",
        //             value: "nb-NO"
        //         }, {
        //             name: "Polish (Poland)",
        //             value: "pl-PL"
        //         }, {
        //             name: "Portuguese (Brazil)",
        //             value: "pt-BR"
        //         }, {
        //             name: "Portuguese (Portugal)",
        //             value: "pt-PT"
        //         }, {
        //             name: "Romanian (Romania)",
        //             value: "ro-RO"
        //         }, {
        //             name: "Russian (Russia)",
        //             value: "ru-RU"
        //         }, {
        //             name: "Slovak (Slovakia)",
        //             value: "sk-SK"
        //         }, {
        //             name: "Spanish (Spain)",
        //             value: "es-ES"
        //         }, {
        //             name: "Swedish (Sweden)",
        //             value: "sv-SE"
        //         }, {
        //             name: "Tamil (India)",
        //             value: "ta-IN"
        //         }, {
        //             name: "Telugu (India)",
        //             value: "te-IN"
        //         }, {
        //             name: "Thai (Thailand)",
        //             value: "th-TH"
        //         }, {
        //             name: "Turkish (Turkey)",
        //             value: "tr-TR"
        //         }, {
        //             name: "Ukrainian (Ukraine)",
        //             value: "uk-UA"
        //         }, {
        //             name: "Vietnamese (Vietnam)",
        //             value: "vi-VN"
        //         }]
        //     }]
        // }});
        // console.log("levelupmessage");
        // await client.api.applications(msg.client.user.id).commands.post({data: {
        //     name: 'levelupmessage',
        //     description: 'Changes the message displayed on levelup.',
        //     options: [{
        //         type: 3,
        //         name: "title",
        //         description: "The title of the message. Use \"none\" to clear the title",
        //         required: false,
        //     }, {
        //         type: 3,
        //         name: "description",
        //         description: "The description of the message. Use \"none\" to clear the description",
        //         requried: false,
        //     }, {
        //         type: 5,
        //         name: "image",
        //         description: "Whether or not to display an image on levelup",
        //         requried: false,
        //     }]
        // }});  
        // console.log("roles");
        // await client.api.applications(msg.client.user.id).commands.post({data: {
        //     name: 'roles',
        //     description: 'Change which roles are given at what levels.',
        //     options: [{
        //         type: 1,
        //         name: "add",
        //         description: "Add a role to be gained at a level",
        //         options: [{
        //             type: 8,
        //             name: "role",
        //             description: "The role to add",
        //             required: true
        //         }, {
        //             type: 4,
        //             name: "level",
        //             description: "Leve the role is gained at",
        //             required: true
        //         }]
        //     }, {
        //         type: 1,
        //         name: "remove",
        //         description: "Remove a role from being added by levelups",
        //         options: [{
        //             type: 8,
        //             name: "role",
        //             description: "The role to be removed from levelups",
        //             required: true,
        //         }]
        //     }, {
        //         type: 1,
        //         name: "options",
        //         description: "Options for levelup roles",
        //         options: [{
        //             type: 5,
        //             name: "cumulative",
        //             description: "Whether or not old roles are removed upon gaining new role",
        //             required: true,
        //         }]
        //     }, {
        //         type: 1,
        //         name: "view",
        //         description: "See all roles and the levels they are gained at"
        //     }, {
        //         type: 1,
        //         name: "reload",
        //         description: "Reloads roles for all members based on their level"
        //     }]
        // }}); 
        // console.log("setlevel");
        // await client.api.applications(msg.client.user.id).commands.post({data: {
        //     name: "setlevel",
        //     description: "Set a members level",
        //     options: [{
        //         type: 6,
        //         name: "member",
        //         description: "Member to update",
        //         required: true
        //     }, {
        //         type: 4,
        //         name: "level",
        //         description: "New level",
        //         required: true,
        //     }, {
        //         type: 4,
        //         name: "xp",
        //         description: "XP to add",
        //         requried: false
        //     }]
        // }});
        // console.log("nickname");
        // await client.api.applications(msg.client.user.id).commands.post({data: {
        //     name: "nickname",
        //     description: "Change a members nickname",
        //     options: [{
        //         type: 6,
        //         name: "member",
        //         description: "Member to change nickname of",
        //         required: true,
        //     }, {
        //         type: 3,
        //         name: "nickname",
        //         description: "New nickname",
        //         required: true,
        //     }]
        // }});
        //#endregion

        //#region Direct Discord API file upload
        // const filePath = `./imageData/generated/level.png`;
        // const form = new FormData();
        // const stats = fs.statSync(filePath);
        // const fileSizeInBytes = stats.size;
        // const fileStream = fs.createReadStream(filePath);
        // form.append('file', fileStream, { knownLength: fileSizeInBytes });

        // const options = {
        //     method: 'POST',
        //     body: form,
        //     headers: {
        //         'Authorization': `Bot ${client.token}`,
        //     }
        // }

        // const res = await fetch(`https://discord.com/api/channels/${msg.channel.id}/messages`, { ...options });
        // console.log(await res.json());
        //#endregion
        
        //#region Guild DB update
            guildDBOLD = [
                {
                    "guild_id": "639874642001002498",
                    "prefix": "gamer",
                    "allowbots": true,
                    "levelSystem": {
                        "enabled": false,
                        "disallowed_channels": [],
                        "levelup_message": {
                            "color": 2215713,
                            "title": "test title multiple words"
                        },
                        "newrole_message": {
                            "color": 2215713,
                            "description": "Congratulations {username}, you reached level {level} and gained the role {role}!"
                        },
                        "levelup_image": true,
                        "cooldown_timestamps": {
                            "335439500270632972": 1614173125953,
                            "276675912693710849": 1614174957886,
                            "235088799074484224": 1614179961004,
                            "613048551584301169": 1614295352653,
                            "671681661296967680": 1614295354200
                        },
                        "roles": {
                            "900": "753167867020574742",
                            "-1": "811346830322302986"
                        }
                    },
                    "name": "S2M",
                    "meta": {
                        "revision": 6110,
                        "created": 1612035790289,
                        "version": 0,
                        "updated": 1620237145355
                    },
                    "$loki": 1
                },
                {
                    "guild_id": "646363298371076118",
                    "prefix": "..",
                    "allowbots": false,
                    "levelSystem": {
                        "enabled": false,
                        "disallowed_channels": [],
                        "levelup_message": {
                            "color": 2215713,
                            "title": "Congratulations {username}, you reached level {level}!",
                            "description": ""
                        },
                        "newrole_message": {
                            "color": 2215713,
                            "description": "Congratulations {username}, you reached level {level} and gained the role {role}!"
                        },
                        "levelup_image": true,
                        "cooldown_timestamps": {},
                        "roles": {}
                    },
                    "name": "Darkside",
                    "meta": {
                        "revision": 153,
                        "created": 1612385927310,
                        "version": 0,
                        "updated": 1612386302656
                    },
                    "$loki": 2
                },
                {
                    "guild_id": "404637739590615040",
                    "prefix": "..",
                    "allowbots": false,
                    "levelSystem": {
                        "enabled": false,
                        "disallowed_channels": [],
                        "levelup_message": {
                            "color": 2215713,
                            "title": "Congratulations {username}, you reached level {level}!",
                            "description": ""
                        },
                        "newrole_message": {
                            "color": 2215713,
                            "description": "Congratulations {username}, you reached level {level} and gained the role {role}!"
                        },
                        "levelup_image": true,
                        "cooldown_timestamps": {},
                        "roles": {}
                    },
                    "name": "Familien Dunham",
                    "meta": {
                        "revision": 452,
                        "created": 1613750536302,
                        "version": 0,
                        "updated": 1622584243987
                    },
                    "$loki": 3
                },
                {
                    "guild_id": "666937895424098304",
                    "prefix": "neko",
                    "allowbots": false,
                    "levelSystem": {
                        "enabled": false,
                        "disallowed_channels": [],
                        "levelup_message": {
                            "color": 2215713,
                            "title": "Congratulations {username}, you reached level {level}!",
                            "description": ""
                        },
                        "newrole_message": {
                            "color": 2215713,
                            "description": "Congratulations {username}, you reached level {level} and gained the role {role}!"
                        },
                        "levelup_image": true,
                        "cooldown_timestamps": {},
                        "roles": {},
                        "update_channel": "669143519381684226"
                    },
                    "name": "Pokécord og irrelevante ting",
                    "meta": {
                        "revision": 670,
                        "created": 1613849829549,
                        "version": 0,
                        "updated": 1622587291536
                    },
                    "$loki": 4
                },
                {
                    "guild_id": "783274740240220190",
                    "prefix": ".",
                    "allowbots": false,
                    "levelSystem": {
                        "enabled": false,
                        "disallowed_channels": [],
                        "levelup_message": {
                            "color": 2215713,
                            "title": "Congratulations {username}, you reached level {level}!",
                            "description": ""
                        },
                        "newrole_message": {
                            "color": 2215713,
                            "description": "Congratulations {username}, you reached level {level} and gained the role {role}!"
                        },
                        "levelup_image": true,
                        "cooldown_timestamps": {},
                        "roles": {}
                    },
                    "name": "Bored in school",
                    "meta": {
                        "revision": 12,
                        "created": 1614119653474,
                        "version": 0,
                        "updated": 1614120684153
                    },
                    "$loki": 5
                },
                {
                    "guild_id": "702789285312462858",
                    "prefix": "gamer",
                    "allowbots": false,
                    "levelSystem": {
                        "enabled": false,
                        "disallowed_channels": [],
                        "levelup_message": {
                            "color": 2215713,
                            "title": "Congratulations {username}, you reached level {level}!",
                            "description": ""
                        },
                        "newrole_message": {
                            "color": 2215713,
                            "description": "Congratulations {username}, you reached level {level} and gained the role {role}!"
                        },
                        "levelup_image": true,
                        "cooldown_timestamps": {},
                        "roles": {}
                    },
                    "name": "Mattias og Nicklas' database",
                    "meta": {
                        "revision": 172,
                        "created": 1615905531887,
                        "version": 0,
                        "updated": 1622578851252
                    },
                    "$loki": 6
                },
                {
                    "guild_id": "776187795013894164",
                    "prefix": ".",
                    "allowbots": false,
                    "levelSystem": {
                        "enabled": false,
                        "disallowed_channels": [],
                        "levelup_message": {
                            "color": 2215713,
                            "title": "Congratulations {username}, you reached level {level}!",
                            "description": ""
                        },
                        "newrole_message": {
                            "color": 2215713,
                            "description": "Congratulations {username}, you reached level {level} and gained the role {role}!"
                        },
                        "levelup_image": true,
                        "cooldown_timestamps": {},
                        "roles": {}
                    },
                    "name": "Sukkertoppens Officielle Elev Discord",
                    "meta": {
                        "revision": 4,
                        "created": 1615910597571,
                        "version": 0,
                        "updated": 1615910755583
                    },
                    "$loki": 7
                }
            ],
            guildUserDBOLD = [{
                "name": "639874642001002498",
                "data": [
                    {
                        "user_id": "298842558610800650",
                        "xp": 28501,
                        "level": 25,
                        "levelroles": [
                            "674208972579930121",
                            "674208972579930121",
                            "717354234613596220",
                            "674208972579930121",
                            "717354234613596220"
                        ],
                        "roles": [
                            "774210058812784661",
                            "644534405431296029",
                            "686920130684518453",
                            "746320748393660446",
                            "779292061392044032",
                            "704431226785628211",
                            "715535160971493376",
                            "717358003279364146",
                            "725765421529038848",
                            "801783046553862144",
                            "639874715371962368",
                            "742313268382662656",
                            "752490937917374474",
                            "801342389750857741",
                            "645321827316400203",
                            "706265390023573584",
                            "700298971947597924",
                            "746268127779618836",
                            "639874642001002498"
                        ],
                        "inGuild": true,
                        "meta": {
                            "revision": 1515,
                            "created": 1612036787300,
                            "version": 0,
                            "updated": 1620237145099
                        },
                        "$loki": 1
                    },
                    {
                        "user_id": "166530197791703040",
                        "xp": 140,
                        "level": 1,
                        "levelroles": [],
                        "roles": [
                            "774210058812784661",
                            "644534405431296029",
                            "717355768721965108",
                            "779292061392044032",
                            "704431226785628211",
                            "725765421529038848",
                            "801783046553862144",
                            "752490937917374474",
                            "801342389750857741",
                            "645321827316400203",
                            "700298971947597924",
                            "746268127779618836",
                            "674208972579930121",
                            "639874642001002498"
                        ],
                        "inGuild": true,
                        "meta": {
                            "revision": 102,
                            "created": 1612036857857,
                            "version": 0,
                            "updated": 1615899452019
                        },
                        "$loki": 2
                    },
                    {
                        "user_id": "239449027966402570",
                        "xp": 65,
                        "level": 0,
                        "levelroles": [],
                        "roles": [
                            "722712068272422922",
                            "644534405431296029",
                            "647163393001652264",
                            "746320748393660446",
                            "717350992810737706",
                            "704431226785628211",
                            "717358003279364146",
                            "725765421529038848",
                            "639874715371962368",
                            "709133787056963604",
                            "742313268382662656",
                            "645321827316400203",
                            "639874642001002498"
                        ],
                        "inGuild": true,
                        "meta": {
                            "revision": 86,
                            "created": 1612036875194,
                            "version": 0,
                            "updated": 1615907200266
                        },
                        "$loki": 3
                    },
                    {
                        "user_id": "805058574401273916",
                        "xp": 1676500,
                        "level": 100,
                        "levelroles": [
                            "674208972579930121"
                        ],
                        "roles": [
                            "671093529178669087",
                            "674208972579930121",
                            "639874642001002498"
                        ],
                        "inGuild": false,
                        "meta": {
                            "revision": 656,
                            "created": 1612036921781,
                            "version": 0,
                            "updated": 1620237145587
                        },
                        "$loki": 4
                    },
                    {
                        "user_id": "671681661296967680",
                        "xp": "-999922",
                        "level": 0,
                        "levelroles": [],
                        "roles": [
                            "671093529178669087",
                            "639874642001002498"
                        ],
                        "inGuild": true,
                        "meta": {
                            "revision": 62,
                            "created": 1612036933006,
                            "version": 0,
                            "updated": 1615918718957
                        },
                        "$loki": 5
                    },
                    {
                        "user_id": "200309790562451467",
                        "xp": 350,
                        "level": 3,
                        "levelroles": [],
                        "roles": [
                            "774210058812784661",
                            "644534405431296029",
                            "717355768721965108",
                            "686920130684518453",
                            "746320748393660446",
                            "789573741708443670",
                            "779292061392044032",
                            "715535160971493376",
                            "717358003279364146",
                            "725765421529038848",
                            "801783046553862144",
                            "639874715371962368",
                            "709133787056963604",
                            "752490937917374474",
                            "801342389750857741",
                            "645321827316400203",
                            "706265390023573584",
                            "700298971947597924",
                            "640189266118574108",
                            "746268127779618836",
                            "639874642001002498"
                        ],
                        "inGuild": true,
                        "meta": {
                            "revision": 320,
                            "created": 1612038582594,
                            "version": 0,
                            "updated": 1615918702144
                        },
                        "$loki": 6
                    },
                    {
                        "user_id": "364453004637634560",
                        "xp": 387,
                        "level": 3,
                        "levelroles": [],
                        "roles": [
                            "671093529178669087",
                            "799181305505775636",
                            "639874642001002498"
                        ],
                        "inGuild": true,
                        "meta": {
                            "revision": 93,
                            "created": 1612379879253,
                            "version": 0,
                            "updated": 1615918702417
                        },
                        "$loki": 7
                    },
                    {
                        "user_id": "276675912693710849",
                        "xp": 212,
                        "level": 2,
                        "levelroles": [],
                        "roles": [
                            "644534405431296029",
                            "717355768721965108",
                            "746320748393660446",
                            "687203386361118720",
                            "779292061392044032",
                            "715535160971493376",
                            "717358003279364146",
                            "725765421529038848",
                            "801783046553862144",
                            "639874715371962368",
                            "801342389750857741",
                            "645321827316400203",
                            "639874642001002498"
                        ],
                        "inGuild": true,
                        "meta": {
                            "revision": 122,
                            "created": 1612379929560,
                            "version": 0,
                            "updated": 1620237140235
                        },
                        "$loki": 8
                    },
                    {
                        "user_id": "235088799074484224",
                        "xp": 39,
                        "level": 0,
                        "levelroles": [],
                        "roles": [
                            "671093529178669087",
                            "639874642001002498"
                        ],
                        "inGuild": true,
                        "meta": {
                            "revision": 31,
                            "created": 1612382283144,
                            "version": 0,
                            "updated": 1615895283138
                        },
                        "$loki": 9
                    },
                    {
                        "user_id": "510789298321096704",
                        "xp": 0,
                        "level": 0,
                        "levelroles": [],
                        "roles": [
                            "671093529178669087",
                            "639874642001002498"
                        ],
                        "inGuild": true,
                        "meta": {
                            "revision": 10,
                            "created": 1612382306964,
                            "version": 0,
                            "updated": 1615895283138
                        },
                        "$loki": 10
                    },
                    {
                        "user_id": "458207669778382849",
                        "xp": 0,
                        "level": 0,
                        "levelroles": [],
                        "roles": [
                            "644534405431296029",
                            "717358003279364146",
                            "797012567385833482",
                            "746268127779618836",
                            "639874642001002498"
                        ],
                        "inGuild": true,
                        "meta": {
                            "revision": 5,
                            "created": 1613503797106,
                            "version": 0,
                            "updated": 1615895283138
                        },
                        "$loki": 11
                    },
                    {
                        "user_id": "335439500270632972",
                        "xp": 25,
                        "level": 0,
                        "levelroles": [],
                        "roles": [
                            "722712068272422922",
                            "644534405431296029",
                            "686920130684518453",
                            "746320748393660446",
                            "715535160971493376",
                            "717358003279364146",
                            "725765421529038848",
                            "639874715371962368",
                            "742313268382662656",
                            "645321827316400203",
                            "721668855340204123",
                            "746268127779618836",
                            "639874642001002498"
                        ],
                        "inGuild": true,
                        "meta": {
                            "revision": 63,
                            "created": 1613504835026,
                            "version": 0,
                            "updated": 1615898988874
                        },
                        "$loki": 12
                    },
                    {
                        "user_id": "289433724393881600",
                        "xp": 98,
                        "level": 0,
                        "levelroles": [],
                        "roles": [
                            "644534405431296029",
                            "686920130684518453",
                            "779292061392044032",
                            "717358003279364146",
                            "719128068962123796",
                            "639874715371962368",
                            "801342389750857741",
                            "721668855340204123",
                            "746268127779618836",
                            "639874642001002498"
                        ],
                        "inGuild": true,
                        "meta": {
                            "revision": 50,
                            "created": 1613763427823,
                            "version": 0,
                            "updated": 1615901475503
                        },
                        "$loki": 13
                    },
                    {
                        "user_id": "613048551584301169",
                        "xp": 113,
                        "level": 1,
                        "levelroles": [],
                        "roles": [
                            "722712068272422922",
                            "644534405431296029",
                            "788679599302115358",
                            "760566845463461930",
                            "717355768721965108",
                            "686920130684518453",
                            "746320748393660446",
                            "779292061392044032",
                            "715535160971493376",
                            "725765421529038848",
                            "801783046553862144",
                            "717354234613596220",
                            "719128068962123796",
                            "639874715371962368",
                            "709133787056963604",
                            "752490937917374474",
                            "801342389750857741",
                            "645321827316400203",
                            "814491569860116501",
                            "706265390023573584",
                            "700298971947597924",
                            "640189266118574108",
                            "639874642001002498"
                        ],
                        "inGuild": true,
                        "meta": {
                            "revision": 68,
                            "created": 1613826666648,
                            "version": 0,
                            "updated": 1615899824995
                        },
                        "$loki": 14
                    },
                    {
                        "user_id": "248009714699337728",
                        "xp": 72,
                        "level": 0,
                        "levelroles": [],
                        "roles": [
                            "644534405431296029",
                            "788679599302115358",
                            "742315863608131635",
                            "687203386361118720",
                            "789573741708443670",
                            "717350992810737706",
                            "779292061392044032",
                            "704431226785628211",
                            "717358003279364146",
                            "725765421529038848",
                            "801783046553862144",
                            "709133787056963604",
                            "645321827316400203",
                            "700298971947597924",
                            "639874642001002498"
                        ],
                        "inGuild": true,
                        "meta": {
                            "revision": 28,
                            "created": 1613827845716,
                            "version": 0,
                            "updated": 1615895283138
                        },
                        "$loki": 15
                    },
                    {
                        "user_id": "268400056242143232",
                        "xp": 149,
                        "level": 1,
                        "levelroles": [],
                        "roles": [
                            "722712068272422922",
                            "644534405431296029",
                            "686920130684518453",
                            "746268018333450322",
                            "746320748393660446",
                            "717451704819384321",
                            "817117208802885662",
                            "779292061392044032",
                            "704431226785628211",
                            "717358003279364146",
                            "725765421529038848",
                            "639874715371962368",
                            "709133787056963604",
                            "717452252100558929",
                            "742313268382662656",
                            "801342389750857741",
                            "645321827316400203",
                            "814491569860116501",
                            "721668855340204123",
                            "706265390023573584",
                            "700298971947597924",
                            "639874642001002498"
                        ],
                        "inGuild": true,
                        "meta": {
                            "revision": 86,
                            "created": 1613998377092,
                            "version": 0,
                            "updated": 1615899868117
                        },
                        "$loki": 16
                    },
                    {
                        "user_id": "188914557526343680",
                        "xp": 0,
                        "level": 0,
                        "levelroles": [],
                        "roles": [
                            "644534405431296029",
                            "717355768721965108",
                            "797001351188054016",
                            "796825735167868968",
                            "796825309592420363",
                            "715535160971493376",
                            "797005948992225300",
                            "639874715371962368",
                            "797012567385833482",
                            "709133787056963604",
                            "796823418036813855",
                            "796828064587317268",
                            "645321827316400203",
                            "796824071013662732",
                            "674208972579930121",
                            "639874642001002498"
                        ],
                        "inGuild": true,
                        "meta": {
                            "revision": 25,
                            "created": 1613998550640,
                            "version": 0,
                            "updated": 1615899415226
                        },
                        "$loki": 17
                    },
                    {
                        "user_id": "206524917347254273",
                        "xp": 0,
                        "level": 0,
                        "levelroles": [],
                        "roles": [
                            "644534405431296029",
                            "717358003279364146",
                            "742313268382662656",
                            "801342389750857741",
                            "639874642001002498"
                        ],
                        "inGuild": true,
                        "meta": {
                            "revision": 17,
                            "created": 1613999047120,
                            "version": 0,
                            "updated": 1615895283138
                        },
                        "$loki": 18
                    },
                    {
                        "user_id": "150970968163090432",
                        "xp": 207,
                        "level": 1,
                        "levelroles": [],
                        "roles": [
                            "722712068272422922",
                            "644534405431296029",
                            "717355768721965108",
                            "746320748393660446",
                            "779292061392044032",
                            "704431226785628211",
                            "725765421529038848",
                            "686920213681406053",
                            "639874715371962368",
                            "709133787056963604",
                            "752490937917374474",
                            "645321827316400203",
                            "706265390023573584",
                            "640189266118574108",
                            "674208972579930121",
                            "639874642001002498"
                        ],
                        "inGuild": true,
                        "meta": {
                            "revision": 41,
                            "created": 1613999072790,
                            "version": 0,
                            "updated": 1615900797884
                        },
                        "$loki": 19
                    },
                    {
                        "user_id": "296315765362262016",
                        "xp": 0,
                        "level": 0,
                        "levelroles": [],
                        "roles": [
                            "644534405431296029",
                            "686920130684518453",
                            "746320748393660446",
                            "717350992810737706",
                            "779292061392044032",
                            "717358003279364146",
                            "725765421529038848",
                            "742313268382662656",
                            "819193437449355265",
                            "645321827316400203",
                            "639874642001002498"
                        ],
                        "inGuild": true,
                        "meta": {
                            "revision": 19,
                            "created": 1614000744374,
                            "version": 0,
                            "updated": 1615908964309
                        },
                        "$loki": 20
                    },
                    {
                        "user_id": "687593549684015126",
                        "xp": 0,
                        "level": 0,
                        "levelroles": [],
                        "roles": [
                            "689388114015551531",
                            "639874642001002498"
                        ],
                        "inGuild": true,
                        "meta": {
                            "revision": 9,
                            "created": 1614593012854,
                            "version": 0,
                            "updated": 1615895283138
                        },
                        "$loki": 21
                    },
                    {
                        "user_id": "752498159648768041",
                        "xp": 0,
                        "level": 0,
                        "levelroles": [],
                        "roles": [
                            "644534405431296029",
                            "717354234613596220",
                            "742313268382662656",
                            "801342389750857741",
                            "639874642001002498"
                        ],
                        "inGuild": true,
                        "meta": {
                            "revision": 6,
                            "created": 1615895093673,
                            "version": 0,
                            "updated": 1615895283138
                        },
                        "$loki": 22
                    },
                    {
                        "user_id": "689061787458338832",
                        "xp": 0,
                        "level": 0,
                        "levelroles": [],
                        "roles": [
                            "689388114015551531",
                            "639874642001002498"
                        ],
                        "inGuild": true,
                        "meta": {
                            "revision": 10,
                            "created": 1615895093674,
                            "version": 0,
                            "updated": 1615900742540
                        },
                        "$loki": 23
                    },
                    {
                        "user_id": "591509523785842695",
                        "xp": 0,
                        "level": 0,
                        "levelroles": [],
                        "roles": [
                            "644534405431296029",
                            "717354234613596220",
                            "742313268382662656",
                            "801342389750857741",
                            "639874642001002498"
                        ],
                        "inGuild": true,
                        "meta": {
                            "revision": 6,
                            "created": 1615895093674,
                            "version": 0,
                            "updated": 1615895283138
                        },
                        "$loki": 24
                    },
                    {
                        "user_id": "428604676313972755",
                        "xp": 0,
                        "level": 0,
                        "levelroles": [],
                        "roles": [
                            "644534405431296029",
                            "746320748393660446",
                            "717354234613596220",
                            "742313268382662656",
                            "639874642001002498"
                        ],
                        "inGuild": true,
                        "meta": {
                            "revision": 6,
                            "created": 1615895093674,
                            "version": 0,
                            "updated": 1615895283138
                        },
                        "$loki": 25
                    },
                    {
                        "user_id": "414134448607723520",
                        "xp": 0,
                        "level": 0,
                        "levelroles": [],
                        "roles": [
                            "644534405431296029",
                            "717350992810737706",
                            "779292061392044032",
                            "717354234613596220",
                            "719128068962123796",
                            "742313268382662656",
                            "639874642001002498"
                        ],
                        "inGuild": true,
                        "meta": {
                            "revision": 9,
                            "created": 1615895093674,
                            "version": 0,
                            "updated": 1615898537809
                        },
                        "$loki": 26
                    },
                    {
                        "user_id": "269954131370704898",
                        "xp": 0,
                        "level": 0,
                        "levelroles": [],
                        "roles": [
                            "644534405431296029",
                            "686920130684518453",
                            "746320748393660446",
                            "779292061392044032",
                            "715535160971493376",
                            "717358003279364146",
                            "725765421529038848",
                            "801783046553862144",
                            "639874715371962368",
                            "742313268382662656",
                            "801342389750857741",
                            "645321827316400203",
                            "639874642001002498"
                        ],
                        "inGuild": true,
                        "meta": {
                            "revision": 6,
                            "created": 1615895093674,
                            "version": 0,
                            "updated": 1615895283138
                        },
                        "$loki": 27
                    },
                    {
                        "user_id": "225978351620194305",
                        "xp": 0,
                        "level": 0,
                        "levelroles": [],
                        "roles": [
                            "644534405431296029",
                            "742313268382662656",
                            "674208972579930121",
                            "639874642001002498"
                        ],
                        "inGuild": true,
                        "meta": {
                            "revision": 6,
                            "created": 1615895093675,
                            "version": 0,
                            "updated": 1615895283138
                        },
                        "$loki": 28
                    },
                    {
                        "user_id": "189037729080803328",
                        "xp": 0,
                        "level": 0,
                        "levelroles": [],
                        "roles": [
                            "644534405431296029",
                            "686920130684518453",
                            "647163393001652264",
                            "717350992810737706",
                            "779292061392044032",
                            "725765421529038848",
                            "742313268382662656",
                            "801342389750857741",
                            "645321827316400203",
                            "700298971947597924",
                            "674208972579930121",
                            "639874642001002498"
                        ],
                        "inGuild": true,
                        "meta": {
                            "revision": 6,
                            "created": 1615895093675,
                            "version": 0,
                            "updated": 1615895283138
                        },
                        "$loki": 29
                    },
                    {
                        "user_id": "571401816466522121",
                        "xp": 0,
                        "level": 0,
                        "levelroles": [],
                        "roles": [
                            "644534405431296029",
                            "779292061392044032",
                            "717354234613596220",
                            "639874642001002498"
                        ],
                        "inGuild": true,
                        "meta": {
                            "revision": 4,
                            "created": 1615895227445,
                            "version": 0,
                            "updated": 1615895283138
                        },
                        "$loki": 30
                    },
                    {
                        "user_id": "186199858594578432",
                        "xp": 0,
                        "level": 0,
                        "levelroles": [],
                        "roles": [],
                        "inGuild": true,
                        "meta": {
                            "revision": 3,
                            "created": 1615895415639,
                            "version": 0,
                            "updated": 1615895481728
                        },
                        "$loki": 31
                    },
                    {
                        "user_id": "716364284719923202",
                        "xp": 0,
                        "level": 0,
                        "levelroles": [],
                        "roles": [],
                        "inGuild": true,
                        "meta": {
                            "revision": 6,
                            "created": 1615900339148,
                            "version": 0,
                            "updated": 1615918072143
                        },
                        "$loki": 32
                    }
                ],
                "idIndex": null,
                "binaryIndices": {},
                "constraints": null,
                "uniqueNames": [
                    "user_id"
                ],
                "transforms": {},
                "objType": "639874642001002498",
                "dirty": false,
                "cachedIndex": null,
                "cachedBinaryIndex": null,
                "cachedData": null,
                "adaptiveBinaryIndices": true,
                "transactional": false,
                "cloneObjects": false,
                "cloneMethod": "parse-stringify",
                "asyncListeners": false,
                "disableMeta": false,
                "disableChangesApi": true,
                "disableDeltaChangesApi": true,
                "autoupdate": true,
                "serializableIndices": true,
                "disableFreeze": true,
                "ttl": null,
                "maxId": 32,
                "DynamicViews": [],
                "events": {
                    "insert": [],
                    "update": [],
                    "pre-insert": [],
                    "pre-update": [],
                    "close": [],
                    "flushbuffer": [],
                    "error": [],
                    "delete": [
                        null
                    ],
                    "warning": [
                        null
                    ]
                },
                "changes": [],
                "dirtyIds": []
            },
            {
                "data": [
                    {
                        "user_id": "298842558610800650",
                        "xp": 127,
                        "level": 0,
                        "levelroles": [],
                        "roles": [],
                        "inGuild": true,
                        "meta": {
                            "revision": 21,
                            "created": 1612035790291,
                            "version": 0,
                            "updated": 1612036746900
                        },
                        "$loki": 1
                    },
                    {
                        "user_id": "805058574401273916",
                        "xp": 21,
                        "level": 0,
                        "levelroles": [],
                        "roles": [],
                        "inGuild": true,
                        "meta": {
                            "revision": 3,
                            "created": 1612035987111,
                            "version": 0,
                            "updated": 1612035994895
                        },
                        "$loki": 2
                    },
                    {
                        "user_id": "166530197791703040",
                        "xp": 23,
                        "level": 0,
                        "levelroles": [],
                        "roles": [],
                        "inGuild": true,
                        "meta": {
                            "revision": 1,
                            "created": 1612036775335,
                            "version": 0,
                            "updated": 1612036775335
                        },
                        "$loki": 3
                    }
                ],
                "idIndex": null,
                "binaryIndices": {},
                "constraints": null,
                "uniqueNames": [
                    "user_id"
                ],
                "transforms": {},
                "dirty": false,
                "cachedIndex": null,
                "cachedBinaryIndex": null,
                "cachedData": null,
                "adaptiveBinaryIndices": true,
                "transactional": false,
                "cloneObjects": false,
                "cloneMethod": "parse-stringify",
                "asyncListeners": false,
                "disableMeta": false,
                "disableChangesApi": true,
                "disableDeltaChangesApi": true,
                "autoupdate": true,
                "serializableIndices": true,
                "disableFreeze": true,
                "ttl": null,
                "maxId": 3,
                "DynamicViews": [],
                "events": {
                    "insert": [],
                    "update": [],
                    "pre-insert": [],
                    "pre-update": [],
                    "close": [],
                    "flushbuffer": [],
                    "error": [],
                    "delete": [
                        null
                    ],
                    "warning": [
                        null
                    ]
                },
                "changes": [],
                "dirtyIds": []
            },
            {
                "name": "646363298371076118",
                "data": [
                    {
                        "user_id": "805058574401273916",
                        "xp": 0,
                        "level": 0,
                        "levelroles": [],
                        "roles": [
                            "691591156135624765",
                            "661936542280843264",
                            "646363298371076118"
                        ],
                        "inGuild": true,
                        "meta": {
                            "revision": 10,
                            "created": 1612385927310,
                            "version": 0,
                            "updated": 1612385993453
                        },
                        "$loki": 1
                    },
                    {
                        "user_id": "188914557526343680",
                        "xp": 0,
                        "level": 0,
                        "levelroles": [],
                        "roles": [],
                        "inGuild": true,
                        "meta": {
                            "revision": 18,
                            "created": 1612385936237,
                            "version": 0,
                            "updated": 1612386213995
                        },
                        "$loki": 2
                    },
                    {
                        "user_id": "298842558610800650",
                        "xp": 0,
                        "level": 0,
                        "levelroles": [],
                        "roles": [],
                        "inGuild": true,
                        "meta": {
                            "revision": 24,
                            "created": 1612385938356,
                            "version": 0,
                            "updated": 1612386302422
                        },
                        "$loki": 3
                    },
                    {
                        "user_id": "276675912693710849",
                        "xp": 0,
                        "level": 0,
                        "levelroles": [],
                        "roles": [],
                        "inGuild": true,
                        "meta": {
                            "revision": 5,
                            "created": 1612385952759,
                            "version": 0,
                            "updated": 1612386135557
                        },
                        "$loki": 4
                    },
                    {
                        "user_id": "671681661296967680",
                        "xp": 0,
                        "level": 0,
                        "levelroles": [],
                        "roles": [],
                        "inGuild": true,
                        "meta": {
                            "revision": 23,
                            "created": 1612386011434,
                            "version": 0,
                            "updated": 1612386302656
                        },
                        "$loki": 5
                    },
                    {
                        "user_id": "200309790562451467",
                        "xp": 0,
                        "level": 0,
                        "levelroles": [],
                        "roles": [],
                        "inGuild": true,
                        "meta": {
                            "revision": 2,
                            "created": 1612386011524,
                            "version": 0,
                            "updated": 1612386142876
                        },
                        "$loki": 6
                    }
                ],
                "idIndex": null,
                "binaryIndices": {},
                "constraints": null,
                "uniqueNames": [
                    "user_id"
                ],
                "transforms": {},
                "objType": "646363298371076118",
                "dirty": false,
                "cachedIndex": null,
                "cachedBinaryIndex": null,
                "cachedData": null,
                "adaptiveBinaryIndices": true,
                "transactional": false,
                "cloneObjects": false,
                "cloneMethod": "parse-stringify",
                "asyncListeners": false,
                "disableMeta": false,
                "disableChangesApi": true,
                "disableDeltaChangesApi": true,
                "autoupdate": true,
                "serializableIndices": true,
                "disableFreeze": true,
                "ttl": null,
                "maxId": 6,
                "DynamicViews": [],
                "events": {
                    "insert": [],
                    "update": [],
                    "pre-insert": [],
                    "pre-update": [],
                    "close": [],
                    "flushbuffer": [],
                    "error": [],
                    "delete": [
                        null
                    ],
                    "warning": [
                        null
                    ]
                },
                "changes": [],
                "dirtyIds": []
            },
            {
                "name": "404637739590615040",
                "data": [
                    {
                        "user_id": "298842558610800650",
                        "xp": 3150,
                        "level": 10,
                        "levelroles": [],
                        "roles": [
                            "490066027473010698",
                            "516647773379231777",
                            "801179470374895626",
                            "404637739590615040"
                        ],
                        "inGuild": true,
                        "meta": {
                            "revision": 132,
                            "created": 1613750536303,
                            "version": 0,
                            "updated": 1622584243618
                        },
                        "$loki": 1
                    },
                    {
                        "user_id": "805058574401273916",
                        "xp": 0,
                        "level": 0,
                        "levelroles": [],
                        "roles": [
                            "801176862146691118",
                            "805060031615467561",
                            "404637739590615040"
                        ],
                        "inGuild": true,
                        "meta": {
                            "revision": 88,
                            "created": 1613750552072,
                            "version": 0,
                            "updated": 1613864131649
                        },
                        "$loki": 2
                    },
                    {
                        "user_id": "671681661296967680",
                        "xp": 0,
                        "level": 0,
                        "levelroles": [],
                        "roles": [],
                        "inGuild": true,
                        "meta": {
                            "revision": 14,
                            "created": 1613751424740,
                            "version": 0,
                            "updated": 1613856012410
                        },
                        "$loki": 3
                    },
                    {
                        "user_id": "287894637165936640",
                        "xp": 0,
                        "level": 0,
                        "levelroles": [],
                        "roles": [],
                        "inGuild": true,
                        "meta": {
                            "revision": 3,
                            "created": 1613751891431,
                            "version": 0,
                            "updated": 1613864049011
                        },
                        "$loki": 4
                    },
                    {
                        "user_id": "429305856241172480",
                        "xp": 0,
                        "level": 0,
                        "levelroles": [],
                        "roles": [],
                        "inGuild": true,
                        "meta": {
                            "revision": 7,
                            "created": 1621416612757,
                            "version": 0,
                            "updated": 1622584243987
                        },
                        "$loki": 5
                    }
                ],
                "idIndex": null,
                "binaryIndices": {},
                "constraints": null,
                "uniqueNames": [
                    "user_id"
                ],
                "transforms": {},
                "objType": "404637739590615040",
                "dirty": false,
                "cachedIndex": null,
                "cachedBinaryIndex": null,
                "cachedData": null,
                "adaptiveBinaryIndices": true,
                "transactional": false,
                "cloneObjects": false,
                "cloneMethod": "parse-stringify",
                "asyncListeners": false,
                "disableMeta": false,
                "disableChangesApi": true,
                "disableDeltaChangesApi": true,
                "autoupdate": true,
                "serializableIndices": true,
                "disableFreeze": true,
                "ttl": null,
                "maxId": 5,
                "DynamicViews": [],
                "events": {
                    "insert": [],
                    "update": [],
                    "pre-insert": [],
                    "pre-update": [],
                    "close": [],
                    "flushbuffer": [],
                    "error": [],
                    "delete": [
                        null
                    ],
                    "warning": [
                        null
                    ]
                },
                "changes": [],
                "dirtyIds": []
            },
            {
                "name": "666937895424098304",
                "data": [
                    {
                        "user_id": "805058574401273916",
                        "xp": 0,
                        "level": 0,
                        "levelroles": [],
                        "roles": [
                            "812772915187023933",
                            "666937895424098304"
                        ],
                        "inGuild": true,
                        "meta": {
                            "revision": 77,
                            "created": 1613849829550,
                            "version": 0,
                            "updated": 1622586863489
                        },
                        "$loki": 1
                    },
                    {
                        "user_id": "298842558610800650",
                        "xp": 18,
                        "level": 0,
                        "levelroles": [],
                        "roles": [],
                        "inGuild": true,
                        "meta": {
                            "revision": 239,
                            "created": 1613849845434,
                            "version": 0,
                            "updated": 1622587291536
                        },
                        "$loki": 2
                    },
                    {
                        "user_id": "437802197539880970",
                        "xp": 0,
                        "level": 0,
                        "levelroles": [],
                        "roles": [],
                        "inGuild": false,
                        "meta": {
                            "revision": 10,
                            "created": 1615904136711,
                            "version": 0,
                            "updated": 1620242275331
                        },
                        "$loki": 3
                    },
                    {
                        "user_id": "339926969548275722",
                        "xp": 0,
                        "level": 0,
                        "levelroles": [],
                        "roles": [],
                        "inGuild": false,
                        "meta": {
                            "revision": 10,
                            "created": 1615904139451,
                            "version": 0,
                            "updated": 1620242275331
                        },
                        "$loki": 4
                    },
                    {
                        "user_id": "270904126974590976",
                        "xp": 0,
                        "level": 0,
                        "levelroles": [],
                        "roles": [],
                        "inGuild": false,
                        "meta": {
                            "revision": 10,
                            "created": 1615904141593,
                            "version": 0,
                            "updated": 1620242275331
                        },
                        "$loki": 5
                    },
                    {
                        "user_id": "170915625722576896",
                        "xp": 0,
                        "level": 0,
                        "levelroles": [],
                        "roles": [],
                        "inGuild": false,
                        "meta": {
                            "revision": 10,
                            "created": 1615904143891,
                            "version": 0,
                            "updated": 1620242275331
                        },
                        "$loki": 6
                    },
                    {
                        "user_id": "395385545326592010",
                        "xp": 0,
                        "level": 0,
                        "levelroles": [],
                        "roles": [],
                        "inGuild": false,
                        "meta": {
                            "revision": 10,
                            "created": 1615904145752,
                            "version": 0,
                            "updated": 1620242275331
                        },
                        "$loki": 7
                    },
                    {
                        "user_id": "276675912693710849",
                        "xp": 0,
                        "level": 0,
                        "levelroles": [],
                        "roles": [],
                        "inGuild": true,
                        "meta": {
                            "revision": 30,
                            "created": 1615904147341,
                            "version": 0,
                            "updated": 1622581338228
                        },
                        "$loki": 8
                    },
                    {
                        "user_id": "606268348380086370",
                        "xp": 0,
                        "level": 0,
                        "levelroles": [],
                        "roles": [],
                        "inGuild": false,
                        "meta": {
                            "revision": 10,
                            "created": 1615904149700,
                            "version": 0,
                            "updated": 1620242275332
                        },
                        "$loki": 9
                    },
                    {
                        "user_id": "116275390695079945",
                        "xp": 0,
                        "level": 0,
                        "levelroles": [],
                        "roles": [],
                        "inGuild": false,
                        "meta": {
                            "revision": 10,
                            "created": 1615904151887,
                            "version": 0,
                            "updated": 1620242275332
                        },
                        "$loki": 10
                    },
                    {
                        "user_id": "509118347057561600",
                        "xp": 0,
                        "level": 0,
                        "levelroles": [],
                        "roles": [],
                        "inGuild": false,
                        "meta": {
                            "revision": 2,
                            "created": 1615904154356,
                            "version": 0,
                            "updated": 1615904154356
                        },
                        "$loki": 11
                    },
                    {
                        "user_id": "365975655608745985",
                        "xp": 0,
                        "level": 0,
                        "levelroles": [],
                        "roles": [],
                        "inGuild": false,
                        "meta": {
                            "revision": 2,
                            "created": 1615904157452,
                            "version": 0,
                            "updated": 1615904157453
                        },
                        "$loki": 12
                    },
                    {
                        "user_id": "472141928578940958",
                        "xp": 0,
                        "level": 0,
                        "levelroles": [],
                        "roles": [],
                        "inGuild": false,
                        "meta": {
                            "revision": 2,
                            "created": 1615904159132,
                            "version": 0,
                            "updated": 1615904159132
                        },
                        "$loki": 13
                    },
                    {
                        "user_id": "671681661296967680",
                        "xp": 0,
                        "level": 0,
                        "levelroles": [],
                        "roles": [
                            "825389402288422976",
                            "666937895424098304"
                        ],
                        "inGuild": true,
                        "meta": {
                            "revision": 8,
                            "created": 1620240116631,
                            "version": 0,
                            "updated": 1620243462258
                        },
                        "$loki": 14
                    },
                    {
                        "user_id": "200309790562451467",
                        "xp": 0,
                        "level": 0,
                        "levelroles": [],
                        "roles": [
                            "668109404763062282",
                            "666937895424098304"
                        ],
                        "inGuild": true,
                        "meta": {
                            "revision": 10,
                            "created": 1620242955367,
                            "version": 0,
                            "updated": 1622581200454
                        },
                        "$loki": 15
                    },
                    {
                        "user_id": "411240035841474590",
                        "xp": 0,
                        "level": 0,
                        "levelroles": [],
                        "roles": [],
                        "inGuild": true,
                        "meta": {
                            "revision": 3,
                            "created": 1621421167172,
                            "version": 0,
                            "updated": 1621421383522
                        },
                        "$loki": 16
                    }
                ],
                "idIndex": [
                    1,
                    2,
                    3,
                    4,
                    5,
                    6,
                    7,
                    8,
                    9,
                    10,
                    11,
                    12,
                    13,
                    14,
                    15,
                    16
                ],
                "binaryIndices": {},
                "constraints": null,
                "uniqueNames": [
                    "user_id"
                ],
                "transforms": {},
                "objType": "666937895424098304",
                "dirty": false,
                "cachedIndex": null,
                "cachedBinaryIndex": null,
                "cachedData": null,
                "adaptiveBinaryIndices": true,
                "transactional": false,
                "cloneObjects": false,
                "cloneMethod": "parse-stringify",
                "asyncListeners": false,
                "disableMeta": false,
                "disableChangesApi": true,
                "disableDeltaChangesApi": true,
                "autoupdate": true,
                "serializableIndices": true,
                "disableFreeze": true,
                "ttl": null,
                "maxId": 16,
                "DynamicViews": [],
                "events": {
                    "insert": [],
                    "update": [],
                    "pre-insert": [],
                    "pre-update": [],
                    "close": [],
                    "flushbuffer": [],
                    "error": [],
                    "delete": [
                        null
                    ],
                    "warning": [
                        null
                    ]
                },
                "changes": [],
                "dirtyIds": []
            },
            {
                "name": "783274740240220190",
                "data": [
                    {
                        "user_id": "248009714699337728",
                        "xp": 0,
                        "level": 0,
                        "levelroles": [],
                        "roles": [],
                        "inGuild": true,
                        "meta": {
                            "revision": 3,
                            "created": 1614119653474,
                            "version": 0,
                            "updated": 1614120674240
                        },
                        "$loki": 1
                    },
                    {
                        "user_id": "331744590786985987",
                        "xp": 0,
                        "level": 0,
                        "levelroles": [],
                        "roles": [],
                        "inGuild": true,
                        "meta": {
                            "revision": 3,
                            "created": 1614120625994,
                            "version": 0,
                            "updated": 1614120684153
                        },
                        "$loki": 2
                    }
                ],
                "idIndex": null,
                "binaryIndices": {},
                "constraints": null,
                "uniqueNames": [
                    "user_id"
                ],
                "transforms": {},
                "objType": "783274740240220190",
                "dirty": false,
                "cachedIndex": null,
                "cachedBinaryIndex": null,
                "cachedData": null,
                "adaptiveBinaryIndices": true,
                "transactional": false,
                "cloneObjects": false,
                "cloneMethod": "parse-stringify",
                "asyncListeners": false,
                "disableMeta": false,
                "disableChangesApi": true,
                "disableDeltaChangesApi": true,
                "autoupdate": true,
                "serializableIndices": true,
                "disableFreeze": true,
                "ttl": null,
                "maxId": 2,
                "DynamicViews": [],
                "events": {
                    "insert": [],
                    "update": [],
                    "pre-insert": [],
                    "pre-update": [],
                    "close": [],
                    "flushbuffer": [],
                    "error": [],
                    "delete": [
                        null
                    ],
                    "warning": [
                        null
                    ]
                },
                "changes": [],
                "dirtyIds": []
            },
            {
                "name": "702789285312462858",
                "data": [
                    {
                        "user_id": "805058574401273916",
                        "xp": 0,
                        "level": 0,
                        "levelroles": [],
                        "roles": [
                            "821424916855259177",
                            "702789285312462858"
                        ],
                        "inGuild": true,
                        "meta": {
                            "revision": 47,
                            "created": 1615905531888,
                            "version": 0,
                            "updated": 1622578833018
                        },
                        "$loki": 1
                    },
                    {
                        "user_id": "298842558610800650",
                        "xp": 0,
                        "level": 0,
                        "levelroles": [],
                        "roles": [
                            "801358228499595304",
                            "702789285312462858"
                        ],
                        "inGuild": true,
                        "meta": {
                            "revision": 37,
                            "created": 1615905614421,
                            "version": 0,
                            "updated": 1622578839333
                        },
                        "$loki": 2
                    },
                    {
                        "user_id": "276675912693710849",
                        "xp": 0,
                        "level": 0,
                        "levelroles": [],
                        "roles": [
                            "702790152371699722",
                            "801358228499595304",
                            "702789285312462858"
                        ],
                        "inGuild": true,
                        "meta": {
                            "revision": 10,
                            "created": 1615905998650,
                            "version": 0,
                            "updated": 1622578851252
                        },
                        "$loki": 3
                    },
                    {
                        "user_id": "671681661296967680",
                        "xp": 0,
                        "level": 0,
                        "levelroles": [],
                        "roles": [
                            "821418979083026495",
                            "702789285312462858"
                        ],
                        "inGuild": true,
                        "meta": {
                            "revision": 13,
                            "created": 1615905998889,
                            "version": 0,
                            "updated": 1622556873614
                        },
                        "$loki": 4
                    },
                    {
                        "user_id": "364453004637634560",
                        "xp": 0,
                        "level": 0,
                        "levelroles": [],
                        "roles": [],
                        "inGuild": true,
                        "meta": {
                            "revision": 17,
                            "created": 1615908859300,
                            "version": 0,
                            "updated": 1621431242347
                        },
                        "$loki": 5
                    },
                    {
                        "user_id": "200309790562451467",
                        "xp": 0,
                        "level": 0,
                        "levelroles": [],
                        "roles": [
                            "801358228499595304",
                            "702789285312462858"
                        ],
                        "inGuild": true,
                        "meta": {
                            "revision": 8,
                            "created": 1620242955387,
                            "version": 0,
                            "updated": 1621429701225
                        },
                        "$loki": 6
                    }
                ],
                "idIndex": null,
                "binaryIndices": {},
                "constraints": null,
                "uniqueNames": [
                    "user_id"
                ],
                "transforms": {},
                "objType": "702789285312462858",
                "dirty": false,
                "cachedIndex": null,
                "cachedBinaryIndex": null,
                "cachedData": null,
                "adaptiveBinaryIndices": true,
                "transactional": false,
                "cloneObjects": false,
                "cloneMethod": "parse-stringify",
                "asyncListeners": false,
                "disableMeta": false,
                "disableChangesApi": true,
                "disableDeltaChangesApi": true,
                "autoupdate": true,
                "serializableIndices": true,
                "disableFreeze": true,
                "ttl": null,
                "maxId": 6,
                "DynamicViews": [],
                "events": {
                    "insert": [],
                    "update": [],
                    "pre-insert": [],
                    "pre-update": [],
                    "close": [],
                    "flushbuffer": [],
                    "error": [],
                    "delete": [
                        null
                    ],
                    "warning": [
                        null
                    ]
                },
                "changes": [],
                "dirtyIds": []
            },
            {
                "name": "776187795013894164",
                "data": [
                    {
                        "user_id": "232543125372010497",
                        "xp": 0,
                        "level": 0,
                        "levelroles": [],
                        "roles": [],
                        "inGuild": true,
                        "meta": {
                            "revision": 1,
                            "created": 1615910597574,
                            "version": 0,
                            "updated": 1615910597574
                        },
                        "$loki": 1
                    },
                    {
                        "user_id": "166530197791703040",
                        "xp": 0,
                        "level": 0,
                        "levelroles": [],
                        "roles": [],
                        "inGuild": true,
                        "meta": {
                            "revision": 1,
                            "created": 1615910755583,
                            "version": 0,
                            "updated": 1615910755583
                        },
                        "$loki": 2
                    }
                ],
                "idIndex": null,
                "binaryIndices": {},
                "constraints": null,
                "uniqueNames": [
                    "user_id"
                ],
                "transforms": {},
                "objType": "776187795013894164",
                "dirty": false,
                "cachedIndex": null,
                "cachedBinaryIndex": null,
                "cachedData": null,
                "adaptiveBinaryIndices": true,
                "transactional": false,
                "cloneObjects": false,
                "cloneMethod": "parse-stringify",
                "asyncListeners": false,
                "disableMeta": false,
                "disableChangesApi": true,
                "disableDeltaChangesApi": true,
                "autoupdate": true,
                "serializableIndices": true,
                "disableFreeze": true,
                "ttl": null,
                "maxId": 2,
                "DynamicViews": [],
                "events": {
                    "insert": [],
                    "update": [],
                    "pre-insert": [],
                    "pre-update": [],
                    "close": [],
                    "flushbuffer": [],
                    "error": [],
                    "delete": [
                        null
                    ],
                    "warning": [
                        null
                    ]
                },
                "changes": [],
                "dirtyIds": []
            }];

        for (let i = 0; i < guildDBOLD.length; i++) {
            const currentGuild = guildDBOLD[i],
                foundGuild = (await sql.get("guilds", `id = ${currentGuild.guild_id}`))[0],
                guildObject = {
                    id: currentGuild.guild_id,
                    name: currentGuild.name,
                    prefix: currentGuild.prefix,
                    ignoreBots: !currentGuild.allowbots
                },
                foundLevelsysten = (await sql.get("guild-levelsystem", `id = ${currentGuild.guild_id}`))[0],
                levelsystemObject = {
                    id: currentGuild.guild_id,
                    enabled: currentGuild.levelSystem.enabled,
                    ignoredChannels: JSON.stringify(currentGuild.levelSystem.disallowed_channels),
                    levelupChannel: currentGuild.levelSystem.update_channel,
                    levelupMessage: JSON.stringify(currentGuild.levelSystem.levelup_message),
                    newroleMessage: JSON.stringify(currentGuild.levelSystem.newrole_message),
                    levelupImage: currentGuild.levelSystem.levelup_image,
                    rolesCumulative: currentGuild.levelSystem.roles.cumulative || false,
                    roles: JSON.stringify(currentGuild.levelSystem.roles)
                }
            if (foundGuild) {
                sql.update("guilds", guildObject, `id = ${guildObject.id}`);
            } else {
                await sql.insert("guilds", guildObject);
            }
            if (foundLevelsysten) {
                sql.update("guild-levelsystem", levelsystemObject, `id = ${levelsystemObject.id}`);
            } else {
                await sql.insert("guild-levelsystem", levelsystemObject);
            }

            const userDBOLD = guildUserDBOLD.find(element => element.name == currentGuild.guild_id);
            for (let j = 0; j < userDBOLD.data.length; j++) {
                const user = userDBOLD.data[j],
                    foundGuildUser = (await sql.get("guild-users", `guildid = ${currentGuild.guild_id} AND userid = ${user.user_id}`))[0],
                    foundUser = (await sql.get("users", `id = ${user.user_id}`))[0],
                    guildUserObject = {
                        userid: user.user_id,
                        guildid: currentGuild.guild_id,
                        xp: user.xp,
                        level: user.level,
                        levelRoles: JSON.stringify(user.levelroles),
                        roles: JSON.stringify(user.roles),
                        inGuild: user.inGuild || true
                    },
                    DSUser = await client.users.fetch(user.user_id),
                    userObject = {
                        id: user.user_id,
                        username: DSUser.username,
                        tag: DSUser.tag.slice(-4),
                        unsubscribed: false
                    }
                if (foundGuildUser) {
                    sql.update("guild-users", guildUserObject, `guildid = ${guildUserObject.guildid} AND userid = ${guildUserObject.userid}`);
                } else {
                    await sql.insert("guild-users", guildUserObject);
                }
                if (foundUser) {
                    sql.update("users", userObject, `id = ${userObject.id}`);
                } else {
                    await sql.insert("users", userObject);
                }
            }
        }
        //#endregion
    }
}