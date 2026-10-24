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
const getUser = db.prepare("SELECT ID, pass, salt, status FROM users WHERE username = ?;")
const allUsers = db.prepare("SELECT * FROM users;")


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

// LOGIN

app.get("/login", (req, res) => {
    return res.render(`${__dirname}/templates/login.ejs`, {action: "/login"})
})

app.post("/login", (req, res) => {
    const user = req.body.login
    const userdata = getUser.get(user)
    if(!userdata){
        return res.redirect("/login")
    }
    const salt = userdata.salt
    const hashed_passwd = crypto.scryptSync(req.body.pass, salt, 64)
    if(crypto.timingSafeEqual(Buffer.from(userdata.pass, "hex"), hashed_passwd)){
        req.session.user = userdata.ID
        return res.redirect("/")
    }
    return res.redirect("/login")
})

// PANEL LOGIN

app.get("/panel_login", (req, res) => {
    if(!req.session.user){
        return res.redirect("/login")
    }
    return res.render(`${__dirname}/templates/login.ejs`, {action: "/panel_login"})
})

app.post("/panel_login", (req, res) => {
    const user = req.body.login
    const userdata = getUser.get(user)
    if(!userdata){
        return res.redirect("/panel_login")
    }
    const salt = userdata.salt
    const hashed_passwd = crypto.scryptSync(req.body.pass, salt, 64)
    if(crypto.timingSafeEqual(Buffer.from(userdata.pass, "hex"), hashed_passwd) && userdata.status == "admin"){
        req.session.admin = userdata.ID
        return res.redirect("/panel")
    }
    return res.redirect("/panel_login")
})


// PANEL

app.get("/panel", (req, res) => {
    if(!req.session.user){
        return res.redirect("/login")
    }
    else if(!req.session.admin){
        return res.redirect("/")
    }

    let users = allUsers.all()

    return res.render(`${__dirname}/templates/panel.ejs`, {users: users})
})


// MAIN

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