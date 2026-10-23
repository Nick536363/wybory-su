const express = require("express")
const format = require("node.date-time")
const { DatabaseSync } = require("node:sqlite")
require("dotenv").config()
const db = new DatabaseSync(__dirname+"/"+process.env.DB_NAME)
const app = express()
const PORT = process.env.PORT


// CREATE

const newID = db.prepare("INSERT INTO IDs (ID) VALUES (?);")

// READ

const getID = db.prepare("SELECT ID FROM IDs WHERE ID = ?;")
const allID = db.prepare("SELECT ID FROM IDs")



function log(file, message){
    let date = new Date().format("Y-MM-dd HH:mm:SS")
    fs.appendFile(file, `${date} ${message}\n`, (err)=>{
        if(err){
            console.log(err)
        }
    })
    
}

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.set('view engine', 'ejs');



app.get("/", (req, res) => {
    return res.sendFile(`${__dirname}/templates/index.html`)
    
})

app.post("/confirm", (req, res) => {
    ID = getID.get(parseInt(req.body.ID))
    if(ID == undefined){
        newID.run(req.body.ID)
        return res.redirect("/")
    }
    else{
        res.sendFile(`${__dirname}/templates/exists.html`)
    }

})




app.listen(PORT, () => {})