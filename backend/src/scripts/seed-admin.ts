/**
 * Seed or promote an admin user.
 * Usage:
 *   ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=secret ADMIN_PHONE=+0000000000 npx ts-node src/scripts/seed-admin.ts
 *   npx ts-node src/scripts/seed-admin.ts admin@example.com secret +0000000000
 */
const { connect, disconnect } = require('../db');
const User = require('../models/User');

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL ?? (process.argv[2] as string);
  const password = process.env.ADMIN_PASSWORD ?? (process.argv[3] as string);
  const phone = process.env.ADMIN_PHONE ?? (process.argv[4] as string) ?? '+0000000000';

  if (!email || !email.trim()) {
    console.error('Usage: ADMIN_EMAIL=... ADMIN_PASSWORD=... ADMIN_PHONE=... npx ts-node src/scripts/seed-admin.ts');
    console.error('   or: npx ts-node src/scripts/seed-admin.ts <email> <password> <phone>');
    process.exit(1);
  }
  if (!password || !password.trim()) {
    console.error('Password is required.');
    process.exit(1);
  }
  if (!phone || !phone.trim()) {
    console.error('Phone is required. Set ADMIN_PHONE or pass a phone number as the third argument.');
    process.exit(1);
  }

  const normalizedEmail = email.trim().toLowerCase();

  try {
    await connect();
    console.log('Connected to MongoDB.');

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      existing.role = 'admin';
      existing.isActive = true;
      await existing.save();
      console.log(`Updated existing user to admin: ${normalizedEmail}`);
    } else {
      await User.create({
        name: 'Admin',
        email: normalizedEmail,
        password: password.trim(),
        phone: phone.trim(),
        role: 'admin',
        isActive: true,
      });
      console.log(`Created new admin user: ${normalizedEmail}`);
    }
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  } finally {
    await disconnect();
    console.log('Disconnected.');
  }
}

seedAdmin();
