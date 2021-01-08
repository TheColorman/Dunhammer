const { get } = require('https');

module.exports = {
    name: 'neko',
    short_desc: 'Sends a picture of a catgirl',
    long_desc: 'Connects with the nekos.life API to send an image. Note: not all settings will show catgirls. Types:\n\nNSFW:\n`random_hentai_gif`, `pussy`, `nsfw_neko_gif`, `lewd`, `les`, `kuni`, `cum`, `classic`, `boobs`, `bj`, `anal`, `nsfw_avatar`, `yuri`, `trap`, `tits`, `solog`, `solo`, `pwankg`, `pussy_jpg`, `lewdkemo`, `lewdk`, `keta`, `hololewd`, `holoero`, `hentai`, `futanari`, `femdom`, `feetg`, `erofeet`, `feet`, `ero`, `erok`, `erokemo`, `eron`, `eroyuri`, `cum_jpg`, `blowjob`, `spank`, `gasm`.\n\nSFW:\n`tickle`, `slap`, `poke`, `pat`, `neko`, `meow`, `lizard`, `kiss`, `hug`, `fox_girl`, `feed`, `cuddle`, `ngif`, `kemonomimi`, `holo`, `smug`, `baka`, `woof`, `wallpaper`, `goose`, `gecg`, `avatar`, `waifu`.\n\nRandom:\n`i\'m feeling lucky`/`random`.',
    aliases: ['image', 'catgirl'],
    usage: '[type]',
    permissions: 'ATTACH_FILES',
    async execute(msg, args, taggedUsers, taggedMembers, guild, guild_db, user_db, user, args_original_case_with_command, taggedChannels) {
        args_original_case_with_command.shift();

        if (args_original_case_with_command[0] == "help") {
            args[0] = "neko";
            return msg.client.commands.get("help").execute(msg, args, taggedUsers, taggedMembers, guild, guild_db, user_db, user, args_original_case_with_command, taggedChannels);
        }

        let endpoint = args_original_case_with_command.join('_');
        endpoint = endpoint ? endpoint : "neko";
        if (endpoint == "random_hentai_gif") endpoint = "Random_hentai_gif"; // this api is staright shit
        if (["i'm_feeling_lucky", "lucky", "random", "im_feeling_lucky"].includes(endpoint)) endpoint = (msg.channel.nsfw ? ["Random_hentai_gif", "pussy", "nsfw_neko_gif", "lewd", "les", "kuni", "cum", "classic", "boobs", "bj", "anal", "nsfw_avatar", "yuri", "trap", "tits", "solog", "solo", "pwankg", "pussy_jpg", "lewdkemo", "lewdk", "keta", "hololewd", "holoero", "hentai", "futanari", "femdom", "feetg", "erofeet", "feet", "ero", "erok", "erokemo", "eron", "eroyuri", "cum_jpg", "blowjob", "spank", "gasm", "tickle", "slap", "poke", "pat", "neko", "meow", "lizard", "kiss", "hug", "fox_girl", "feed", "cuddle", "ngif", "kemonomimi", "holo", "smug", "baka", "woof", "wallpaper", "goose", "gecg", "avatar", "waifu"][Math.round(Math.random()*62)] : ["tickle", "slap", "poke", "pat", "neko", "meow", "lizard", "kiss", "hug", "fox_girl", "feed", "cuddle", "ngif", "kemonomimi", "holo", "smug", "baka", "woof", "wallpaper", "goose", "gecg", "avatar", "waifu"][Math.round(Math.random()*23)])
        let url = `https://nekos.life/api/v2/img/${endpoint}`;
        let nsfw = ["random_hentai_gif", "pussy", "nsfw_neko_gif", "lewd", "les", "kuni", "cum", "classic", "boobs", "bj", "anal", "nsfw_avatar", "yuri", "trap", "tits", "solog", "solo", "pwankg", "pussy_jpg", "lewdkemo", "lewdk", "keta", "hololewd", "holoero", "hentai", "futanari", "femdom", "feetg", "erofeet", "feet", "ero", "erok", "erokemo", "eron", "eroyuri", "cum_jpg", "blowjob", "spank", "gasm"];

        if (nsfw.includes(args[0]) && !msg.channel.nsfw) {
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