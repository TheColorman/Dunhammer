// eslint-disable-next-line no-unused-vars
const MySQL = require("../../sql/sql"),
    // eslint-disable-next-line no-unused-vars
    Discord = require("discord.js"),

    { get } = require('https'),
    { apiFunctions } = require('../../helperfunctions');

module.exports = {
    name: 'neko',
    shortDesc: 'Sends a picture of a catgirl',
    longDesc: 'Connects with the nekos.life API to send an image. Note: not all settings will show catgirls. Types:\n\nNSFW:\n`random_hentai_gif`, `pussy`, `nsfw_neko_gif`, `lewd`, `les`, `kuni`, `cum`, `classic`, `boobs`, `bj`, `anal`, `nsfw_avatar`, `yuri`, `trap`, `tits`, `solog`, `solo`, `pwankg`, `pussy_jpg`, `lewdkemo`, `lewdk`, `keta`, `hololewd`, `holoero`, `hentai`, `futanari`, `femdom`, `feetg`, `erofeet`, `feet`, `ero`, `erok`, `erokemo`, `eron`, `eroyuri`, `cum_jpg`, `blowjob`, `spank`, `gasm`.\n\nSFW:\n`tickle`, `slap`, `poke`, `pat`, `neko`, `meow`, `lizard`, `kiss`, `hug`, `fox_girl`, `feed`, `cuddle`, `ngif`, `kemonomimi`, `holo`, `smug`, `baka`, `woof`, `wallpaper`, `goose`, `gecg`, `avatar`, `waifu`.\n\nRandom:\n`i\'m feeling lucky`/`random`.',
    aliases: ['image', 'catgirl'],
    usage: '[type]',
    permissions: 'ATTACH_FILES',
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
            // interaction compatability
            const interactionNekoType = interaction.data.options[0].options ? interaction.data.options[0].options[0].value : interaction.data.options[0].name;
            switch (interactionNekoType) {
                case "default":
                    args.lowercase = ["neko"];
                    break;
                case "sfw":
                    args.lowercase = ["sfw"];
                    break;
                case "nsfw":
                    args.lowercase = ["nsfw"];
                    break;
                default:
                    args.lowercase = [interaction.data.options[0].options[0].value];
            }
        }
        const DBGuild = (await sql.get("guilds", `id = ${msg.guild.id}`))[0];

        if (args.lowercase[0] == "help") {
            return msg.client.commands.get("help").execute(msg, args, tags, sql);
        }

        let endpoint = args.lowercase.join('_');
        endpoint = endpoint ? endpoint : "neko";
        if (endpoint == "default") endpoint = "neko";

        if (endpoint == "random_hentai_gif") endpoint = "Random_hentai_gif"; // this api is staright shit

        const randoms = ["i'm_feeling_lucky", "lucky", "random", "im_feeling_lucky"],
            randomsNSFW = ["nsfw", "im_feeling_horny", "i'm_feeling_horny", "horny"],
            randomsSFW = ["sfw", "no_horny", "sfw_random"],
            sfwEndpoints = [
                "tickle", "slap", "poke", "pat", "neko", "meow", "lizard", "kiss",
                "hug", "fox_girl", "feed", "cuddle", "ngif", "kemonomimi", "holo",
                "smug", "baka", "woof", "wallpaper", "goose", "gecg", "avatar", "waifu"
            ],
            nsfwEndpoints = [
                "random_hentai_gif", "pussy", "nsfw_neko_gif", "lewd", "les", "kuni", "cum", "classic",
                "boobs", "bj", "anal", "nsfw_avatar", "yuri", "trap", "tits", "solog",
                "solo", "pwankg", "pussy_jpg", "lewdkemo", "lewdk", "keta", "hololewd", "holoero",
                "hentai", "futanari", "femdom", "feetg", "erofeet", "feet", "ero", "erok",
                "erokemo", "eron", "eroyuri", "cum_jpg", "blowjob", "spank", "gasm"
            ],
            allEndpoints = [
                "Random_hentai_gif", "pussy", "nsfw_neko_gif", "lewd", "les", "kuni", "cum", "classic",
                "boobs", "bj", "anal", "nsfw_avatar", "yuri", "trap", "tits", "solog",
                "solo", "pwankg", "pussy_jpg", "lewdkemo", "lewdk", "keta", "hololewd", "holoero",
                "hentai", "futanari", "femdom", "feetg", "erofeet", "feet", "ero", "erok",
                "erokemo", "eron", "eroyuri", "cum_jpg", "blowjob", "spank", "gasm", "tickle",
                "slap", "poke", "pat", "neko", "meow", "lizard", "kiss", "hug",
                "fox_girl", "feed", "cuddle", "ngif", "kemonomimi", "holo", "smug", "baka",
                "woof", "wallpaper", "goose", "gecg", "avatar", "waifu"
            ];
        if (randoms.includes(endpoint)) endpoint = allEndpoints[Math.floor(Math.random() * allEndpoints.length)];
        if (randomsNSFW.includes(endpoint)) endpoint = nsfwEndpoints[Math.floor(Math.random() * nsfwEndpoints.length)];
        if (randomsSFW.includes(endpoint)) endpoint = sfwEndpoints[Math.floor(Math.random() * sfwEndpoints.length)];

        const url = `https://nekos.life/api/v2/img/${endpoint}`;


        if (nsfwEndpoints.includes(endpoint) && !msg.channel.nsfw) {
            const replyEmbed = {
                "color": 0xcf2d2d,
                "title": ":octagonal_sign: Error!",
                "description": `:no_entry: This channel is SFW!`,
                "footer": {
                    "icon_url": "https://nekos.life/static/icons/android-chrome-72x72.png",
                    "text": "nekos.life"
                }
            }
            if (interaction) {
                return await apiFunctions.interactionEdit(msg.client, interaction, msg.channel, replyEmbed);
            } else {
                return msg.channel.send({ embed: replyEmbed});
            }
        } 

        const returned = await new Promise((resolve, reject) => {
            get(url, (res) => {
                if(res.statusCode == 200) {
                    res.setEncoding('utf8');
                    let rawData = '';
                    res.on('data', (chunk) => { rawData += chunk});
                    res.on('end', () => {
                        try {
                            resolve(rawData.split("\"")[3]);
                        } catch(err) {
                            reject(err.message);
                        }
                    });
                }
            });
        });
        if (returned == "404") {
            const replyEmbed = {
                "color": 0xcf2d2d,
                "title": ":octagonal_sign: Error!",
                "description": `:question: Invalid argument! Use \`${DBGuild.prefix}help neko\` for help.`
            }
            if (interaction) {
                return await apiFunctions.interactionEdit(msg.client, interaction, msg.channel, replyEmbed);
            } else {
                return msg.channel.send({ embed: replyEmbed});
            }
        } 

        const replyEmbed = {
                "color": 0xa914ff,
                "title": ":cat: " + endpoint,
                "image": {
                    "url": returned
                },
                "author": {
                    "icon_url": "https://nekos.life/static/icons/android-chrome-72x72.png",
                    "name": "nekos.life",
                    "url": "https://nekos.life/"
                },
                "footer": {
                    "text": "React with ⚠ to remove and report the image."
                }
            },
            nekoImage = interaction ? await apiFunctions.interactionEdit(msg.client, interaction, msg.channel, replyEmbed) : await msg.channel.send({ embed:  replyEmbed }),
        // reactions
            filter = (reaction) => reaction.emoji.name === '⚠';
        nekoImage.react('⚠')
            .then(() => {
                nekoImage.awaitReactions(filter, { idle: 45000, max: 1 })
                    .then(async (collected) => {
                        if (!collected.first()) {
                            try {
                                await nekoImage.reactions.removeAll();
                                return nekoImage.edit({ embed: {
                                    "color": 0xa914ff,
                                    "title": ":cat: " + endpoint,
                                    "image": {
                                        "url": returned
                                    },
                                    "author": {
                                        "icon_url": "https://nekos.life/static/icons/android-chrome-72x72.png",
                                        "name": "nekos.life",
                                        "url": "https://nekos.life/"
                                    },
                                    "footer": {
                                        "text": "R̶e̶a̶c̶t̶ ̶w̶i̶t̶h̶ ̶⚠̶ ̶t̶o̶ ̶r̶e̶m̶o̶v̶e̶ ̶a̶n̶d̶ ̶r̶e̶p̶o̶r̶t̶ ̶t̶h̶e̶ ̶i̶m̶a̶g̶e̶.̶\nTimeout! Message an admin to remove the image."
                                    }
                                }});
                            } catch(err) {
                                return;
                            }
                        }
                        try {
                            nekoImage.edit({ embed: {
                                "color": 0xa914ff,
                                "title": ":cat: " + endpoint,
                                "description": "Image reported.",
                                "author": {
                                    "icon_url": "https://nekos.life/static/icons/android-chrome-72x72.png",
                                    "name": "nekos.life",
                                    "url": "https://nekos.life/"
                                },
                                "footer": {
                                    "text": "React with ⚠ to remove and report the image."
                                }
                            }});
                        } catch(err) {
                            return;
                        }
                            
                        const reactor = collected.first().users.cache.find(reactUser => reactUser.id != msg.client.user.id),
                            reportChannel = await msg.client.channels.fetch('821393392771923978');
                        let invites = "ERROR";
                        try {
                            const inviteCollection = await msg.guild.fetchInvites(),
                                inviteArray = inviteCollection.array();
                            invites = inviteArray.length ? inviteCollection.first(5).join("\n") : "No invites!";
                        } catch(err) {
                            invites = "No permissions!";
                        }
                        
                        reportChannel.send({ embed: {
                            color: 0xa914ff,
                            title: "Neko report",
                            description: `Reported by ${await reactor}`,
                            fields: [{
                                name: "Guild",
                                value: `Name: ${msg.guild.name}\nID: ${msg.guild.id}`
                            }, {
                                name: "NSFW channel?",
                                value: `${msg.channel.nsfw}`,
                                inline: true,
                            }, {
                                name: "Channel name",
                                value: `#${msg.channel.name}`,
                                inline: true,
                            }, {
                                name: "Invites (don't actually use)",
                                value: `${invites}`
                            }],
                            image: {
                                url: returned
                            }
                        }});
                    });
            });
    }
}