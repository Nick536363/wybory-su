const express = require("express")
const format = require("node.date-time")
const session = require("express-session")
const crypto = require("node:crypto")
const fs = require("fs")
const { DatabaseSync } = require("node:sqlite")
require("dotenv").config()
const db = new DatabaseSync(__dirname+"/"+process.env.DB_NAME)
const app = express()
const PORT = process.env.PORT


// CREATE

const newID = db.prepare("INSERT INTO IDs (ID) VALUES (?);")

// READ

const getID = db.prepare("SELECT ID FROM IDs WHERE ID = ?;")
const getPass = db.prepare("SELECT ID, pass, salt FROM users WHERE username = ?;")


function log(file, message){
    let date = new Date().format("Y-MM-dd HH:mm:SS")
    fs.appendFile(file, `${date} ${message}\n`, (err)=>{
        if(err){
            console.log(err)
        }
    })
    
}
app.use(session({
    secret: process.env.SECRET,
    saveUninitialized: false,
    resave: false,
    cookie: {
        httpOnly: true,
        sameSite: "lax"
    }
}))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.set('view engine', 'ejs');

app.use((req, res, next)=>{
    log("log.log", `${req.ip} wszedł na ${req.url} (${req.method})`)
    next()
})


app.get("/login", (req, res) => {
    return res.sendFile(`${__dirname}/templates/login.html`)
})

app.post("/login", (req, res) => {
    const user = req.body.login
    const passNsalt = getPass.get(user)
    if(!passNsalt){
        return res.redirect("/login")
    }
    const salt = passNsalt.salt
    const hashed_passwd = crypto.scryptSync(req.body.pass, salt, 64)
    if(crypto.timingSafeEqual(Buffer.from(passNsalt.pass, "hex"), hashed_passwd)){
        req.session.user = passNsalt.ID
        return res.redirect("/")
    }
    return res.redirect("/login")
})

app.get("/", (req, res) => {
    if(!req.session.user){
        return res.redirect("/login")
    }
    return res.sendFile(`${__dirname}/templates/index.html`)
    
})

app.post("/confirm", (req, res) => {
    if(!req.session.user){
        return res.redirect("/login")
    }
    ID = getID.get(parseInt(req.body.ID))
    if(ID == undefined){
        newID.run(req.body.ID)
        return res.redirect("/")
    }
    else{
        log("log.log", `${req.ip}: Identyfikator ${ID.ID} został przyłożony poraz kolejny`)
        return res.sendFile(`${__dirname}/templates/exists.html`)
    }

})




app.listen(PORT, () => {})