require("dotenv").config()

const express = require("express")
const bcrypt = require("bcryptjs")
const User = require("../models/user")
const jwt = require("jsonwebtoken")

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

module.exports = (app) => app.use("/auth", router)