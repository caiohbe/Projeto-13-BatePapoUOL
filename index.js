import express from 'express'
import cors from 'cors'
import joi from 'joi'
import dotenv from 'dotenv'
import { MongoClient, ObjectId } from 'mongodb'
import dayjs from 'dayjs'

// Configs
const app = express()
app.use(cors())
app.use(express.json())
dotenv.config()
const mongoClient = new MongoClient(process.env.MONGO_URI)
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

const messageSchema = joi.object({
    to: joi.string().required(),
    text: joi.string().required(),
    type: joi.string().required(),
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
        res.status(500).send(err)
    }    
})

app.get('/participants', async (req, res) => {
    try {
        const participants = await db.collection("participants").find().toArray()
        res.send(participants)
    } catch (err) {
        res.status(500).send(err)
    }
})

app.post('/messages', async (req, res) => {
    const { to, text, type } = req.body
    const from = req.headers.user
    console.log(from)

    const validation = messageSchema.validate(req.body, {abortEarly: false})

    if (validation.error) {
        const errors = validation.error.details.map(detail => detail.message)
        res.status(422).send(errors)
        return
    }

    if (type !== 'message' && type !== 'private_message') {
        res.status(422).send('"type" inválido')
        return
    }

    try {
        const participants = await db.collection("participants").find().toArray()
        if (!participants.find(p => p.name === from)) {
            res.status(422).send('Participante não existente na lista de participantes')
        }
        
    } catch (err) {
        res.status(500).send(err)
    }

    try {
        const message = {
            from,
            to,
            text,
            type,
            time: dayjs(Date.now()).format('HH:mm:ss')
        }

        db.collection("messages").insertOne(message)
        res.sendStatus(200)
    } catch (err) {
        res.status(500).send(err)
    }
})

app.get('/messages', async (req, res) => {
    const { limit } = req.query
    const user = req.headers.user
    let messages
    let filteredMessages

    try {
        messages = await db.collection("messages").find().toArray()
        filteredMessages = messages.filter((msg) => {
            if (msg.to === "Todos" || msg.to === user || msg.from === user) {
                return true
            }
        })
    } catch (err) {
        res.status(500).send(err)
    }

    if (!limit) {
        res.send(filteredMessages)
    } 

    res.send(filteredMessages.slice(-limit))

})

app.post('/status', async (req, res) => {
    const { user } = req.headers

    try {
        const participants = await db.collection("participants").find().toArray()

        if (!participants.find(p => p.name === user)) {
            res.sendStatus(404)
            return
        }

        await db.collection("participants").updateOne(
            { name: user },
            { $set: { lastStatus: Date.now() } }
        )
        res.sendStatus(200)

    } catch (err) {
        res.status(500).send(err.message)
    }
})

setInterval(() => {
    const participants = db.collection("participants").find().toArray()
    participants.then((participants) => {
        participants.forEach((p) => {
            if (Date.now() - p.lastStatus > 10000) {
                db.collection("participants").deleteOne({ _id: ObjectId(p._id) })
                const message = {
                    from: p.name,
                    to: 'Todos',
                    text: 'sai da sala...',
                    type: 'status',
                    time: dayjs(Date.now()).format('HH:mm:ss')
                }

                db.collection("messages").insertOne(message)
            }
        })
    })
}, 15000)

app.listen(5000, () => {
    console.log(`Server running in port: ${5000}`);
});