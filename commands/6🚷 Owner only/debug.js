///@ts-check

module.exports = {
    name: 'debug',
    short_desc: 'Debug command.',
    long_desc: 'Debug command. Can only be used by bot owner, and is a placeholder for random testing.',
    execute(msg, args, tags, databases) {
        if (!['298842558610800650', '411240035841474590'].includes(msg.author.id)) {
            return msg.channel.send({ embed: {
                "color": 0xcf2d2d,
                "title": ":octagonal_sign: Error!",
                "description": `:no_entry: You don't have access to \`${guild.prefix}shutdown\`!`
            }});
        }

        const client = msg.client;

        // // help
        // client.api.applications(msg.client.user.id).guilds(msg.guild.id).commands.post({data: {
        //     name: 'help',
        //     description: 'Shows either a list of all commands, or shows help for a specific command.',
        //     options: [{
        //         type: 3,
        //         name: "command",
        //         description: "The command to get help for",
        //         required: false,
        //         choices: [{
        //             name: "help",
        //             value: "help"
        //         }, {
        //             name: "ping",
        //             value: "ping"
        //         }, {
        //             name: "invite",
        //             value: "invite"
        //         }, {
        //             name: "roadmap",
        //             value: "roadmap"
        //         }, {
        //             name: "suggestion",
        //             value: "suggestion"
        //         }, {
        //             name: "allowbots",
        //             value: "allowbots"
        //         }, {
        //             name: "prefix",
        //             value: "prefix"
        //         }, {
        //             name: "neko",
        //             value: "neko"
        //         }, {
        //             name: "me",
        //             value: "me"
        //         }]
        //     }]
        // }});   
        // // ping
        // client.api.applications(msg.client.user.id).guilds(msg.guild.id).commands.post({data: {
        //     name: 'ping',
        //     description: 'Checks latency between Discord and the bot.'
        // }});
        // // invite
        // client.api.applications(msg.client.user.id).guilds(msg.guild.id).commands.post({data: {
        //     name: 'invite',
        //     description: 'Sends an invite link for Dunhammer.'
        // }});
        // // roadmap
        // client.api.applications(msg.client.user.id).guilds(msg.guild.id).commands.post({data: {
        //     name: 'roadmap',
        //     description: 'Sends a link for the Dunhammer roadmap.'
        // }});
        // // suggestion
        // client.api.applications(msg.client.user.id).guilds(msg.guild.id).commands.post({data: {
        //     name: 'suggestion',
        //     description: 'Submits a suggestion directly to the roadmap. See /roadmap for more information.',
        //     options: [{
        //         type: 3,
        //         name: "suggestion",
        //         description: "The actual suggestion",
        //         required: true,
        //     }]
        // }});
        // // allowbots
        // client.api.applications(msg.client.user.id).guilds(msg.guild.id).commands.post({data: {
        //     name: 'allowbots',
        //     description: 'Change whether bots are ignored by Dunhammer.',
        //     options: [{
        //         type: 5,
        //         name: "boolean",
        //         description: "True to acknowledge bots, False to ignore bots",
        //         required: true,
        //     }]
        // }});
        // // prefix
        // client.api.applications(msg.client.user.id).guilds(msg.guild.id).commands.post({data: {
        //     name: 'prefix',
        //     description: 'Change the bot prefix. Prefix is used for making non-slash commands. Default prefix is ".".',
        //     options: [{
        //         type: 3,
        //         name: "prefix",
        //         description: "New prefix for Dunhammer",
        //         required: true,
        //     }]
        // }});
        // neko
        // client.api.applications(msg.client.user.id).guilds(msg.guild.id).commands.post({data: {
        //     name: 'neko',
        //     description: 'Sends a picture from nekos.life. Note that not all types will result in a catgirl.',
        //     options: [{
        //         type: 1,
        //         name: "SFW",
        //         description: "The type of catgirl to send",
        //         required: false,
        //         options: [{
        //             type: 3,
        //             name: "type",
        //             description: "test6",
        //             choices: [{
        //                 name: "random",
        //                 value: "random"
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
        //     }]
        // }});
    }
}