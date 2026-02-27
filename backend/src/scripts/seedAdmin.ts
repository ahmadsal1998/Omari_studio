import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../models/User.model';

dotenv.config();

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/omari_studio');
    console.log('Connected to MongoDB');

    const adminEmail = (process.env.ADMIN_EMAIL || '').toLowerCase().trim();
    const adminUsername = (process.env.ADMIN_USERNAME || '').trim();
    const adminPassword = process.env.ADMIN_PASSWORD || '';

    if (!adminEmail || !adminUsername || !adminPassword) {
      throw new Error(
        'Missing admin credentials. Set ADMIN_EMAIL, ADMIN_USERNAME, and ADMIN_PASSWORD in .env'
      );
    }

    const existingAdmin = await User.findOne({
      $or: [{ email: adminEmail }, { username: adminUsername }],
    });

    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    if (existingAdmin) {
      // Update existing admin to ensure correct password and role
      existingAdmin.password = hashedPassword;
      existingAdmin.role = 'admin';
      existingAdmin.email = adminEmail;
      existingAdmin.username = adminUsername;
      await existingAdmin.save();
      console.log('Admin user updated successfully');
      console.log('Email:', adminEmail);
      console.log('Username:', adminUsername);
    } else {
      const admin = new User({
        email: adminEmail,
        username: adminUsername,
        password: hashedPassword,
        role: 'admin',
      });

      await admin.save();
      console.log('Admin user created successfully');
      console.log('Email:', adminEmail);
      console.log('Username:', adminUsername);
    }

    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

seedAdmin();
