import mongoose from 'mongoose';
import { User } from './mongodb-models.js';

export async function seedDevAdmin() {
  console.log('🌱 Seeding development admin user...');

  try {
    // Check if admin user already exists
    const existingAdmin = await User.findOne({ username: 'admin' });
    if (existingAdmin) {
      console.log('📊 Admin user already exists, skipping seed');
      return;
    }

    // Create admin user
    const adminUser = new User({
      username: 'admin',
      email: 'admin@police.gov',
      password: 'admin123',
      firstName: 'System',
      lastName: 'Administrator',
      role: 'admin',
      badgeNumber: 'ADMIN001',
      department: 'IT',
      position: 'System Administrator',
      phone: '+1-555-0000',
      isActive: true
    });

    await adminUser.save();
    console.log('✅ Admin user created successfully');

  } catch (error) {
    console.error('❌ Error seeding admin user:', error.message);
    // Don't throw error to prevent app startup failure
  }
}