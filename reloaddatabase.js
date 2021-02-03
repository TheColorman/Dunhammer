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
            description: ":arrows_counterclockwise: Refreshing database... (This ***will*** take a while)."
        }});
        const description = [];
        const max_desc_length = 15;

        // Guild
        const db_guild = databases.guilds.findOne({ guild_id: msg.guild.id });
        db_guild.levelSystem.roles ||= { cumulative: false};
        db_guild.allowbots ||= false;
        db_guild.name ||= msg.guild.name;
        databases.guilds.update(db_guild);

        // Users (from guild)
        const members = await msg.guild.members.cache;
        const members_length = members.size;
        description.push(`The guild contains ${members_length} members.`);

        let members_index = 0;
        if (description.length > max_desc_length) description.shift();
        members.each(async member => {
            members_index++;
            description.push(`Updating roles for ${member.user.tag}.`);
            if (description.length > max_desc_length) description.shift();
            await message.edit({ embed: {
                color: 49919,
                description: `:arrows_counterclockwise: Refreshing database... (This ***will*** take a while).\n\n\`\`\`\n      Member ${members_index}/${members_length}\n${description.join('\n')}\n\`\`\``
            }});
            // roles
            if (databases.users.findOne({ user_id: member.id}) == null) {
                description.push(`${member.user.tag} not in database, creating entry...`);
                if (description.length > max_desc_length) description.shift();
                await message.edit({ embed: {
                    color: 49919,
                    description: `:arrows_counterclockwise: Refreshing database... (This ***will*** take a while).\n\n\`\`\`\n      Member ${members_index}/${members_length}\n${description.join('\n')}\n\`\`\``
                }});    
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
        const db_users_length = databases.users.chain().data().length;
        description.push(`Verifying database entries...`);
        if (description.length > max_desc_length) description.shift();
        description.push(`The database contains ${db_users_length} users.`);
        if (description.length > max_desc_length) description.shift();

        await message.edit({ embed: {
            color: 49919,
            description: `:arrows_counterclockwise: Refreshing database... (This ***will*** take a while).\n\n\`\`\`\n${description.join("\n")}\n\`\`\``
        }});
        let db_users_index = 0;
        for (const db_user of db_users) {
            db_users_index++;
            description.push(`Searching for guild member with ID ${db_user.user_id}...`);
            if (description.length > max_desc_length) description.shift();    
            await message.edit({ embed: {
                color: 49919,
                description: `:arrows_counterclockwise: Refreshing database... (This ***will*** take a while).\n\n\`\`\`\n      User ${db_users_index}/${db_users_length}\n${description.join("\n")}\n\`\`\``
            }});    
            try {
                const db_member = await msg.guild.members.fetch(db_user.user_id);
                description.push(`Matching user found: ${db_member.user.tag}`);
                if (description.length > max_desc_length) description.shift(); 
                await message.edit({ embed: {
                    color: 49919,
                    description: `:arrows_counterclockwise: Refreshing database... (This ***will*** take a while).\n\n\`\`\`\n      User ${db_users_index}/${db_users_length}\n${description.join("\n")}\n\`\`\``
                }});        
            } catch (err) {
                if (err.message === "Unknown Member" || err.message === "Unknown User") {
                    db_user.inGuild = false;
                }
                description.push(`No users found in guild, marking entry MISSING`);
                if (description.length > max_desc_length) description.shift();
                await message.edit({ embed: {
                    color: 49919,
                    description: `:arrows_counterclockwise: Refreshing database... (This ***will*** take a while).\n\n\`\`\`\n      User ${db_users_index}/${db_users_length}\n${description.join("\n")}\n\`\`\``
                }});        
            }
        }
        await message.edit({ embed: {
            color: 2215713,
            description: `~~:arrows_counterclockwise: Refreshing database... (This ***will*** take a while).~~\n\n\`\`\`\n${description.join("\n")}\n\`\`\`\n\n:white_check_mark: Done!`
        }});
        return msg.channel.send({ embed: {
            color: 2215713,
            description: ":white_check_mark: Reloaded the database for this server."
        }});
    }
}