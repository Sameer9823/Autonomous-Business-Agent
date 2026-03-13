import type { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/user';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    await connectToDatabase();

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const hashed = await bcrypt.hash(password, 12);
    const user = await User.create({
      name:     name.trim(),
      email:    email.toLowerCase().trim(),
      password: hashed,
    });

    return res.status(201).json({
      success: true,
      user: { id: user._id.toString(), name: user.name, email: user.email },
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
