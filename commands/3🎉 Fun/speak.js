// eslint-disable-next-line no-unused-vars
const MySQL = require("../../sql/sql"),
    // eslint-disable-next-line no-unused-vars
    Discord = require("discord.js"),

    textToSpeech = require('@google-cloud/text-to-speech'),
    fs = require('fs'),
    util = require('util'),
    { apiFunctions } = require('../../helperfunctions');

module.exports = {
    name: 'speak',
    shortDesc: 'Speak a message.',
    longDesc: 'Joins your voice channel and speaks the message.',
    usage: '[language (BCP-47)] [gender (female/male)] <message>',
    aliases: ['tts'],
    cooldown: 2,
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
        // check if i have enough characters to use the google api
        // I sure fucking hope this code works, because dates are a pain in the ass to work with and im not testing this shit.
        const DBApi = (await sql.get("api", `name = "tts"`))[0],
        // 90 characters a minute
            date = new Date(DBApi.date),
            now = new Date();
        if (date.getFullYear() == now.getFullYear() && date.getMonth() == now.getMonth()) {
            const minutes = Math.floor(Math.abs((now.getTime() - date.getTime()) / 1000) / 60);
            DBApi.assignInt += minutes * 90;
        } else {
            const firstThisMonth = new Date(now.getFullYear(), now.getMonth(), 1),
                minutes = Math.floor(Math.abs((now.getTime() - firstThisMonth.getTime()) / 1000) / 60);
            DBApi.assignInt += minutes * 90;
        }
        DBApi.date = new Date().getTime();
        await sql.update("api", DBApi, `name = "tts"`);

        // variables
        let languageCode = "en-UK",
            channel = msg.member.voice.channel,
            gender,
            text = args.original.join(" ");
        
        if (interaction) {  // interactions have more options
            await msg.client.api.interactions(interaction.id, interaction.token).callback.post({ data: {
                type: 5,
            }});
            const languageCodeOption = interaction.data.options.find(option => ["language_a-k", "language_l-z"].includes(option.name)),
                genderOption = interaction.data.options.find(option => option.name == "gender"),
                channelOption = interaction.data.options.find(option => option.name == "channel");
            gender = genderOption ? genderOption.value : undefined;
            languageCode = languageCodeOption ? languageCodeOption.value : "en-UK";
            channel = channelOption ? msg.guild.channels.resolve(channelOption.value) : msg.member.voice.channel;
            text = interaction.data.options.find(option => option.name == "message").value;
        }

        if (DBApi.assignInt - text.length < 0) {
            const replyEmbed = {
                "color": 0xcf2d2d,
                "title": ":octagonal_sign: Error!",
                "description": ":mute: This command is on cooldown, please try again later or use a shorter message."
            }
            if (interaction) {
                return await apiFunctions.interactionEdit(msg.client, interaction, msg.channel, replyEmbed);
            } else {
                return msg.channel.send({ embed: replyEmbed});
            }    
        }
        DBApi.assignInt -= text.length;
        await sql.update("api", DBApi, `name = "tts"`);

        if (!channel || channel.type != "voice") {
            const replyEmbed = {
                "color": 0xcf2d2d,
                "title": ":octagonal_sign: Error!",
                "description": ":mute: Not in a voice channel."
            }
            if (interaction) {
                return await apiFunctions.interactionEdit(msg.client, interaction, msg.channel, replyEmbed);
            } else {
                return msg.channel.send({ embed: replyEmbed});
            }    
        }
        
        const replyEmbed = {
            color: 2215713,
            description: `:loud_sound: Saying \`${text}\` in channel \`${channel.name}\`.`,
        }
        if (interaction) {
            await apiFunctions.interactionEdit(msg.client, interaction, msg.channel, replyEmbed);
        } else {
            msg.channel.send({ embed: replyEmbed});
        }


        const ttsClient = new textToSpeech.TextToSpeechClient({ projectId: "dunhammer", keyFile: "./GCloudKey.json" }),
        
            input = {
                text: text
            },
            request = {
                input: input,
                voice: {
                    languageCode: languageCode,
                    ssmlGender: gender
                },
                audioConfig: { audioEncoding: "MP3" },
            },
        
            [response] = await ttsClient.synthesizeSpeech(request),
            writeFile = util.promisify(fs.writeFile);
        await writeFile('./audioData/output.mp3', response.audioContent, 'binary');
            
        const connection = await channel.join(),
            dispatcher = connection.play('./audioData/output.mp3');
    
        dispatcher.on("finish", () => channel.leave());
    }
}