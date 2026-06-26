const jwt = require('jsonwebtoken')
const User = require('../schema/userSchema')
const bcrypt = require("bcrypt")


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

        const token = jwt.sign(
            {
                id: user._id,
                role: user.role,
                name: user.name,
                lastname: user.lastname,
                username: user.username,

            },
            process.env.JWT_SECRET,
            {expiresIn: '24h'}
        )
        res.setHeader("Authorization", `Bearer ${token}`);

        return res.status(200).json({message: "Loggin effettuato con sucesso"})
    }catch(err){
        return res.status(500).json({message: "Errore interno del server" + err.message})
    }
}

module.exports = login