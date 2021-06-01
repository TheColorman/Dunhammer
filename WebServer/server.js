const express = require('express'),
    path = require('path'),
    cookieParser = require('cookie-parser'),
    { catchAsync, htmlEncode } = require('./utils'),
    fetch = require('node-fetch'),
//const session = require('express-session');
    { guild_config } = require('./api/loki'),
//const { token } = require('../token.json');

    app = express(),
    client_id = "671681661296967680";

// Routes
app.use('/api/discord', require('./api/discord'));

app.use(cookieParser(client_id));
app.set('etag', false);

app.get('/', (req, res) => {
    res.status(200).sendFile(path.join(__dirname, 'index.html'));
});

app.get('/leaderboards', catchAsync(async (req, res) => {
    if (!req.signedCookies.access_token) {
        return res.end(`<h1>bro you are literally supposed to <a href="/api/discord/login">log in</a>.</p>`);
    }
    const access_token = req.signedCookies.access_token;
    const response = await fetch(`https://discord.com/api/v8/users/@me/guilds`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${access_token}`
        }
    });
    const json = await response.json();
    const filtered = json.filter(guild => {
        const user_db = guild_config.getCollection(guild.id);
        return user_db !== null;
    });

    //dark mode check
    if (!req.cookies.darkmode) res.cookie('darkmode', false, { expires: new Date(7*24*60*60*1000 + Date.now()) });
    const theme = req.cookies.darkmode == "true" ? "class=\"dark-mode\"" : "";

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.write(`
    <body onload="darkmodeCheck()" ${theme}>
        <style>
            body {
                font-family: Whitney,Helvetica Neue,Helvetica,Arial,sans-serif;
            }
            table {
                width: 90%;
            }
            th {
                text-align: left;
                font-size: 32pt;
            }
            td {
                text-align: left;
                font-size: 26pt;
                width: 32%;
            }
            img {
                width: 1em;
                border-radius: 50%;
                vertical-align: sub;
            }
            .dark-mode {
                background-color: #36393f;
                color: white;
            }
            .dark-mode > * a  {
                color: #00b0f4;
            }
        </style>
        <script>
            function darkmodeCheck() {
                const dark = (getCookie("darkmode") == "true");
                if (dark) document.body.classList.add("dark-mode");
            }

            function toggleDarkMode() {
                document.body.classList.toggle("dark-mode");
                const dark = (getCookie("darkmode") == "true");
                document.cookie = "darkmode=" + !dark + "; expires=" + new Date((7*24*60*60*1000) + Date.now()) + ";";
            }

            function getCookie(cname) {
                var name = cname + "=";
                var decodedCookie = decodeURIComponent(document.cookie);
                var ca = decodedCookie.split(';');
                for(var i = 0; i <ca.length; i++) {
                  var c = ca[i];
                  while (c.charAt(0) == ' ') {
                    c = c.substring(1);
                  }
                  if (c.indexOf(name) == 0) {
                    return c.substring(name.length, c.length);
                  }
                }
                return "";              
            }
        </script>
        <br>
        <p>oh yeah, before i forget, <a href="/">heres</a> the home button. or just fucking change the url, its not that hard. its 2 am im gonna go to bed now</p>
        <br><br><br>
        <button onClick="toggleDarkMode()">dark mode (actual dark mode, trust me)</button>
    `);
    filtered.forEach(async guild => {
        res.write(`
            <h3>
                ${guild.name}
            </h3>
            <br>
            <table style="width:90%">
        `);
        const user_db = guild_config.getCollection(guild.id);
        const sorted = user_db.chain().simplesort('xp', true).data();
        let index = 1;
        res.write(`
                <tr>
                    <th>Rank</th>
                    <th>ID</th>
                    <th>Level</th>
                </tr>
        `);
        for (const db_user of sorted) {

            res.write(`
                <tr>
                    <td>${index}</td>
                    <td><img src="${db_user.avatarUrl}">${db_user.username ? htmlEncode(db_user.username) : db_user.username}</td>
                    <td>${db_user.level}</td>
                </tr>
            `);
            index++;        
        }
        res.write(`
            </table>
            <br><br>
        `);
    });
    res.end(`</body>`);
}));

app.listen(8081, () => {
    console.info('Running on port 8081');
});

app.use((err, req, res) => {
    switch (err.message) {
        case 'NoCodeProvided': {
            return res.status(400).send({
                status: 'ERROR',
                error: err.message,
            });
        }
        default: {
            return res.status(500).send({
                status: 'ERROR',
                error: err.message,
            });
        }
    }
});