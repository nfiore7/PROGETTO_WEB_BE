const jwt = require('jsonwebtoken')

function generateTokens (payload){
    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1m' })
    const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' })
    return {accessToken, refreshToken}

}
module.exports = generateTokens