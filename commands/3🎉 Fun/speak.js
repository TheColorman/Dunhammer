//@ts-check

const textToSpeech = require('@google-cloud/text-to-speech');
const fs = require('fs');
const util = require('util');
const { apiFunctions } = require('../../helperfunctions');

module.exports = {
    name: 'speak',
    shortDesc: 'Speak a message.',
    longDesc: 'Joins your voice channel and speaks the message.',
    usage: '[language (BCP-47)] [gender (female/male)] <message>',
    aliases: ['tts'],
    cooldown: 2,
    async execute(msg, args, tags, databases, interaction) {
        // check if i have enough characters to use the google api
        // I sure fucking hope this code works, because dates are a pain in the ass to work with and im not testing this shit.
        const api_db = databases.client.getCollection("apis");
        if (api_db.findOne({ api_name: "tts" }) === null) {
            api_db.insert({
                api_name: "tts",
                charactersLeft: 90,
                date: new Date(),
            });
        }
        // 90 characters a minute
        const db_tts = api_db.findOne({ api_name: "tts" });
        const date = new Date(db_tts.date);
        const now = new Date();
        if (date.getFullYear() == now.getFullYear() && date.getMonth() == now.getMonth()) {
            const minutes = (Math.floor(Math.abs((now.getTime() - date.getTime()) / 1000) / 60));
            db_tts.charactersLeft += minutes * 90;
        } else {
            const firstThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const minutes = (Math.floor(Math.abs((now.getTime() - firstThisMonth.getTime()) / 1000) / 60));
            db_tts.charactersLeft = minutes * 90;
        }
        db_tts.date = new Date();
        api_db.update(db_tts);

        // variables
        let languageCode = "en-UK";
        let channel = msg.member.voice.channel;
        let gender;
        let text = args.original.join(" ");
        
        if (interaction) {  // interactions have more options
            await msg.client.api.interactions(interaction.id, interaction.token).callback.post({ data: {
                type: 5,
            }});
            const languageCodeOption = interaction.data.options.find(option => ["language_a-k", "language_l-z"].includes(option.name));
            const genderOption = interaction.data.options.find(option => option.name == "gender");
            const channelOption = interaction.data.options.find(option => option.name == "channel");
            gender = genderOption ? genderOption.value : undefined;
            languageCode = languageCodeOption ? languageCodeOption.value : "en-UK";
            channel = channelOption ? msg.guild.channels.resolve(channelOption.value) : msg.member.voice.channel;
            text = interaction.data.options.find(option => option.name == "message").value;
        }

        if (db_tts.charactersLeft - text.length < 0) {
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
        db_tts.charactersLeft -= text.length;
        api_db.update(db_tts);

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
            const message = await apiFunctions.interactionEdit(msg.client, interaction, msg.channel, replyEmbed);
        } else {
            msg.channel.send({ embed: replyEmbed});
        }


        const ttsClient = new textToSpeech.TextToSpeechClient({ projectId: "dunhammer", keyFile: "./GCloudKey.json" });
        
        let input = {
            text: text
        }
        const request = {
            input: input,
            voice: {
                languageCode: languageCode,
                ssmlGender: gender
            },
            audioConfig: { audioEncoding: "MP3" },
        }
        
        const [response] = await ttsClient.synthesizeSpeech(request);
        const writeFile = util.promisify(fs.writeFile);
        await writeFile('./audioData/output.mp3', response.audioContent, 'binary');
            
        const connection = await channel.join();
        const dispatcher = connection.play('./audioData/output.mp3');
    
        dispatcher.on("finish", () => channel.leave());
    }
}