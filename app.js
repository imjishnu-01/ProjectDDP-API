const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

require('dotenv').config();




const userRoutes = require('./api/routes/userRoutes');
const skillRoutes = require('./api/routes/skillRoutes');
const workExperienceRoutes = require('./api/routes/workExperinceRoutes')
const invitationRouter = require('./api/routes/invitationRoutes');
const authMiddleware = require('./middleWare/authMiddleware');


const app = express();


app.use(cors({
    origin: ['*'], // Replace with the origin you want to allow
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Set the allowed HTTP methods
    allowedHeaders: ['Content-Type', 'Authorization'], // Set the allowed request headers
    exposedHeaders: ['Content-Length', 'X-Custom-Header'], // Expose additional response headers
    credentials: true, // Allow credentials (e.g., cookies, HTTP authentication)
    maxAge: 3600, // Set the maximum age for preflight requests (optional)
  }));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use('/api/user', userRoutes);
app.use('/api/skill', skillRoutes);
app.use('/api/workExperince', workExperienceRoutes);
app.use('/api/invite', invitationRouter);

app.use(authMiddleware);

const port = process.env.PORT;

app.listen(port,()=>{
    console.log(`Application running on port:${port}`)
})