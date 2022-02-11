// eslint-disable-next-line no-unused-vars
const Discord = require("discord.js"),
    // eslint-disable-next-line no-unused-vars
    MySQL = require("../sql/sql"),
    { default: fetch } = require("node-fetch");

module.exports = {
    name: "neko",
    ApplicationCommandData: {
        name: "neko",
        description: "Sends a catgirl.",
        type: 1,
        options: [
            {
                type: 3,
                name: "sfw",
                description: "Safe For Work types",
                choices: [
                    {
                        name: "ngif",
                        value: "ngif"
                    }, {
                        name: "smug",
                        value: "smug"
                    }, {
                        name: "gasm",
                        value: "gasm"
                    }, {
                        name: "8ball",
                        value: "8ball"
                    }, {
                        name: "cuddle",
                        value: "cuddle"
                    }, {
                        name: "avatar",
                        value: "avatar"
                    }, {
                        name: "slap",
                        value: "slap"
                    }, {
                        name: "pat",
                        value: "pat"
                    }, {
                        name: "gecg",
                        value: "gecg"
                    }, {
                        name: "holo",
                        value: "holo"
                    }, {
                        name: "poke",
                        value: "poke"
                    }, {
                        name: "feed",
                        value: "feed"
                    }, {
                        name: "fox_girl",
                        value: "fox_girl"
                    }, {
                        name: "neko",
                        value: "neko"
                    }, {
                        name: "baka",
                        value: "baka"
                    }, {
                        name: "kemonomimi",
                        value: "kemonomimi"
                    }, {
                        name: "hug",
                        value: "hug"
                    }, {
                        name: "kiss",
                        value: "kiss"
                    }, {
                        name: "wallpaper",
                        value: "wallpaper"
                    }, {
                        name: "tickle",
                        value: "tickle"
                    }, {
                        name: "waifu",
                        value: "waifu"
                    }, {
                        name: "woof",
                        value: "woof"
                    }, {
                        name: "goose",
                        value: "goose"
                    }, {
                        name: "meow",
                        value: "meow"
                    }, {
                        name: "lizard",
                        value: "lizard"
                    }
                ],
            },
            {
                type: 3,
                name: "nsfw",
                description: "Not Safe For Work types",
                choices: [
                    {
                        name: "feet",
                        value: "feet"
                    }, {
                        name: "lewdkemo",
                        value: "lewdkemo"
                    }, {
                        name: "solo",
                        value: "solo"
                    }, {
                        name: "erokemo",
                        value: "erokemo"
                    }, {
                        name: "ero",
                        value: "ero"
                    }, {
                        name: "hololewd",
                        value: "hololewd"
                    }, {
                        name: "tits",
                        value: "tits"
                    }, {
                        name: "eroyuri",
                        value: "eroyuri"
                    }, {
                        name: "holoero",
                        value: "holoero"
                    }, {
                        name: "yuri",
                        value: "yuri"
                    }, {
                        name: "keta",
                        value: "keta"
                    }, {
                        name: "hentai",
                        value: "hentai"
                    }, {
                        name: "eron",
                        value: "eron"
                    }, {
                        name: "erok",
                        value: "erok"
                    }, {
                        name: "cum_jpg",
                        value: "cum_jpg"
                    }, {
                        name: "nsfw_avatar",
                        value: "nsfw_avatar"
                    }, {
                        name: "erofeet",
                        value: "erofeet"
                    }, {
                        name: "blowjob",
                        value: "blowjob"
                    }, {
                        name: "femdom",
                        value: "femdom"
                    }, {
                        name: "trap",
                        value: "trap"
                    }, {
                        name: "lewd",
                        value: "lewd"
                    }, {
                        name: "pussy_jpg",
                        value: "pussy_jpg"
                    }, {
                        name: "futanari",
                        value: "futanari"
                    }, {
                        name: "lewdk",
                        value: "lewdk"
                    }
                ],
            }, {
                type: 3,
                name: "nsfw-gif",
                description: "Not Safe For Work gif types",
                choices: [
                    {
                        name: "solog",
                        value: "solog"
                    }, {
                        name: "cum",
                        value: "cum"
                    }, {
                        name: "les",
                        value: "les"
                    }, {
                        name: "bj",
                        value: "bj"
                    }, {
                        name: "pwankg",
                        value: "pwankg"
                    }, {
                        name: "nsfw_neko_gif",
                        value: "nsfw_neko_gif"
                    }, {
                        name: "pussy",
                        value: "pussy"
                    }, {
                        name: "Random_hentai_gif",
                        value: "Random_hentai_gif"
                    }, {
                        name: "feetg",
                        value: "feetg"
                    }, {
                        name: "kuni",
                        value: "kuni"
                    }, {
                        name: "classic",
                        value: "classic"
                    }, {
                        name: "spank",
                        value: "spank"
                    }, {
                        name: "boobs",
                        value: "boobs"
                    }, {
                        name: "anal",
                        value: "anal"
                    }
                ]
            }
        ],
    },
    /**
     * Command execution
     * @param {Discord.CommandInteraction} interaction Interaction object
     * @param {MySQL} sql MySQL custom object
     */
    async execute(interaction) {
        // check for nsfw
        if (interaction.options.data.length && interaction.options.data[interaction.options.data.length-1].name.includes("nsfw") && !interaction.channel.nsfw) {
            return interaction.reply({
                embeds: [{
                    "color": 0xF14B46,
                    "description": [
                        // choose a random funny description.
                        `I can't send ${interaction.options.data[interaction.options.data.length-1].value} in a safe for work channel, you know!`,
                        `This is a safe for work channel, you horny bastard! Go watch your ${interaction.options.data[interaction.options.data.length-1].value} somewhere else!`,
                        `What are you thinking, *CHILDREN*  have access to this channel! You can't let them see ${interaction.options.data[interaction.options.data.length-1].value}, keep it in the NSFW channels!`,
                        `${interaction.options.data[interaction.options.data.length-1].value} huh? I won't judge, but try to keep it to NSFW next time :wink:.`
                    ][Math.floor(Math.random()*4)]
                }]
            });
        }

        const endpoint = interaction.options.data.length ? interaction.options.data[interaction.options.data.length-1].value : "neko",

            nekoRes = await (await fetch(`https://nekos.life/api/v2/img/${endpoint}`)).json();

        interaction.reply({
            embeds: [{
                "color": 0x5823A8,
                "title": `:cat: ${endpoint}`,
                "url": nekoRes.url,
                "image": {
                    "url": nekoRes.url
                },
                "footer": {
                    "iconURL": "https://nekos.life/static/icons/android-chrome-72x72.png",
                    "text": "nekos.life"
                }
            }],
            components: [{
                type: "ACTION_ROW",
                components: [{
                    type: "BUTTON",
                    label: "Report",
                    customId: "commands.neko.report",
                    style: "SECONDARY"
                }]
            }]
        });
    },
    /**
     * Report execution
     * @param {Discord.ButtonInteraction} interaction Interaction object
     */
    async report(interaction) {
        interaction.update({
            embeds: [{
                "color": 0xF14B46,
                "title": "Reported",
            }],
            components: []
        });

        const reportChannel = await interaction.client.channels.fetch('821393392771923978');

        //! Legacy code, update eventually
        let invites;
        try {
            const inviteCollection = await interaction.guild.fetchInvites(),
                inviteArray = inviteCollection.array();
            invites = inviteArray.length ? inviteCollection.first(5).join("\n") : "No invites!";
        } catch(err) {
            invites = "No permissions!";
        }
        //! End of legacy code

        reportChannel.send({
            embeds: [{
                color: 0x5823A8,
                title: "Neko report",
                description: `Reported by ${interaction.member}`,
                fields: [{
                    name: "Guild",
                    value: `Name: ${interaction.guild.name}\nID: ${interaction.guild.id}`
                }, {
                    name: "NSFW channel?",
                    value: `${interaction.channel.nsfw}`,
                    inline: true,
                }, {
                    name: "Channel",
                    value: `${interaction.channel}`,
                    inline: true,
                }, {
                    name: "Invites (don't actually use)",
                    value: `${invites}`
                }],
                image: {
                    url: interaction.message.embeds[0].image.url
                }
            }]
        });
    }
}
