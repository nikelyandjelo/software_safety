const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const SERVER_PORT = 3000;
const { AuthenticationClient, UserInfoClient } = require('auth0');

const { auth } = require('express-oauth2-jwt-bearer');

const AUTHENTICATION_HEADER = 'Authorization';

const authenticationClient = new AuthenticationClient({
    domain: 'dev-tyadv4mn38acpd24.us.auth0.com',
    clientId: 'w450yyzWEY1GyCHj8Latq8tNsDZqWGpo',
    clientSecret: 'HA_SE9n3v2zh2L6WRqd4LRx3F2FAXajsWKCbBBRqsmFOK7wKMfDO1BXPMHWJVUra',
});

const uiClient = new UserInfoClient({
    domain: 'dev-tyadv4mn38acpd24.us.auth0.com',
});

const verifyJwt = auth({
    audience: 'https://dev-tyadv4mn38acpd24.us.auth0.com/api/v2/',
    issuerBaseURL: `https://dev-tyadv4mn38acpd24.us.auth0.com/`,
});

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/api/redirect', (_, res) => { // Редірект з параметрами
    return res.redirect(301,
        `https://dev-tyadv4mn38acpd24.us.auth0.com/authorize
        ?client_id=YNf99vxIkTuiN8gFH3a3G6dcfPIb4lTB
        &redirect_uri=http://localhost:3000/
        &response_type=code
        &response_mode=query
        &scope=offline_access+openid+profile
        &audience=https://dev-tyadv4mn38acpd24.us.auth0.com/api/v2/
        &prompt=login
    `);
});

app.use( async (req, _, next) => {
    let user = {};
 
    try {
        const token = req.get(AUTHENTICATION_HEADER);
        if (token) {
            const { data } = await uiClient.getUserInfo(token);
            user = data;
        }
    } catch (err) {
        console.log('Authentication error: ' + err);
     }
    req.user = user;
    next();
});

app.get('/api/profile', verifyJwt, async (req, res) => {
    const auth = req.auth;
    if (auth) {
        const token = auth.token;
        const { data } = await uiClient.getUserInfo(token);
        console.log('jwt verified successfully');
        return res.json(data);
    }
    console.log('failed to verify jwt');
    return res.status(401).json({'errormsg' : 'jwt verification failed'});
});

app.get('/', (req, res) => {
    if (req.user.nickname) {
        return res.json(
            req.user
        )
    }
    res.sendFile(path.join(__dirname+'/index.html'));
})

app.post('/api/login', async (req, res) => {
    const { login, password } = req.body;

    try {
        const { data } = await authenticationClient.oauth.passwordGrant({
            grantType: 'password',
            username: login,
            password,
            scope: 'offline_access openid',
            audience: 'https://dev-tyadv4mn38acpd24.us.auth0.com/api/v2/',
        });
        res.json(data).send();
    } catch (err) {
        console.log(err);
        res.status(401).send();
    }
});

app.post('/api/refresh', async (req, res) => {
    const refresh_token = req.get(AUTHENTICATION_HEADER);
    const { data } = await authenticationClient.oauth.refreshTokenGrant({ refresh_token });
    console.log('refresh token: ' + refresh_token);
    res.json(data).send();
});

app.listen(SERVER_PORT, () => {
    console.log(`This app listening on port ${SERVER_PORT}`)
})
