// eslint-disable-next-line no-unused-vars
const MySQL = require("../../sql/sql"),
    // eslint-disable-next-line no-unused-vars
    Discord = require("discord.js"),

    { default: fetch} = require('node-fetch'),
    https = require('https'),
    querystring = require('querystring'),
    { trelloToken } = require('../../token.json'),

    { QuickMessage, apiFunctions } = require('../../helperfunctions.js');

module.exports = {
    name: 'suggestion',
    aliases: ['suggest', 'idea', 'report', 'bug', 'glitch'],
    shortDesc: 'Suggest a feature or report a bug .',
    longDesc: 'Submits an anonymous suggestion/bug report to the [roadmap](https://trello.com/b/expgfSZa/dunhammer-roadmap).',
    usage: '<message>',
    cooldown: 10,
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
        }
        const DBGuild = (await sql.get("guilds", `id = ${msg.guild.id}`))[0];
        if (!args.original.length) {
            const replyEmbed = {
                color: 0xcf2d2d,
                title: ":octagonal_sign: Error!",
                description: `:question: Not enough arguments! Use \`${DBGuild.prefix}help suggestion\` for help.`
            }
            if (interaction) {
                const data = {
                    embeds: [replyEmbed]
                }
                return await fetch(`https://discord.com/api/v8/webhooks/${msg.client.user.id}/${interaction.token}/messages/@original`, {
                    method: 'PATCH',
                    body: JSON.stringify(data),
                    headers: {
                        'Authorization': `Bot ${msg.client.token}`,
                        'Content-Type': 'application/json'
                    }
                });
            } else {
                return msg.channel.send({ embed: replyEmbed});
            }
        }
        
        const confirmation = interaction ? await apiFunctions.interactionEdit(msg.client, interaction, msg.channel, {
                color: 0xe86b0c,
                description: `:grey_question: Are you sure you want to add \`${args.original.join(" ")}\` to the [roadmap](https://trello.com/b/expgfSZa/dunhammer-roadmap)? React with :white_check_mark: to continue.`
            }) : await QuickMessage.confirmation(msg.channel, `Are you sure you want to add \`${args.original.join(" ")}\` to the [roadmap](https://trello.com/b/expgfSZa/dunhammer-roadmap)? React with :white_check_mark: to continue.`),
            filter = (reaction, user) => reaction.emoji.name === '✅' && user.id === msg.author.id;
        confirmation.react('✅')
            .then(() => {
                confirmation.awaitReactions(filter, { idle: 15000, max: 1 })
                    .then(async (collected) => {
                        if (!collected.first()) {
                            await confirmation.reactions.removeAll();
                            return confirmation.edit({embed: QuickMessage.confirmation_timeout(`Are you sure you want to add \`${args.original.join(" ")}\` to the [roadmap](https://trello.com/b/expgfSZa/dunhammer-roadmap)? React with :white_check_mark: to continue.`)});
                        }
                        const trello_key = "bc34d08189a136ae7ebe4fd978e7980b",
                            list_id = "60082643ec4279863610f11f",
                            host = 'api.trello.com',
                            path = `/1/cards?key=${trello_key}&token=${trelloToken}&idList=${list_id}`,
                
                            data = querystring.stringify({
                                "name": args.original.join(" ")
                            }),
                            options = {
                                hostname: host,
                                path: path,
                                method: 'POST',
                                headers: {
                                    "Content-Type": "application/x-www-form-urlencoded"
                                }
                            },
                
                            req = https.request(options, (res) => {
                            
                                res.on('data', (d) =>{
                                    if (res.statusCode != 200) return QuickMessage.error(msg.channel, `${d}`);
                                    return QuickMessage.add(msg.channel, `Added \`${args.original.join(' ')}\` to the [roadmap](https://trello.com/b/expgfSZa/dunhammer-roadmap).`);
                                    
                                });
                            });
                        
                        req.on('error', (err) => {
                            console.log(err);
                        });
                        
                        req.write(data);
                        req.end();        
                    });
            });
    }
}