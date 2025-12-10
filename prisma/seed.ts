/**
 * Database Seed Script for MFO Ice Rink Management Platform
 *
 * Run with: npx prisma db seed
 * Or manually: npx tsx prisma/seed.ts
 */

import { PrismaClient, UserRole, RinkType, FormCategory, FieldType, SeverityLevel, ChecklistCategory, EquipmentType, SubscriptionTier, SubscriptionStatus } from '@prisma/client';
import { hash } from 'bcryptjs';
import { addDays, subDays, addHours, startOfWeek, format } from 'date-fns';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...\n');

  // ============================================
  // 1. CREATE ORGANIZATION
  // ============================================
  console.log('📁 Creating organization...');

  const organization = await prisma.organization.upsert({
    where: { slug: 'northside-ice-complex' },
    update: {},
    create: {
      name: 'Northside Ice Complex',
      slug: 'northside-ice-complex',
      address: '1234 Ice Arena Way',
      city: 'Minneapolis',
      state: 'MN',
      postalCode: '55401',
      country: 'US',
      phone: '(612) 555-0100',
      email: 'info@northsideice.com',
      website: 'https://northsideice.com',
      timezone: 'America/Chicago',
    },
  });

  // Create subscription
  await prisma.subscription.upsert({
    where: { organizationId: organization.id },
    update: {},
    create: {
      organizationId: organization.id,
      tier: SubscriptionTier.PROFESSIONAL,
      status: SubscriptionStatus.ACTIVE,
      maxFacilities: 3,
      maxUsersPerFacility: 25,
      currentPeriodStart: new Date(),
      currentPeriodEnd: addDays(new Date(), 30),
    },
  });

  // ============================================
  // 2. CREATE FACILITY
  // ============================================
  console.log('🏟️  Creating facility...');

  const facility = await prisma.facility.upsert({
    where: {
      organizationId_slug: {
        organizationId: organization.id,
        slug: 'main-arena',
      },
    },
    update: {},
    create: {
      organizationId: organization.id,
      name: 'Main Arena',
      slug: 'main-arena',
      address: '1234 Ice Arena Way',
      city: 'Minneapolis',
      state: 'MN',
      postalCode: '55401',
      latitude: 44.9778,
      longitude: -93.2650,
      phone: '(612) 555-0101',
      email: 'arena@northsideice.com',
      timezone: 'America/Chicago',
    },
  });

  // Create weather cache
  await prisma.weatherCache.upsert({
    where: { facilityId: facility.id },
    update: {},
    create: {
      facilityId: facility.id,
      temperature: 28,
      humidity: 65,
      conditions: 'Partly Cloudy',
      icon: '02d',
      expiresAt: addHours(new Date(), 1),
    },
  });

  // ============================================
  // 3. CREATE RINKS
  // ============================================
  console.log('🧊 Creating rinks...');

  const rinkA = await prisma.rink.upsert({
    where: { id: 'rink-a' },
    update: {},
    create: {
      id: 'rink-a',
      facilityId: facility.id,
      name: 'Rink A - NHL Size',
      rinkType: RinkType.STANDARD,
      length: 200,
      width: 85,
      surfaceArea: 17000,
      icePointsConfig: 25,
    },
  });

  const rinkB = await prisma.rink.upsert({
    where: { id: 'rink-b' },
    update: {},
    create: {
      id: 'rink-b',
      facilityId: facility.id,
      name: 'Rink B - Olympic Size',
      rinkType: RinkType.OLYMPIC,
      length: 200,
      width: 100,
      surfaceArea: 20000,
      icePointsConfig: 35,
    },
  });

  // ============================================
  // 4. CREATE USERS
  // ============================================
  console.log('👥 Creating users...');

  const passwordHash = await hash('demo123', 12);

  const users = await Promise.all([
    // Super Admin
    prisma.user.upsert({
      where: { email: 'admin@mfo.dev' },
      update: {},
      create: {
        email: 'admin@mfo.dev',
        name: 'System Admin',
        passwordHash,
        role: UserRole.SUPER_ADMIN,
        phone: '(612) 555-0001',
      },
    }),
    // Facility Admin
    prisma.user.upsert({
      where: { email: 'manager@northsideice.com' },
      update: {},
      create: {
        email: 'manager@northsideice.com',
        name: 'Mike Thompson',
        passwordHash,
        role: UserRole.FACILITY_ADMIN,
        phone: '(612) 555-0102',
      },
    }),
    // Manager
    prisma.user.upsert({
      where: { email: 'operations@northsideice.com' },
      update: {},
      create: {
        email: 'operations@northsideice.com',
        name: 'Sarah Johnson',
        passwordHash,
        role: UserRole.MANAGER,
        phone: '(612) 555-0103',
      },
    }),
    // Ice Technicians
    prisma.user.upsert({
      where: { email: 'john.smith@northsideice.com' },
      update: {},
      create: {
        email: 'john.smith@northsideice.com',
        name: 'John Smith',
        passwordHash,
        role: UserRole.ICE_TECHNICIAN,
        phone: '(612) 555-0104',
      },
    }),
    prisma.user.upsert({
      where: { email: 'emily.brown@northsideice.com' },
      update: {},
      create: {
        email: 'emily.brown@northsideice.com',
        name: 'Emily Brown',
        passwordHash,
        role: UserRole.ICE_TECHNICIAN,
        phone: '(612) 555-0105',
      },
    }),
    prisma.user.upsert({
      where: { email: 'david.lee@northsideice.com' },
      update: {},
      create: {
        email: 'david.lee@northsideice.com',
        name: 'David Lee',
        passwordHash,
        role: UserRole.STAFF,
        phone: '(612) 555-0106',
      },
    }),
    prisma.user.upsert({
      where: { email: 'lisa.wilson@northsideice.com' },
      update: {},
      create: {
        email: 'lisa.wilson@northsideice.com',
        name: 'Lisa Wilson',
        passwordHash,
        role: UserRole.STAFF,
        phone: '(612) 555-0107',
      },
    }),
  ]);

  const [admin, facilityAdmin, manager, techJohn, techEmily, staffDavid, staffLisa] = users;

  // Link users to facility
  for (const user of users.slice(1)) {
    await prisma.facilityUser.upsert({
      where: {
        userId_facilityId: {
          userId: user.id,
          facilityId: facility.id,
        },
      },
      update: {},
      create: {
        userId: user.id,
        facilityId: facility.id,
        role: user.role,
      },
    });
  }

  // ============================================
  // 5. CREATE EQUIPMENT
  // ============================================
  console.log('🚜 Creating equipment...');

  const zamboni1 = await prisma.equipment.upsert({
    where: { id: 'zamboni-1' },
    update: {},
    create: {
      id: 'zamboni-1',
      facilityId: facility.id,
      name: 'Zamboni #1',
      equipmentType: EquipmentType.ZAMBONI,
      manufacturer: 'Zamboni',
      model: '552',
      serialNumber: 'ZB-2021-00123',
      purchaseDate: subDays(new Date(), 730),
      warrantyExpires: addDays(new Date(), 365),
      currentHours: 1850,
      lastServiceHours: 1800,
      nextServiceHours: 2000,
    },
  });

  const zamboni2 = await prisma.equipment.upsert({
    where: { id: 'zamboni-2' },
    update: {},
    create: {
      id: 'zamboni-2',
      facilityId: facility.id,
      name: 'Zamboni #2',
      equipmentType: EquipmentType.ZAMBONI,
      manufacturer: 'Zamboni',
      model: '552',
      serialNumber: 'ZB-2022-00456',
      purchaseDate: subDays(new Date(), 365),
      warrantyExpires: addDays(new Date(), 730),
      currentHours: 920,
      lastServiceHours: 900,
      nextServiceHours: 1000,
    },
  });

  await prisma.equipment.upsert({
    where: { id: 'edger-1' },
    update: {},
    create: {
      id: 'edger-1',
      facilityId: facility.id,
      name: 'Edge-O-Matic',
      equipmentType: EquipmentType.EDGER,
      manufacturer: 'Jet Ice',
      model: 'Edge-O-Matic 2500',
      serialNumber: 'JI-2020-00789',
      currentHours: 450,
    },
  });

  // ============================================
  // 6. CREATE FORM TEMPLATES
  // ============================================
  console.log('📝 Creating form templates...');

  // Ice Make Logbook Form
  const iceMakeForm = await prisma.formTemplate.upsert({
    where: { id: 'form-ice-make' },
    update: {},
    create: {
      id: 'form-ice-make',
      facilityId: facility.id,
      createdById: facilityAdmin.id,
      name: 'Ice Make Logbook',
      description: 'Record ice making process details including cuts, floods, and maintenance.',
      category: FormCategory.ICE_OPERATIONS,
      isPublished: true,
      version: 1,
    },
  });

  // Add fields to ice make form
  await prisma.formField.createMany({
    skipDuplicates: true,
    data: [
      { id: 'imf-1', formTemplateId: iceMakeForm.id, fieldType: FieldType.DROPDOWN, label: 'Rink', isRequired: true, orderIndex: 0, options: [{ value: 'rink-a', label: 'Rink A' }, { value: 'rink-b', label: 'Rink B' }] },
      { id: 'imf-2', formTemplateId: iceMakeForm.id, fieldType: FieldType.NUMBER, label: 'Water Temperature (°F)', isRequired: true, orderIndex: 1, minValue: 32, maxValue: 80 },
      { id: 'imf-3', formTemplateId: iceMakeForm.id, fieldType: FieldType.NUMBER, label: 'Number of Floods', isRequired: true, orderIndex: 2, minValue: 1, maxValue: 10 },
      { id: 'imf-4', formTemplateId: iceMakeForm.id, fieldType: FieldType.NUMBER, label: 'Ice Thickness Added (inches)', orderIndex: 3, minValue: 0, maxValue: 2 },
      { id: 'imf-5', formTemplateId: iceMakeForm.id, fieldType: FieldType.TEXTAREA, label: 'Notes', orderIndex: 4, maxLength: 500 },
    ],
  });

  // Zamboni Circle Check Form
  const zamboniForm = await prisma.formTemplate.upsert({
    where: { id: 'form-zamboni-check' },
    update: {},
    create: {
      id: 'form-zamboni-check',
      facilityId: facility.id,
      createdById: facilityAdmin.id,
      name: 'Zamboni Circle Check',
      description: 'Pre-operation inspection checklist for Zamboni ice resurfacer.',
      category: FormCategory.ICE_OPERATIONS,
      isPublished: true,
      version: 1,
    },
  });

  await prisma.formField.createMany({
    skipDuplicates: true,
    data: [
      { id: 'zcf-1', formTemplateId: zamboniForm.id, fieldType: FieldType.DROPDOWN, label: 'Machine', isRequired: true, orderIndex: 0, options: [{ value: 'zamboni-1', label: 'Zamboni #1' }, { value: 'zamboni-2', label: 'Zamboni #2' }] },
      { id: 'zcf-2', formTemplateId: zamboniForm.id, fieldType: FieldType.DROPDOWN, label: 'Oil Level', isRequired: true, orderIndex: 1, options: [{ value: 'OK', label: 'OK' }, { value: 'LOW', label: 'Low' }, { value: 'CRITICAL', label: 'Critical' }] },
      { id: 'zcf-3', formTemplateId: zamboniForm.id, fieldType: FieldType.DROPDOWN, label: 'Water Level', isRequired: true, orderIndex: 2, options: [{ value: 'OK', label: 'OK' }, { value: 'LOW', label: 'Low' }] },
      { id: 'zcf-4', formTemplateId: zamboniForm.id, fieldType: FieldType.DROPDOWN, label: 'Blade Condition', isRequired: true, orderIndex: 3, options: [{ value: 'OK', label: 'OK' }, { value: 'NEEDS_ATTENTION', label: 'Needs Attention' }, { value: 'CRITICAL', label: 'Critical - Replace' }] },
      { id: 'zcf-5', formTemplateId: zamboniForm.id, fieldType: FieldType.CHECKBOX, label: 'Lights Working', isRequired: true, orderIndex: 4 },
      { id: 'zcf-6', formTemplateId: zamboniForm.id, fieldType: FieldType.CHECKBOX, label: 'Horn Working', isRequired: true, orderIndex: 5 },
      { id: 'zcf-7', formTemplateId: zamboniForm.id, fieldType: FieldType.NUMBER, label: 'Hour Meter Reading', isRequired: true, orderIndex: 6 },
      { id: 'zcf-8', formTemplateId: zamboniForm.id, fieldType: FieldType.TEXTAREA, label: 'Issues Found', orderIndex: 7 },
    ],
  });

  // Daily Refrigeration Log
  const refrigerationForm = await prisma.formTemplate.upsert({
    where: { id: 'form-refrigeration' },
    update: {},
    create: {
      id: 'form-refrigeration',
      facilityId: facility.id,
      createdById: facilityAdmin.id,
      name: 'Daily Refrigeration Log',
      description: 'Record refrigeration plant readings and equipment status.',
      category: FormCategory.REFRIGERATION,
      isPublished: true,
      version: 1,
    },
  });

  await prisma.formField.createMany({
    skipDuplicates: true,
    data: [
      { id: 'rf-1', formTemplateId: refrigerationForm.id, fieldType: FieldType.NUMBER, label: 'Compressor 1 - Suction (PSI)', isRequired: true, orderIndex: 0, minValue: 0, maxValue: 100 },
      { id: 'rf-2', formTemplateId: refrigerationForm.id, fieldType: FieldType.NUMBER, label: 'Compressor 1 - Discharge (PSI)', isRequired: true, orderIndex: 1, minValue: 100, maxValue: 300 },
      { id: 'rf-3', formTemplateId: refrigerationForm.id, fieldType: FieldType.NUMBER, label: 'Compressor 2 - Suction (PSI)', orderIndex: 2, minValue: 0, maxValue: 100 },
      { id: 'rf-4', formTemplateId: refrigerationForm.id, fieldType: FieldType.NUMBER, label: 'Compressor 2 - Discharge (PSI)', orderIndex: 3, minValue: 100, maxValue: 300 },
      { id: 'rf-5', formTemplateId: refrigerationForm.id, fieldType: FieldType.NUMBER, label: 'Brine Supply Temp (°F)', isRequired: true, orderIndex: 4, minValue: 10, maxValue: 30 },
      { id: 'rf-6', formTemplateId: refrigerationForm.id, fieldType: FieldType.NUMBER, label: 'Brine Return Temp (°F)', isRequired: true, orderIndex: 5, minValue: 10, maxValue: 35 },
      { id: 'rf-7', formTemplateId: refrigerationForm.id, fieldType: FieldType.CHECKBOX, label: 'Alarms Present', orderIndex: 6 },
      { id: 'rf-8', formTemplateId: refrigerationForm.id, fieldType: FieldType.TEXTAREA, label: 'Notes', orderIndex: 7 },
    ],
  });

  // Air Quality Check
  const airQualityForm = await prisma.formTemplate.upsert({
    where: { id: 'form-air-quality' },
    update: {},
    create: {
      id: 'form-air-quality',
      facilityId: facility.id,
      createdById: facilityAdmin.id,
      name: 'Air Quality Check',
      description: 'Monitor CO₂, CO, and other air quality metrics for safety compliance.',
      category: FormCategory.AIR_QUALITY,
      isPublished: true,
      version: 1,
    },
  });

  await prisma.formField.createMany({
    skipDuplicates: true,
    data: [
      { id: 'aq-1', formTemplateId: airQualityForm.id, fieldType: FieldType.DROPDOWN, label: 'Location', isRequired: true, orderIndex: 0, options: [{ value: 'rink-a', label: 'Rink A' }, { value: 'rink-b', label: 'Rink B' }, { value: 'lobby', label: 'Lobby' }, { value: 'locker-room', label: 'Locker Room' }] },
      { id: 'aq-2', formTemplateId: airQualityForm.id, fieldType: FieldType.NUMBER, label: 'CO₂ Level (ppm)', isRequired: true, orderIndex: 1, minValue: 0, maxValue: 10000 },
      { id: 'aq-3', formTemplateId: airQualityForm.id, fieldType: FieldType.NUMBER, label: 'CO Level (ppm)', orderIndex: 2, minValue: 0, maxValue: 100 },
      { id: 'aq-4', formTemplateId: airQualityForm.id, fieldType: FieldType.NUMBER, label: 'Temperature (°F)', orderIndex: 3, minValue: 40, maxValue: 90 },
      { id: 'aq-5', formTemplateId: airQualityForm.id, fieldType: FieldType.NUMBER, label: 'Humidity (%)', orderIndex: 4, minValue: 0, maxValue: 100 },
      { id: 'aq-6', formTemplateId: airQualityForm.id, fieldType: FieldType.TEXTAREA, label: 'Notes', orderIndex: 5 },
    ],
  });

  // ============================================
  // 7. CREATE ICE DEPTH READINGS
  // ============================================
  console.log('📏 Creating ice depth readings...');

  const generateIceDepthPoints = (baseDepth: number, variance: number) => {
    const points = [];
    for (let i = 1; i <= 25; i++) {
      points.push({
        pointId: `P${i}`,
        x: ((i - 1) % 5) * 25 + 10,
        y: Math.floor((i - 1) / 5) * 25 + 10,
        depth: baseDepth + (Math.random() - 0.5) * variance,
      });
    }
    return points;
  };

  for (let dayOffset = 0; dayOffset < 14; dayOffset++) {
    const date = subDays(new Date(), dayOffset);

    // Morning reading
    const morningPoints = generateIceDepthPoints(1.25, 0.15);
    await prisma.iceDepthReading.create({
      data: {
        rinkId: rinkA.id,
        recordedById: techJohn.id,
        pointsConfig: 25,
        readingPoints: morningPoints,
        averageDepth: morningPoints.reduce((sum, p) => sum + p.depth, 0) / 25,
        minDepth: Math.min(...morningPoints.map(p => p.depth)),
        maxDepth: Math.max(...morningPoints.map(p => p.depth)),
        variance: 0.08,
        ambientTemp: 55 + Math.random() * 10,
        iceTemp: 22 + Math.random() * 4,
        humidity: 60 + Math.random() * 20,
        status: 'RECORDED',
        recordedAt: addHours(date, 8),
      },
    });

    // Evening reading
    const eveningPoints = generateIceDepthPoints(1.2, 0.12);
    await prisma.iceDepthReading.create({
      data: {
        rinkId: rinkA.id,
        recordedById: techEmily.id,
        pointsConfig: 25,
        readingPoints: eveningPoints,
        averageDepth: eveningPoints.reduce((sum, p) => sum + p.depth, 0) / 25,
        minDepth: Math.min(...eveningPoints.map(p => p.depth)),
        maxDepth: Math.max(...eveningPoints.map(p => p.depth)),
        variance: 0.06,
        ambientTemp: 52 + Math.random() * 10,
        iceTemp: 21 + Math.random() * 4,
        humidity: 55 + Math.random() * 20,
        status: 'RECORDED',
        recordedAt: addHours(date, 20),
      },
    });
  }

  // ============================================
  // 8. CREATE INCIDENTS
  // ============================================
  console.log('⚠️  Creating incidents...');

  await prisma.incidentReport.createMany({
    skipDuplicates: true,
    data: [
      {
        facilityId: facility.id,
        reportedById: staffDavid.id,
        incidentTime: subDays(new Date(), 2),
        location: 'Rink A - Near boards',
        incidentType: 'Player Collision',
        description: 'Two hockey players collided during practice. Player #12 reported shoulder pain.',
        severityLevel: SeverityLevel.MINOR,
        ambulanceCalled: false,
        injuredName: 'Jake Miller',
        injuredContact: '(612) 555-1234',
        injuredAge: 16,
        bodyDiagramData: { injuries: [{ bodyPart: 'left_shoulder', x: 30, y: 25, description: 'Bruising' }] },
        witnesses: [{ name: 'Coach Williams', contact: '(612) 555-4567' }],
        status: 'RESOLVED',
        followUpNotes: 'Player returned to practice after 2 days rest.',
        resolvedAt: subDays(new Date(), 1),
      },
      {
        facilityId: facility.id,
        reportedById: techJohn.id,
        incidentTime: subDays(new Date(), 5),
        location: 'Lobby entrance',
        incidentType: 'Slip and Fall',
        description: 'Spectator slipped on wet floor near entrance. Minor knee scrape.',
        severityLevel: SeverityLevel.MINOR,
        ambulanceCalled: false,
        injuredName: 'Mary Johnson',
        injuredContact: '(612) 555-8901',
        status: 'CLOSED',
        followUpNotes: 'First aid administered. Wet floor signs placed.',
        resolvedAt: subDays(new Date(), 5),
      },
      {
        facilityId: facility.id,
        reportedById: manager.id,
        incidentTime: subDays(new Date(), 1),
        location: 'Rink B - Center ice',
        incidentType: 'Equipment Malfunction',
        description: 'Zamboni blade nicked the ice during resurfacing, creating a small gouge.',
        severityLevel: SeverityLevel.MINOR,
        ambulanceCalled: false,
        status: 'OPEN',
        followUpNotes: 'Blade inspection scheduled.',
      },
    ],
  });

  // ============================================
  // 9. CREATE SCHEDULE AND SHIFTS
  // ============================================
  console.log('📅 Creating schedules and shifts...');

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 0 });

  const schedule = await prisma.schedule.upsert({
    where: { id: 'schedule-current-week' },
    update: {},
    create: {
      id: 'schedule-current-week',
      facilityId: facility.id,
      name: `Week of ${format(weekStart, 'MMM d, yyyy')}`,
      startDate: weekStart,
      endDate: addDays(weekStart, 6),
      status: 'PUBLISHED',
      publishedAt: new Date(),
    },
  });

  // Create shifts for each day
  const positions = ['Ice Technician', 'Front Desk', 'Zamboni Operator', 'Maintenance'];
  const shiftUsers = [techJohn, techEmily, staffDavid, staffLisa];

  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const shiftDate = addDays(weekStart, dayOffset);

    // Morning shift
    await prisma.scheduleShift.create({
      data: {
        scheduleId: schedule.id,
        userId: shiftUsers[dayOffset % shiftUsers.length].id,
        shiftDate,
        startTime: addHours(shiftDate, 6),
        endTime: addHours(shiftDate, 14),
        position: positions[dayOffset % positions.length],
        status: dayOffset < 3 ? 'COMPLETED' : 'SCHEDULED',
      },
    });

    // Evening shift
    await prisma.scheduleShift.create({
      data: {
        scheduleId: schedule.id,
        userId: shiftUsers[(dayOffset + 1) % shiftUsers.length].id,
        shiftDate,
        startTime: addHours(shiftDate, 14),
        endTime: addHours(shiftDate, 22),
        position: positions[(dayOffset + 1) % positions.length],
        status: dayOffset < 3 ? 'COMPLETED' : 'SCHEDULED',
      },
    });
  }

  // Create time-off requests
  await prisma.timeOffRequest.createMany({
    skipDuplicates: true,
    data: [
      {
        userId: techEmily.id,
        startDate: addDays(new Date(), 14),
        endDate: addDays(new Date(), 16),
        reason: 'Holiday vacation',
        status: 'PENDING',
      },
      {
        userId: staffDavid.id,
        startDate: addDays(new Date(), 21),
        endDate: addDays(new Date(), 21),
        reason: 'Personal day',
        status: 'PENDING',
      },
    ],
  });

  // ============================================
  // 10. CREATE CHECKLISTS
  // ============================================
  console.log('✅ Creating checklists...');

  const openingChecklist = await prisma.checklist.upsert({
    where: { id: 'checklist-opening' },
    update: {},
    create: {
      id: 'checklist-opening',
      facilityId: facility.id,
      name: 'Daily Opening Checklist',
      description: 'Complete these tasks each morning before opening to the public.',
      category: ChecklistCategory.OPENING,
    },
  });

  await prisma.checklistItem.createMany({
    skipDuplicates: true,
    data: [
      { id: 'oc-1', checklistId: openingChecklist.id, label: 'Unlock all entry doors', orderIndex: 0 },
      { id: 'oc-2', checklistId: openingChecklist.id, label: 'Turn on lobby and rink lights', orderIndex: 1 },
      { id: 'oc-3', checklistId: openingChecklist.id, label: 'Check restrooms - supplies and cleanliness', orderIndex: 2 },
      { id: 'oc-4', checklistId: openingChecklist.id, label: 'Inspect ice surface for damage', orderIndex: 3 },
      { id: 'oc-5', checklistId: openingChecklist.id, label: 'Check refrigeration plant readings', orderIndex: 4 },
      { id: 'oc-6', checklistId: openingChecklist.id, label: 'Test PA system', orderIndex: 5 },
      { id: 'oc-7', checklistId: openingChecklist.id, label: 'Verify emergency exits are clear', orderIndex: 6 },
      { id: 'oc-8', checklistId: openingChecklist.id, label: 'Check first aid kit supplies', orderIndex: 7 },
    ],
  });

  const closingChecklist = await prisma.checklist.upsert({
    where: { id: 'checklist-closing' },
    update: {},
    create: {
      id: 'checklist-closing',
      facilityId: facility.id,
      name: 'Daily Closing Checklist',
      description: 'Complete these tasks each evening before leaving.',
      category: ChecklistCategory.CLOSING,
    },
  });

  await prisma.checklistItem.createMany({
    skipDuplicates: true,
    data: [
      { id: 'cc-1', checklistId: closingChecklist.id, label: 'Clear all patrons from facility', orderIndex: 0 },
      { id: 'cc-2', checklistId: closingChecklist.id, label: 'Final ice resurfacing complete', orderIndex: 1 },
      { id: 'cc-3', checklistId: closingChecklist.id, label: 'Turn off non-essential lights', orderIndex: 2 },
      { id: 'cc-4', checklistId: closingChecklist.id, label: 'Check and lock all doors', orderIndex: 3 },
      { id: 'cc-5', checklistId: closingChecklist.id, label: 'Set alarm system', orderIndex: 4 },
      { id: 'cc-6', checklistId: closingChecklist.id, label: 'Record refrigeration readings', orderIndex: 5 },
    ],
  });

  // ============================================
  // 11. CREATE REFRIGERATION & AIR QUALITY LOGS
  // ============================================
  console.log('🌡️  Creating refrigeration and air quality logs...');

  for (let dayOffset = 0; dayOffset < 14; dayOffset++) {
    const date = subDays(new Date(), dayOffset);

    // Refrigeration logs (morning and evening)
    await prisma.refrigerationLog.createMany({
      data: [
        {
          facilityId: facility.id,
          recordedById: techJohn.id,
          recordedAt: addHours(date, 7),
          compressor1Suction: 28 + Math.random() * 4,
          compressor1Discharge: 175 + Math.random() * 10,
          compressor2Suction: 27 + Math.random() * 4,
          compressor2Discharge: 172 + Math.random() * 10,
          brineSupply: 18 + Math.random() * 2,
          brineReturn: 22 + Math.random() * 2,
          condenserIn: 85 + Math.random() * 5,
          condenserOut: 95 + Math.random() * 5,
          oilPressure: 45 + Math.random() * 5,
          oilLevel: 'OK',
          refrigerantLevel: 'OK',
          alarmsPresent: false,
        },
        {
          facilityId: facility.id,
          recordedById: techEmily.id,
          recordedAt: addHours(date, 19),
          compressor1Suction: 29 + Math.random() * 4,
          compressor1Discharge: 178 + Math.random() * 10,
          compressor2Suction: 28 + Math.random() * 4,
          compressor2Discharge: 175 + Math.random() * 10,
          brineSupply: 17 + Math.random() * 2,
          brineReturn: 21 + Math.random() * 2,
          condenserIn: 82 + Math.random() * 5,
          condenserOut: 92 + Math.random() * 5,
          oilPressure: 46 + Math.random() * 5,
          oilLevel: 'OK',
          refrigerantLevel: 'OK',
          alarmsPresent: false,
        },
      ],
    });

    // Air quality logs
    await prisma.airQualityLog.createMany({
      data: [
        {
          facilityId: facility.id,
          recordedById: staffDavid.id,
          location: 'Rink A',
          recordedAt: addHours(date, 10),
          co2Level: 800 + Math.random() * 200,
          coLevel: Math.random() * 5,
          temperature: 55 + Math.random() * 8,
          humidity: 60 + Math.random() * 15,
          thresholdExceeded: false,
        },
        {
          facilityId: facility.id,
          recordedById: staffLisa.id,
          location: 'Rink B',
          recordedAt: addHours(date, 10),
          co2Level: 750 + Math.random() * 200,
          coLevel: Math.random() * 5,
          temperature: 54 + Math.random() * 8,
          humidity: 58 + Math.random() * 15,
          thresholdExceeded: false,
        },
      ],
    });
  }

  // ============================================
  // 12. CREATE ALERTS
  // ============================================
  console.log('🔔 Creating alerts...');

  await prisma.alert.createMany({
    skipDuplicates: true,
    data: [
      {
        facilityId: facility.id,
        alertType: 'CO2_ELEVATED',
        severity: SeverityLevel.MINOR,
        message: 'CO₂ level at Rink B reading 950 ppm (threshold: 1000 ppm)',
        threshold: 1000,
        actualValue: 950,
        isAcknowledged: false,
        createdAt: subDays(new Date(), 0),
      },
      {
        facilityId: facility.id,
        alertType: 'BLADE_HOURS',
        severity: SeverityLevel.MINOR,
        message: 'Zamboni #2 approaching 200 hours on current blade',
        threshold: 200,
        actualValue: 192,
        isAcknowledged: false,
        createdAt: subDays(new Date(), 1),
      },
      {
        facilityId: facility.id,
        alertType: 'ICE_VARIANCE',
        severity: SeverityLevel.MODERATE,
        message: 'Rink A ice depth variance exceeds threshold',
        threshold: 0.15,
        actualValue: 0.18,
        isAcknowledged: true,
        acknowledgedById: manager.id,
        acknowledgedAt: subDays(new Date(), 2),
        createdAt: subDays(new Date(), 3),
      },
    ],
  });

  // ============================================
  // 13. CREATE AUDIT LOGS
  // ============================================
  console.log('📋 Creating audit logs...');

  const auditActions = [
    { action: 'CREATE', entityType: 'IceDepthReading', description: 'recorded ice depth reading' },
    { action: 'CREATE', entityType: 'FormSubmission', description: 'submitted daily refrigeration log' },
    { action: 'UPDATE', entityType: 'IncidentReport', description: 'updated incident status to resolved' },
    { action: 'CREATE', entityType: 'ScheduleShift', description: 'created new shift' },
    { action: 'UPDATE', entityType: 'Alert', description: 'acknowledged alert' },
    { action: 'CREATE', entityType: 'AirQualityLog', description: 'recorded air quality reading' },
    { action: 'CREATE', entityType: 'ZamboniLog', description: 'completed circle check' },
    { action: 'UPDATE', entityType: 'Equipment', description: 'updated hour meter reading' },
  ];

  for (let i = 0; i < 50; i++) {
    const audit = auditActions[Math.floor(Math.random() * auditActions.length)];
    const user = users[Math.floor(Math.random() * users.length)];

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: audit.action,
        entityType: audit.entityType,
        entityId: `entity-${i}`,
        newValues: { description: audit.description },
        createdAt: subDays(new Date(), Math.floor(Math.random() * 30)),
      },
    });
  }

  // ============================================
  // DONE
  // ============================================
  console.log('\n✅ Database seeded successfully!\n');
  console.log('Demo accounts created:');
  console.log('─────────────────────────────────────');
  console.log('  Admin:       admin@mfo.dev');
  console.log('  Manager:     manager@northsideice.com');
  console.log('  Operations:  operations@northsideice.com');
  console.log('  Technician:  john.smith@northsideice.com');
  console.log('  Staff:       david.lee@northsideice.com');
  console.log('─────────────────────────────────────');
  console.log('  Password:    demo123');
  console.log('─────────────────────────────────────\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
