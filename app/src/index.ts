import express from 'express';
import { env } from './Environment.js';

const app = express();
const PORT = env.PORT || 3000;

app.use(express.json());

app.get('/status', (req, res) => {
    res.json({
        status: 'online',
        agent: 'Wade Wilson',
        platform: 'Mac Mini M4 Pro',
        message: 'Unde sunt micii, Tibi?'
    });
});

app.post('/execute', (req, res) => {
    const { instructions } = req.body;
    console.log('Primind instrucțiuni LEGO:', instructions);
    // Aici va veni Runner-ul tău de VM
    res.json({ success: true, executed: instructions?.length || 0 });
});

app.listen(PORT, () => {
    console.log(`🚀 Genesis Server pornit pe portul ${PORT}`);
});