const jwt = require('jsonwebtoken')
const User = require('../schema/userSchema')
const bcrypt = require("bcrypt")

/*
    Questa è una funzione di login, dove preleviamo dalla richiesta lo username e la password
    verifichiamo che lo username esista in quanto univoco nel schema, facciamo un match della
    password hashata, inviata in chiaro dall'utente, dopodoche crea un payload dove verranno
    inserite tutte le info chiave, dell'utente se esso esiste. Questo payload verra successivamente
    inserito nel token generato e invitato al FE nell'header. Genererà anche un refreshToke di durata
    diversa invitato nel body della risposta.



 */

async function login (req, res) {
    const {username, password} = req.body
    try {
        const user = await User.findOne({ username: username })
        if (!user) {
            return res.status(401).json({message: "Username o password errati"})
        }
        const match = await bcrypt.compare(password, user.password)
        if(!match) {
            return res.status(401).json({message: "Username o password errati"})
        }

        const payload = {
            id: user._id,
            role: user.role,
            name: user.name,
            lastname: user.lastname,
            username: user.username,
        }

        const accessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1m' })
        const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' })

        res.setHeader("Authorization", `Bearer ${accessToken}`)
        return res.status(200).json({ message: "Login effettuato con successo", refreshToken })
    }catch(err){
        return res.status(500).json({message: "Errore interno del server" + err.message})
    }
}

module.exports = login