const jwt = require('jsonwebtoken')

const token = jwt.sign(
    {
        id: user._id,
        role: user.role,
        name: user.name,
        lastname: user.lastname,

    },
    process.env.JWT_SECRET,
    {expiresIn: '24h'}
)