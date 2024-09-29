const config = require('./config.json')
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const express = require('express');
const cors = require('cors');
const {authenticateToken} = require('./utilities');
const upload = require('./multer');
const fs = require('fs');
const path = require('path');

require('dotenv').config();
mongoose.set('debug', true);
const jwt = require('jsonwebtoken');

mongoose.connect(config.connectionString)

const User = require('./models/user.model')
const TravelStory = require('./models/travelStory.model');
const { error } = require('console');

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


// Route to handle image upload
app.post('/upload-image', upload.single('image'), async (req, res) => {
    try {
        if (!req.file){
            return res.status(400).json({
                error: true,
                message: "No image uploaded"
            })
        }
        const imageUrl = `http://localhost:4000/uploads/${req.file.filename}`; 
        res.status(201).json({ imageUrl })
    } catch (error) {
        res.status(500).json({
            error: true,
            message: error.message
        })
    }

})

// Delete an image from uploads folder
app.delete('/delete-image', authenticateToken, async (req, res) => {
    const  { imageUrl } = req.query;

    if (!imageUrl){
        return  res.status(400).json({
            error: true,
            message: "No image to delete"
        })
    }
    try {
        // Extract the filename frome the image url
        const filename = path.basename(imageUrl);

        // Define the file exists
        const filePath = path.join(__dirname, 'uploads', filename)

        // Check if the file exists
        if (fs.existsSync(filePath)){
            fs.unlinkSync(filePath)
            res.status(200).json({ message: "Image deleted successfully" })
        } else {
            res.status(200).json({
                error: true,
                message: "Image not found"
            })
        }
    } catch (error) {
        res.status(500).json({
            error: true,
            message: error.message
        })
    }
})

// Serve static files from the uploads and assets diractory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// Add Travel Story
app.post('/add-travel-story', authenticateToken, async (req, res) => {
    const { title,  story, visitedLocation, imageUrl, visitedDate } = req.body;
    const { userId } = req.user;
    
    // Validate required fields
    if(!title  || !story || !visitedLocation || !imageUrl || !visitedDate ){
        return res.status(400).json({
            error: true,
            message: "All fields are required"
        });
    }
    // Convert visitedDate from milliseconds to Date object
    const parsedVisitedDate = new Date(parseInt(visitedDate));

    try {
        const travelStory = new  TravelStory({
            title,
            story,
            visitedLocation,
            userId,
            imageUrl,
            visitedDate: parsedVisitedDate,
        });

        await travelStory.save();
        return res.status(201).json({
            story: travelStory,
            message: "Added Successfully"
        })
    } catch(error) {
        res.status(400).json({
            error: true,
            message: error.message
        })
    }
})

// Get all Travel Stories
app.get('/get-all-stories', authenticateToken, async  (req, res) => {
    const  { userId } = req.user;

    try {
        const travelStory = await  TravelStory.find({ userId }).sort({
            isFavourite: -1,
        });
        res.status(200).json({ stories: travelStory })
    } catch (error) {
        res.status(500).json({ error: true, message: error.message })
    }
});


// Edit Travel Story
app.put('/edit-story/:id', authenticateToken, async (req, res) => {
    const { title, story,  visitedLocation, imageUrl, visitedDate } = req.body
    const { userId } = req.user;
    const { id } = req.params;  

    // Validate required fields
    if(!title  || !story || !visitedLocation || !imageUrl || !visitedDate ){
        return res.status(400).json({
            error: true,
            message: "All fields are required"
        });
    }
    // Convert visitedDate from millisecond to Date object
    const  parsedVisitedDate = new Date(parseInt(visitedDate))

    try {
        // Find the travel story by ID and ensure it belongs to the authenticated user
        const travelStory = await TravelStory.findOne({ _id: id, userId: userId })        
        if(!travelStory) {
            return res.status(404).json({
                error: true,
                message: "Travel Story not found"
            })
        }
        const placeholderImageUrl = `http://localhost:4000/assets/placeholder.png`;
        travelStory.title = title;
        travelStory.story = story;
        travelStory.visitedLocation = visitedLocation;
        travelStory.imageUrl = imageUrl || placeholderImageUrl;
        travelStory.visitedDate = parsedVisitedDate;

        await travelStory.save();
        res.status(200).json({  travelStory, message: "Travel Story updated successfully" })

    } catch (error) {
        res.status(500).json({
            error: true,
            message: error.message
        })
    }
})

// Delet travel story
app.delete('/delete-story/:id', authenticateToken, async (req, res) =>{
    const { id } = req.params;
    const { userId } = req.user;

    try {
         // Find the travel story by ID and ensure it belongs to the authenticated user
         const travelStory = await TravelStory.findOne({ _id: id, userId: userId })        
         if(!travelStory) {
             return res.status(404).json({
                 error: true,
                 message: "Travel Story not found"
             })
         }
         // Delet the travel story from the database
         await travelStory.deleteOne({ _id: id,  userId: userId });

         // Extract the filename from the imageUrl
         const imageUrl = travelStory.imageUrl;
         const filename = path.basename(imageUrl);

         // Define the file path
         const filePath = path.join(__dirname, 'uploads', filename);

         // Delete the image file from the uploads folder
         fs.unlink(filePath,  (err) => {
            if (err) {
                console.error('Filed to delete image file', err);
    }})
    res.status(200).json({ message: "Travel Story deleted successfully" })

    } catch (error) {
        res.status(500).json({
            error: true,
            message: error.message
        })
    }

})

// Update isFavourite
app.put('/update-isFavourite/:id', authenticateToken, async (req, res) =>{
    const  { id } = req.params;
    const  { userId } = req.user;
    const {isFavourite} = req.body;

    try {
        const travelStory = await TravelStory.findOne({ _id: id, userId: userId })
        if(!travelStory) {
            return  res.status(404).json({
                error: true,
                message: "Travel Story not found"
            })
        }
        travelStory.isFavourite = isFavourite;
        await travelStory.save();
        res.status(200).json({ travelStory, message: "Travel Story updated successfully" })
    } catch (error) {
        res.status(500).json({
            error: true,
            message: error.message
        })
    }
})

// Search travel story
app.get('/search', authenticateToken, async (req, res) => {
    const { query } = req.query;
    const { userId } = req.user;

    if(!query){
        return res.status(404).json({ erro: true, message: 'query is required' });
    }
    try {
        const searchResults = await TravelStory.find({
            userId: userId,
            $or: [
                { title: { $regex: query, $options: 'i' } },
                { story: { $regex: query, $options: 'i' } },
                { visitedLocation: { $regex: query, $options: 'i' } },
            ],
        }).sort({ isFavourite: -1 });
        res.status(200).json({ stories: searchResults });
    } catch (error) {
        res.status(500).json({ error: true, status: 'error' });
    }
})

// Filter travel story by date range
app.get('/travel-stories/filter', authenticateToken, async (req, res) => {
    const { userId } = req.user;
    const { startDate, endDate } = req.query; 

    try {
       // Convert startDate and endDate from milliseconds to Date objects
        const start = new Date(parseInt(startDate));
        const end = new Date(parseInt(endDate));
        
        // Find travel story that belong to the authenticated user and fall withn the date range
        const filteredStories = await TravelStory.find({
            userId: userId,
            visitedDate: { $gte: start, $lte: end },
        }).sort({ isFavourite: -1 });
        res.status(200).json({ stories: filteredStories });
    } catch (error) {
        res.status(500).json({
            error: true,
            message: error.message,
        });
    }
});

app.listen(4000);
module.exports = app 

// time taken   ~   youtube
// 1:57 min
// 1:04 min     ~   44:57
// 2:17 min     ~   1:08
// 29:54 s      ~   1:18
