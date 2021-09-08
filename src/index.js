const express = require("express")
const app = express()

app.use(express.json())
app.use(express.urlencoded({
  extended: false
}))

require("./app/controllers/index.js")(app)


app.listen(8000, ()=>{console.log("Server is working!")})