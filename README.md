# Open in Gmail - Thunderbird Extension

A Thunderbird extension that adds an "Open in Gmail" button to quickly view the current email in the Gmail web interface.

## Features

- **One-click access**: Opens the current email in Gmail web interface with a single click
- **Smart Message-ID lookup**: Uses RFC822 Message-ID for accurate email matching
- **Fallback search**: If Message-ID is unavailable, searches by subject and sender
- **Native integration**: Button appears directly in the message display header
- **Cross-platform**: Opens in your default system browser on macOS, Linux, and Windows

## Installation

### Quick Install

1. Download the latest `open-in-gmail.xpi` file
2. In Thunderbird, go to **Tools > Add-ons and Themes** (or press `Cmd+Shift+A`)
3. Click the gear icon ⚙️ and select **Install Add-on From File...**
4. Select the downloaded `.xpi` file
5. Click **Add** to confirm

### Build from Source

```bash
# Clone or download the source code
cd open-in-gmail

# Package the extension
./package.sh

# Install the generated .xpi file in Thunderbird
```

## Usage

1. Open any email in Thunderbird
2. Look for the Gmail icon button in the message header area
3. Click the button to open the email in Gmail
4. Your default browser will open with the email displayed

## Requirements

- **Thunderbird**: Version 78.0 or later
- **Gmail account**: The email must exist in your Gmail or Google Workspace account
- **Operating System**: macOS (tested), Linux, Windows

## How It Works

The extension uses two methods to locate emails in Gmail:

1. **Primary Method - Message-ID**: Extracts the RFC822 Message-ID from email headers and uses Gmail's `rfc822msgid:` search operator
2. **Fallback Method**: If Message-ID is unavailable, constructs a search query using the subject line and sender email

### Gmail URL Format

```
https://mail.google.com/mail/?authuser=<email>#search/rfc822msgid:<message-id>
```

## Development

### Project Structure

```
├── manifest.json          # Extension metadata and configuration
├── background.js          # Core logic and Gmail URL construction
├── icons/                 # Extension icons (16x16, 32x32, 48x48, 96x96)
├── tests/                 # Unit tests
│   └── test.js           # Test suite
├── README.md             # This file
└── package.sh            # Build script
```

### Running Tests

```bash
node tests/test.js
```

All tests should pass:
- Message-ID extraction tests (8 tests)
- Gmail URL construction tests (5 tests)
- Fallback URL construction tests (5 tests)
- Integration tests (1 test)

### Building

```bash
./package.sh
```

This creates `open-in-gmail.xpi` in the current directory.

### Debugging

1. Open **Tools > Developer Tools > Debug Add-ons**
2. Load the extension temporarily for testing
3. View logs in **Tools > Developer Tools > Browser Console**

## Permissions

This extension requires the following permissions:

- **messagesRead**: To access email headers and metadata
- **accountsRead**: To look up the account email for the `authuser` parameter

These permissions are only used to read the current email's Message-ID and open the Gmail URL.

## Limitations

- **Gmail account required**: The email must exist in your Gmail or Google Workspace account
- **Multiple accounts**: Uses the account email as the `authuser` parameter; may not work if you have multiple Google accounts signed in to the browser
- **Deleted emails**: Won't find emails that have been deleted from Gmail
- **Search accuracy**: Fallback search may show multiple results if subject/sender aren't unique

## Version History

### 0.0.1 (2026-02-25)
- Initial release
- Message-ID based email lookup; fallback search by subject and sender
- Gmail and Google Workspace account support
- Button enabled/disabled based on whether the active message is from a Gmail account
- Gmail logo icon with external-link arrow badge
