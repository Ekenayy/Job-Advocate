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
  "ziprecruiter.com",
  "simplyhired.com",
  "dice.com",
  "careerbuilder.com",
  "career.com",
  "talent.com",
  "workatastartup.com",
  "breezy.hr",
  "workable.com",
  "bamboohr.com",
];

// Function to check if current site is a job site using job site list, button text, and apply button
const isJobSite = () => {
  const currentUrl = window.location.href.toLowerCase();
  console.log("Checking URL:", currentUrl);

  // Check if URL matches known job sites
  const isKnownJobSite = JOB_SITES.some((site) => {
    const matches = currentUrl.includes(site);
    console.log(`Checking against ${site}:`, matches);
    return matches;
  });

  // Check for apply buttons/text
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

    console.log("Found potential apply elements:", elements.length);

    // Check if any of the elements have the text "apply"
    const matchingElement = elements.find((element) => {
      const text = element.textContent?.toLowerCase().trim() || "";
      const matches = text.includes("apply");
      console.log("Element text:", text, "Matches:", matches);
      return matches;
    });

    return !!matchingElement;
  };

  // Check for job description sections
  const hasJobDescriptionSection = () => {
    const jobSectionSelectors = [
      '[class*="job-description"]',
      '[id*="job-description"]',
      '[class*="requirements"]',
      '[id*="requirements"]',
      '[class*="qualifications"]',
      '[id*="qualifications"]',
    ];

    return !!document.querySelector(jobSectionSelectors.join(","));
  };

  const result =
    isKnownJobSite || hasApplyButton() || hasJobDescriptionSection();
  console.log("Is job site result:", result);
  return result;
};

// Function to extract job title based on the job site
const extractJobInfo = async () => {
  const currentUrl = window.location.href.toLowerCase();
  const domain = window.location.hostname.replace("www.", "");
  const pageText = document.body.innerText;

  try {
    // Get job title using GPT
    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/analyze/job-info`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ pageContent: pageText.substring(0, 3000) }),
      }
    );

    const responseText = await response.text();
    console.log("Raw response:", responseText);
    
    // The response might be a JSON string that needs to be parsed
    let result;
    try {
      // First try to parse the response as JSON
      result = JSON.parse(responseText);
    } catch (parseError) {
      // If parsing fails, the response might already be a string with the job title
      result = { jobTitle: responseText };
    }
    
    console.log("Parsed result:", result);
    const jobTitle = result.jobTitle || "";

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
  } catch (error) {
    console.error("Error extracting job info:", error);
    return {
      jobTitle: "",
      domain: domain,
      isJobSite: isJobSite(),
    };
  }
};

// Listen for messages from the extension
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.action === "GET_JOB_INFO") {
    extractJobInfo().then(sendResponse);
    return true; // Required for async response
  } else if (request.action === "OPEN_SIDE_PANEL") {
    chrome.runtime.sendMessage({ action: "OPEN_SIDE_PANEL" });
    return true; // Add return value for this path
  }
  return false; // Add default return
});

// Auto-open side panel if we're on a job site
if (isJobSite()) {
  chrome.runtime.sendMessage({ action: "OPEN_SIDE_PANEL" });
}
