// List of common job site domains
const JOB_SITES = [
  "linkedin.com/jobs",
  "job.ashbyhq.com",
  "indeed.com",
  "glassdoor.com",
  "monster.com",
  "careers.google.com",
  "jobs.lever.co",
  "greenhouse.io",
  "workday.com",

  // Add more job sites as needed
];

// Function to check if current site is a job site
const isJobSite = () => {
  const currentUrl = window.location.href.toLowerCase();
  console.log('Checking URL:', currentUrl);

  // Check if URL matches known job sites
  const isKnownJobSite = JOB_SITES.some((site) => {
    const matches = currentUrl.includes(site);
    console.log(`Checking against ${site}:`, matches);
    return matches;
  });

  // Check for "Apply" buttons/text
  const hasApplyButton = () => {
    // Common selectors for apply buttons
    const applySelectors = [
      // Button text content
      "button, a, span, div",
      // Common button classes/IDs
      '[class*="apply"]',
      '[id*="apply"]',
      // Common aria labels
      '[aria-label*="apply"]',
      '[data-testid*="apply"]',
      // Form elements
      'form[action*="apply"]',
    ];

    // Convert NodeList to Array for easier manipulation
    const elements = Array.from(
      document.querySelectorAll(applySelectors.join(","))
    );
    
    console.log('Found potential apply elements:', elements.length);
    
    const matchingElement = elements.find(element => {
      const text = element.textContent?.toLowerCase().trim() || "";
      const matches = text.includes("Apply") || text.includes("APPLY") || text.includes("Qualifications") || text.includes("QUALIFICATIONS");
      console.log('Element text:', text, 'Matches:', matches);
      return matches;
    });

    return !!matchingElement;
  };

  const result = isKnownJobSite || hasApplyButton();
  console.log('Is job site result:', result);
  return result;
};

// Function to extract job information based on the job site
const extractJobInfo = () => {
  const currentUrl = window.location.href.toLowerCase();
  const domain = window.location.hostname.replace("www.", "");
  let jobTitle = "";

  // Site-specific selectors
  if (currentUrl.includes("linkedin.com")) {
    jobTitle =
      document
        .querySelector("h1.job-details-jobs-unified-top-card__job-title")
        ?.textContent?.trim() ||
      document
        .querySelector(
          "[class*='job-details-jobs-unified-top-card__job-title']"
        )
        ?.textContent?.trim() ||
      document.querySelector(".topcard__title")?.textContent?.trim() ||
      "";
  } else if (currentUrl.includes("indeed.com")) {
    jobTitle =
      document
        .querySelector(".jobsearch-JobInfoHeader-title")
        ?.textContent?.trim() ||
      document.querySelector('[data-testid="jobTitle"]')?.textContent?.trim() ||
      "";
  } else if (currentUrl.includes("glassdoor.com")) {
    jobTitle =
      document.querySelector(".job-title")?.textContent?.trim() ||
      document.querySelector(".css-1vg6q84")?.textContent?.trim() ||
      document.querySelector("#jd-job-title-1009610292169")?.textContent?.trim() ||
      "";
  } else if (currentUrl.includes("ashbyhq.com")) {
    jobTitle = document.querySelector('#root ._titles_ud4nd_34 h1')?.textContent?.trim() || "";
  } 
  // we can add more later

  // Fallback to generic selectors if no site-specific match
  if (!jobTitle) {
    // Look for the most prominent heading near an "Apply" button
    const applyButton = Array.from(document.querySelectorAll("button, a")).find(
      (el) => el.textContent?.toLowerCase().includes("apply")
    );

    if (applyButton) {
      // Look for headings above the apply button
      const headings = Array.from(
        document.querySelectorAll("h1, h2, h3")
      ).filter((heading) => {
        const headingRect = heading.getBoundingClientRect();
        const buttonRect = applyButton.getBoundingClientRect();
        return headingRect.top < buttonRect.top;
      });

      // Use the closest heading to the apply button
      if (headings.length > 0) {
        jobTitle = headings[headings.length - 1].textContent?.trim() || "";
      }
    }

    // If still no job title, try common heading patterns
    if (!jobTitle) {
      const selectors = [
        "h1", // Often job titles are in the main heading
        '[data-testid*="job-title"]',
        ".job-title",
        '[class*="title"]',
      ];

      for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element?.textContent) {
          jobTitle = element.textContent.trim();
          break;
        }
      }
    }
  }

  // Get company domain from job posting
  let companyDomain = domain;
  if (isJobSite()) {
    // Try to extract actual company domain from job posting
    if (currentUrl.includes("linkedin.com")) {
      const companyLink = document
        .querySelector(".company-link")
        ?.getAttribute("href");
      if (companyLink) {
        companyDomain = new URL(companyLink).hostname.replace("www.", "");
      }
    }
    // Add more site-specific company domain extraction logic
  }

  return {
    jobTitle,
    domain: companyDomain,
    isJobSite: isJobSite(),
  };
};

// Listen for messages from the extension
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.action === "GET_JOB_INFO") {
    const jobInfo = extractJobInfo();
    sendResponse(jobInfo);
  } else if (request.action === "OPEN_SIDE_PANEL") {
    // Existing side panel logic
    chrome.runtime.sendMessage({ action: "OPEN_SIDE_PANEL" });
  }
});

// Auto-open side panel if we're on a job site
if (isJobSite()) {
  chrome.runtime.sendMessage({ action: "OPEN_SIDE_PANEL" });
}
