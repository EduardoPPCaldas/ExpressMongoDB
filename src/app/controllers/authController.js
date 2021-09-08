require("dotenv").config()

const express = require("express")
const bcrypt = require("bcryptjs")
const User = require("../models/user")
const jwt = require("jsonwebtoken")
const crypto = require('crypto')
const mailer = require('../../modules/mailer')

const router =  express.Router()

function generateToken(params = {}){
  return jwt.sign(params, process.env.SECRET_HASH_JWT,{
    expiresIn:86400
  })
}

router.post("/register", async (req, res)=>{
  const {email} = req.body
  try {
    if(await User.findOne({ email })){
      return res.status(400).json({
        "error": "Usuário já existe"
      })
    }

    const user = await User.create(req.body)

    user.password = undefined

    return res.send({ user, token: generateToken({id: user.id}) })
  } catch (error) {
    return res.status(400).send({"error" : "registration failed"})
  }
})

router.post("/authenticate", async (req, res)=>{
  const { email, password } = req.body
  const user = await User.findOne({
    email
  }).select('+password') //Password select = false, this way we can get the password

  if(!user){
    return res.status(400).send({ "error": "User not found" })
  }
  
  if(!await bcrypt.compare(password, user.password)){
    return res.status(400).send({ "error": "Invalid password" })
  }

  user.password = undefined

  res.json({user, token : generateToken({id: user.id})})
})

router.post("/forgot_password", async (req, res)=>{
  const { email } = req.body
  try {
    const user = await User.findOne({ email })
    if(!user){
      return res.status(400).send({ "error": "User not found" })
    }

    const token = crypto.randomBytes(20).toString('hex')

    const now = new Date()
    now.setHours(now.getHours() + 1)

    await User.findByIdAndUpdate(user.id, {
      '$set':{
        passwordResetToken: token,
        passwordResetExpires: now
      }
    })

    mailer.sendMail({
      to: email,
      from: "eduardocaldas.dev@gmail.com",
      html: `<p>Você esqueceu sua senha? Não tem problema, utilize esse token: ${token}</p>`,
    }, (err)=>{
      if(err) return res.status(400).send({error: "Cannot send forgot password email"})

      return res.send()
    })

  } catch (error) {
    res.status(400).send({
      "error": "Error on forgot password, try again"
    })
  }
})

router.post("/reset_password", async (req, res)=>{
  const { email, token, password } = req.body
  try {
    const user = await User.findOne({ email }).select('+passwordResetToken passwordResetExpires')

    if(!user){
      return res.status(400).send({"error": "User not found"})
    }

    if(token !== user.passwordResetToken){
      return res.status(400).send({"error": "Invalid token"})
    }

    const now = new Date()

    if(now > user.passwordResetExpires){
      return res.status(400).send({"error": "Token expired, generate a new one"})
    }

    user.password = password

    await user.save()
    return res.send()

  } catch (error) {
    res.status(400).send({
      "error": "cannot reset password, try again"
    })
  }
})

module.exports = (app) => app.use("/auth", router)