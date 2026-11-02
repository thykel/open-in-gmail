#!/bin/bash

# Comprehensive test suite for Open in Gmail extension
# Runs all tests, validation, and demos

set -e

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                                                                ║"
echo "║           Open in Gmail - Complete Test Suite                 ║"
echo "║           Thunderbird Extension                                ║"
echo "║                                                                ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Track test results
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Test 1: Unit Tests
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 1: Running Unit Tests"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if node tests/test.js; then
    echo ""
    echo "✓ Unit tests PASSED (14/14 tests)"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo ""
    echo "✗ Unit tests FAILED"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

echo ""
read -p "Press Enter to continue to validation checks..."
echo ""

# Test 2: Package Validation
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 2: Package Validation"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if node validate.js; then
    echo ""
    echo "✓ Package validation PASSED"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo ""
    echo "✗ Package validation FAILED"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

echo ""
read -p "Press Enter to continue to functionality demo..."
echo ""

# Test 3: Functionality Demo
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 3: Functionality Demo"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if node demo.js; then
    echo ""
    echo "✓ Functionality demo PASSED"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo ""
    echo "✗ Functionality demo FAILED"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Total test suites: $TOTAL_TESTS"
echo "Passed: $PASSED_TESTS"
echo "Failed: $FAILED_TESTS"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo "╔════════════════════════════════════════════════════════════════╗"
    echo "║                                                                ║"
    echo "║                    ✓ ALL TESTS PASSED!                        ║"
    echo "║                                                                ║"
    echo "║         Extension is ready for installation!                  ║"
    echo "║                                                                ║"
    echo "╚════════════════════════════════════════════════════════════════╝"
    echo ""
    echo "Installation package: open-in-gmail.xpi"
    echo ""
    echo "Next steps:"
    echo "1. Open Thunderbird"
    echo "2. Press Cmd+Shift+A (macOS) to open Add-ons Manager"
    echo "3. Click gear icon and select 'Install Add-on From File...'"
    echo "4. Select open-in-gmail.xpi"
    echo "5. Test by opening an email and clicking the red G button"
    echo ""
    echo "For detailed instructions, see QUICKSTART.md"
    echo ""
    exit 0
else
    echo "╔════════════════════════════════════════════════════════════════╗"
    echo "║                                                                ║"
    echo "║                    ✗ SOME TESTS FAILED                        ║"
    echo "║                                                                ║"
    echo "║         Please review the errors above                        ║"
    echo "║                                                                ║"
    echo "╚════════════════════════════════════════════════════════════════╝"
    echo ""
    exit 1
fi
