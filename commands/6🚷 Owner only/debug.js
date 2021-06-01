/* eslint-disable no-unused-vars */
// @ts-check-

const { default: fetch } = require("node-fetch");
const fs = require('fs');
const FormData = require('form-data');
const MySQL = require("../../sql/sql");
const { mysqlPassword } = require("../../token.json");


module.exports = {
    name: 'debug',
    shortDesc: 'Debug command.',
    longDesc: 'Debug command. Can only be used by bot owner, and is a placeholder for random testing.',
    /**
     * 
     * @param {*} msg 
     * @param {*} args 
     * @param {*} tags 
     * @param {Object} databases 
     * @param {MySQL} databases.sql
     * @param {Loki} databases.guild_config
     * @returns 
     */
    async execute(msg, args, tags, databases) {
        const guild = databases.guilds.findOne({ guild_id: msg.guild.id });
        if (!['298842558610800650', '411240035841474590'].includes(msg.author.id)) {
            return msg.channel.send({ embed: {
                "color": 0xcf2d2d,
                "title": ":octagonal_sign: Error!",
                "description": `:no_entry: You don't have access to \`${guild.prefix}debug\`!`
            }});
        }

        const client = msg.client;
        
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
        
        const sql = databases.sql;
        //#region Guild DB update
        // for (let i = 0; i < databases.guilds.data.length; i++) {
        //     const guild = databases.guilds.data[i];
        //     const lvlobj = {
        //         id: guild.guild_id,
        //         enabled: guild.levelSystem.enabled,
        //         ignoredChannels: JSON.stringify(guild.levelSystem.disallowed_channels),
        //         levelupChannel: guild.levelSystem.update_channel | null,
        //         levelupMessage: JSON.stringify(guild.levelSystem.levelup_message),
        //         newroleMessage: JSON.stringify(guild.levelSystem.newrole_message),
        //         levelupImage: guild.levelSystem.levelup_image,
        //         rolesCumulative: guild.levelSystem.roles.cumulative | false,
        //         roles: guild.levelSystem.roles | { "cumulative": false },
        //     };
        //     const guildobj = {
        //         id: guild.guild_id,
        //         name: guild.name,
        //         prefix: guild.prefix,
        //         ignoreBots: !guild.allowbots
        //     }
        //     sql.insert("guild-levelsystem", lvlobj);
        //     sql.insert("guilds", guildobj);
        // }
        //#endregion
        //#region user DB update
        // for (let i = 0; i < databases.users.data.length; i++) {
        //     const user = databases.users.data[i];
        //     const userDS = await client.users.fetch(user.user_id)
        //     const usrobj = {
        //         id: user.user_id,
        //         username: userDS.username,
        //         tag: userDS.tag.slice(-4)
        //     }
        //     sql.insert("users", usrobj);
        // }
        //#endregion
        //#region guild-user DB update
        const rawdata = fs.readFileSync("./databases/guild_config.db");
        const json = JSON.parse(rawdata);
        const collections = json.collections;
        collections.forEach(collection => {
            const guildid = collection.name;
            if (guildid == "guilds" || !guildid) return;
            const db_guild = databases.guild_config.getCollection(guildid);
            for (let i = 0; i < db_guild.data.length; i++) {
                const user = db_guild.data[i];
                sql.insert("guild-users", {
                    userid: user.user_id,
                    guildid: guildid,
                    xp: user.xp,
                    level: user.level,
                    levelRoles: JSON.stringify(user.levelroles),
                    roles: JSON.stringify(user.roles),
                    inGuild: user.inGuild,
                });
            }
        });
        //#endregion
    }
}