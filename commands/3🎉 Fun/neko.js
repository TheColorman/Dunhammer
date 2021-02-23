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
            if (args.lowercase.length > 1) {
                args.lowercase.shift()
                args.original.shift()
            }
        }

        const guild = databases.guilds.findOne({ guild_id: msg.guild.id });

        if (args.lowercase[0] == "help") {
            return msg.client.commands.get("help").execute(msg, args, tags, databases);
        }

        let endpoint = args.lowercase.join('_');
        endpoint = endpoint ? endpoint : "neko";
        if (endpoint == "random_hentai_gif") endpoint = "Random_hentai_gif"; // this api is staright shit
        if (["i'm_feeling_lucky", "lucky", "random", "im_feeling_lucky", "sfw"].includes(endpoint)) endpoint = (msg.channel.nsfw ? ["Random_hentai_gif", "pussy", "nsfw_neko_gif", "lewd", "les", "kuni", "cum", "classic", "boobs", "bj", "anal", "nsfw_avatar", "yuri", "trap", "tits", "solog", "solo", "pwankg", "pussy_jpg", "lewdkemo", "lewdk", "keta", "hololewd", "holoero", "hentai", "futanari", "femdom", "feetg", "erofeet", "feet", "ero", "erok", "erokemo", "eron", "eroyuri", "cum_jpg", "blowjob", "spank", "gasm", "tickle", "slap", "poke", "pat", "neko", "meow", "lizard", "kiss", "hug", "fox_girl", "feed", "cuddle", "ngif", "kemonomimi", "holo", "smug", "baka", "woof", "wallpaper", "goose", "gecg", "avatar", "waifu"][Math.round(Math.random()*62)] : ["tickle", "slap", "poke", "pat", "neko", "meow", "lizard", "kiss", "hug", "fox_girl", "feed", "cuddle", "ngif", "kemonomimi", "holo", "smug", "baka", "woof", "wallpaper", "goose", "gecg", "avatar", "waifu"][Math.round(Math.random()*23)])
        let nsfw = ["random_hentai_gif", "pussy", "nsfw_neko_gif", "lewd", "les", "kuni", "cum", "classic", "boobs", "bj", "anal", "nsfw_avatar", "yuri", "trap", "tits", "solog", "solo", "pwankg", "pussy_jpg", "lewdkemo", "lewdk", "keta", "hololewd", "holoero", "hentai", "futanari", "femdom", "feetg", "erofeet", "feet", "ero", "erok", "erokemo", "eron", "eroyuri", "cum_jpg", "blowjob", "spank", "gasm"];
        if (endpoint == "nsfw") endpoint = nsfw[Math.floor(Math.random() * nsfw.length)];
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

        return msg.channel.send({ embed: {
            "color": 0xa914ff,
            "title": ":cat: " + endpoint,
            "image": {
                "url": returned
            },
            "footer": {
                "icon_url": "https://nekos.life/static/icons/android-chrome-72x72.png",
                "text": "nekos.life"
            }
        }});
    }
}