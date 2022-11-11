import express from 'express'
import cors from 'cors'
import joi from 'joi'
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

const userSchema = joi.object({
    name: joi.string().required()
})

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

app.post('/participants', async (req, res) => {
    const user = req.body

    const validation = userSchema.validate(user, {abortEarly: false})

    if (validation.error) {
        const errors = validation.error.details.map(detail => detail.message)
        res.sendStatus(422).send(errors)
        return
    }

    db.collection("participants")
    .find()
    .toArray()
    .then((participants) => {
        const found = participants.find((p) => p.name === name)
        if (found) {
            res.status(409).send({ error: "Usuário já existe." })
            return
        }

        const user = {
            name,
            lastStatus: Date.now()
        }

        db.collection("participants").insertOne(user)
        res.sendStatus(201)
    }).catch(err = console.log(err))

    
})

app.listen(6000, () => {
    console.log(`Server running in port: ${6000}`);
  });