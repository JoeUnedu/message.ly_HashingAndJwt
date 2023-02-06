/** User Routes for messagely */

const express = require("express");
const { route } = require("../app");
const { ensureCorrectUser } = require("../middleware/auth.js")

const User = require("../models/userModel");

const router = new express.Router();


/** GET / - get list of users.
 *
 * => {users: [{username, first_name, last_name, phone}, ...]}
 *
 **/
router.get("/", async function (req, res, next) {
    /** get / returns a list of users.
        
        list is empty when no users are found.
      
    */

    try {
        const allUsers = await User.all();
        return res.json({ users: allUsers });

    } catch (error) {
        next(error);
    }

})


/** GET /:username - get detail of users.
 *
 * => {user: {username, first_name, last_name, phone, join_at, last_login_at}}
 *
 **/
router.get("/:username", async function (req, res, next) {
    /** get /:username returns the details about the specified users.
        
        list is empty when no users are found.
      
    */

    try {
        const userDetails = await User.get(req.params.username);
        return res.json({ user: userDetails });

    } catch (error) {
        return next(error);
    }



})


/** GET /:username/to - get messages to user
 *
 * => {messages: [{id,
 *                 body,
 *                 sent_at,
 *                 read_at,
 *                 from_user: {username, first_name, last_name, phone}}, ...]}
 *
 **/


router.get("/:username/to", ensureCorrectUser, async function (req, res, next) {
    /** get /:username/to returns all messages sent to the specified user.
        
        list is empty when there are no messages found to the user OR when
         the user does not exist.
      
    */

    try {
        const toMsgs = await User.messagesTo(req.params.username);
        return res.json({ messages: toMsgs });

    } catch (error) {
        return next(error);
    }

})


/** GET /:username/from - get messages from user
 *
 * => {messages: [{id,
 *                 body,
 *                 sent_at,
 *                 read_at,
 *                 to_user: {username, first_name, last_name, phone}}, ...]}
 *
 **/

router.get("/:username/from", ensureCorrectUser, async function (req, res, next) {
    /** get /:username/from returns all messages sent from the specified user.
        
        list is empty when there are no messages found from the user OR when
         the user does not exist.
      
    */

    try {
        const fromMsgs = await User.messagesFrom(req.params.username);
        return res.json({ messages: fromMsgs });

    } catch (error) {
        return next(error);
    }

})


module.exports = router;
