const jwt = require('jsonwebtoken');

function authenticateToken (req, res, next){
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(" ")[1];

    // No token, unauthorized
    if(!token) return res.status(401).send({ message: 'Unauthorized' });

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) =>{
        // Token invalid, forbidden
        if(err) return res.status(403).send({ message: 'Forbidden' });
        req.user = user;
        next();
    });
}

module.exports = {
    authenticateToken,
};