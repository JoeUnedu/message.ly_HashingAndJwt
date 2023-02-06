/** Authentication Routes for Message.ly */

const express = require("express");
const jwt = require("jsonwebtoken");
const ExpressError = require("../expressError");

const User = require("../models/userModel");

const router = new express.Router();

const { CFG_SECRET_KEY } = require("../config");


/** POST /login - login: {username, password} => {token}
 *
 * Make sure to update their last-login!
 *
 **/
router.post("/login", async function (req, res, next) {

    try {
        // authenticate either returns true when username and password match
        //  or throws an error for user not found or invalid password.
        if (await User.authenticate(req.body.username, req.body.password)) {

            const username = req.body.username.trim()
            await User.updateLoginTimestamp(username);

            let token = jwt.sign({ username }, CFG_SECRET_KEY);
            return res.json({ token });
        } else {
            throw new ExpressError("The username and / or password are invalid.", 400);
        }

    } catch (error) {

        return next(error);
        // return next(new ExpressError(error.message, 400));
    }

})


/** POST /register - register user: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 *
 *  Make sure to update their last-login!
 */
router.post("/register", async function (req, res, next) {

    try {
        const results = await User.register(req.body)

        // token will consist of only the username.
        let token = jwt.sign({ username: results.username }, CFG_SECRET_KEY);
        return res.json({ token });

    } catch (error) {

        return next(error);

    }

})

module.exports = router;