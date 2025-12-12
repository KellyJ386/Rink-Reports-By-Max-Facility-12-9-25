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
  // 6B. CREATE COMPREHENSIVE PRE-BUILT TEMPLATES
  // ============================================
  console.log('📝 Creating comprehensive pre-built templates...');

  // 1. Daily Safety Checklist Template
  const dailySafetyForm = await prisma.formTemplate.upsert({
    where: { id: 'template-daily-safety' },
    update: {},
    create: {
      id: 'template-daily-safety',
      facilityId: facility.id,
      createdById: facilityAdmin.id,
      name: 'Daily Safety Checklist',
      description: 'Comprehensive daily safety inspection for facility operations and compliance.',
      category: FormCategory.FACILITY_CHECKLIST,
      isPublished: true,
      version: 10, // v1.0
      includeUser: true,
      includeTimestamp: true,
      includeFacility: true,
    },
  });

  await prisma.formField.createMany({
    skipDuplicates: true,
    data: [
      { id: 'dsf-auto-user', formTemplateId: dailySafetyForm.id, fieldType: FieldType.AUTO_USER, label: 'Inspector', isRequired: true, orderIndex: 0 },
      { id: 'dsf-auto-date', formTemplateId: dailySafetyForm.id, fieldType: FieldType.AUTO_DATE, label: 'Inspection Date', isRequired: true, orderIndex: 1 },
      { id: 'dsf-auto-facility', formTemplateId: dailySafetyForm.id, fieldType: FieldType.AUTO_FACILITY, label: 'Facility', isRequired: true, orderIndex: 2 },
      { id: 'dsf-div-1', formTemplateId: dailySafetyForm.id, fieldType: FieldType.DIVIDER, label: '', orderIndex: 3 },
      { id: 'dsf-header-1', formTemplateId: dailySafetyForm.id, fieldType: FieldType.SECTION_HEADER, label: 'Emergency Equipment', orderIndex: 4 },
      { id: 'dsf-1', formTemplateId: dailySafetyForm.id, fieldType: FieldType.CHECKBOX, label: 'First aid kits fully stocked', isRequired: true, orderIndex: 5 },
      { id: 'dsf-2', formTemplateId: dailySafetyForm.id, fieldType: FieldType.CHECKBOX, label: 'AED functional and accessible', isRequired: true, orderIndex: 6 },
      { id: 'dsf-3', formTemplateId: dailySafetyForm.id, fieldType: FieldType.CHECKBOX, label: 'Fire extinguishers inspected', isRequired: true, orderIndex: 7 },
      { id: 'dsf-4', formTemplateId: dailySafetyForm.id, fieldType: FieldType.CHECKBOX, label: 'Emergency exits clear and marked', isRequired: true, orderIndex: 8 },
      { id: 'dsf-5', formTemplateId: dailySafetyForm.id, fieldType: FieldType.CHECKBOX, label: 'Emergency lighting functional', isRequired: true, orderIndex: 9 },
      { id: 'dsf-div-2', formTemplateId: dailySafetyForm.id, fieldType: FieldType.DIVIDER, label: '', orderIndex: 10 },
      { id: 'dsf-header-2', formTemplateId: dailySafetyForm.id, fieldType: FieldType.SECTION_HEADER, label: 'Ice Surface Safety', orderIndex: 11 },
      { id: 'dsf-6', formTemplateId: dailySafetyForm.id, fieldType: FieldType.CHECKBOX, label: 'Ice surface free of debris', isRequired: true, orderIndex: 12 },
      { id: 'dsf-7', formTemplateId: dailySafetyForm.id, fieldType: FieldType.CHECKBOX, label: 'Boards and glass secure', isRequired: true, orderIndex: 13 },
      { id: 'dsf-8', formTemplateId: dailySafetyForm.id, fieldType: FieldType.CHECKBOX, label: 'Gates functioning properly', isRequired: true, orderIndex: 14 },
      { id: 'dsf-9', formTemplateId: dailySafetyForm.id, fieldType: FieldType.CHECKBOX, label: 'Player benches inspected', isRequired: true, orderIndex: 15 },
      { id: 'dsf-10', formTemplateId: dailySafetyForm.id, fieldType: FieldType.CHECKBOX, label: 'Penalty boxes secure', isRequired: true, orderIndex: 16 },
      { id: 'dsf-div-3', formTemplateId: dailySafetyForm.id, fieldType: FieldType.DIVIDER, label: '', orderIndex: 17 },
      { id: 'dsf-header-3', formTemplateId: dailySafetyForm.id, fieldType: FieldType.SECTION_HEADER, label: 'Facility Areas', orderIndex: 18 },
      { id: 'dsf-11', formTemplateId: dailySafetyForm.id, fieldType: FieldType.CHECKBOX, label: 'Locker rooms clean and safe', isRequired: true, orderIndex: 19 },
      { id: 'dsf-12', formTemplateId: dailySafetyForm.id, fieldType: FieldType.CHECKBOX, label: 'Restrooms clean with supplies', isRequired: true, orderIndex: 20 },
      { id: 'dsf-13', formTemplateId: dailySafetyForm.id, fieldType: FieldType.CHECKBOX, label: 'Lobby and spectator areas clean', isRequired: true, orderIndex: 21 },
      { id: 'dsf-14', formTemplateId: dailySafetyForm.id, fieldType: FieldType.CHECKBOX, label: 'Wet floor signs available', isRequired: true, orderIndex: 22 },
      { id: 'dsf-div-4', formTemplateId: dailySafetyForm.id, fieldType: FieldType.DIVIDER, label: '', orderIndex: 23 },
      { id: 'dsf-15', formTemplateId: dailySafetyForm.id, fieldType: FieldType.DROPDOWN, label: 'Overall Safety Rating', isRequired: true, orderIndex: 24, options: [{ value: 'excellent', label: 'Excellent - All items passed' }, { value: 'good', label: 'Good - Minor issues noted' }, { value: 'fair', label: 'Fair - Issues need attention' }, { value: 'poor', label: 'Poor - Immediate action required' }] },
      { id: 'dsf-16', formTemplateId: dailySafetyForm.id, fieldType: FieldType.TEXTAREA, label: 'Issues Found / Corrective Actions', orderIndex: 25, maxLength: 1000 },
      { id: 'dsf-17', formTemplateId: dailySafetyForm.id, fieldType: FieldType.SIGNATURE, label: 'Inspector Signature', isRequired: true, orderIndex: 26 },
    ],
  });

  // 2. Enhanced Refrigeration Log Template
  const enhancedRefrigForm = await prisma.formTemplate.upsert({
    where: { id: 'template-refrigeration-log' },
    update: {},
    create: {
      id: 'template-refrigeration-log',
      facilityId: facility.id,
      createdById: facilityAdmin.id,
      name: 'Refrigeration System Log',
      description: 'Comprehensive refrigeration plant monitoring with all critical readings.',
      category: FormCategory.REFRIGERATION,
      isPublished: true,
      version: 10,
      includeUser: true,
      includeTimestamp: true,
    },
  });

  await prisma.formField.createMany({
    skipDuplicates: true,
    data: [
      { id: 'erf-auto-user', formTemplateId: enhancedRefrigForm.id, fieldType: FieldType.AUTO_USER, label: 'Technician', isRequired: true, orderIndex: 0 },
      { id: 'erf-auto-date', formTemplateId: enhancedRefrigForm.id, fieldType: FieldType.AUTO_DATE, label: 'Reading Date/Time', isRequired: true, orderIndex: 1 },
      { id: 'erf-shift', formTemplateId: enhancedRefrigForm.id, fieldType: FieldType.DROPDOWN, label: 'Shift', isRequired: true, orderIndex: 2, options: [{ value: 'morning', label: 'Morning (6AM-2PM)' }, { value: 'afternoon', label: 'Afternoon (2PM-10PM)' }, { value: 'night', label: 'Night (10PM-6AM)' }] },
      { id: 'erf-div-1', formTemplateId: enhancedRefrigForm.id, fieldType: FieldType.DIVIDER, label: '', orderIndex: 3 },
      { id: 'erf-header-1', formTemplateId: enhancedRefrigForm.id, fieldType: FieldType.SECTION_HEADER, label: 'Compressor #1', orderIndex: 4 },
      { id: 'erf-1', formTemplateId: enhancedRefrigForm.id, fieldType: FieldType.NUMBER, label: 'Suction Pressure (PSI)', isRequired: true, orderIndex: 5, minValue: 0, maxValue: 100 },
      { id: 'erf-2', formTemplateId: enhancedRefrigForm.id, fieldType: FieldType.NUMBER, label: 'Discharge Pressure (PSI)', isRequired: true, orderIndex: 6, minValue: 100, maxValue: 300 },
      { id: 'erf-3', formTemplateId: enhancedRefrigForm.id, fieldType: FieldType.NUMBER, label: 'Oil Pressure (PSI)', isRequired: true, orderIndex: 7, minValue: 30, maxValue: 80 },
      { id: 'erf-4', formTemplateId: enhancedRefrigForm.id, fieldType: FieldType.DROPDOWN, label: 'Oil Level', isRequired: true, orderIndex: 8, options: [{ value: 'OK', label: 'OK' }, { value: 'LOW', label: 'Low' }, { value: 'CRITICAL', label: 'Critical' }] },
      { id: 'erf-div-2', formTemplateId: enhancedRefrigForm.id, fieldType: FieldType.DIVIDER, label: '', orderIndex: 9 },
      { id: 'erf-header-2', formTemplateId: enhancedRefrigForm.id, fieldType: FieldType.SECTION_HEADER, label: 'Compressor #2', orderIndex: 10 },
      { id: 'erf-5', formTemplateId: enhancedRefrigForm.id, fieldType: FieldType.NUMBER, label: 'Suction Pressure (PSI)', orderIndex: 11, minValue: 0, maxValue: 100 },
      { id: 'erf-6', formTemplateId: enhancedRefrigForm.id, fieldType: FieldType.NUMBER, label: 'Discharge Pressure (PSI)', orderIndex: 12, minValue: 100, maxValue: 300 },
      { id: 'erf-7', formTemplateId: enhancedRefrigForm.id, fieldType: FieldType.NUMBER, label: 'Oil Pressure (PSI)', orderIndex: 13, minValue: 30, maxValue: 80 },
      { id: 'erf-8', formTemplateId: enhancedRefrigForm.id, fieldType: FieldType.DROPDOWN, label: 'Oil Level', orderIndex: 14, options: [{ value: 'OK', label: 'OK' }, { value: 'LOW', label: 'Low' }, { value: 'CRITICAL', label: 'Critical' }] },
      { id: 'erf-div-3', formTemplateId: enhancedRefrigForm.id, fieldType: FieldType.DIVIDER, label: '', orderIndex: 15 },
      { id: 'erf-header-3', formTemplateId: enhancedRefrigForm.id, fieldType: FieldType.SECTION_HEADER, label: 'Brine System', orderIndex: 16 },
      { id: 'erf-9', formTemplateId: enhancedRefrigForm.id, fieldType: FieldType.NUMBER, label: 'Brine Supply Temp (°F)', isRequired: true, orderIndex: 17, minValue: 10, maxValue: 30 },
      { id: 'erf-10', formTemplateId: enhancedRefrigForm.id, fieldType: FieldType.NUMBER, label: 'Brine Return Temp (°F)', isRequired: true, orderIndex: 18, minValue: 10, maxValue: 35 },
      { id: 'erf-11', formTemplateId: enhancedRefrigForm.id, fieldType: FieldType.NUMBER, label: 'Brine Flow (GPM)', orderIndex: 19, minValue: 0, maxValue: 500 },
      { id: 'erf-div-4', formTemplateId: enhancedRefrigForm.id, fieldType: FieldType.DIVIDER, label: '', orderIndex: 20 },
      { id: 'erf-header-4', formTemplateId: enhancedRefrigForm.id, fieldType: FieldType.SECTION_HEADER, label: 'Condenser', orderIndex: 21 },
      { id: 'erf-12', formTemplateId: enhancedRefrigForm.id, fieldType: FieldType.NUMBER, label: 'Condenser Water In (°F)', orderIndex: 22, minValue: 60, maxValue: 120 },
      { id: 'erf-13', formTemplateId: enhancedRefrigForm.id, fieldType: FieldType.NUMBER, label: 'Condenser Water Out (°F)', orderIndex: 23, minValue: 70, maxValue: 130 },
      { id: 'erf-div-5', formTemplateId: enhancedRefrigForm.id, fieldType: FieldType.DIVIDER, label: '', orderIndex: 24 },
      { id: 'erf-14', formTemplateId: enhancedRefrigForm.id, fieldType: FieldType.TOGGLE, label: 'Any Alarms Present?', isRequired: true, orderIndex: 25 },
      { id: 'erf-15', formTemplateId: enhancedRefrigForm.id, fieldType: FieldType.TEXTAREA, label: 'Alarm Details / Notes', orderIndex: 26, maxLength: 500 },
    ],
  });

  // 3. Enhanced Air Quality Log Template
  const enhancedAirQualityForm = await prisma.formTemplate.upsert({
    where: { id: 'template-air-quality-log' },
    update: {},
    create: {
      id: 'template-air-quality-log',
      facilityId: facility.id,
      createdById: facilityAdmin.id,
      name: 'Air Quality Monitoring Log',
      description: 'Track CO2, CO, and environmental conditions for occupant safety.',
      category: FormCategory.AIR_QUALITY,
      isPublished: true,
      version: 10,
      includeUser: true,
      includeTimestamp: true,
    },
  });

  await prisma.formField.createMany({
    skipDuplicates: true,
    data: [
      { id: 'eaq-auto-user', formTemplateId: enhancedAirQualityForm.id, fieldType: FieldType.AUTO_USER, label: 'Recorded By', isRequired: true, orderIndex: 0 },
      { id: 'eaq-auto-date', formTemplateId: enhancedAirQualityForm.id, fieldType: FieldType.AUTO_DATE, label: 'Reading Date/Time', isRequired: true, orderIndex: 1 },
      { id: 'eaq-location', formTemplateId: enhancedAirQualityForm.id, fieldType: FieldType.DROPDOWN, label: 'Monitoring Location', isRequired: true, orderIndex: 2, options: [{ value: 'rink-a-ice', label: 'Rink A - Ice Level' }, { value: 'rink-a-stands', label: 'Rink A - Spectator Stands' }, { value: 'rink-b-ice', label: 'Rink B - Ice Level' }, { value: 'rink-b-stands', label: 'Rink B - Spectator Stands' }, { value: 'lobby', label: 'Main Lobby' }, { value: 'locker-room', label: 'Locker Room Area' }, { value: 'mechanical', label: 'Mechanical Room' }] },
      { id: 'eaq-div-1', formTemplateId: enhancedAirQualityForm.id, fieldType: FieldType.DIVIDER, label: '', orderIndex: 3 },
      { id: 'eaq-header-1', formTemplateId: enhancedAirQualityForm.id, fieldType: FieldType.SECTION_HEADER, label: 'Gas Levels', orderIndex: 4 },
      { id: 'eaq-instr', formTemplateId: enhancedAirQualityForm.id, fieldType: FieldType.INSTRUCTIONAL_TEXT, label: 'CO2: Normal <1000ppm, Action >2000ppm. CO: Normal <9ppm, Action >35ppm', orderIndex: 5 },
      { id: 'eaq-1', formTemplateId: enhancedAirQualityForm.id, fieldType: FieldType.NUMBER, label: 'CO₂ Level (ppm)', isRequired: true, orderIndex: 6, minValue: 0, maxValue: 10000 },
      { id: 'eaq-2', formTemplateId: enhancedAirQualityForm.id, fieldType: FieldType.NUMBER, label: 'CO Level (ppm)', isRequired: true, orderIndex: 7, minValue: 0, maxValue: 100 },
      { id: 'eaq-3', formTemplateId: enhancedAirQualityForm.id, fieldType: FieldType.NUMBER, label: 'NO₂ Level (ppm)', orderIndex: 8, minValue: 0, maxValue: 50 },
      { id: 'eaq-div-2', formTemplateId: enhancedAirQualityForm.id, fieldType: FieldType.DIVIDER, label: '', orderIndex: 9 },
      { id: 'eaq-header-2', formTemplateId: enhancedAirQualityForm.id, fieldType: FieldType.SECTION_HEADER, label: 'Environmental Conditions', orderIndex: 10 },
      { id: 'eaq-4', formTemplateId: enhancedAirQualityForm.id, fieldType: FieldType.NUMBER, label: 'Ambient Temperature (°F)', isRequired: true, orderIndex: 11, minValue: 30, maxValue: 100 },
      { id: 'eaq-5', formTemplateId: enhancedAirQualityForm.id, fieldType: FieldType.NUMBER, label: 'Relative Humidity (%)', isRequired: true, orderIndex: 12, minValue: 0, maxValue: 100 },
      { id: 'eaq-6', formTemplateId: enhancedAirQualityForm.id, fieldType: FieldType.NUMBER, label: 'Dew Point (°F)', orderIndex: 13, minValue: -20, maxValue: 80 },
      { id: 'eaq-div-3', formTemplateId: enhancedAirQualityForm.id, fieldType: FieldType.DIVIDER, label: '', orderIndex: 14 },
      { id: 'eaq-7', formTemplateId: enhancedAirQualityForm.id, fieldType: FieldType.TOGGLE, label: 'Threshold Exceeded?', isRequired: true, orderIndex: 15 },
      { id: 'eaq-8', formTemplateId: enhancedAirQualityForm.id, fieldType: FieldType.MULTI_SELECT, label: 'Actions Taken (if threshold exceeded)', orderIndex: 16, options: [{ value: 'ventilation', label: 'Increased ventilation' }, { value: 'doors-opened', label: 'Doors opened' }, { value: 'evacuation', label: 'Area evacuated' }, { value: 'manager-notified', label: 'Manager notified' }, { value: 'zamboni-stopped', label: 'Zamboni operation stopped' }] },
      { id: 'eaq-9', formTemplateId: enhancedAirQualityForm.id, fieldType: FieldType.TEXTAREA, label: 'Additional Notes', orderIndex: 17, maxLength: 500 },
    ],
  });

  // 4. Incident Report Template (IMMUTABLE)
  const incidentReportForm = await prisma.formTemplate.upsert({
    where: { id: 'template-incident-report' },
    update: {},
    create: {
      id: 'template-incident-report',
      facilityId: facility.id,
      createdById: facilityAdmin.id,
      name: 'Incident Report',
      description: 'Official incident documentation for injuries, accidents, and safety events. Submissions are locked for compliance.',
      category: FormCategory.INCIDENT_REPORTING,
      isPublished: true,
      version: 10,
      isImmutable: true, // CRITICAL: Incident reports cannot be modified after submission
      includeUser: true,
      includeTimestamp: true,
      includeFacility: true,
    },
  });

  await prisma.formField.createMany({
    skipDuplicates: true,
    data: [
      { id: 'irf-auto-user', formTemplateId: incidentReportForm.id, fieldType: FieldType.AUTO_USER, label: 'Report Filed By', isRequired: true, orderIndex: 0 },
      { id: 'irf-auto-date', formTemplateId: incidentReportForm.id, fieldType: FieldType.AUTO_DATE, label: 'Report Date', isRequired: true, orderIndex: 1 },
      { id: 'irf-auto-facility', formTemplateId: incidentReportForm.id, fieldType: FieldType.AUTO_FACILITY, label: 'Facility', isRequired: true, orderIndex: 2 },
      { id: 'irf-div-1', formTemplateId: incidentReportForm.id, fieldType: FieldType.DIVIDER, label: '', orderIndex: 3 },
      { id: 'irf-header-1', formTemplateId: incidentReportForm.id, fieldType: FieldType.SECTION_HEADER, label: 'Incident Details', orderIndex: 4 },
      { id: 'irf-1', formTemplateId: incidentReportForm.id, fieldType: FieldType.DATETIME, label: 'Date and Time of Incident', isRequired: true, orderIndex: 5 },
      { id: 'irf-2', formTemplateId: incidentReportForm.id, fieldType: FieldType.DROPDOWN, label: 'Incident Type', isRequired: true, orderIndex: 6, options: [{ value: 'injury-player', label: 'Player Injury' }, { value: 'injury-spectator', label: 'Spectator Injury' }, { value: 'injury-staff', label: 'Staff Injury' }, { value: 'slip-fall', label: 'Slip and Fall' }, { value: 'collision', label: 'Collision' }, { value: 'equipment', label: 'Equipment Malfunction' }, { value: 'property', label: 'Property Damage' }, { value: 'medical', label: 'Medical Emergency' }, { value: 'security', label: 'Security Incident' }, { value: 'other', label: 'Other' }] },
      { id: 'irf-3', formTemplateId: incidentReportForm.id, fieldType: FieldType.DROPDOWN, label: 'Severity Level', isRequired: true, orderIndex: 7, options: [{ value: 'minor', label: 'Minor - First aid only' }, { value: 'moderate', label: 'Moderate - Medical attention recommended' }, { value: 'major', label: 'Major - Ambulance called' }, { value: 'critical', label: 'Critical - Life-threatening' }] },
      { id: 'irf-4', formTemplateId: incidentReportForm.id, fieldType: FieldType.TEXT, label: 'Specific Location', isRequired: true, orderIndex: 8, placeholder: 'e.g., Rink A - near boards by penalty box' },
      { id: 'irf-5', formTemplateId: incidentReportForm.id, fieldType: FieldType.RINK_DIAGRAM, label: 'Mark Location on Rink', orderIndex: 9 },
      { id: 'irf-div-2', formTemplateId: incidentReportForm.id, fieldType: FieldType.DIVIDER, label: '', orderIndex: 10 },
      { id: 'irf-header-2', formTemplateId: incidentReportForm.id, fieldType: FieldType.SECTION_HEADER, label: 'Injured Party Information', orderIndex: 11 },
      { id: 'irf-6', formTemplateId: incidentReportForm.id, fieldType: FieldType.TEXT, label: 'Name of Injured Person', isRequired: true, orderIndex: 12 },
      { id: 'irf-7', formTemplateId: incidentReportForm.id, fieldType: FieldType.NUMBER, label: 'Age', orderIndex: 13, minValue: 0, maxValue: 120 },
      { id: 'irf-8', formTemplateId: incidentReportForm.id, fieldType: FieldType.PHONE, label: 'Contact Phone', orderIndex: 14 },
      { id: 'irf-9', formTemplateId: incidentReportForm.id, fieldType: FieldType.EMAIL, label: 'Contact Email', orderIndex: 15 },
      { id: 'irf-10', formTemplateId: incidentReportForm.id, fieldType: FieldType.TEXT, label: 'Body Part Injured', orderIndex: 16 },
      { id: 'irf-div-3', formTemplateId: incidentReportForm.id, fieldType: FieldType.DIVIDER, label: '', orderIndex: 17 },
      { id: 'irf-header-3', formTemplateId: incidentReportForm.id, fieldType: FieldType.SECTION_HEADER, label: 'Incident Description', orderIndex: 18 },
      { id: 'irf-11', formTemplateId: incidentReportForm.id, fieldType: FieldType.TEXTAREA, label: 'Describe what happened', isRequired: true, orderIndex: 19, minLength: 50, maxLength: 2000, helpText: 'Provide a detailed description of the incident including what happened before, during, and after.' },
      { id: 'irf-div-4', formTemplateId: incidentReportForm.id, fieldType: FieldType.DIVIDER, label: '', orderIndex: 20 },
      { id: 'irf-header-4', formTemplateId: incidentReportForm.id, fieldType: FieldType.SECTION_HEADER, label: 'Emergency Response', orderIndex: 21 },
      { id: 'irf-12', formTemplateId: incidentReportForm.id, fieldType: FieldType.TOGGLE, label: 'Was ambulance called?', isRequired: true, orderIndex: 22 },
      { id: 'irf-13', formTemplateId: incidentReportForm.id, fieldType: FieldType.TOGGLE, label: 'Was first aid administered?', isRequired: true, orderIndex: 23 },
      { id: 'irf-14', formTemplateId: incidentReportForm.id, fieldType: FieldType.TEXTAREA, label: 'Treatment/First Aid Provided', orderIndex: 24, maxLength: 500 },
      { id: 'irf-div-5', formTemplateId: incidentReportForm.id, fieldType: FieldType.DIVIDER, label: '', orderIndex: 25 },
      { id: 'irf-header-5', formTemplateId: incidentReportForm.id, fieldType: FieldType.SECTION_HEADER, label: 'Witnesses', orderIndex: 26 },
      { id: 'irf-15', formTemplateId: incidentReportForm.id, fieldType: FieldType.TEXT, label: 'Witness 1 Name', orderIndex: 27 },
      { id: 'irf-16', formTemplateId: incidentReportForm.id, fieldType: FieldType.PHONE, label: 'Witness 1 Contact', orderIndex: 28 },
      { id: 'irf-17', formTemplateId: incidentReportForm.id, fieldType: FieldType.TEXT, label: 'Witness 2 Name', orderIndex: 29 },
      { id: 'irf-18', formTemplateId: incidentReportForm.id, fieldType: FieldType.PHONE, label: 'Witness 2 Contact', orderIndex: 30 },
      { id: 'irf-div-6', formTemplateId: incidentReportForm.id, fieldType: FieldType.DIVIDER, label: '', orderIndex: 31 },
      { id: 'irf-header-6', formTemplateId: incidentReportForm.id, fieldType: FieldType.SECTION_HEADER, label: 'Photos and Documentation', orderIndex: 32 },
      { id: 'irf-19', formTemplateId: incidentReportForm.id, fieldType: FieldType.PHOTO, label: 'Incident Photos', orderIndex: 33, helpText: 'Upload photos of the incident scene, injuries (with consent), or damage' },
      { id: 'irf-20', formTemplateId: incidentReportForm.id, fieldType: FieldType.FILE_UPLOAD, label: 'Additional Documents', orderIndex: 34 },
      { id: 'irf-div-7', formTemplateId: incidentReportForm.id, fieldType: FieldType.DIVIDER, label: '', orderIndex: 35 },
      { id: 'irf-21', formTemplateId: incidentReportForm.id, fieldType: FieldType.SIGNATURE, label: 'Reporter Signature', isRequired: true, orderIndex: 36 },
      { id: 'irf-instr', formTemplateId: incidentReportForm.id, fieldType: FieldType.INSTRUCTIONAL_TEXT, label: 'By signing, I certify that the information provided is accurate and complete to the best of my knowledge.', orderIndex: 37 },
    ],
  });

  // 5. Ice Resurfacing Log Template
  const iceResurfacingForm = await prisma.formTemplate.upsert({
    where: { id: 'template-ice-resurfacing' },
    update: {},
    create: {
      id: 'template-ice-resurfacing',
      facilityId: facility.id,
      createdById: facilityAdmin.id,
      name: 'Ice Resurfacing Log',
      description: 'Track each ice cut/flood including equipment, conditions, and ice quality.',
      category: FormCategory.ICE_OPERATIONS,
      isPublished: true,
      version: 10,
      includeUser: true,
      includeTimestamp: true,
      includeWeather: true,
    },
  });

  await prisma.formField.createMany({
    skipDuplicates: true,
    data: [
      { id: 'isf-auto-user', formTemplateId: iceResurfacingForm.id, fieldType: FieldType.AUTO_USER, label: 'Operator', isRequired: true, orderIndex: 0 },
      { id: 'isf-auto-date', formTemplateId: iceResurfacingForm.id, fieldType: FieldType.AUTO_DATE, label: 'Date/Time', isRequired: true, orderIndex: 1 },
      { id: 'isf-1', formTemplateId: iceResurfacingForm.id, fieldType: FieldType.DROPDOWN, label: 'Rink', isRequired: true, orderIndex: 2, options: [{ value: 'rink-a', label: 'Rink A - NHL Size' }, { value: 'rink-b', label: 'Rink B - Olympic Size' }] },
      { id: 'isf-2', formTemplateId: iceResurfacingForm.id, fieldType: FieldType.DROPDOWN, label: 'Machine Used', isRequired: true, orderIndex: 3, options: [{ value: 'zamboni-1', label: 'Zamboni #1' }, { value: 'zamboni-2', label: 'Zamboni #2' }] },
      { id: 'isf-div-1', formTemplateId: iceResurfacingForm.id, fieldType: FieldType.DIVIDER, label: '', orderIndex: 4 },
      { id: 'isf-header-1', formTemplateId: iceResurfacingForm.id, fieldType: FieldType.SECTION_HEADER, label: 'Pre-Resurface Check', orderIndex: 5 },
      { id: 'isf-3', formTemplateId: iceResurfacingForm.id, fieldType: FieldType.NUMBER, label: 'Hour Meter Reading', isRequired: true, orderIndex: 6 },
      { id: 'isf-4', formTemplateId: iceResurfacingForm.id, fieldType: FieldType.CHECKBOX, label: 'Pre-operation circle check completed', isRequired: true, orderIndex: 7 },
      { id: 'isf-5', formTemplateId: iceResurfacingForm.id, fieldType: FieldType.DROPDOWN, label: 'Water Tank Level', isRequired: true, orderIndex: 8, options: [{ value: 'full', label: 'Full' }, { value: '75', label: '75%' }, { value: '50', label: '50%' }, { value: '25', label: '25%' }] },
      { id: 'isf-6', formTemplateId: iceResurfacingForm.id, fieldType: FieldType.DROPDOWN, label: 'Blade Condition', isRequired: true, orderIndex: 9, options: [{ value: 'new', label: 'New/Sharp' }, { value: 'good', label: 'Good' }, { value: 'fair', label: 'Fair' }, { value: 'needs-change', label: 'Needs Changing' }] },
      { id: 'isf-div-2', formTemplateId: iceResurfacingForm.id, fieldType: FieldType.DIVIDER, label: '', orderIndex: 10 },
      { id: 'isf-header-2', formTemplateId: iceResurfacingForm.id, fieldType: FieldType.SECTION_HEADER, label: 'Resurfacing Details', orderIndex: 11 },
      { id: 'isf-7', formTemplateId: iceResurfacingForm.id, fieldType: FieldType.DROPDOWN, label: 'Cut Type', isRequired: true, orderIndex: 12, options: [{ value: 'light', label: 'Light Shave' }, { value: 'medium', label: 'Medium Cut' }, { value: 'heavy', label: 'Heavy Cut' }, { value: 'flood-only', label: 'Flood Only (No Cut)' }] },
      { id: 'isf-8', formTemplateId: iceResurfacingForm.id, fieldType: FieldType.NUMBER, label: 'Water Temperature (°F)', isRequired: true, orderIndex: 13, minValue: 32, maxValue: 180 },
      { id: 'isf-9', formTemplateId: iceResurfacingForm.id, fieldType: FieldType.NUMBER, label: 'Number of Passes', isRequired: true, orderIndex: 14, minValue: 1, maxValue: 5 },
      { id: 'isf-10', formTemplateId: iceResurfacingForm.id, fieldType: FieldType.NUMBER, label: 'Time to Complete (minutes)', orderIndex: 15, minValue: 5, maxValue: 30 },
      { id: 'isf-div-3', formTemplateId: iceResurfacingForm.id, fieldType: FieldType.DIVIDER, label: '', orderIndex: 16 },
      { id: 'isf-header-3', formTemplateId: iceResurfacingForm.id, fieldType: FieldType.SECTION_HEADER, label: 'Ice Conditions', orderIndex: 17 },
      { id: 'isf-11', formTemplateId: iceResurfacingForm.id, fieldType: FieldType.NUMBER, label: 'Ambient Building Temp (°F)', orderIndex: 18, minValue: 40, maxValue: 80 },
      { id: 'isf-12', formTemplateId: iceResurfacingForm.id, fieldType: FieldType.NUMBER, label: 'Ice Surface Temp (°F)', orderIndex: 19, minValue: 15, maxValue: 30 },
      { id: 'isf-13', formTemplateId: iceResurfacingForm.id, fieldType: FieldType.NUMBER, label: 'Humidity (%)', orderIndex: 20, minValue: 0, maxValue: 100 },
      { id: 'isf-14', formTemplateId: iceResurfacingForm.id, fieldType: FieldType.ICE_GRID, label: 'Ice Depth Measurements', orderIndex: 21, helpText: 'Record ice thickness at measurement points' },
      { id: 'isf-div-4', formTemplateId: iceResurfacingForm.id, fieldType: FieldType.DIVIDER, label: '', orderIndex: 22 },
      { id: 'isf-header-4', formTemplateId: iceResurfacingForm.id, fieldType: FieldType.SECTION_HEADER, label: 'Post-Resurface Quality', orderIndex: 23 },
      { id: 'isf-15', formTemplateId: iceResurfacingForm.id, fieldType: FieldType.DROPDOWN, label: 'Ice Quality Rating', isRequired: true, orderIndex: 24, options: [{ value: 'excellent', label: 'Excellent - Competition Ready' }, { value: 'good', label: 'Good - Standard Use' }, { value: 'fair', label: 'Fair - Acceptable' }, { value: 'poor', label: 'Poor - Needs Attention' }] },
      { id: 'isf-16', formTemplateId: iceResurfacingForm.id, fieldType: FieldType.MULTI_SELECT, label: 'Issues Observed', orderIndex: 25, options: [{ value: 'snow-build', label: 'Snow buildup' }, { value: 'ruts', label: 'Ruts or grooves' }, { value: 'soft-spots', label: 'Soft spots' }, { value: 'chips', label: 'Chips or divots' }, { value: 'foggy', label: 'Foggy ice' }, { value: 'lines-faded', label: 'Lines faded' }] },
      { id: 'isf-17', formTemplateId: iceResurfacingForm.id, fieldType: FieldType.TEXTAREA, label: 'Notes / Issues', orderIndex: 26, maxLength: 500 },
    ],
  });

  console.log('✅ Created 5 comprehensive pre-built templates');

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
