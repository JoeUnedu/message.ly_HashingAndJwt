/** Message Routes for Message.ly */

const express = require("express");

const Message = require("../models/messageModel");
const { ensureCorrectUser, ensureLoggedIn } = require("../middleware/auth.js")

const router = new express.Router();


/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Make sure that the currently-logged-in users is either the to or from user.
 *
 **/
router.get("/:id", ensureLoggedIn, async function (req, res, next) {

    try {
        const msgDetail = await Message.get(req.params.id);

        if ((msgDetail.from_user.username === req.user.username) ||
            (msgDetail.to_user.username === req.user.username)) {

            return res.json({ message: msgDetail });

        } else {
            // currently logged in user has no relation to the message.
            return next({ status: 401, message: "Unauthorized" });
        }

    } catch (error) {
        return next(error);
    }

})


/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/
router.post("/", ensureLoggedIn, async function (req, res, next) {

    try {
        const newMessage = await Message.create({
            from_username: req.user.username,
            to_username: req.body.to_username,
            body: req.body.body
        });

        return res.json({ message: newMessage });

    } catch (error) {
        return next(error);
    }

})


/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Make sure that the only the intended recipient can mark as read.
 *
 **/
router.post("/:id/read", ensureLoggedIn, async function (req, res, next) {

    // get the message associated with the id, make sure the logged in user
    //  is the 'to_user' of the message and update the read_at time.
    try {
        const msgDetail = await Message.get(req.params.id);

        if (msgDetail.to_user.username === req.user.username) {

            //const msgRead = await Message.markRead(req.params.id);
            const msgRead = await Message.markRead(msgDetail.id);

            return res.json({ message: msgRead });

        } else {
            // currently logged in user is not the recipient of the message.
            return next({ status: 401, message: "Unauthorized" });
        }

    } catch (error) {
        return next(error);
    }

})


module.exports = router;
