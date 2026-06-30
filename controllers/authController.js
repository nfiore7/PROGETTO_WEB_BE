const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const User = require('../schema/userSchema')
const generateTokens = require('../utils/generateTokens')

module.exports = {

    /*
    Questa è una funzione di login, dove preleviamo dalla richiesta lo username e la password
    verifichiamo che lo username esista in quanto univoco nel schema, facciamo un match della
    password hashata, inviata in chiaro dall'utente, dopodoche crea un payload dove verranno
    inserite tutte le info chiave, dell'utente se esso esiste. Questo payload verra successivamente
    inserito nel token generato e invitato al FE nell'header. Genererà anche un refreshToke di durata
    diversa invitato nel body della risposta.
 */

    login: async function (req, res) {
        const { username, password } = req.body
        try {
            const user = await User.findOne({ username })
            if (!user) {
                return res.status(401).json({ message: "Username o password errati" })
            }

            const match = await bcrypt.compare(password, user.password)
            if (!match) {
                return res.status(401).json({ message: "Username o password errati" })
            }

            const payload = {
                id: user._id,
                role: user.role,
                name: user.name,
                lastname: user.lastname,
                username: user.username,
            }

            const { accessToken, refreshToken } = generateTokens(payload)

            res.setHeader("Authorization", `Bearer ${accessToken}`)
            return res.status(200).json({ message: "Login effettuato con successo", refreshToken })

        } catch (err) {
            return res.status(500).json({ message: "Errore interno del server", error: err.message })
        }
    },

    refreshToken: async function (req, res) {
        const { refreshToken } = req.body
        if (!refreshToken) {
            return res.status(401).json({ message: "Refresh token mancante" })
        }

        try {
            const payload = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET)

            const { accessToken } = generateTokens({
                id: payload.id,
                role: payload.role,
                name: payload.name,
                lastname: payload.lastname,
                username: payload.username,
            })

            return res.status(200).json({ accessToken })

        } catch (err) {
            return res.status(403).json({ message: "Refresh token non valido o scaduto" })
        }
    }
}