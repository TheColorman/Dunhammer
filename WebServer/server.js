const express = require('express'),
    path = require('path'),
    cookieParser = require('cookie-parser'),
    rateLimit = require('express-rate-limit'),
    { catchAsync } = require('./utils'),
    fetch = require('node-fetch'),

//const session = require('express-session');
    //{ guild_config } = require('./api/loki'),
//const { token } = require('../token.json');

    app = express(),
    client_id = "671681661296967680",
    limiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // limit each IP to 100 requests per windowMs
        message: "Too many requests from this IP, please try again after 15 minutes"
    }),

    MySQL = require("../sql/sql"),
    { mysqlPassword } = require("../token.json"),
    { mysql_login } = require("../config.json"),
    sql = new MySQL({ host: mysql_login.host, user: mysql_login.user, password: mysqlPassword, database: mysql_login.database })

    
// Yes im doing this again
process.on('uncaughtException', async (err) => {
    console.error("DUNHAMMER HAS CRASHED, PREVENTING SHUTDOWN. ERROR:");
    console.error(err);
});


// Routes
app.use('/api/discord', require('./api/discord'));

app.use(limiter);

app.use(cookieParser(client_id));
app.set('etag', false);

app.use('/images', express.static(__dirname + '/../data/levelupBackgrounds'));

app.get('/', (req, res) => {
    res.status(200).sendFile(path.join(__dirname, 'index.html'));
});

app.get('/leaderboards', (req, res) => {
    return res.send("Leaderboards currently don't work because I'm a big dumb dumb who forgot to update it to MySQL.");
});
app.get('/disable', (req, res) => {
    return res.send("The website is still Work In Progress, so I can't opt you out of the Global Leaderboard! Come back at a later date. (check Dunhammer for updates)");
});
//#region leaderboards
/*
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
*/
//#endregion

app.get('/buy', catchAsync(async (req, res) => {
    if (!req.signedCookies.access_token) return res.send(`<h3>Please <a href="/api/discord/login">log in</a> and try again.</h3>`);

    const
        apiUser = await (await fetch(`https://discord.com/api/users/@me`, {
            headers: {
                'authorization': `Bearer ${req.signedCookies.access_token}`
            }
        })).json();
    if (!apiUser.id) return res.send(`<h3>Something went wrong :(</h3>`);
    const DBUser = await sql.getDBUser({
            id: apiUser.id,
            username: apiUser.username,
            tag: `${apiUser.username}#${apiUser.discriminator}`
        }),
        coins = DBUser.coins,
        purchased = DBUser.backgrounds & 1,
        purchased2 = DBUser.backgrounds & 16,
        purchased3 = DBUser.backgrounds & 32,
        purchased4 = DBUser.backgrounds & 64;

    if (req.query.background) {
        const background = req.query.background;
        if ([1, 16].includes(background)) return res.send(`<h3>You either already have this background or it doesn't exist.</h3>`);
        if (background == 1) {
            if (coins < 1000) return res.send(`<h3>You only have ${coins} Coins, but you need at least 1000 to buy this background!</h3>`);
            await sql.update(`users`, {
                coins: coins - 1000,
                backgrounds: DBUser.backgrounds - - background
            }, `id = ${apiUser.id}`);
            return res.send(`<h2>Bought background "Player". Go <a href="/buy">here</a> to select it.</h2>`)
        } else if (background == 16) {
            if (coins < 2000) return res.send(`<h3>You only have ${coins} Coins, but you need at least 2000 to buy this background!</h3>`);
            await sql.update(`users`, {
                coins: coins - 2000,
                backgrounds: DBUser.backgrounds - - background
            }, `id = ${apiUser.id}`);
            return res.send(`<h2>Bought background "Linus". Go <a href="/buy">here</a> to select it.</h2>`)

        } else if (background == 32) {
            if (coins < 2000) return res.send(`<h3>You only have ${coins} Coins, but you need at least 2000 to buy this background!</h3>`);
            await sql.update(`users`, {
                coins: coins - 2000,
                backgrounds: DBUser.backgrounds - - background
            }, `id = ${apiUser.id}`);
            return res.send(`<h2>Bought background "Violet". Go <a href="/buy">here</a> to select it.</h2>`)

        } else if (background == 64) {
            if (coins < 2000) return res.send(`<h3>You only have ${coins} Coins, but you need at least 3000 to buy this background!</h3>`);
            await sql.update(`users`, {
                coins: coins - 3000,
                backgrounds: DBUser.backgrounds - - background
            }, `id = ${apiUser.id}`);
            return res.send(`<h2>Bought background "Approaching". Go <a href="/buy">here</a> to select it.</h2>`)
        }
    }    

    return res.send(
        `<h2>Coins: ${coins}</h2> <a href="/buy-coins">Buy coins</a> <br> <a href="/">Home</a> <br>
<h2>Your backgrounds:</h2> <br>
<img src="images/0.png" width="300"> <br> <p>Deep Black  <a href="/select?background=0">Select</a></p>
<br>${purchased ? `<img src="images/1.png" width="300"> <br> <p>Player  <a href="/select?background=1">Select</a></p>` : `<h2>Purchase backgrounds:</h2>
<br><img src="images/1.png" width="300"> <br> <p>Player  <a href="/buy?background=1">Purchase</a> for 1000 Coins</p>`}
<br>${purchased2 ? `<img src="images/16.png" width="300"> <br> <p>Linus  <a href="/select?background=16">Select</a></p>` : `<h2>Purchase backgrounds:</h2>
<br><img src="images/16.png" width="300"> <br> <p>Linus  <a href="/buy?background=16">Purchase</a> for 2000 Coins</p>`}
<br>${purchased3 ? `<img src="images/32.png" width="300"> <br> <p>Violet  <a href="/select?background=32">Select</a></p>` : `<h2>Purchase backgrounds:</h2>
<br><img src="images/32.png" width="300"> <br> <p>Violet  <a href="/buy?background=32">Purchase</a> for 2000 Coins</p>`}
<br>${purchased4 ? `<img src="images/64.png" width="300"> <br> <p>Approaching  <a href="/select?background=64">Select</a></p>` : `<h2>Purchase backgrounds:</h2>
<br><img src="images/64.png" width="300"> <br> <p>Approaching  <a href="/buy?background=64">Purchase</a> for 3000 Coins</p>`}`
    );
}));

app.get('/select', catchAsync(async (req, res) => {
    if (!req.signedCookies.access_token) return res.send(`<h3>Please <a href="/api/discord/login">log in</a> and try again.</h3>`);
    const
        background = req.query.background,
        apiUser = await (await fetch(`https://discord.com/api/users/@me`, {
            headers: {
                'authorization': `Bearer ${req.signedCookies.access_token}`
            }
        })).json(),
        DBUser = await sql.getDBUser({
            id: apiUser.id,
            username: apiUser.username,
            tag: `${apiUser.username}#${apiUser.discriminator}`
        }),
        purchased = background == 0 ? true : DBUser.backgrounds & background;
    if (!purchased) return res.send(`<h3>You can't select a background that you haven't <a href="/buy">purchased</a>!`);
    await sql.update(`users`, {
        currentBackground: background
    }, `id = ${apiUser.id}`);
    const names = {
            0: "Deep Black",
            1: "Player",
            16: "Linus",
            32: "Violet",
            64: "Approaching"
        },
        bgname = names[background];
    return res.send(`<h2>Background ${bgname} selected.</h2>`)
}));

const StripeKey =
        "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", // dont fucking change this i cant get it back
    stripe = require("stripe")(StripeKey);

app.get(
    "/buy-coins",
    catchAsync(async (req, res) => {
        if (!req.signedCookies.access_token)
            return res.send(
                `<h3>Please <a href="/api/discord/login">log in</a> and try again.</h3>`
            );
        if (!req.query.amount) {
            return res.send(`
            <a href="/buy-coins?amount=500">500 coins - 10 DKK</a>
        `);
        }

        return res.send(`
    <script>
        fetch('https://dunhammer.colorman.me/checkout', {
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ hello: "world" }),
        }).then(async response => {
            const json = await response.json();
            window.location.href = json.url;
        });
    </script>
    `);
    })
);

app.post(
    "/checkout",
    catchAsync(async (req, res) => {
        if (!req.signedCookies.access_token)
            return res.send(
                `<h3>Please <a href="/api/discord/login">log in</a> and try again.</h3>`
            );

        const session = await stripe.checkout.sessions.create({
            mode: "payment",
            payment_method_types: ["card"],
            line_items: [
                {
                    price: "price_1Jq5G1DIIUixlAyCqAZx0nLE",
                    quantity: 1,
                },
            ],
            success_url:
                "https://dunhammer.colorman.me/success?session_id={CHECKOUT_SESSION_ID}",
            cancel_url: "https://dunhammer.colorman.me/buy",
        });

        res.send(session);
    })
);

app.get(
    "/success",
    catchAsync(async (req, res) => {
        if (!req.query.session_id) return res.send(`<script> window.location.href="/buy"</script>`);
        if (!req.signedCookies.access_token) return res.send(`Something went wrong and you've been logged out before I could send you the coins! Please copy the website URL and <a href="/api/discord/login">log in</a>. Then go back to this URL to receive your coins. (contact me if it still doesnt work).`);

        // Santize the session ID
        const sessionIdSanitized = sql.escape(req.query.session_id);


        const DBStripeEvent = (await sql.get(`stripe_events`, `id = "${sessionIdSanitized}"`))[0];
        if (DBStripeEvent.processed) return res.send(`This transaction ID has already received their coins!<br><a href="/buy">Home</a>`);

        const
            apiUser = await (
                await fetch(`https://discord.com/api/users/@me`, {
                    headers: {
                        authorization: `Bearer ${req.signedCookies.access_token}`,
                    }
                })
            ).json(),
            DBUser = await sql.getDBUser({
                id: apiUser.id,
                username: apiUser.username,
                tag: `${apiUser.username}#${apiUser.discriminator}`,
            });
        
        await sql.update(`users`, { coins: parseInt(DBUser.coins) + 500 }, `id = ${apiUser.id}`);
        await sql.update(`stripe_events`, { processed: true }, `id = "${sessionIdSanitized}"`);

        console.log(`User with ID "${apiUser.id}"" and username "${apiUser.username}#${apiUser.discriminator}" just spent 10 DKK in the shop.`);

        return res.send(`
    Thank you for your purchase. <br>
    <a href="/buy">Home</a>
    `);
    })
);

const endpointSecret = 'whsec_LR4YSGpegBJplvr1X4Hoge31miTueY1y';
app.post(
    '/stripe-webhook',
    express.raw({type: 'application/json'}),
    catchAsync(async (req, res) => {
        const sig = req.headers['stripe-signature'];

        let event;

        try {
            event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
        }
        catch (err) {
            console.log(err);
            // Sanitize error message for HTML
            const sanitizedError = err.toString().replace(/</g, '&lt;').replace(/>/g, '&gt;');
            res.status(400).send(`Webhook Error: ${sanitizedError}`);
            return;
        }

        res.json({ received: true });

        switch (event.type) {
            case "checkout.session.completed": {
                const
                    session = event.data.object,
                    DBStripeEvent = await sql.get(`stripe_events`, `id = "${session.id}"`);
                if (!DBStripeEvent.length) {
                    await sql.insert(`stripe_events`, { id: session.id });
                }
                break;
            }
            default: {
                console.log(`Unhandled event type ${event.type}`);
            }
        }
    })
);


app.listen(8081, () => {
    console.info('Serving webserver on port 8081');
});

/* app.use((err, req, res) => {
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
}); */