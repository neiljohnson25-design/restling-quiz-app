import { PrismaClient, Difficulty } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Category configurations
const CATEGORY_CONFIG: Record<string, { description: string; unlockLevel: number; colorTheme: string; sortOrder: number }> = {
  'WWF/WWE Golden Era': {
    description: 'Test your knowledge of wrestling\'s golden age from the 1980s to early 1990s. Hulkamania, WrestleMania, and the birth of sports entertainment!',
    unlockLevel: 1,
    colorTheme: '#FFD700',
    sortOrder: 1,
  },
  'Attitude Era': {
    description: 'The most rebellious time in wrestling history. Austin 3:16, The Rock, DX, and Monday Night Wars!',
    unlockLevel: 1,
    colorTheme: '#C8102E',
    sortOrder: 2,
  },
  'Ruthless Aggression Era': {
    description: 'The era of ruthless aggression! Brock Lesnar, John Cena, Batista, and the rise of new superstars.',
    unlockLevel: 2,
    colorTheme: '#0047AB',
    sortOrder: 3,
  },
  'WCW Monday Nitro': {
    description: 'Where the big boys play! nWo, Goldberg, Sting, and the company that almost won the war.',
    unlockLevel: 1,
    colorTheme: '#000000',
    sortOrder: 4,
  },
  'ECW Hardcore': {
    description: 'Extreme Championship Wrestling - where the rules didn\'t apply. Hardcore legends and unforgettable moments.',
    unlockLevel: 3,
    colorTheme: '#8B0000',
    sortOrder: 5,
  },
  'Wrestling Finishers': {
    description: 'Can you identify the signature moves that ended matches? From the Stunner to the RKO!',
    unlockLevel: 1,
    colorTheme: '#FF4500',
    sortOrder: 6,
  },
  'Catchphrases & Promos': {
    description: 'If you smell what The Rock is cooking! Test your knowledge of wrestling\'s most iconic words.',
    unlockLevel: 1,
    colorTheme: '#9932CC',
    sortOrder: 7,
  },
  'Championship History': {
    description: 'Who held the gold? Test your knowledge of title reigns, record holders, and championship lineages.',
    unlockLevel: 2,
    colorTheme: '#FFD700',
    sortOrder: 8,
  },
  'Royal Rumble History': {
    description: '30 men, one winner! From 1988 to today, how well do you know the Royal Rumble?',
    unlockLevel: 2,
    colorTheme: '#4169E1',
    sortOrder: 9,
  },
  'Tag Team Wrestling': {
    description: 'The best tag teams in wrestling history. From the Road Warriors to the Hardy Boyz!',
    unlockLevel: 2,
    colorTheme: '#228B22',
    sortOrder: 10,
  },
  'Specialty Matches': {
    description: 'Hell in a Cell, TLC, Royal Rumble rules, and more! Do you know your match types?',
    unlockLevel: 3,
    colorTheme: '#DC143C',
    sortOrder: 11,
  },
  'Modern Era WWE': {
    description: 'The current era of WWE. Roman Reigns, The Bloodline, and today\'s superstars!',
    unlockLevel: 1,
    colorTheme: '#1E90FF',
    sortOrder: 12,
  },
  'International Wrestling': {
    description: 'Wrestling around the world! NJPW, AEW, and promotions from across the globe.',
    unlockLevel: 3,
    colorTheme: '#FF6347',
    sortOrder: 13,
  },
  'Stables & Factions': {
    description: 'The greatest factions in wrestling history. nWo, DX, The Four Horsemen, and more!',
    unlockLevel: 2,
    colorTheme: '#2F4F4F',
    sortOrder: 14,
  },
  'WrestleMania Moments': {
    description: 'The showcase of the immortals! The biggest moments from wrestling\'s grandest stage.',
    unlockLevel: 2,
    colorTheme: '#FFD700',
    sortOrder: 15,
  },
  'Women\'s Wrestling': {
    description: 'The women\'s evolution! From the Fabulous Moolah to Becky Lynch and beyond.',
    unlockLevel: 2,
    colorTheme: '#FF69B4',
    sortOrder: 16,
  },
  'Managers & Valets': {
    description: 'The men and women who guided champions. Bobby Heenan, Paul Heyman, and more!',
    unlockLevel: 3,
    colorTheme: '#708090',
    sortOrder: 17,
  },
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .trim();
}

function parseCsv(content: string): any[] {
  const lines = content.split('\n');
  const headers = lines[0].split(',');
  const records: any[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Handle CSV parsing with potential commas in fields
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    if (values.length >= 11) {
      records.push({
        category: values[0],
        questionText: values[1],
        questionType: values[2],
        difficulty: values[3] as Difficulty,
        correctAnswer: values[4],
        options: [values[5], values[6], values[7], values[8]].filter(Boolean),
        explanation: values[9] || null,
        xpReward: parseInt(values[10], 10) || 50,
        timeLimit: parseInt(values[11], 10) || 15,
      });
    }
  }

  return records;
}

async function main() {
  console.log('Starting seed...');

  // Create categories
  console.log('Creating categories...');
  const categories: Record<string, string> = {};

  for (const [name, config] of Object.entries(CATEGORY_CONFIG)) {
    const category = await prisma.quizCategory.upsert({
      where: { slug: slugify(name) },
      update: config,
      create: {
        name,
        slug: slugify(name),
        ...config,
      },
    });
    categories[name] = category.id;
    console.log(`  Created/updated category: ${name}`);
  }

  // Load and parse CSV
  console.log('\nLoading questions from CSV...');
  const csvPath = path.join(__dirname, '../../wrestling-quiz-FINAL.csv');

  if (!fs.existsSync(csvPath)) {
    console.log('CSV file not found at:', csvPath);
    console.log('Looking in parent directory...');
    const altPath = path.join(__dirname, '../../../wrestling-quiz-FINAL.csv');
    if (fs.existsSync(altPath)) {
      console.log('Found CSV at:', altPath);
    } else {
      console.log('CSV file not found. Please place wrestling-quiz-FINAL.csv in the project root.');
      return;
    }
  }

  const csvContent = fs.readFileSync(
    fs.existsSync(csvPath) ? csvPath : path.join(__dirname, '../../../wrestling-quiz-FINAL.csv'),
    'utf-8'
  );
  const questions = parseCsv(csvContent);

  console.log(`Parsed ${questions.length} questions from CSV`);

  // Insert questions
  let inserted = 0;
  let skipped = 0;

  for (const q of questions) {
    const categoryId = categories[q.category];
    if (!categoryId) {
      console.log(`  Skipping question - unknown category: ${q.category}`);
      skipped++;
      continue;
    }

    try {
      await prisma.question.create({
        data: {
          categoryId,
          questionText: q.questionText,
          questionType: 'MULTIPLE_CHOICE',
          difficulty: q.difficulty,
          correctAnswer: q.correctAnswer,
          answerOptions: q.options,
          explanation: q.explanation,
          xpReward: q.xpReward,
          timeLimit: q.timeLimit,
        },
      });
      inserted++;
    } catch (error: any) {
      if (error.code === 'P2002') {
        skipped++;
      } else {
        console.log(`  Error inserting question: ${error.message}`);
        skipped++;
      }
    }
  }

  console.log(`\nInserted ${inserted} questions, skipped ${skipped}`);

  // Create achievements
  console.log('\nCreating achievements...');
  const achievements = [
    {
      name: 'Know Your Role',
      description: 'Complete your first quiz question',
      unlockCriteria: { type: 'first_quiz' },
      xpReward: 100,
      beltTier: null,
    },
    {
      name: 'Rising Star',
      description: 'Reach level 5',
      unlockCriteria: { type: 'level', value: 5 },
      xpReward: 200,
      beltTier: 'bronze' as const,
    },
    {
      name: 'Main Eventer',
      description: 'Reach level 10',
      unlockCriteria: { type: 'level', value: 10 },
      xpReward: 500,
      beltTier: 'silver' as const,
    },
    {
      name: 'Hall of Famer',
      description: 'Reach level 25',
      unlockCriteria: { type: 'level', value: 25 },
      xpReward: 1000,
      beltTier: 'gold' as const,
    },
    {
      name: 'Legend',
      description: 'Reach level 50',
      unlockCriteria: { type: 'level', value: 50 },
      xpReward: 2500,
      beltTier: 'championship' as const,
    },
    {
      name: '7-Day Champion',
      description: 'Maintain a 7-day streak',
      unlockCriteria: { type: 'streak', value: 7 },
      xpReward: 300,
      beltTier: 'bronze' as const,
    },
    {
      name: 'Iron Man',
      description: 'Maintain a 30-day streak',
      unlockCriteria: { type: 'streak', value: 30 },
      xpReward: 1000,
      beltTier: 'gold' as const,
    },
    {
      name: 'Undertaker Streak',
      description: 'Maintain a 21-day streak',
      unlockCriteria: { type: 'streak', value: 21 },
      xpReward: 750,
      beltTier: 'silver' as const,
    },
    {
      name: 'Century Club',
      description: 'Answer 100 questions correctly',
      unlockCriteria: { type: 'total_correct', value: 100 },
      xpReward: 500,
      beltTier: 'bronze' as const,
    },
    {
      name: 'Millennium Man',
      description: 'Answer 1000 questions correctly',
      unlockCriteria: { type: 'total_correct', value: 1000 },
      xpReward: 2000,
      beltTier: 'gold' as const,
    },
    {
      name: 'Speed Demon',
      description: 'Answer 10 questions correctly in under 5 seconds each',
      unlockCriteria: { type: 'speed_demon', value: 5 },
      xpReward: 250,
      beltTier: 'bronze' as const,
    },
    {
      name: 'Perfect 10',
      description: 'Get 10 questions correct in a row',
      unlockCriteria: { type: 'perfect_quiz' },
      xpReward: 400,
      beltTier: 'silver' as const,
    },
    {
      name: 'Attitude Era Expert',
      description: 'Answer 50 Attitude Era questions correctly',
      unlockCriteria: { type: 'category_correct', categorySlug: 'attitude-era', value: 50 },
      xpReward: 500,
      beltTier: 'silver' as const,
    },
    {
      name: 'Golden Era Guru',
      description: 'Answer 50 Golden Era questions correctly',
      unlockCriteria: { type: 'category_correct', categorySlug: 'wwfwwe-golden-era', value: 50 },
      xpReward: 500,
      beltTier: 'silver' as const,
    },
    {
      name: 'ECW Original',
      description: 'Achieve 80% accuracy in ECW Hardcore with at least 20 answers',
      unlockCriteria: { type: 'category_accuracy', categorySlug: 'ecw-hardcore', accuracy: 80 },
      xpReward: 600,
      beltTier: 'gold' as const,
    },
  ];

  for (const achievement of achievements) {
    await prisma.achievement.upsert({
      where: { name: achievement.name },
      update: achievement,
      create: achievement,
    });
    console.log(`  Created/updated achievement: ${achievement.name}`);
  }

  // Create championship belts
  console.log('\nCreating championship belts...');
  const belts = [
    {
      name: 'WWF Championship',
      description: 'Complete all questions in the WWF/WWE Golden Era category',
      beltImageUrl: '/belts/wwf-championship.png',
      categoryId: categories['WWF/WWE Golden Era'],
      unlockCriteria: { type: 'category_complete' },
      rarity: 'common' as const,
    },
    {
      name: 'Attitude Era Championship',
      description: 'Achieve 90% accuracy in the Attitude Era category with at least 50 answers',
      beltImageUrl: '/belts/attitude-era.png',
      categoryId: categories['Attitude Era'],
      unlockCriteria: { type: 'category_mastery', accuracy: 90 },
      rarity: 'rare' as const,
    },
    {
      name: 'ECW Television Championship',
      description: 'Complete all questions in the ECW Hardcore category',
      beltImageUrl: '/belts/ecw-tv.png',
      categoryId: categories['ECW Hardcore'],
      unlockCriteria: { type: 'category_complete' },
      rarity: 'rare' as const,
    },
    {
      name: 'WCW World Heavyweight Championship',
      description: 'Answer 100 WCW questions correctly',
      beltImageUrl: '/belts/wcw-world.png',
      categoryId: categories['WCW Monday Nitro'],
      unlockCriteria: { type: 'total_correct', value: 100 },
      rarity: 'rare' as const,
    },
    {
      name: 'Big Blue Cage Hardcore Championship',
      description: 'Answer 500 questions correctly across all categories',
      beltImageUrl: '/belts/bbc-hardcore.png',
      categoryId: null,
      unlockCriteria: { type: 'total_correct', value: 500 },
      rarity: 'legendary' as const,
      bigBlueCageProductUrl: 'https://bigbluecage.com/custom-belts',
    },
    {
      name: 'Big Blue Cage World Championship',
      description: 'Reach level 50 and answer 1000 questions correctly',
      beltImageUrl: '/belts/bbc-world.png',
      categoryId: null,
      unlockCriteria: { type: 'total_correct', value: 1000 },
      rarity: 'legendary' as const,
      bigBlueCageProductUrl: 'https://bigbluecage.com/custom-belts',
    },
  ];

  for (const belt of belts) {
    await prisma.championshipBelt.upsert({
      where: { name: belt.name },
      update: belt,
      create: belt,
    });
    console.log(`  Created/updated belt: ${belt.name}`);
  }

  // Create admin user
  console.log('\nCreating admin user...');
  const adminPassword = await bcrypt.hash('admin123', 12);
  await prisma.user.upsert({
    where: { email: 'admin@bigbluecage.com' },
    update: {},
    create: {
      email: 'admin@bigbluecage.com',
      username: 'admin',
      passwordHash: adminPassword,
      displayName: 'Big Blue Cage Admin',
      isAdmin: true,
    },
  });
  console.log('  Admin user created: admin@bigbluecage.com / admin123');

  console.log('\nSeed completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
