//@ts-check
module.exports = {
    name: 'reloaddatabase',
    short_desc: 'Reloads the database.',
    long_desc: 'Reloads the entire database for this guild. This command can only be used by the bot owner.',
    async execute(msg, args, tags, databases) {
        const guild = databases.guilds.findOne({ guild_id: msg.guild.id });
        if (!['298842558610800650', '411240035841474590'].includes(msg.author.id)) {
            return msg.channel.send({ embed: {
                "color": 0xcf2d2d,
                "title": ":octagonal_sign: Error!",
                "description": `:no_entry: You don't have access to \`${guild.prefix}reloaddatabase\`!`
            }});
        }
        const message = await msg.channel.send({ embed: {
            color: 49919,
            description: "<a:discord_loading:821347252085063680> Refreshing database... (This might take a while)."
        }});

        // Guild
        await message.edit({ embed: {
            color: 49919,
            description: `:arrows_counterclockwise: Refreshing database... (This might take a while).\n\n\`\`\`\nUpdating old database versions...\n\`\`\``
        }});
        const db_guild = databases.guilds.findOne({ guild_id: msg.guild.id });
        db_guild.levelSystem.roles ||= { cumulative: false};
        db_guild.levelSystem.cooldown_timestamps ||= {};
        db_guild.allowbots ||= false;
        db_guild.name ||= msg.guild.name;
        databases.guilds.update(db_guild);

        // Users (from guild)
        const members = await msg.guild.members.cache;
        const members_length = members.size;
        await message.edit({ embed: {
            color: 49919,
            description: `<a:discord_loading:821347252085063680> Refreshing database... (This might take a while).\n\n\`\`\`\nRefreshing roles for ${members_length} members...\n\`\`\``
        }});
        members.each(async member => {
            // roles
            if (databases.users.findOne({ user_id: member.id}) == null) {
                databases.users.insert({
                    user_id: member.id,
                    xp: 0,
                    level: 0,
                    levelroles: [],
                    roles: [],
                    inGuild: true
                });
            }
            const db_user = databases.users.findOne({ user_id: member.id });
            db_user.roles = [];
            member.roles.cache.forEach(role => db_user.roles.push(role.id));

            db_user.levelroles ||= false;
            db_user.inGuild ||= true;
            databases.users.update(db_user);
        });
        // Users (from database)
        const db_users = databases.users.chain().data();
        const db_users_length = db_users.length;
        await message.edit({ embed: {
            color: 49919,
            description: `<a:discord_loading:821347252085063680> Refreshing database... (This might take a while).\n\n\`\`\`\nRefreshing roles for ${members_length} members...\nVerifying ${db_users_length} users in database...\n\`\`\``
        }});        
        for (const db_user of db_users) {
            try {
                const db_member = await msg.guild.members.fetch(db_user.user_id);
            } catch (err) {
                if (err.message === "Unknown Member" || err.message === "Unknown User") {
                    db_user.inGuild = false;
                }
            }
            db_user.roles ||= [];
            databases.users.update(db_user);
        }
        await message.edit({ embed: {
            color: 49919,
            description: `~~:white_check_mark: Refreshing database... (This might take a while).~~\n\n\`\`\`\nRefreshing roles for ${members_length} members...\nVerifying ${db_users_length} users in database...\n\`\`\`\n\n Done!`
        }});
        return msg.channel.send({ embed: {
            color: 2215713,
            description: ":white_check_mark: Reloaded the database for this server."
        }});
    }
}