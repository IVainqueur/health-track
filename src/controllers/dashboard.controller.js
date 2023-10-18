import { Router } from "express";

const app = Router();

app.get('/', (req, res) => {
    res.sendFile('record.view.html', { root: 'src/view' });
});

export default app;