/**
 * Backfill Business.type and create personal Businesses for existing users.
 * - Sets type: 'commercial' on any Business document missing type.
 * - Creates a personal Business for each User with role 'user' that has no Business.
 *
 * Usage: npx ts-node src/scripts/backfill-business-type.ts
 *   or:  MONGODB_URI=mongodb://... npx ts-node src/scripts/backfill-business-type.ts
 */
const { connect, disconnect } = require('../db');
const User = require('../models/User');
const Business = require('../models/Business');

function generatePersonalBusinessName(userName: string): string {
  const sanitized = (userName || 'User').trim().replace(/\s+/g, ' ');
  return `${sanitized}-business`;
}

async function backfill() {
  try {
    await connect();
    console.log('Connected to MongoDB.');

    const existingBusinesses = await Business.updateMany(
      { type: { $exists: false } },
      { $set: { type: 'commercial' } },
    );
    if (existingBusinesses.modifiedCount > 0) {
      console.log(`Updated ${existingBusinesses.modifiedCount} business(es) with type: 'commercial'.`);
    }

    const usersWithoutBusiness = await User.aggregate([
      { $match: { role: 'user' } },
      {
        $lookup: {
          from: 'businesses',
          localField: '_id',
          foreignField: 'owner',
          as: 'businesses',
        },
      },
      { $match: { businesses: { $size: 0 } } },
      { $project: { _id: 1, name: 1 } },
    ]);

    let created = 0;
    for (const user of usersWithoutBusiness) {
      await Business.create({
        owner: user._id,
        type: 'personal',
        businessname: generatePersonalBusinessName(user.name),
        description: 'Personal account',
      });
      created++;
    }
    if (created > 0) {
      console.log(`Created ${created} personal business(es) for existing users.`);
    }

    console.log('Backfill complete.');
  } catch (err) {
    console.error('Backfill failed:', err);
    process.exit(1);
  } finally {
    await disconnect();
    console.log('Disconnected.');
  }
}

backfill();
