// Main function to run when popup loads
document.addEventListener('DOMContentLoaded', function () {
  // Clear the badge notification when popup opens
  chrome.runtime.sendMessage({ action: 'clearBadge' });

  // Add click handler for the create PR button
  document.getElementById('create-pr-button').addEventListener('click', createNewPR);

  // Setup branch type toggle
  document.getElementById('preset-toggle').addEventListener('click', function () {
    toggleBranchType('preset');
  });

  document.getElementById('custom-toggle').addEventListener('click', function () {
    toggleBranchType('custom');
  });

  // Check if we're in a Chrome extension context
  if (typeof chrome !== 'undefined' && chrome.tabs) {
    // Check current tab to see if it's a GitHub PR page
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      const currentTab = tabs[0];

      // Check if we're on a GitHub PR page
      if (currentTab.url.match(/github\.com\/.*\/.*\/pull\/\d+/)) {
        document.getElementById('pr-content').classList.remove('hidden');
        fetchPrDetails(currentTab);
      } else {
        document.getElementById('not-github-page').classList.remove('hidden');
      }
    });
  } else {
    // Chrome API not available
    document.getElementById('not-github-page').classList.remove('hidden');
    document.querySelector('#not-github-page .error').textContent =
      'Chrome extension API not available. Make sure this is loaded as a Chrome extension.';
  }
});

// Toggle between preset and custom branch input with smooth animation
function toggleBranchType(type) {
  const presetToggle = document.getElementById('preset-toggle');
  const customToggle = document.getElementById('custom-toggle');
  const presetContainer = document.getElementById('preset-branch-container');
  const customContainer = document.getElementById('custom-branch-container');

  if (type === 'preset') {
    presetToggle.classList.add('active');
    customToggle.classList.remove('active');
    presetContainer.classList.remove('hidden');
    customContainer.classList.add('hidden');
  } else {
    presetToggle.classList.remove('active');
    customToggle.classList.add('active');
    presetContainer.classList.add('hidden');
    customContainer.classList.remove('hidden');

    // Focus on the custom branch input with a slight delay for smooth animation
    setTimeout(() => {
      document.getElementById('custom-branch').focus();
    }, 50);
  }
}

// Function to extract PR details from the page
function extractPRDetails() {
  // Debug object to track what we find
  const debug = {
    selectors: {},
    html: {}
  };

  try {
    // Get PR title - try different possible selectors
    let prTitle = '';
    const titleSelectors = [
      '.js-issue-title',
      '.gh-header-title',
      'h1.gh-header-title',
      '[data-pjax="#js-repo-pjax-container"]'
    ];

    for (const selector of titleSelectors) {
      const element = document.querySelector(selector);
      debug.selectors[`title_${selector}`] = !!element;
      if (element) {
        prTitle = element.textContent.trim();
        debug.html[`title_${selector}`] = element.outerHTML;
        break;
      }
    }

    // If still no title, try another approach for large text on the page
    if (!prTitle) {
      const h1Elements = document.querySelectorAll('h1');
      debug.selectors['h1_count'] = h1Elements.length;
      for (let i = 0; i < h1Elements.length; i++) {
        const h1 = h1Elements[i];
        debug.html[`h1_${i}`] = h1.outerHTML;
        if (h1.textContent.includes('#')) {
          prTitle = h1.textContent.trim();
          break;
        }
      }
    }

    // Get PR description
    let prDescription = '';
    const descSelectors = [
      '.comment-body',
      '.js-comment-body',
      '.markdown-body',
      '[data-testid="pull-request-description"]'
    ];

    for (const selector of descSelectors) {
      const elements = document.querySelectorAll(selector);
      debug.selectors[`desc_${selector}`] = elements.length;
      if (elements.length > 0) {
        // Usually first comment is the PR description
        prDescription = elements[0].innerHTML;
        debug.html[`desc_${selector}`] = elements[0].outerHTML;
        break;
      }
    }

    // Get branch information
    let sourceBranch = '';
    let baseBranch = '';

    // Try span with class head-ref first
    const headRefSelectors = [
      '.head-ref',
      '[title*="head"]',
      'span.css-truncate-target',
      '[data-testid="head-ref"]'
    ];

    for (const selector of headRefSelectors) {
      const elements = document.querySelectorAll(selector);
      debug.selectors[`head_${selector}`] = elements.length;

      for (let i = 0; i < elements.length; i++) {
        const el = elements[i];
        debug.html[`head_${selector}_${i}`] = el.outerHTML;
        // Look for elements that might contain branch names
        if (el.textContent.includes('/') ||
          el.textContent.match(/^[a-zA-Z0-9_-]+$/)) {
          sourceBranch = el.textContent.trim();
          break;
        }
      }

      if (sourceBranch) break;
    }

    // Try base-ref for base branch
    const baseRefSelectors = [
      '.base-ref',
      '[title*="base"]',
      '[data-testid="base-ref"]'
    ];

    for (const selector of baseRefSelectors) {
      const elements = document.querySelectorAll(selector);
      debug.selectors[`base_${selector}`] = elements.length;

      for (let i = 0; i < elements.length; i++) {
        const el = elements[i];
        debug.html[`base_${selector}_${i}`] = el.outerHTML;
        if (el.textContent.match(/^[a-zA-Z0-9_-]+$/)) {
          baseBranch = el.textContent.trim();
          break;
        }
      }

      if (baseBranch) break;
    }

    // Last resort: look for text near "from" and "into"
    if (!sourceBranch || !baseBranch) {
      const allText = document.body.textContent;
      const fromMatch = allText.match(/from\s+([a-zA-Z0-9_/-]+)/);
      const intoMatch = allText.match(/into\s+([a-zA-Z0-9_/-]+)/);

      if (fromMatch && !sourceBranch) {
        sourceBranch = fromMatch[1].trim();
        debug.selectors['from_text_match'] = true;
      }

      if (intoMatch && !baseBranch) {
        baseBranch = intoMatch[1].trim();
        debug.selectors['into_text_match'] = true;
      }
    }

    // Get repository info
    const repoPath = window.location.pathname.split('/').slice(1, 3).join('/');

    return {
      prTitle: prTitle,
      prDescription: prDescription,
      sourceBranch: sourceBranch,
      baseBranch: baseBranch,
      repoPath: repoPath,
      debug: debug
    };
  } catch (error) {
    debug.error = error.toString();
    return {
      prTitle: "Error extracting title",
      prDescription: "Error extracting description",
      sourceBranch: "Error extracting source branch",
      baseBranch: "unknown",
      repoPath: window.location.pathname.split('/').slice(1, 3).join('/'),
      debug: debug
    };
  }
}

// Function to fetch PR details from the current tab
function fetchPrDetails(tab) {
  // Show loading status
  setStatus('Loading PR details...', false, 'loading');

  if (chrome.scripting && chrome.scripting.executeScript) {
    // Use the modern Manifest V3 API
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: extractPRDetails
    }, handlePrResults);
  } else {
    // Fall back to the older Manifest V2 API
    const code = `(${extractPRDetails.toString()})()`;
    chrome.tabs.executeScript(tab.id, { code: code }, handlePrResults);
  }
}

// Convert HTML to Markdown
function htmlToMarkdown(html) {
  // First, detect checkboxes specifically
  let markdown = html
    // Handle checked checkboxes
    .replace(/<input[^>]*type="checkbox"[^>]*checked[^>]*>/gi, '- [x] ')
    .replace(/<input[^>]*checked[^>]*type="checkbox"[^>]*>/gi, '- [x] ')
    // Handle unchecked checkboxes
    .replace(/<input[^>]*type="checkbox"[^>]*>/gi, '- [ ] ')

    // Headers
    .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n')
    .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n')
    .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n')
    .replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n\n')
    .replace(/<h5[^>]*>(.*?)<\/h5>/gi, '##### $1\n\n')
    .replace(/<h6[^>]*>(.*?)<\/h6>/gi, '###### $1\n\n')

    // Lists
    .replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, function (match, content) {
      // Don't process list items that already contain checkboxes
      if (content.includes('- [x]') || content.includes('- [ ]')) {
        return content;
      }
      return content.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '- $1\n');
    })
    .replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, function (match, content) {
      let index = 1;
      return content.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, function (match, item) {
        return (index++) + '. ' + item + '\n';
      });
    })

    // Bold, italic
    .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
    .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
    .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
    .replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')

    // Links
    .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')

    // Paragraphs
    .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')

    // Clean up extra spaces and line breaks
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .trim();

  // Handle the special case for task list items with checkboxes
  // Look for specific GitHub task list item pattern
  const taskListItemRegex = /<li class="task-list-item[^>]*>([\s\S]*?)<\/li>/gi;
  if (html.match(taskListItemRegex)) {
    markdown = html.replace(taskListItemRegex, function (match, content) {
      if (content.includes('checked')) {
        return '- [x] ' + content.replace(/<[^>]*>/g, '') + '\n';
      } else {
        return '- [ ] ' + content.replace(/<[^>]*>/g, '') + '\n';
      }
    });
  }

  return markdown;
}

// Extract checkboxes from HTML
function extractCheckboxes(html) {
  // This function specifically looks for GitHub's checkbox pattern in PR templates
  const checkboxRegex = /<input[^>]*type="checkbox"[^>]*>\s*(.*?)(?=<\/li>|<li|$)/gi;
  let matches = [];
  let match;

  while ((match = checkboxRegex.exec(html)) !== null) {
    const isChecked = match[0].includes('checked');
    const label = match[1].trim().replace(/<[^>]*>/g, '');
    matches.push({
      isChecked,
      label
    });
  }

  // Convert matches to markdown
  return matches.map(item =>
    `- [${item.isChecked ? 'x' : ' '}] ${item.label}`
  ).join('\n');
}

// Process PR description (continued)
function processPrDescription(html) {
  // Split the description by sections (headers)
  const sections = html.split(/<h2[^>]*>/i);
  let markdownDescription = '';

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];

    if (i === 0) {
      // First section might not have a header
      markdownDescription += htmlToMarkdown(section);
    } else {
      // Add the h2 back
      markdownDescription += '## ' + section.split('</h2>')[0] + '\n\n';

      const sectionContent = section.split('</h2>')[1] || '';

      // Check if this section contains checkboxes
      if (sectionContent.includes('type="checkbox"')) {
        markdownDescription += extractCheckboxes(sectionContent) + '\n\n';
      } else {
        markdownDescription += htmlToMarkdown(sectionContent) + '\n\n';
      }
    }
  }

  return markdownDescription.trim();
}

// Handle the results from the script execution
function handlePrResults(results) {
  // Clear status
  clearStatus();

  if (!results || !results[0] || (!results[0].result && typeof results[0] !== 'object')) {
    setStatus('Error fetching PR details', true);
    return;
  }

  // Get the actual PR data depending on which API was used
  const prData = results[0].result || results[0];

  // Process and display the data in our popup with fade-in effect
  const titleElement = document.getElementById('pr-title');
  const descElement = document.getElementById('pr-description');
  const branchElement = document.getElementById('source-branch');

  // Temporarily add a fade-out class
  [titleElement, descElement, branchElement].forEach(el => {
    el.style.opacity = '0';
  });

  // Set content
  titleElement.textContent = prData.prTitle || 'Unknown Title';

  // Convert the HTML description to safe text for preview
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = prData.prDescription || '';
  descElement.textContent = tempDiv.textContent.slice(0, 200) + (tempDiv.textContent.length > 200 ? '...' : '');

  branchElement.textContent = prData.sourceBranch || 'Unknown Branch';

  // Fade in content
  setTimeout(() => {
    [titleElement, descElement, branchElement].forEach(el => {
      el.style.opacity = '1';
      el.style.transition = 'opacity 0.3s ease';
    });
  }, 50);

  // Store the markdown-processed description for later use
  prData.markdownDescription = processPrDescription(prData.prDescription || '');

  // Store data for later use
  window.prData = prData;
}

// Function to create a new PR
function createNewPR() {
  if (!window.prData) {
    setStatus('PR data not available', true);
    return;
  }

  // Get the target branch based on current toggle state
  let targetBranch;
  if (document.getElementById('preset-toggle').classList.contains('active')) {
    targetBranch = document.getElementById('target-branch').value;
  } else {
    targetBranch = document.getElementById('custom-branch').value.trim();

    // Validate custom branch name
    if (!targetBranch) {
      setStatus('Please enter a branch name', true);
      document.getElementById('custom-branch').focus();
      return;
    }
  }

  const prData = window.prData;

  // Show loading animation on button
  const button = document.getElementById('create-pr-button');
  button.textContent = 'Creating PR...';
  button.disabled = true;

  setStatus('Creating new PR for ' + targetBranch + '...', false, 'success');

  // Construct the URL for creating a new PR with prefilled values
  const newPrUrl = `https://github.com/${prData.repoPath}/compare/${targetBranch}...${prData.sourceBranch}?quick_pull=1&title=${encodeURIComponent(prData.prTitle)}&body=${encodeURIComponent(prData.markdownDescription)}`;

  // Open the new PR page in a new tab
  chrome.tabs.create({ url: newPrUrl });

  // Reset button state after a delay
  setTimeout(() => {
    button.textContent = 'Create PR';
    button.disabled = false;
  }, 1000);
}

// Function to set status message with animation
function setStatus(message, isError = false, className = '') {
  const statusElement = document.getElementById('status');

  // Remove all existing classes and add status
  statusElement.className = 'status';
  statusElement.classList.add('status-animate', 'visible');

  // Set the message
  statusElement.textContent = message;

  if (isError) {
    statusElement.classList.add('error');
  } else if (className) {
    statusElement.classList.add(className);
  }
}

// Function to clear status
function clearStatus() {
  const statusElement = document.getElementById('status');
  statusElement.className = 'status';
  statusElement.textContent = '';
}