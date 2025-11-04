// Prevent multiple instances of the script
if (window.gmailBulkDeleterLoaded) {
  console.log('Gmail Bulk Deleter content script already loaded, skipping...');
} else {
  window.gmailBulkDeleterLoaded = true;
  console.log('Gmail Bulk Deleter content script loaded');

  // Listen for messages from popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'deleteEmails') {
      handleDeleteEmails(request.config)
        .then(result => sendResponse(result))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true; // Keep message channel open for async response
    }
  });
}

async function handleDeleteEmails(config) {
  const { startDate, endDate, category, label, unreadOnly, maxPages } = config;

  try {
    // Build Gmail search query
    let searchQuery = `before:${endDate}`;
    if (startDate) {
      searchQuery = `after:${startDate} ` + searchQuery;
    }
    if (unreadOnly) {
      searchQuery += ' is:unread';
    }
    if (category) {
      searchQuery += ` category:${category}`;
    }
    if (label) {
      searchQuery += ` label:${label}`;
    }

    // Navigate to search results
    console.log('Search query:', searchQuery);
    window.location.hash = `#search/${encodeURIComponent(searchQuery)}`;

    // Wait for page to load
    await waitForElement('[data-tooltip="Select"]', 10000);
    await sleep(2000); // Additional wait for emails to render

    let totalDeleted = 0;
    let currentPage = 0;
    let hasMorePages = true;
    let consecutiveFailures = 0;

    while (hasMorePages && (maxPages === 0 || currentPage < maxPages)) {
      currentPage++;
      console.log(`Processing page ${currentPage}...`);

      // Safety check: if we've had too many consecutive failures, stop
      if (consecutiveFailures >= 3) {
        console.error('⚠ Stopped after 3 consecutive failures. Gmail may need time to recover.');
        console.log(`Successfully deleted ${totalDeleted} emails before stopping.`);
        break;
      }

      // Count emails before selection
      const emailCountBefore = countEmails();
      console.log(`Emails visible on page: ${emailCountBefore}`);

      if (emailCountBefore === 0) {
        console.log('No emails found on this page');
        break;
      }

      // Try multiple methods to select all emails
      let selectedCount = 0;

      // Method 1: Use keyboard shortcut *a (select all)
      console.log('Method 1: Trying keyboard shortcut to select all...');
      const bodyElement = document.body;

      // First, click somewhere in the email list to ensure focus
      const emailList = document.querySelector('div[role="main"]');
      if (emailList) {
        emailList.focus();
      }

      // Simulate pressing * then a (Gmail's select all shortcut)
      const starEvent = new KeyboardEvent('keydown', { key: '*', code: 'Digit8', shiftKey: true });
      bodyElement.dispatchEvent(starEvent);
      await sleep(200);

      const aEvent = new KeyboardEvent('keydown', { key: 'a', code: 'KeyA' });
      bodyElement.dispatchEvent(aEvent);
      await sleep(800);

      selectedCount = countSelectedEmails();
      console.log(`After keyboard shortcut: ${selectedCount} selected`);

      // Method 2: Click individual checkboxes if keyboard shortcut didn't work
      if (selectedCount < emailCountBefore) {
        console.log('Method 2: Clicking individual checkboxes...');

        // Find all email row checkboxes - try multiple selectors
        let checkboxes = document.querySelectorAll('tr.zA div[role="checkbox"]:not([aria-checked="true"])');

        if (checkboxes.length === 0) {
          checkboxes = document.querySelectorAll('tr.zA span[role="checkbox"]');
        }

        if (checkboxes.length === 0) {
          checkboxes = document.querySelectorAll('tr.zA div.oZ-jc');
        }

        console.log(`Found ${checkboxes.length} email checkboxes to click`);

        let clicked = 0;
        for (const checkbox of checkboxes) {
          const isChecked = checkbox.getAttribute('aria-checked') === 'true';
          if (!isChecked) {
            checkbox.click();
            clicked++;
            if (clicked % 20 === 0) {
              await sleep(200); // Small delay every 20 clicks
            }
          }
        }

        await sleep(800);
        selectedCount = countSelectedEmails();
        console.log(`After clicking ${clicked} checkboxes: ${selectedCount} selected`);
      }

      // Method 3: Click the select-all checkbox as fallback
      if (selectedCount < 2) {
        console.log('Method 3: Using select-all checkbox...');
        const selectAllCheckbox = document.querySelector('[data-tooltip="Select"]');
        if (selectAllCheckbox) {
          // Make sure it's not already checked
          const currentState = selectAllCheckbox.getAttribute('aria-checked');
          console.log(`Select-all checkbox state: ${currentState}`);

          if (currentState !== 'true') {
            selectAllCheckbox.click();
            await sleep(800);
            selectedCount = countSelectedEmails();
            console.log(`After select-all click: ${selectedCount} selected`);
          }
        }
      }

      if (selectedCount === 0) {
        console.log('Failed to select any emails, skipping this page');
        break;
      }

      console.log(`Final selection count: ${selectedCount} emails`)

      // Wait a moment for Gmail to enable the delete button
      await sleep(800);

      // Wait for button to be enabled - re-query each time to get fresh state
      let attempts = 0;
      let deleteButton = null;
      let isEnabled = false;

      while (!isEnabled && attempts < 20) {
        deleteButton = findDeleteButton();

        if (!deleteButton) {
          console.log('Delete button not found on attempt', attempts + 1);
          await sleep(500);
          attempts++;
          continue;
        }

        isEnabled = !deleteButton.classList.contains('T-I-JW');

        if (!isEnabled) {
          console.log(`Delete button is disabled, waiting... (attempt ${attempts + 1}/20)`);
          console.log('Button classes:', deleteButton.className);
          await sleep(500);
          attempts++;
        }
      }

      // Final check
      if (!deleteButton) {
        console.log('Delete button not found after waiting');
        throw new Error('Delete button not found. Make sure you are in Gmail inbox view.');
      }

      if (!isEnabled) {
        console.log('Delete button is still disabled after 10 seconds, trying to click anyway...');
        // Don't skip - try clicking anyway since you said it works when you click manually
      } else {
        console.log('✓ Delete button is enabled, proceeding with deletion');
      }

      console.log('Final delete button state:', deleteButton.className);

      // Click the delete button with multiple event types
      console.log('Clicking delete button...');

      // Try mousedown + mouseup (more realistic click)
      const mouseDownEvent = new MouseEvent('mousedown', {
        view: window,
        bubbles: true,
        cancelable: true,
        buttons: 1
      });
      const mouseUpEvent = new MouseEvent('mouseup', {
        view: window,
        bubbles: true,
        cancelable: true,
        buttons: 1
      });

      deleteButton.dispatchEvent(mouseDownEvent);
      await sleep(50);
      deleteButton.dispatchEvent(mouseUpEvent);
      await sleep(50);

      // Also try regular click
      deleteButton.click();

      console.log('Delete button clicked, waiting for Gmail to process...');
      // Wait for deletion to process and for undo notification to appear
      await sleep(2000);

      // Check if an undo notification appeared (this confirms deletion)
      const undoNotification = document.querySelector('[role="alert"]');
      const hasUndo = undoNotification && undoNotification.textContent.toLowerCase().includes('conversation');

      if (hasUndo) {
        console.log('✓ Delete successful - undo notification appeared');
        console.log('Undo message:', undoNotification.textContent);
        totalDeleted += selectedCount;
        consecutiveFailures = 0; // Reset failure counter on success
      } else {
        console.log('No undo notification detected, checking if emails were removed...');

        // Wait a bit more for Gmail to update
        await sleep(2000);

        // Check if the specific selected emails are gone
        const stillSelected = countSelectedEmails();
        console.log(`Selected emails remaining: ${stillSelected}`);

        if (stillSelected === 0) {
          console.log('✓ Emails appear to be deleted (no longer selected)');
          totalDeleted += selectedCount;
          consecutiveFailures = 0; // Reset failure counter
        } else {
          console.warn('⚠ Delete may have failed - trying keyboard shortcut #');
          consecutiveFailures++;

          // Try keyboard shortcut as backup
          const hashEvent = new KeyboardEvent('keypress', {
            key: '#',
            keyCode: 35,
            which: 35,
            bubbles: true,
            cancelable: true
          });
          document.dispatchEvent(hashEvent);

          await sleep(2000);

          const undoCheck = document.querySelector('[role="alert"]');
          if (undoCheck && undoCheck.textContent.toLowerCase().includes('conversation')) {
            console.log('✓ Keyboard shortcut worked');
            totalDeleted += selectedCount;
            consecutiveFailures = 0; // Reset on success
          } else {
            console.error(`✗ Failed to delete emails on this iteration (failure ${consecutiveFailures}/3)`);
            console.log('Will retry on next iteration...');
          }
        }
      }

      // Wait for the undo notification to disappear and new emails to load
      console.log('Waiting for Gmail to load next batch of emails...');
      await sleep(3000);

      // After deleting, Gmail automatically loads more emails
      // Check if there are still emails on the page
      const newEmailCount = countEmails();
      console.log(`New email count after deletion: ${newEmailCount}`);

      if (newEmailCount === 0) {
        console.log('✓ No more emails found - all matching emails deleted!');
        hasMorePages = false;
      } else {
        console.log(`Found ${newEmailCount} more emails, continuing...`);
        hasMorePages = true;

        // Give Gmail extra time to stabilize before next selection
        // This prevents race conditions with Gmail's UI updates
        console.log('Waiting for Gmail UI to stabilize...');
        await sleep(2000);
      }
    }

    // Build trash search query by replacing category with in:trash
    let trashQuery = searchQuery.replace(/category:\S+/g, '').trim();
    trashQuery = `in:trash ${trashQuery}`.trim();

    return {
      success: true,
      deleted: totalDeleted,
      pages: currentPage,
      searchQuery: searchQuery,
      trashQuery: trashQuery
    };

  } catch (error) {
    console.error('Error during deletion:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

function countEmails() {
  // Try multiple selectors to find email rows
  const selectors = [
    'tr.zA',  // Standard Gmail email row
    'tr[role="row"]',  // Accessible row
    'div[role="main"] tr',  // Any table row in main area
    '.ae4.aDM',  // Email row class
  ];

  for (const selector of selectors) {
    const emails = document.querySelectorAll(selector);
    if (emails.length > 0) {
      console.log(`Found ${emails.length} emails using selector: ${selector}`);
      return emails.length;
    }
  }

  return 0;
}

function countSelectedEmails() {
  // Check for selected/checked state in multiple ways
  const selectedSelectors = [
    'tr.x7',  // Gmail's selected row class
    'tr.btb',  // Another possible selected class
    'tr[aria-checked="true"]',  // Accessible checked state
    'tr.zA[class*="x7"]',  // Combined selector
  ];

  for (const selector of selectedSelectors) {
    const selected = document.querySelectorAll(selector);
    if (selected.length > 0) {
      console.log(`Found ${selected.length} selected emails using: ${selector}`);
      return selected.length;
    }
  }

  // Alternative: count checked checkboxes
  const checkedBoxes = document.querySelectorAll('div[role="checkbox"][aria-checked="true"]');
  if (checkedBoxes.length > 1) {  // More than 1 because select-all is also a checkbox
    const count = checkedBoxes.length - 1;
    console.log(`Found ${count} checked email checkboxes`);
    return count;
  }

  return 0;
}

function findDeleteButton() {
  // Gmail delete button has specific aria-label
  const deleteButtons = [
    document.querySelector('[data-tooltip="Delete"]'),
    document.querySelector('[aria-label="Delete"]'),
    ...Array.from(document.querySelectorAll('[role="button"]')).filter(btn =>
      btn.getAttribute('aria-label')?.toLowerCase().includes('delete')
    )
  ];

  return deleteButtons.find(btn => btn !== null);
}

function findOlderButton() {
  // Find "Older" pagination button
  const buttons = [
    document.querySelector('[data-tooltip="Older"]'),
    document.querySelector('[aria-label="Older"]'),
    ...Array.from(document.querySelectorAll('[role="button"]')).filter(btn =>
      btn.getAttribute('aria-label')?.toLowerCase().includes('older')
    )
  ];

  return buttons.find(btn => btn !== null);
}

function waitForElement(selector, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const element = document.querySelector(selector);
    if (element) {
      return resolve(element);
    }

    const observer = new MutationObserver((mutations, obs) => {
      const element = document.querySelector(selector);
      if (element) {
        obs.disconnect();
        resolve(element);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Timeout waiting for element: ${selector}`));
    }, timeout);
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
