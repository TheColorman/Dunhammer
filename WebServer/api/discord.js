const express = require('express');
const fetch = require('node-fetch');
const { catchAsync } = require('../utils');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');

const router = express.Router();

const CLIENT_ID = "671681661296967680";
const CLIENT_SECRET = require('../../token.json').secret;
const redirect = encodeURIComponent('https://dunhammer.colorman.me/api/discord/callback');

router.use(cookieParser(CLIENT_ID));

router.get('/login', catchAsync(async (req, res) => {
    if (req.signedCookies.access_token) {
        const response = await fetch(`https://discord.com/api/v8/users/@me`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${req.signedCookies.access_token}`
            }
        });
        if (response.status != 401) {
            return res.send(`<p>You have been logged in, congratulations. Click <a href="/api/discord/logout">here</a> to log out or <a href="/">here</a> to go home.</p>`)
        }
    }
    let state;
    await new Promise((resolve) => {
        crypto.randomBytes(32, async (err, buffer) => {
            state = await buffer.toString('hex');
            resolve();
        });
    });
    res.cookie('state', state, {
        httpOnly: true,
        signed: true,
        expires: new Date(30*60*1000 + Date.now()),
        secure: true,
    });
    res.send(`<meta http-equiv="refresh" content="0; URL=https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${redirect}&response_type=code&scope=email%20guilds&state=${state}">`);
}));

router.get('/logout', (req, res) => {
    if (req.signedCookies.access_token) {
        res.cookie('access_token', 'none', { maxAge: 0 });
        res.end(`<p>You have been logged out.\n<a href="/">Go home.<a/></p>`);
    } else {
        res.write("<p>You were never logged in to begin with!</p>");
        res.end(`<p><a href="/">go home and sleep button that takes you home</a></p>`);
    }
})

router.get('/callback', catchAsync(async (req, res) => {
    if (!req.query.code) throw new Error('NoCodeProvided');
    const stateCookie = req.signedCookies.state;
    if (!req.query.state || stateCookie !== req.query.state) {
        return res.end(`<h1>bro you are actually getting hacked right now so i didnt log you in</h1><br><br><br><br><p>or maybe you disabled cookies or something</p>`);
    }

    res.cookie('state', 'undefined', {
        expires: new Date(Date.now()),
    });

    const code = req.query.code;
    const data = `client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&grant_type=authorization_code&code=${code}&redirect_uri=${redirect}&scope=email%20guilds`;

    const response = await fetch(`https://discord.com/api/v8/oauth2/token`, {
        method: 'POST',
        body: data,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    const json = await response.json();

    if (json.access_token) {
        const cookieConfig = {
            httpOnly: true,
            signed: true,
            expires: new Date(7*24*60*60*1000 + Date.now()),
            secure: true,
        }        
        res.cookie('access_token', json.access_token, cookieConfig);
    }

    res.redirect("/");
}));

router.get('/guilds', catchAsync(async (req, res) => {
    if (req.signedCookies.access_token) {
        const response = await fetch(`https://discord.com/api/v8/users/@me/guilds`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${req.signedCookies.access_token}`
            }
        });
        const guilds = await response.json();
        const filteredGuilds = guilds.filter(guild => {
            return (parseInt(guild.permissions) & 8) == 8;
        });
        const guildNames = filteredGuilds.map(guild => {
            return guild.name;
        });
        res.end(`You are admin in the following servers:\n${guildNames.join("\n")}`);
    } else {
        res.end(`<p>It would seems you're not <a href="/api/discord/login">logged in</a></p>`);
    }
}));




module.exports = router;