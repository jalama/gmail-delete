document.getElementById('deleteBtn').addEventListener('click', async () => {
  const startDate = document.getElementById('startDate').value;
  const endDate = document.getElementById('endDate').value;
  const category = document.getElementById('category').value.trim();
  const label = document.getElementById('label').value.trim();
  const unreadOnly = document.getElementById('unreadOnly').checked;
  const maxPages = parseInt(document.getElementById('maxPages').value) || 0;

  // Validation
  if (!endDate) {
    showStatus('Please enter an end date', 'error');
    return;
  }

  if (startDate && new Date(startDate) > new Date(endDate)) {
    showStatus('Start date must be before or equal to end date', 'error');
    return;
  }

  const deleteBtn = document.getElementById('deleteBtn');
  deleteBtn.disabled = true;
  deleteBtn.textContent = 'Processing...';

  try {
    // Get active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab.url.includes('mail.google.com')) {
      showStatus('Please navigate to Gmail first', 'error');
      deleteBtn.disabled = false;
      deleteBtn.textContent = 'Delete Emails';
      return;
    }

    // Inject content script if not already loaded
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      });
      // Wait a bit for script to initialize
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (injectionError) {
      // Script might already be injected, that's okay
      console.log('Content script injection:', injectionError.message);
    }

    // Send message to content script
    const response = await chrome.tabs.sendMessage(tab.id, {
      action: 'deleteEmails',
      config: {
        startDate,
        endDate,
        category,
        label,
        unreadOnly,
        maxPages
      }
    });

    if (response && response.success) {
      const message = `Success! Deleted ${response.deleted} emails across ${response.pages} pages.`;
      const trashUrl = `https://mail.google.com/mail/u/0/#search/${encodeURIComponent(response.trashQuery)}`;
      showStatus(message, 'success', trashUrl);
    } else if (response) {
      showStatus(`Error: ${response.error}`, 'error');
    } else {
      showStatus('No response from content script', 'error');
    }
  } catch (error) {
    if (error.message.includes('Receiving end does not exist')) {
      showStatus('Please refresh the Gmail page and try again', 'error');
    } else {
      showStatus(`Error: ${error.message}`, 'error');
    }
  } finally {
    deleteBtn.disabled = false;
    deleteBtn.textContent = 'Delete Emails';
  }
});

function showStatus(message, type, trashUrl = null) {
  const status = document.getElementById('status');
  status.innerHTML = ''; // Clear previous content
  status.className = type;
  status.style.display = 'block';

  // Add message text
  const messageText = document.createTextNode(message);
  status.appendChild(messageText);

  // Add trash link if provided
  if (trashUrl && type === 'success') {
    const lineBreak = document.createElement('br');
    status.appendChild(lineBreak);

    const link = document.createElement('a');
    link.href = trashUrl;
    link.textContent = 'View deleted emails in Trash';
    link.target = '_blank';
    link.style.color = '#155724';
    link.style.textDecoration = 'underline';
    link.style.fontWeight = 'bold';
    link.style.marginTop = '8px';
    link.style.display = 'inline-block';
    status.appendChild(link);
  }

  if (type === 'success') {
    setTimeout(() => {
      status.style.display = 'none';
    }, 15000); // Extended to 15 seconds so user has time to click link
  }
}
