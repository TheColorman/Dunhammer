//@ts-check
const { get } = require('https');

module.exports = {
    name: 'neko',
    short_desc: 'Sends a picture of a catgirl',
    long_desc: 'Connects with the nekos.life API to send an image. Note: not all settings will show catgirls. Types:\n\nNSFW:\n`random_hentai_gif`, `pussy`, `nsfw_neko_gif`, `lewd`, `les`, `kuni`, `cum`, `classic`, `boobs`, `bj`, `anal`, `nsfw_avatar`, `yuri`, `trap`, `tits`, `solog`, `solo`, `pwankg`, `pussy_jpg`, `lewdkemo`, `lewdk`, `keta`, `hololewd`, `holoero`, `hentai`, `futanari`, `femdom`, `feetg`, `erofeet`, `feet`, `ero`, `erok`, `erokemo`, `eron`, `eroyuri`, `cum_jpg`, `blowjob`, `spank`, `gasm`.\n\nSFW:\n`tickle`, `slap`, `poke`, `pat`, `neko`, `meow`, `lizard`, `kiss`, `hug`, `fox_girl`, `feed`, `cuddle`, `ngif`, `kemonomimi`, `holo`, `smug`, `baka`, `woof`, `wallpaper`, `goose`, `gecg`, `avatar`, `waifu`.\n\nRandom:\n`i\'m feeling lucky`/`random`.',
    aliases: ['image', 'catgirl'],
    usage: '[type]',
    permissions: 'ATTACH_FILES',
    async execute(msg, args, tags, databases, interaction) {
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
        const guild = databases.guilds.findOne({ guild_id: msg.guild.id });

        if (args.lowercase[0] == "help") {
            return msg.client.commands.get("help").execute(msg, args, tags, databases);
        }

        let endpoint = args.lowercase.join('_');
        endpoint = endpoint ? endpoint : "neko";
        if (endpoint == "default") endpoint = "neko";

        if (endpoint == "random_hentai_gif") endpoint = "Random_hentai_gif"; // this api is staright shit

        if (["i'm_feeling_lucky", "lucky", "random", "im_feeling_lucky", "sfw"].includes(endpoint)) endpoint = (msg.channel.nsfw ? ["Random_hentai_gif", "pussy", "nsfw_neko_gif", "lewd", "les", "kuni", "cum", "classic", "boobs", "bj", "anal", "nsfw_avatar", "yuri", "trap", "tits", "solog", "solo", "pwankg", "pussy_jpg", "lewdkemo", "lewdk", "keta", "hololewd", "holoero", "hentai", "futanari", "femdom", "feetg", "erofeet", "feet", "ero", "erok", "erokemo", "eron", "eroyuri", "cum_jpg", "blowjob", "spank", "gasm", "tickle", "slap", "poke", "pat", "neko", "meow", "lizard", "kiss", "hug", "fox_girl", "feed", "cuddle", "ngif", "kemonomimi", "holo", "smug", "baka", "woof", "wallpaper", "goose", "gecg", "avatar", "waifu"][Math.round(Math.random()*62)] : ["tickle", "slap", "poke", "pat", "neko", "meow", "lizard", "kiss", "hug", "fox_girl", "feed", "cuddle", "ngif", "kemonomimi", "holo", "smug", "baka", "woof", "wallpaper", "goose", "gecg", "avatar", "waifu"][Math.round(Math.random()*23)])
        let nsfw = ["random_hentai_gif", "pussy", "nsfw_neko_gif", "lewd", "les", "kuni", "cum", "classic", "boobs", "bj", "anal", "nsfw_avatar", "yuri", "trap", "tits", "solog", "solo", "pwankg", "pussy_jpg", "lewdkemo", "lewdk", "keta", "hololewd", "holoero", "hentai", "futanari", "femdom", "feetg", "erofeet", "feet", "ero", "erok", "erokemo", "eron", "eroyuri", "cum_jpg", "blowjob", "spank", "gasm"];
        if (["nsfw", "im_feeling_horny", "i'm_feeling_horny", "horny"].includes(endpoint)) endpoint = nsfw[Math.floor(Math.random() * nsfw.length)];
        let url = `https://nekos.life/api/v2/img/${endpoint}`;


        if (nsfw.includes(endpoint) && !msg.channel.nsfw) {
            return msg.channel.send({ embed: {
                "color": 0xcf2d2d,
                "title": ":octagonal_sign: Error!",
                "description": `:no_entry: This channel is SFW!`,
                "footer": {
                    "icon_url": "https://nekos.life/static/icons/android-chrome-72x72.png",
                    "text": "nekos.life"
                }    
            }});
        } 

        let returned = await new Promise((resolve, reject) => {
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
        if (returned == "404") return msg.channel.send({ embed: {
            "color": 0xcf2d2d,
            "title": ":octagonal_sign: Error!",
            "description": `:question: Invalid argument! Use \`${guild.prefix}help neko\` for help.`
        }});

        const confirmation = await msg.channel.send({ embed: {
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
        }});
        // reactions
        const filter = (reaction, user) => reaction.emoji.name === '⚠' && user.id === msg.author.id;
        confirmation.react('⚠')
            .then(() => {
                confirmation.awaitReactions(filter, { idle: 15000, max: 1 })
                    .then(async (collected) => {
                        if (!collected.first()) {
                            await confirmation.reactions.removeAll();
                            return confirmation.edit({ embed: {
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
                        }
                        confirmation.edit({ embed: {
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

                        const reportChannel = await msg.client.channels.fetch('821393392771923978');
                        reportChannel.send({ embed: {
                            color: 0xa914ff,
                            title: "Neko report",
                            description: `Reported by ${await msg.member.user}`,
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
                                value: `${(await msg.guild.fetchInvites()).first(5).join("\n")}`
                            }],
                            image: {
                                url: returned
                            }
                        }});
                    });
            });
    }
}