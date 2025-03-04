# GitHub PR Branch Cloner

A Chrome extension that streamlines the process of cloning pull requests to different branches in GitHub repositories.

![GitHub PR Branch Merger Extension Screenshot](extension-screenshot.png)

## Overview

GitHub PR Branch Merger solves a common workflow challenge: creating identical pull requests across multiple branches. This extension allows you to:

- Copy an existing GitHub PR's title and description
- Use the same source branch
- Create a new PR targeting a different branch (like quality or production)
- All with just a few clicks!

Perfect for teams following gitflow workflows that require separate PRs for feature, staging, and production branches.

## Features

- **One-Click PR Cloning**: Automatically extracts PR details from the current GitHub page
- **Custom Branch Support**: Choose from common branch presets or specify your own custom branch name
- **Preserves Formatting**: Maintains Markdown formatting, checkboxes, and styling from the original PR
- **Dark-Mode UI**: Sleek GitHub-inspired design that matches the platform's aesthetics
- **Debug Tools**: Built-in debugging for troubleshooting in complex repository setups

## Installation

### From Chrome Web Store
*(Coming soon in Store)*

### Manual Installation
1. Clone this repository or download as a ZIP file
2. Extract the files to a folder on your computer
3. Open Chrome and navigate to `chrome://extensions/`
4. Enable "Developer mode" (toggle in the top-right corner)
5. Click "Load unpacked" and select the extension folder
6. The extension icon should now appear in your Chrome toolbar

## Usage

1. Navigate to any GitHub pull request page
2. Click the GitHub PR Branch Merger extension icon in your toolbar
3. The extension will automatically extract:
   - PR title
   - PR description (with formatting preserved)
   - Source branch name
4. Choose your target branch:
   - Select from presets (quality, production, master, main, development)
   - OR click "Custom" to enter any branch name
5. Click "Create PR"
6. A new tab will open with all details pre-populated, ready for you to submit

## Use Cases

- **Development → Staging → Production Workflow**: Clone feature PRs across your environment branches
- **Hotfix Propagation**: Quickly create identical hotfix PRs for multiple release branches
- **Backporting Features**: Easily port new features to maintenance branches
- **Release Management**: Streamline the release process by creating consistent PRs across branches

## Technical Details

This extension uses:
- Chrome Extension Manifest V3
- Content script injection for reading PR details
- HTML to Markdown conversion for preserving PR formatting
- GitHub's native PR creation URL scheme

## Project Structure

```
GitHubPRMerger/
├── manifest.json        # Extension configuration
├── popup.html           # Extension UI
├── popup.js             # UI logic and PR processing
├── icon16.png           # Small icon
├── icon48.png           # Medium icon
├── icon128.png          # Large icon
└── README.md            # This documentation
```

## Permissions

This extension requires:
- `activeTab`: To read PR details from the current tab
- `scripting`: To inject content scripts for PR data extraction
- `https://github.com/*`: To operate on GitHub pages only

The extension doesn't collect any data or send information to external servers.

## Contributing

Contributions are welcome! If you'd like to improve this extension:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Common Issues & Troubleshooting

- **PR details not loading**: Ensure you're on a GitHub PR page (URL should contain `/pull/`)
- **Formatting issues in the cloned PR**: Use the "Show Debug Info" option to check the extracted HTML
- **Extension not working**: Check the console for errors and make sure you have the necessary permissions enabled

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Inspired by the need to streamline PR creation across multiple branches
- Uses GitHub's native PR creation mechanisms for reliability
- Built to enhance developer workflows in multi-branch environments
