/**
 * Unit tests for Open in Gmail extension
 */

// Import the functions to test
const { extractMessageId, constructGmailUrl, constructGmailFallbackUrl } = require('../background.js');

// Simple test framework
class TestRunner {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
  }

  test(name, fn) {
    this.tests.push({ name, fn });
  }

  async run() {
    console.log('\n=== Running Tests ===\n');

    for (const { name, fn } of this.tests) {
      try {
        await fn();
        this.passed++;
        console.log(`✓ ${name}`);
      } catch (error) {
        this.failed++;
        console.log(`✗ ${name}`);
        console.log(`  Error: ${error.message}`);
      }
    }

    console.log(`\n=== Test Results ===`);
    console.log(`Passed: ${this.passed}`);
    console.log(`Failed: ${this.failed}`);
    console.log(`Total: ${this.tests.length}`);

    return this.failed === 0;
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

function assertEquals(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(
      message || `Expected "${expected}" but got "${actual}"`
    );
  }
}

// Create test runner
const runner = new TestRunner();

// Test: extractMessageId with standard format
runner.test('extractMessageId - standard format with angle brackets', () => {
  const fullMessage = {
    headers: {
      'message-id': ['<abc123@mail.gmail.com>']
    }
  };

  const result = extractMessageId(fullMessage);
  assertEquals(result, 'abc123@mail.gmail.com', 'Should extract Message-ID without angle brackets');
});

// Test: extractMessageId without angle brackets
runner.test('extractMessageId - without angle brackets', () => {
  const fullMessage = {
    headers: {
      'message-id': ['def456@example.com']
    }
  };

  const result = extractMessageId(fullMessage);
  assertEquals(result, 'def456@example.com', 'Should handle Message-ID without angle brackets');
});

// Test: extractMessageId with string instead of array
runner.test('extractMessageId - string instead of array', () => {
  const fullMessage = {
    headers: {
      'message-id': '<xyz789@outlook.com>'
    }
  };

  const result = extractMessageId(fullMessage);
  assertEquals(result, 'xyz789@outlook.com', 'Should handle Message-ID as string');
});

// Test: extractMessageId with whitespace
runner.test('extractMessageId - with whitespace', () => {
  const fullMessage = {
    headers: {
      'message-id': ['  <test@domain.com>  ']
    }
  };

  const result = extractMessageId(fullMessage);
  assertEquals(result, 'test@domain.com', 'Should trim whitespace');
});

// Test: extractMessageId with complex Message-ID
runner.test('extractMessageId - complex Message-ID', () => {
  const fullMessage = {
    headers: {
      'message-id': ['<CAB12-AbC_DeF.123456789@mail.gmail.com>']
    }
  };

  const result = extractMessageId(fullMessage);
  assertEquals(
    result,
    'CAB12-AbC_DeF.123456789@mail.gmail.com',
    'Should handle complex Message-ID with special characters'
  );
});

// Test: extractMessageId with missing headers
runner.test('extractMessageId - missing headers', () => {
  const fullMessage = {
    headers: {}
  };

  const result = extractMessageId(fullMessage);
  assertEquals(result, null, 'Should return null when Message-ID header is missing');
});

// Test: extractMessageId with null input
runner.test('extractMessageId - null input', () => {
  const result = extractMessageId(null);
  assertEquals(result, null, 'Should return null for null input');
});

// Test: extractMessageId with empty Message-ID array
runner.test('extractMessageId - empty Message-ID array', () => {
  const fullMessage = {
    headers: {
      'message-id': []
    }
  };

  const result = extractMessageId(fullMessage);
  assertEquals(result, null, 'Should return null for empty Message-ID array');
});

// Test: constructGmailUrl with simple Message-ID (no account email)
runner.test('constructGmailUrl - simple Message-ID', () => {
  const messageId = 'test123@gmail.com';
  const result = constructGmailUrl(messageId);
  const expected = 'https://mail.google.com/mail/#search/rfc822msgid:test123%40gmail.com';

  assertEquals(result, expected, 'Should construct correct Gmail URL');
});

// Test: constructGmailUrl with account email (authuser param)
runner.test('constructGmailUrl - with account email', () => {
  const messageId = 'test123@gmail.com';
  const accountEmail = 'user@gmail.com';
  const result = constructGmailUrl(messageId, accountEmail);

  assert(result.includes('?authuser=user%40gmail.com'), 'Should include authuser parameter');
  assert(result.includes('#search/rfc822msgid:'), 'Should have search fragment');
});

// Test: constructGmailUrl with special characters
runner.test('constructGmailUrl - Message-ID with special characters', () => {
  const messageId = 'test+special@gmail.com';
  const result = constructGmailUrl(messageId);

  assert(result.includes('test%2Bspecial%40gmail.com'), 'Should URL-encode special characters');
  assert(result.startsWith('https://mail.google.com/mail/#search/rfc822msgid:'), 'Should have correct base URL');
});

// Test: constructGmailUrl with complex Message-ID
runner.test('constructGmailUrl - complex Message-ID', () => {
  const messageId = 'CAB12-AbC_DeF.123456789@mail.gmail.com';
  const result = constructGmailUrl(messageId);

  assert(result.includes(encodeURIComponent(messageId)), 'Should encode entire Message-ID');
  assert(result.startsWith('https://mail.google.com/mail/#search/rfc822msgid:'), 'Should have correct base URL');
});

// Test: Real-world Gmail Message-ID format
runner.test('constructGmailUrl - real Gmail Message-ID format', () => {
  const messageId = 'CADr9Z8KJz8WqY3nB5xYq4zF8M1K5x2j3h4g5f6d7s8a9b0c@mail.gmail.com';
  const result = constructGmailUrl(messageId);

  assert(result.includes('rfc822msgid:'), 'Should use rfc822msgid search operator');
  assert(result.includes(encodeURIComponent(messageId)), 'Should include encoded Message-ID');
});

// Integration test: Full workflow
runner.test('Integration - Extract and construct URL from full message', () => {
  const fullMessage = {
    headers: {
      'message-id': ['<CADr9Z8KTest123@mail.gmail.com>'],
      'from': ['test@example.com'],
      'subject': ['Test Subject']
    }
  };

  const messageId = extractMessageId(fullMessage);
  assert(messageId !== null, 'Should extract Message-ID');
  assertEquals(messageId, 'CADr9Z8KTest123@mail.gmail.com', 'Should extract correct Message-ID');

  const url = constructGmailUrl(messageId);
  assert(url.includes('rfc822msgid:'), 'Should construct URL with rfc822msgid');
  assert(url.includes('CADr9Z8KTest123'), 'URL should contain Message-ID');
});

// Tests: constructGmailFallbackUrl
runner.test('constructGmailFallbackUrl - subject and author with angle brackets', () => {
  const message = { subject: 'Hello World', author: 'Alice <alice@example.com>' };
  const result = constructGmailFallbackUrl(message, null);

  assert(result.includes('subject%3A%22Hello%20World%22'), 'Should include encoded subject query');
  assert(result.includes('from%3Aalice%40example.com'), 'Should extract email from angle brackets');
  assert(result.startsWith('https://mail.google.com/mail/#search/'), 'Should have correct base URL');
});

runner.test('constructGmailFallbackUrl - subject only', () => {
  const message = { subject: 'Test Subject', author: '' };
  const result = constructGmailFallbackUrl(message, null);

  assert(result !== null, 'Should return a URL when subject is present');
  assert(result.includes('subject%3A%22Test%20Subject%22'), 'Should include subject query');
  assert(!result.includes('from%3A'), 'Should not include from clause');
});

runner.test('constructGmailFallbackUrl - author only (plain email)', () => {
  const message = { subject: '', author: 'bob@example.com' };
  const result = constructGmailFallbackUrl(message, null);

  assert(result !== null, 'Should return a URL when author is present');
  assert(result.includes('from%3Abob%40example.com'), 'Should include from clause');
  assert(!result.includes('subject%3A'), 'Should not include subject clause');
});

runner.test('constructGmailFallbackUrl - no subject or author returns null', () => {
  const message = { subject: '', author: '' };
  const result = constructGmailFallbackUrl(message, null);

  assertEquals(result, null, 'Should return null when neither subject nor author is available');
});

runner.test('constructGmailFallbackUrl - with account email adds authuser', () => {
  const message = { subject: 'Test', author: 'alice@example.com' };
  const result = constructGmailFallbackUrl(message, 'user@gmail.com');

  assert(result.includes('?authuser=user%40gmail.com'), 'Should include authuser parameter');
});

// Run all tests
runner.run().then((success) => {
  process.exit(success ? 0 : 1);
});
