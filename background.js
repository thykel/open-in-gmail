/**
 * Thunderbird extension to open emails in Gmail web interface
 */

/**
 * Cache of accountIds confirmed to be Gmail (consumer or Workspace).
 * Negative results are not cached: Sent/Drafts messages may lack Gmail-specific headers,
 * so we re-check until we see a received message that confirms the account is Gmail.
 */
const gmailAccountCache = new Set();

/**
 * Check if an email address is a consumer Gmail/Googlemail account
 * @param {string} email
 * @returns {boolean}
 */
function isGmailEmailDomain(email) {
  if (!email) return false;
  const domain = email.split('@')[1]?.toLowerCase();
  return domain === 'gmail.com' || domain === 'googlemail.com';
}

/**
 * Check if a full message was delivered by Gmail's mail servers.
 * Gmail adds "Authentication-Results: mx.google.com" to every delivered message,
 * including Google Workspace accounts with custom domains.
 * @param {Object} fullMessage - Full message object with headers
 * @returns {boolean}
 */
function hasGmailHeaders(fullMessage) {
  // Received messages: Gmail's MX server adds Authentication-Results
  const authResults = fullMessage.headers['authentication-results'] || [];
  const authValues = Array.isArray(authResults) ? authResults : [authResults];
  if (authValues.some(v => v.includes('mx.google.com'))) return true;

  // Sent messages: Gmail signs outgoing messages with X-Google-DKIM-Signature
  const xGoogleDkim = fullMessage.headers['x-google-dkim-signature'];
  if (Array.isArray(xGoogleDkim) ? xGoogleDkim.length > 0 : !!xGoogleDkim) return true;

  return false;
}

/**
 * Get account email from message folder (used for the authuser URL parameter)
 * @param {Object} message - Message object
 * @returns {Promise<string|null>} - Account email or null
 */
async function getAccountEmailFromMessage(message) {
  try {
    if (!message?.folder?.accountId) return null;
    const account = await browser.accounts.get(message.folder.accountId);
    return account?.identities?.[0]?.email || null;
  } catch (error) {
    console.error("[Open in Gmail] Error getting account email:", error);
    return null;
  }
}

/**
 * Determine if a message belongs to a Gmail account (consumer or Workspace).
 * Uses a two-step check: fast domain check first, then header-based fallback.
 * Caches confirmed Gmail accountIds to avoid repeated getFull() calls.
 * @param {Object} message - Message object
 * @returns {Promise<boolean>}
 */
async function isGmailAccount(message) {
  const accountId = message?.folder?.accountId;
  if (!accountId) return false;

  if (gmailAccountCache.has(accountId)) return true;

  const accountEmail = await getAccountEmailFromMessage(message);
  if (isGmailEmailDomain(accountEmail)) {
    gmailAccountCache.add(accountId);
    return true;
  }

  // Header-based fallback for Workspace accounts (custom domain + Gmail backend)
  try {
    const fullMessage = await browser.messages.getFull(message.id);
    if (hasGmailHeaders(fullMessage)) {
      gmailAccountCache.add(accountId);
      return true;
    }
  } catch (error) {
    console.error("[Open in Gmail] Error checking Gmail headers:", error);
  }

  return false;
}

/**
 * Extract Message-ID from email headers
 * @param {Object} fullMessage - Full message object with headers
 * @returns {string|null} - Message-ID or null if not found
 */
function extractMessageId(fullMessage) {
  if (!fullMessage || !fullMessage.headers) {
    return null;
  }

  const messageIdHeader = fullMessage.headers['message-id'];

  if (!messageIdHeader || messageIdHeader.length === 0) {
    return null;
  }

  let messageId = Array.isArray(messageIdHeader) ? messageIdHeader[0] : messageIdHeader;

  messageId = messageId.trim();
  if (messageId.startsWith('<') && messageId.endsWith('>')) {
    messageId = messageId.slice(1, -1);
  }

  return messageId;
}

/**
 * Build a Gmail search URL
 * @param {string} encodedQuery - Pre-encoded search query
 * @param {string|null} accountEmail - The account email for authuser param
 * @returns {string} - Gmail URL
 */
function buildGmailUrl(encodedQuery, accountEmail) {
  const authParam = accountEmail ? `?authuser=${encodeURIComponent(accountEmail)}` : '';
  return `https://mail.google.com/mail/${authParam}#search/${encodedQuery}`;
}

/**
 * Construct Gmail URL using Message-ID (RFC822 message ID search)
 * @param {string} messageId - The Message-ID
 * @param {string|null} accountEmail - The account email for authuser param
 * @returns {string} - Gmail search URL
 */
function constructGmailUrl(messageId, accountEmail) {
  return buildGmailUrl(`rfc822msgid:${encodeURIComponent(messageId)}`, accountEmail);
}

/**
 * Construct a fallback Gmail search URL using subject and sender
 * @param {Object} message - Message object with subject and author fields
 * @param {string|null} accountEmail - The account email for authuser param
 * @returns {string|null} - Gmail search URL, or null if query cannot be built
 */
function constructGmailFallbackUrl(message, accountEmail) {
  const subject = message.subject || "";
  const author = message.author || "";

  let searchQuery = "";
  if (subject) {
    searchQuery += `subject:"${subject}"`;
  }
  if (author) {
    const emailMatch = author.match(/<([^>]+)>/);
    const email = emailMatch ? emailMatch[1] : author;
    if (searchQuery) searchQuery += " ";
    searchQuery += `from:${email}`;
  }

  if (!searchQuery) {
    return null;
  }

  return buildGmailUrl(encodeURIComponent(searchQuery), accountEmail);
}

/**
 * Fallback: Open Gmail by searching for subject and sender
 * @param {Object} message - Message object
 * @param {string|null} accountEmail - The account email for authuser param
 */
async function openGmailBySubject(message, accountEmail) {
  const gmailUrl = constructGmailFallbackUrl(message, accountEmail);
  if (!gmailUrl) {
    console.error("Cannot construct Gmail search query without subject or author");
    return;
  }

  console.log(`[Open in Gmail] Fallback search for: ${message.subject}`);
  console.log(`[Open in Gmail] Opening URL: ${gmailUrl}`);
  await browser.windows.openDefaultBrowser(gmailUrl);
}

// Only set up browser listeners if we're in a WebExtension environment (not Node.js)
if (typeof browser !== 'undefined') {
  async function updateButtonState(tab, message) {
    if (!message) {
      browser.messageDisplayAction.disable(tab.id);
      return;
    }
    if (await isGmailAccount(message)) {
      browser.messageDisplayAction.enable(tab.id);
    } else {
      browser.messageDisplayAction.disable(tab.id);
    }
  }

  browser.messageDisplay.onMessageDisplayed.addListener(async (tab, message) => {
    try {
      await updateButtonState(tab, message);
    } catch (error) {
      console.error("Error checking account for message:", error);
      browser.messageDisplayAction.disable(tab.id);
    }
  });

  // onMessageDisplayed doesn't re-fire when switching back to a folder where a message
  // was already selected, so we also check on folder changes.
  browser.mailTabs.onDisplayedFolderChanged.addListener(async (tab, _displayedFolder) => {
    try {
      const message = await browser.messageDisplay.getDisplayedMessage(tab.id);
      await updateButtonState(tab, message);
    } catch (error) {
      console.error("Error checking account on folder change:", error);
      browser.messageDisplayAction.disable(tab.id);
    }
  });

  browser.messageDisplayAction.onClicked.addListener(async (tab) => {
    try {
      const message = await browser.messageDisplay.getDisplayedMessage(tab.id);

      if (!message) {
        console.error("No message is currently displayed");
        return;
      }

      const fullMessage = await browser.messages.getFull(message.id);
      const accountEmail = await getAccountEmailFromMessage(message);
      const messageId = extractMessageId(fullMessage);

      if (!messageId) {
        console.error("Could not extract Message-ID from email");
        await openGmailBySubject(message, accountEmail);
        return;
      }

      const gmailUrl = constructGmailUrl(messageId, accountEmail);

      console.log(`[Open in Gmail] Account email: ${accountEmail}`);
      console.log(`[Open in Gmail] Opening URL: ${gmailUrl}`);

      await browser.windows.openDefaultBrowser(gmailUrl);
    } catch (error) {
      console.error("Error opening email in Gmail:", error);
    }
  });
}

// Export functions for testing (when running in Node.js test environment)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    extractMessageId,
    constructGmailUrl,
    constructGmailFallbackUrl,
  };
}
