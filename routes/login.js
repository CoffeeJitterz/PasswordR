const express = require('express');
const router  = express.Router();
const bcrypt = require('bcrypt');
const cookieSession = require('cookie-session');

const {Pool} = require('pg');
const pool = new Pool ({
  user:'labber',
  password: 'labber',
  host:'localhost',
  database: 'midterm'
})


module.exports = (db) => {
  router.get("/", (req, res) => {
    const templateVars = {email: req.session.email};
    res.render("login", templateVars);
  });

  const getUserWithEmail = function (email) {
    // console.log("getting email");
    return pool
    .query ( `SELECT * FROM users WHERE email = $1` , [email.toLowerCase()])
    .then((result) => {
      // console.log ("result.rows: ", result.rows[0]);
      return result.rows[0];
    })
    .catch((err) => {
      // console.log("line 28", err);
      return null;
    })
  }
  exports.getUserWithEmail = getUserWithEmail;

  const login = function(email, password) {
    // console.log("getting login");
    return getUserWithEmail(email)
    .then(user =>{
       //if ("password" === user.user_password)
      if (bcrypt.compareSync(password, user.user_password))
      {
        // console.log("line 43 ", user);
        return user;
      }
      return null;
    })
  }
  exports.login = login;

  router.post("/", (req, res) => {
    const{email, password} = req.body;

    login(email, password)
    // console.log("line 52")
    .then (user => {
      //  console.log("!!!!!!!!!!!!!!!", user);
      if(!user) {
        res.status(403).send("please check your username and password again. :) ");
        // res.send({error: "error"});
        return;
      }
      req.session.id = user.id;
      req.session.email = user.email; // create an id key with the value of user.id === 1
      console.log("id", req.session.id , "email", req.session.email);


      return pool
      .query(`SELECT organization_id
              FROM users_organizations
              WHERE user_id = ${user.id}`)
      .then((result) => {
        // console.log("line 73_organization_id: ", result.rows[0]);
        req.session = {id: user.id, email: user.email, org_id: result.rows[0].organization_id};
        // console.log("line 75", req.session);
        res.redirect('/');
      })
    })
    .catch(e => {console.log("line 67",e); res.send(e)});
  })

  router.post('/logout', (req, res) => {
    req.session = null;
    res.redirect("/");
  });

  return router;
};