import express from 'express';
import cors from 'cors';
import recordController from './controllers/record.controller.js';
import dashboardController from './controllers/dashboard.controller.js';

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

app.use('/api/record', recordController)
app.use('/dashboard', dashboardController)

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});


