import express from 'express';
import { supabase } from '../config/supabase';
import type { User } from '../types/User';

const router = express.Router();

router.get('/users', async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('*');

    if (error) throw error;
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/users', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    const { data, error } = await supabase
      .from('users')
      .insert([
        { username, email, password } // Note: Ensure password is hashed before storing
      ])
      .select();

    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ... other routes ...

export default router; 