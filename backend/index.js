const config = require('./config.json')
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const express = require('express');
const cors = require('cors');
const {authenticateToken} = require('./utilities');

require('dotenv').config();
const jwt = require('jsonwebtoken');

mongoose.connect(config.connectionString)

const User = require('./models/user.model')
const TravelStory = require('./models/travelStory.model')

const app = express();
app.use(express.json());
app.use(cors({origin: "*" }));

// Create account
app.post('/create-account',async (req,res)=>{
    const {fullName, email, password} = req.body;

    if(!fullName || !email || !password){
        return res
        .status(400)
        .json({error:true, message: 'All fields are required'})
    }
    const isUser = await User.findOne({email});

    if(isUser){
        return res
        .status(400)
        .json({error:true, message: 'User already exists'})
    }


    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
        fullName,
        email,
        password: hashedPassword
    })

    await user.save();

    const accessToken = jwt.sign(
        { userId: user._id },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: '72h',
        }
    )

    return res.status(201).json({
        error: false,
        user : { fullName: user.fullName, email: user.email},
        accessToken,
        message: "Registration Successful",
    })
})

// Login
app.post('/login', async (req,res)=>{ 
    const {email, password} = req.body;
    if(!email || !password){
        return res
        .status(400)
        .json({ message: 'Email and password are required'}) 
    }
    const user = await User.findOne({email});
    if(!user){
        return res
        .status(400)
        .json({ message: 'User does not exist'})
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if(!isPasswordValid){
        return res
        .status(400)
        .json({ message: 'Incorrect password'})
    }

    const accessToken = jwt.sign(
        { userId: user._id },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: '72h',
        }
    )
    return res.status(200).json({
        message: "Login Successful",
        user : { fullName: user.fullName, email: user.email},
        accessToken,
    })
});

// Get User
app.get('/get-user', authenticateToken, async (req,res) => {
    const { userId } = req.user;
    const isUser = await User.findOne({ _id: userId });

    if(!isUser){
        return res.status(404).json({ message: "User not found" });
    }
    return res.json({
        user : isUser,
        message: "User retrieved successfully",
    })
});


// Add Travel Story
app.post('/add-travel-story', authenticateToken, async (req, res) => {
    const { title,  description, location, startDate, endDate, image } = req.body;
    const { userId } = req.user;
    
    if(!title  || !story || !visitedLocation || !imagrUrl || !visitedDate ){
        return res.status(400).json({
            error: true,
            message: "All fields are required"
        })
    }
})

app.listen(4000);
module.exports = app 

// 1:57 min
// 1:04 min