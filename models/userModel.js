/** User class for Message.ly */

const bcrypt = require("bcrypt");
const db = require("../db");

const { CFG_BCRYPT_WORK_FACTOR } = require("../config");

const ExpressError = require("../expressError");

/** User of the site. */

class User {

  /** register new user -- returns
   *    {username, password, first_name, last_name, phone}
   */

  static async register({ username, password, first_name, last_name, phone }) {

    // username, password, first_name, last_name, phone are all required.
    // for now, just check them all at once.
    if (!username || !password || !first_name || !last_name || !phone) {
      // throw new ExpressError("username, password, first_name, last_name, and phone are required.");
      // throw new Error("username, password, first_name, last_name, and phone are required.");
      throw new ExpressError("username, password, first_name, last_name, and phone are required.", 400);
    }

    const dbUserName = username.trim();
    const dbFirstName = first_name.trim();
    const dbLastName = last_name.trim();
    const dbPhone = phone.trim();
    const dbNow = new Date();

    // hash the password.
    const dbPassword = await bcrypt.hash(password, CFG_BCRYPT_WORK_FACTOR);

    try {
      const results = await db.query(`
        INSERT INTO users
        (username, password, first_name, last_name, phone, join_at, last_login_at) 
        VALUES ($1, $2, $3, $4, $5, $6, $7) 
        RETURNING username, password, first_name, last_name, phone 
      `, [dbUserName, dbPassword, dbFirstName, dbLastName, dbPhone, dbNow, dbNow]);

      return results.rows[0];

    } catch (error) {
      // check for duplicate key error
      if (error.code === "23505") {
        throw new ExpressError(`Username '${username}' already exists. Please select a different username.`, 400);
      }
      // throw other error
      throw new ExpressError(error, 500);
    }

  }


  /** Authenticate: is this username/password valid? Returns boolean. */

  static async authenticate(username, password) {
    /*  authenticate() method determines whether the username and password are valid
         and returns true when they are valid.

        authenticate() method throws an error when the username and/or password are 
         missing and when the username and password are invalid. username not found 
         or invalid password result in the same message.

    */

    // username and password are all required.
    // for now, just check them all at once.
    if (!username || !password) {
      // throw new ExpressError("Both username and password are required.", 400);
      return false;
    }

    // trim leading and trailing spaced from user name. password is gigo
    const dbUserName = username.trim();

    const dbUser = await db.query(`
      SELECT username, password
      FROM   users
      WHERE  username = $1
    `, [dbUserName])

    // was the user found?
    if (dbUser.rows[0]) {
      // user was found. check their password.
      if (await bcrypt.compare(password, dbUser.rows[0].password) === true) {
        return true;
      }

    }

    // user and / or password is invalid. The same error message is used when
    //  username was not found and when username was found but the password was 
    //  incorrect.
    // throw new ExpressError("The username and / or password are invalid.", 400);
    return false;

  }


  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) {
    /*  updateLoginTimestamp() method updates the last_login_at field in the 
         users table for the specified username.

        updateLoginTimestamp does not return a value. 

        An error is thrown in the unlikely event that the user does not exist.        

    */

    if (username) {
      // username was found
      const dbUserName = username.trim();
      const dbNow = new Date();

      const dbUpdate = await db.query(`
        UPDATE    users
        SET       last_login_at = $2 
        WHERE     username = $1
        RETURNING username, last_login_at
      `, [dbUserName, dbNow])

      if (dbUpdate.rows[0]) {
        return;
      }

    }

    // username was not found.
    throw new ExpressError("username not found.", 404);

  }


  /** All: basic info on all users:
   * [{username, first_name, last_name, phone}, ...] */

  static async all() {

    const dbResult = await db.query(`
      SELECT username, first_name, last_name, phone
      FROM   users
    `);

    return dbResult.rows;

  }


  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */

  static async get(username) {

    // username is required.
    if (username) {

      const dbResult = await db.query(`
          SELECT username, first_name, last_name, phone, join_at, last_login_at
          FROM   users
          WHERE  username = $1
        `, [username.trim()]);

      if (dbResult.rows.length > 0) {
        return dbResult.rows[0];
      } else {
        throw new ExpressError(`Username '${username.trim()}' was not found.`, 404);
      }

    } else {
      // username was not provided.
      throw new ExpressError("Both username and password are required.", 400);
    }

  }


  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesFrom(username) {

    if (!username) {
      throw new ExpressError(`Username '${username.trim()}' was not found.`, 404);
    }

    const dbUserName = username.trim();

    const dbMsgs = await db.query(`
      SELECT   msg.id AS id, msg.body AS body, msg.sent_at AS sent_at, 
               msg.read_at AS read_at, 
               msg.to_username AS username, usr.first_name AS first_name, 
               usr.last_name AS last_name, usr.phone AS phone
      FROM     messages AS msg 
      JOIN     users AS usr ON msg.to_username = usr.username 
      WHERE    msg.from_username = $1 
      ORDER BY sent_at 
    `, [dbUserName]);

    if (dbMsgs.rows.length > 0) {
      const fromMsgs = dbMsgs.rows.map(row => {
        return {
          id: row.id,
          to_user: {
            username: row.username,
            first_name: row.first_name,
            last_name: row.last_name,
            phone: row.phone
          },
          body: row.body,
          sent_at: row.sent_at,
          read_at: row.read_at
        }
      })
      return fromMsgs;
    } else {
      return {};
    }

  }


  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {id, first_name, last_name, phone}
   */

  static async messagesTo(username) {

    if (!username) {
      throw new ExpressError(`Username '${username.trim()}' was not found.`, 404);
    }

    const dbUserName = username.trim();

    const dbMsgs = await db.query(`
      SELECT   msg.id AS id, msg.body AS body, msg.sent_at AS sent_at, 
               msg.read_at AS read_at, 
               msg.from_username AS username, usr.first_name AS first_name, 
               usr.last_name AS last_name, usr.phone AS phone
      FROM     messages AS msg 
      JOIN     users AS usr ON msg.from_username = usr.username 
      WHERE    msg.to_username = $1 
      ORDER BY sent_at 
    `, [dbUserName]);

    if (dbMsgs.rows.length > 0) {
      const msgs = dbMsgs.rows.map(row => {
        return {
          id: row.id,
          from_user: {
            username: row.username,
            first_name: row.first_name,
            last_name: row.last_name,
            phone: row.phone
          },
          body: row.body,
          sent_at: row.sent_at,
          read_at: row.read_at
        }
      })
      return msgs;
    } else {
      return {};
    }

  }

}


module.exports = User;