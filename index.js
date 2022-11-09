import express from 'express'
import cors from 'cors'
import { MongoClient } from 'mongodb'

const app = express()

// Configs
app.use(cors())
app.use(express.json())
const mongoClient = new MongoClient("mongodb://localhost:27017")
let db

mongoClient.connect()
    .then(() => {
    db = mongoClient.db("")
    })
    .catch(err => console.log(err))

app.get('/participants', (req, res) => {
    db.collection("participants")
    .find()
    .toArray()
    .then((participants) => {
        res.send(participants)
    })
    .catch((err) => {
        console.log(err)
        res.sendStatus(500)
    })
})

app.listen(4000, () => {
    console.log(`Server running in port: ${4000}`);
  });