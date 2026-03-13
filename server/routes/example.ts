import { Request, Response, NextFunction } from 'express';
import express from 'express';

const router = express.Router();

// Sample GET endpoint
router.get('/example', (req: Request, res: Response) => {
    res.status(200).json({ message: 'GET request successful' });
});

// Sample POST endpoint
router.post('/example', (req: Request, res: Response) => {
    const data = req.body;
    // Handle the data as needed
    res.status(201).json({ message: 'POST request successful', data });
});

// Error handling middleware
router.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(err);
    res.status(500).json({ message: 'Internal Server Error' });
});

export default router;