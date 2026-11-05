import { PrismaClient, Role, PresenceStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const saltRounds = 10;
  const defaultPasswordHash = await bcrypt.hash('Password123!', saltRounds);

  const seedUsers = [
    {
      email: 'admin@bccteams.local',
      displayName: 'System Admin',
      jobTitle: 'IT Director',
      department: 'Information Technology',
      phoneNumber: '+1-555-0100',
      role: Role.ADMIN,
      presenceStatus: PresenceStatus.AVAILABLE,
    },
    {
      email: 'sarah.connor@bccteams.local',
      displayName: 'Sarah Connor',
      jobTitle: 'Lead Product Designer',
      department: 'Design',
      phoneNumber: '+1-555-0101',
      role: Role.MEMBER,
      presenceStatus: PresenceStatus.AVAILABLE,
    },
    {
      email: 'alex.rivera@bccteams.local',
      displayName: 'Alex Rivera',
      jobTitle: 'Senior Software Engineer',
      department: 'Engineering',
      phoneNumber: '+1-555-0102',
      role: Role.MEMBER,
      presenceStatus: PresenceStatus.BUSY,
    },
    {
      email: 'elena.rostova@bccteams.local',
      displayName: 'Elena Rostova',
      jobTitle: 'VP of Product',
      department: 'Product',
      phoneNumber: '+1-555-0103',
      role: Role.MEMBER,
      presenceStatus: PresenceStatus.DO_NOT_DISTURB,
    },
    {
      email: 'marcus.vance@bccteams.local',
      displayName: 'Marcus Vance',
      jobTitle: 'HR Operations Manager',
      department: 'Human Resources',
      phoneNumber: '+1-555-0104',
      role: Role.MEMBER,
      presenceStatus: PresenceStatus.AWAY,
    },
  ];

  console.log('Seeding development database idempotently...');

  for (const user of seedUsers) {
    const upsertedUser = await prisma.user.upsert({
      where: { email: user.email },
      update: {
        displayName: user.displayName,
        jobTitle: user.jobTitle,
        department: user.department,
        phoneNumber: user.phoneNumber,
        role: user.role,
        isActive: true,
      },
      create: {
        email: user.email,
        passwordHash: defaultPasswordHash,
        displayName: user.displayName,
        jobTitle: user.jobTitle,
        department: user.department,
        phoneNumber: user.phoneNumber,
        role: user.role,
        isActive: true,
      },
    });

    await prisma.presence.upsert({
      where: { userId: upsertedUser.id },
      update: {
        status: user.presenceStatus,
      },
      create: {
        userId: upsertedUser.id,
        status: user.presenceStatus,
      },
    });

    await prisma.userSettings.upsert({
      where: { userId: upsertedUser.id },
      update: {},
      create: {
        userId: upsertedUser.id,
        theme: 'light',
        language: 'en',
      },
    });

    console.log(`Seeded user: ${user.email} (${upsertedUser.id})`);
  }

  console.log('Database seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
