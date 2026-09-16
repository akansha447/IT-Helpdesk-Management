// Run with: npm run seed
// Creates a starter admin, agent, employee, and a set of categories.
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Category = require('../models/Category');

const seed = async () => {
  await connectDB();

  const existingAdmin = await User.findOne({ email: 'admin@helpdesk.com' });
  if (existingAdmin) {
    console.log('Seed data already exists. Skipping.');
    process.exit(0);
  }

  await User.create([
    { name: 'Ava Admin', email: 'admin@helpdesk.com', password: 'password123', role: 'admin' },
    { name: 'Alex Agent', email: 'agent@helpdesk.com', password: 'password123', role: 'agent' },
    {
      name: 'Emma Employee',
      email: 'employee@helpdesk.com',
      password: 'password123',
      role: 'employee',
      department: 'Marketing',
    },
  ]);

  await Category.create([
    { name: 'Hardware', description: 'Laptops, monitors, peripherals', baseSlaHours: 48 },
    { name: 'Software', description: 'Applications, licenses, installs', baseSlaHours: 24 },
    { name: 'Network', description: 'Wi-Fi, VPN, connectivity', baseSlaHours: 12 },
    { name: 'Account Access', description: 'Password resets, permissions', baseSlaHours: 8 },
  ]);

  console.log('Seed complete. Login with:');
  console.log('  admin@helpdesk.com / password123');
  console.log('  agent@helpdesk.com / password123');
  console.log('  employee@helpdesk.com / password123');

  await mongoose.disconnect();
  process.exit(0);
};

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
