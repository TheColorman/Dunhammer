const https = require('https');
const querystring = require('querystring');
const { trelloToken } = require('../token.json');

const { QuickMessage } = require('../helperfunctions.js');

module.exports = {
    name: 'suggestion',
    aliases: ['suggest', 'idea', 'report', 'bug', 'glitch'],
    short_desc: 'Suggest a feature or report a bug .',
    long_desc: 'Submits an anonymous suggestion/bug report to the [roadmap](https://trello.com/b/expgfSZa/dunhammer-roadmap).',
    usage: '<message>',
    cooldown: 10,
    async execute(msg, args, tags, databases) {
        const guild_db = databases.guilds;
        db_guild = guild_db.findOne({ guild_id: msg.guild.id });
        if (!args.original.length) return QuickMessage.not_enough_arguments(msg.channel, db_guild.prefix, "suggestion")
        const trello_key = "bc34d08189a136ae7ebe4fd978e7980b";
        const list_id = "60082643ec4279863610f11f";
        const host = 'api.trello.com';
        const path = `/1/cards?key=${trello_key}&token=${trelloToken}&idList=${list_id}`;

        const data = querystring.stringify({
            "name": args.original.join(" ")
        });
        const options = {
            hostname: host,
            path: path,
            method: 'POST',
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            }
        }

        const req = https.request(options, (res) => {
            
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
    }
}