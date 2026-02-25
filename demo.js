#!/usr/bin/env node

/**
 * Demo script to verify Open in Gmail extension functionality
 * Simulates the extension's behavior with real-world email examples
 */

const { extractMessageId, constructGmailUrl } = require('./background.js');

console.log('\n=== Open in Gmail Extension - Functionality Demo ===\n');

// Real-world test cases
const testCases = [
  {
    name: 'Gmail Message',
    description: 'Typical email from Gmail with standard Message-ID',
    message: {
      headers: {
        'message-id': ['<CADr9Z8KJz8WqY3nB5xYq4zF8M1K5x2j3h4g5f6d7s8a9b0c@mail.gmail.com>'],
        'from': ['john.doe@example.com'],
        'subject': ['Project Update - Q1 2026']
      }
    }
  },
  {
    name: 'Outlook Message',
    description: 'Email from Microsoft Outlook with different Message-ID format',
    message: {
      headers: {
        'message-id': ['<AM6PR12MB1234567890ABCDEF12345678@AM6PR12MB1234.eurprd12.prod.outlook.com>'],
        'from': ['jane.smith@company.com'],
        'subject': ['Meeting Notes - Team Sync']
      }
    }
  },
  {
    name: 'Apple Mail Message',
    description: 'Email from Apple Mail on macOS',
    message: {
      headers: {
        'message-id': ['<F12A3456-7B89-0C12-D345-678E9F012345@icloud.com>'],
        'from': ['support@apple.com'],
        'subject': ['Your Apple ID Security Update']
      }
    }
  },
  {
    name: 'Custom Mail Server',
    description: 'Email from a custom mail server',
    message: {
      headers: {
        'message-id': ['20260109123456.ABC123@mail.customdomain.org'],
        'from': ['admin@customdomain.org'],
        'subject': ['Server Maintenance Notification']
      }
    }
  },
  {
    name: 'Message with Special Characters',
    description: 'Message-ID containing special characters that need encoding',
    message: {
      headers: {
        'message-id': ['<test+special_chars.2026@mail.example.com>'],
        'from': ['noreply@example.com'],
        'subject': ['Newsletter: January 2026']
      }
    }
  }
];

// Process each test case
testCases.forEach((testCase, index) => {
  console.log(`${index + 1}. ${testCase.name}`);
  console.log(`   ${testCase.description}`);
  console.log('');

  // Extract Message-ID
  const messageId = extractMessageId(testCase.message);

  if (messageId) {
    console.log(`   ✓ Message-ID extracted: ${messageId}`);

    // Construct Gmail URL
    const gmailUrl = constructGmailUrl(messageId);
    console.log(`   ✓ Gmail URL generated:`);
    console.log(`     ${gmailUrl}`);
    console.log('');

    // Verify URL format
    if (gmailUrl.includes('rfc822msgid:') &&
        gmailUrl.startsWith('https://mail.google.com/mail/u/0/#search/')) {
      console.log(`   ✓ URL format is correct`);
    } else {
      console.log(`   ✗ URL format is incorrect`);
    }
  } else {
    console.log(`   ✗ Failed to extract Message-ID`);
  }

  console.log('');
  console.log('-'.repeat(80));
  console.log('');
});

// Summary
console.log('=== Demo Complete ===');
console.log('');
console.log('What happens when you click the "Open in Gmail" button:');
console.log('1. Extension extracts the Message-ID from the email headers');
console.log('2. Constructs a Gmail search URL using rfc822msgid: operator');
console.log('3. Opens the URL in your default browser');
console.log('4. Gmail searches for and displays the matching email');
console.log('');
console.log('To test the extension:');
console.log('1. Install the extension in Thunderbird (see README.md)');
console.log('2. Open any email');
console.log('3. Click the red "G" button in the message header');
console.log('4. The email should open in Gmail in your browser');
console.log('');

// Test error handling
console.log('=== Error Handling Tests ===\n');

const errorCases = [
  {
    name: 'Missing Message-ID',
    message: {
      headers: {
        'from': ['user@example.com'],
        'subject': ['Test Email']
      }
    }
  },
  {
    name: 'Empty Message-ID',
    message: {
      headers: {
        'message-id': [],
        'from': ['user@example.com'],
        'subject': ['Test Email']
      }
    }
  },
  {
    name: 'Null Input',
    message: null
  }
];

errorCases.forEach((testCase, index) => {
  console.log(`${index + 1}. ${testCase.name}`);
  const messageId = extractMessageId(testCase.message);

  if (messageId === null) {
    console.log('   ✓ Correctly returned null (fallback search will be used)');
  } else {
    console.log('   ✗ Should have returned null');
  }
  console.log('');
});

console.log('=== All Demos Completed Successfully ===\n');
