# Gmail Bulk Deleter Chrome Extension

A Chrome extension to bulk delete Gmail emails based on date range, labels, and read/unread status with pagination support.

## Features

- Delete emails within a specific date range (start date optional)
- Filter by Gmail category (promotions, social, updates, forums) - optional
- Filter by custom label - optional
- Filter by unread status
- Automatic pagination through search results
- Configurable maximum pages to process
- Real-time progress tracking

## Installation

### Step 1: Generate Icons

Before loading the extension, you need to generate the icon files. Choose one method:

**Method 1: HTML Generator (Easiest)**
1. Open `generate-icons.html` in Chrome
2. Click "Download All Icons" button
3. Save all three files (icon16.png, icon48.png, icon128.png) to this folder

**Method 2: Node.js Script**
```bash
npm install canvas
node generate_icons.js
```

**Method 3: Python Script**
```bash
pip install pillow
python3 generate_icons.py
```

### Step 2: Load Extension

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right corner
3. Click "Load unpacked"
4. Select the `gmail-delete` folder
5. The extension icon should appear in your Chrome toolbar

## Usage

1. Navigate to Gmail (mail.google.com)
2. Click the extension icon in the toolbar
3. Configure your deletion criteria:
   - **Start Date** (optional): Emails on or after this date (leave blank for all emails from beginning)
   - **End Date** (required): Emails on or before this date
   - **Category** (optional): Gmail category (promotions, social, updates, forums)
   - **Label** (optional): Custom Gmail label name
   - **Only unread emails**: Check to delete only unread emails
   - **Max pages**: Limit pagination (0 = unlimited, 10 = default)
4. Click "Delete Emails"
5. The extension will:
   - Search for matching emails using your criteria
   - Navigate through pages automatically
   - Select and delete emails on each page
   - Report the total number deleted

## Important Notes

- **⚠️ Deletions are permanent** - Emails will be moved to Trash and permanently deleted after 30 days
- Test with a small date range first to ensure it works as expected
- The extension works by interacting with Gmail's UI, so keep the Gmail tab active during processing
- If Gmail's UI changes significantly, the extension may need updates

## Date Format

Gmail uses the following date format for searches:
- Format: `YYYY-MM-DD` (e.g., 2024-01-01)
- `after:` and `before:` operators are inclusive

## Label Examples

Common Gmail labels you can use:
- `promotions`
- `social`
- `updates`
- `forums`
- Custom labels you've created

## Troubleshooting

**Extension not working:**
- Make sure you're on mail.google.com
- Ensure the Gmail page is fully loaded
- Check the browser console for errors (F12 → Console tab)

**Not all emails deleted:**
- Gmail may have rate limits
- Increase wait times in the code if needed
- Run the extension multiple times

**Delete button not found:**
- Gmail's interface may have changed
- Make sure you're in a standard Gmail view (not settings or compose)

## Technical Details

The extension uses:
- Manifest V3
- Content scripts to interact with Gmail's DOM
- Gmail's native search syntax
- Automatic pagination detection

## Files

- `manifest.json` - Extension configuration
- `popup.html` - User interface
- `popup.js` - Popup logic and communication
- `content.js` - Gmail DOM interaction and deletion logic
- `icon*.svg` - Extension icons

## Limitations

- Only works on mail.google.com
- Requires Gmail to be in English (for button detection)
- Dependent on Gmail's UI structure
- No undo functionality (use Gmail's Trash to recover within 30 days)

## Privacy

This extension:
- Only runs on mail.google.com
- Does not collect or transmit any data
- Does not access your emails' content
- Only interacts with Gmail's UI elements

## License

MIT License - Use at your own risk
