#!/usr/bin/env node

import qrcode from 'qrcode-terminal';
import { internalIpV4 } from 'internal-ip';

const PORT = 5173;

// Available pages
const PAGES = {
  'upload': 'Identity Upload',
  'edit-look': 'Edit Look',
  'templates': 'Templates',
  'create-post': 'Create Post',
  'feed': 'Feed',
  'profile': 'Profile',
  'admin': 'Admin Config',
  '': 'Home'
};

async function generateQR(page = '') {
  try {
    // Get local network IP
    const ip = await internalIpV4();

    if (!ip) {
      console.error('❌ Could not detect local network IP. Make sure you are connected to a network.');
      process.exit(1);
    }

    const baseUrl = `http://${ip}:${PORT}`;
    const url = page ? `${baseUrl}/${page}` : baseUrl;
    const pageName = PAGES[page] || 'Unknown';

    console.log('\n' + '='.repeat(60));
    console.log(`📱 ${pageName} Page QR Code`);
    console.log('='.repeat(60));
    console.log(`\n🌐 URL: ${url}\n`);

    // Generate QR code
    qrcode.generate(url, { small: true });

    console.log('\n' + '='.repeat(60));
    console.log('📲 Scan with your phone to open this page');
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('❌ Error generating QR code:', error.message);
    process.exit(1);
  }
}

async function showAllPages() {
  const ip = await internalIpV4();

  if (!ip) {
    console.error('❌ Could not detect local network IP');
    process.exit(1);
  }

  console.log('\n' + '='.repeat(60));
  console.log('📱 Available Pages');
  console.log('='.repeat(60) + '\n');

  for (const [path, name] of Object.entries(PAGES)) {
    const url = path ? `http://${ip}:${PORT}/${path}` : `http://${ip}:${PORT}`;
    console.log(`${name.padEnd(20)} - ${path || '/'}`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('💡 Usage:');
  console.log('  node scripts/qr-gen.js [page]');
  console.log('  node scripts/qr-gen.js templates  # Generate QR for templates page');
  console.log('  node scripts/qr-gen.js all       # Generate QR for all pages');
  console.log('='.repeat(60) + '\n');
}

async function generateAllQRs() {
  const ip = await internalIpV4();

  if (!ip) {
    console.error('❌ Could not detect local network IP');
    process.exit(1);
  }

  console.log('\n' + '='.repeat(60));
  console.log('📱 QR Codes for All Pages');
  console.log('='.repeat(60) + '\n');

  for (const [path, name] of Object.entries(PAGES)) {
    const url = path ? `http://${ip}:${PORT}/${path}` : `http://${ip}:${PORT}`;

    console.log(`\n${'▼'.repeat(30)}`);
    console.log(`${name} (${path || '/'})`);
    console.log('▼'.repeat(30) + '\n');

    qrcode.generate(url, { small: true });

    console.log(`\n🌐 ${url}\n`);
  }

  console.log('='.repeat(60) + '\n');
}

// Main
const arg = process.argv[2];

if (!arg) {
  await showAllPages();
} else if (arg === 'all') {
  await generateAllQRs();
} else if (arg === 'list') {
  await showAllPages();
} else if (PAGES.hasOwnProperty(arg)) {
  await generateQR(arg);
} else {
  console.error(`❌ Unknown page: ${arg}`);
  console.error('Run without arguments to see available pages');
  process.exit(1);
}
