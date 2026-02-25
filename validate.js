#!/usr/bin/env node

/**
 * Validation script for the Open in Gmail extension
 * Checks package integrity and manifest correctness
 */

const fs = require('fs');
const path = require('path');

console.log('\n=== Extension Package Validation ===\n');

let errors = 0;
let warnings = 0;

// Check manifest.json
console.log('1. Validating manifest.json...');
try {
  const manifestPath = path.join(__dirname, 'manifest.json');
  const manifestContent = fs.readFileSync(manifestPath, 'utf8');
  const manifest = JSON.parse(manifestContent);

  // Check required fields
  const requiredFields = ['manifest_version', 'name', 'version', 'description', 'permissions'];
  requiredFields.forEach(field => {
    if (!manifest[field]) {
      console.log(`   ✗ Missing required field: ${field}`);
      errors++;
    } else {
      console.log(`   ✓ ${field}: ${JSON.stringify(manifest[field])}`);
    }
  });

  // Check background scripts
  if (manifest.background && manifest.background.scripts) {
    console.log(`   ✓ Background scripts defined: ${manifest.background.scripts.join(', ')}`);
  } else {
    console.log('   ✗ Background scripts not defined');
    errors++;
  }

  // Check message_display_action
  if (manifest.message_display_action) {
    console.log('   ✓ message_display_action defined');
    if (manifest.message_display_action.default_icon) {
      console.log('   ✓ Button icons defined');
    } else {
      console.log('   ⚠ Button icons not defined');
      warnings++;
    }
  } else {
    console.log('   ✗ message_display_action not defined');
    errors++;
  }

  // Check permissions
  const requiredPermissions = ['messagesRead', 'accountsRead'];
  requiredPermissions.forEach(perm => {
    if (manifest.permissions.includes(perm)) {
      console.log(`   ✓ Permission: ${perm}`);
    } else {
      console.log(`   ✗ Missing permission: ${perm}`);
      errors++;
    }
  });

} catch (error) {
  console.log(`   ✗ Error reading manifest: ${error.message}`);
  errors++;
}

console.log('');

// Check background.js
console.log('2. Validating background.js...');
try {
  const bgPath = path.join(__dirname, 'background.js');
  const bgContent = fs.readFileSync(bgPath, 'utf8');

  // Check for required functions
  const requiredFunctions = ['extractMessageId', 'constructGmailUrl'];
  requiredFunctions.forEach(fn => {
    if (bgContent.includes(`function ${fn}`)) {
      console.log(`   ✓ Function defined: ${fn}`);
    } else {
      console.log(`   ✗ Function not found: ${fn}`);
      errors++;
    }
  });

  // Check for browser API usage
  if (bgContent.includes('browser.messageDisplayAction')) {
    console.log('   ✓ Uses messageDisplayAction API');
  } else {
    console.log('   ✗ messageDisplayAction API not used');
    errors++;
  }

  if (bgContent.includes('browser.messageDisplay.getDisplayedMessage')) {
    console.log('   ✓ Uses getDisplayedMessage API');
  } else {
    console.log('   ✗ getDisplayedMessage API not used');
    errors++;
  }

  if (bgContent.includes('browser.messages.getFull')) {
    console.log('   ✓ Uses getFull API');
  } else {
    console.log('   ✗ getFull API not used');
    errors++;
  }

  if (bgContent.includes('browser.windows.openDefaultBrowser')) {
    console.log('   ✓ Uses openDefaultBrowser API');
  } else {
    console.log('   ✗ openDefaultBrowser API not used');
    errors++;
  }

  // Check for export (for testing)
  if (bgContent.includes('module.exports')) {
    console.log('   ✓ Functions exported for testing');
  } else {
    console.log('   ⚠ Functions not exported (testing may not work)');
    warnings++;
  }

} catch (error) {
  console.log(`   ✗ Error reading background.js: ${error.message}`);
  errors++;
}

console.log('');

// Check icons
console.log('3. Validating icons...');
const requiredIcons = [
  'icons/gmail-16.png',
  'icons/gmail-32.png',
  'icons/gmail-48.png',
  'icons/gmail-96.png'
];

requiredIcons.forEach(icon => {
  const iconPath = path.join(__dirname, icon);
  if (fs.existsSync(iconPath)) {
    const stats = fs.statSync(iconPath);
    console.log(`   ✓ ${icon} (${stats.size} bytes)`);
  } else {
    console.log(`   ✗ Missing icon: ${icon}`);
    errors++;
  }
});

console.log('');

// Check tests
console.log('4. Validating tests...');
try {
  const testPath = path.join(__dirname, 'tests/test.js');
  if (fs.existsSync(testPath)) {
    const testContent = fs.readFileSync(testPath, 'utf8');
    const testCount = (testContent.match(/runner\.test\(/g) || []).length;
    console.log(`   ✓ Test file exists with ${testCount} tests`);
  } else {
    console.log('   ⚠ Test file not found');
    warnings++;
  }
} catch (error) {
  console.log(`   ⚠ Error reading tests: ${error.message}`);
  warnings++;
}

console.log('');

// Check package file
console.log('5. Validating package...');
const packagePath = path.join(__dirname, 'open-in-gmail.xpi');
if (fs.existsSync(packagePath)) {
  const stats = fs.statSync(packagePath);
  console.log(`   ✓ Package file exists: open-in-gmail.xpi (${stats.size} bytes)`);

  // Check if it's a valid zip file
  const buffer = fs.readFileSync(packagePath);
  if (buffer[0] === 0x50 && buffer[1] === 0x4B) { // PK header
    console.log('   ✓ Package is a valid ZIP archive');
  } else {
    console.log('   ✗ Package is not a valid ZIP archive');
    errors++;
  }
} else {
  console.log('   ⚠ Package file not found (run ./package.sh to create)');
  warnings++;
}

console.log('');

// Check documentation
console.log('6. Validating documentation...');
const docFiles = ['README.md', 'TESTING.md'];
docFiles.forEach(doc => {
  const docPath = path.join(__dirname, doc);
  if (fs.existsSync(docPath)) {
    const stats = fs.statSync(docPath);
    console.log(`   ✓ ${doc} (${stats.size} bytes)`);
  } else {
    console.log(`   ⚠ Missing documentation: ${doc}`);
    warnings++;
  }
});

console.log('');

// Summary
console.log('=== Validation Summary ===');
console.log('');

if (errors === 0 && warnings === 0) {
  console.log('✓ All checks passed! Extension is ready for installation.');
  console.log('');
  console.log('Next steps:');
  console.log('1. Install the extension in Thunderbird (see TESTING.md)');
  console.log('2. Test with real emails');
  console.log('3. Verify Gmail URLs open correctly');
} else {
  if (errors > 0) {
    console.log(`✗ ${errors} error(s) found`);
  }
  if (warnings > 0) {
    console.log(`⚠ ${warnings} warning(s) found`);
  }
  console.log('');
  console.log('Please fix the errors before installing the extension.');
}

console.log('');

process.exit(errors > 0 ? 1 : 0);
