# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Run tests
node tests/test.js

# Build the .xpi extension package
./package.sh
```

## Architecture

This is a Thunderbird WebExtension (`manifest_version: 2`) that adds an "Open in Gmail" button to the message display header.

All core logic lives in `background.js`. It has two execution contexts:
- **Thunderbird (WebExtension)**: The `browser.*` API listeners run when loaded as an extension. The button is enabled/disabled based on whether the active message belongs to a Gmail/Googlemail account.
- **Node.js (tests)**: The same file exports `extractMessageId`, `constructGmailUrl`, and `constructGmailFallbackUrl` via `module.exports` for unit testing, guarded by `typeof browser !== 'undefined'` and `typeof module !== 'undefined'` checks.

### Email-to-Gmail URL flow

1. `browser.messageDisplay.onMessageDisplayed` — checks if the message account is Gmail; enables/disables the toolbar button accordingly
2. On button click: fetches the full message via `browser.messages.getFull()`, extracts the RFC822 `Message-ID` header, and builds a Gmail search URL using the `rfc822msgid:` operator
3. Fallback (no Message-ID): constructs a `subject:"..." from:...` query instead
4. URL format: `https://mail.google.com/mail/?authuser=<email>#search/rfc822msgid:<encoded-id>`

The `.xpi` file is a zip of `manifest.json`, `background.js`, and `icons/*.png` — no build toolchain required.
