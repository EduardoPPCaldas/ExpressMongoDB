const express = require("express")
const app = express()

app.use(express.json())
app.use(express.urlencoded({
  extended: false
}))

require("./controllers/authController")(app)

app.listen(8000, ()=>{console.log("Server is working!")})