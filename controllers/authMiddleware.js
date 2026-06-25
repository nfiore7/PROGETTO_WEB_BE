const jwt = require("jsonwebtoken")


function authMiddleware (req, res, next) {
    const token= req.headers["authorization"]?.split(" ")[1];
    if(!token){
        return res.status(401).json({message:"Non sei autorizzato"})
    }
    jwt.verify(token, process.env.JWT_SECRET, (err, loggedUser) => {
        if(err){
            return res.status(401).json({message:"Non sei autorizzato"})
        }
        req.user = loggedUser;
        next()
    })


}
module.exports = authMiddleware;