import express from 'express'
import cors from 'cors'
import joi from 'joi'
import { MongoClient } from 'mongodb'
import dayjs from 'dayjs'

const app = express()

// Configs
app.use(cors())
app.use(express.json())
const mongoClient = new MongoClient("mongodb://localhost:27017")
let db

try {
    await mongoClient.connect()
    db = mongoClient.db("")
} catch (err) {
    console.log(err)
}

const userSchema = joi.object({
    name: joi.string().required(),
})

app.get('/participants', async (req, res) => {

    try {
        const participants = await db.collection("participants").find().toArray()
        res.send(participants)
    } catch (err) {
        console.log(err)
        res.sendStatus(500)
    }
})

app.post('/participants', async (req, res) => {
    const body = req.body

    const validation = userSchema.validate(body, {abortEarly: false})

    if (validation.error) {
        const errors = validation.error.details.map(detail => detail.message)
        res.status(422).send(errors)
        return
    }
    
    try {
        const participants = await db.collection("participants").find().toArray()
        const found = participants.find((p) => p.name === body.name)
        if (found) {
            res.status(409).send({ error: "Usuário já existe." })
            return
        }

        const user = {
            name: body.name,
            lastStatus: Date.now()
        }

        const message = {
            from: body.name,
            to: "Todos",
            text: "entra na sala...",
            type: "status",
            time: dayjs(Date.now()).format('HH:mm:ss')
        }

        db.collection("participants").insertOne(user)
        db.collection("messages").insertOne(message)
        res.sendStatus(201)
    } catch (err) {
        res.sendStatus(500).send(err)
    }    
})

app.listen(5000, () => {
    console.log(`Server running in port: ${5000}`);
  });