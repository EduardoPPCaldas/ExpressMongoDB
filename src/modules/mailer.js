const nodemailer = require('nodemailer')
const hbs = require("nodemailer-express-handlebars")
const path = require('path')
require("dotenv").config()

const transport = nodemailer.createTransport({
  host: process.env.HOST_MAILER,
  port: process.env.PORT_MAILER,
  auth: {
    user: process.env.AUTH_USER_MAILER,
    pass: process.env.AUTH_USER_PASS
  }
});

transport.use('compile', hbs({
  viewEngine: 'handleBars',
  viewPath: path.resolve('./src/resources/mail/'),
  extName: '.html'
}))

module.exports = transport