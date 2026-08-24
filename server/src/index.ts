import express from 'express';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

//  ROUTE IMPORTS
import projectRoutes from '../src/routes/projectRoutes';
import taskRoutes from '../src/routes/taskRoutes';
import searchRoutes from '../src/routes/searchRoutes';
import userRoutes from '../src/routes/userRoutes';
import teamRoutes from '../src/routes/teamRoutes';
// CONFIGURATIONS
dotenv.config();
const app=express();
app.use(express.json());
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({policy:"cross-origin"}));
app.use(morgan("common"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:false}));
app.use(cors());


// ROUTES
app.get("/",(req,res) =>{
    res.send("This is a home route")
}
)

app.use('/project',projectRoutes);
app.use('/tasks',taskRoutes);
app.use('/search',searchRoutes);
app.use('/users',userRoutes);
app.use('/teams',teamRoutes);

// SERVER
const port = process.env.PORT || 3000;
app.listen(port, ()=>{
    console.log(`Server running on port ${port}`)
})

