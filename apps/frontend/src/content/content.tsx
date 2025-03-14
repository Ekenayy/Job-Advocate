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

// Job listing page patterns - URLs that typically show multiple job listings rather than a single job
const JOB_LISTING_PATTERNS = [
  { 
    domain: "glassdoor.com", 
    patterns: [
      "/Jobs/", 
      "SRCH_", 
      "sc.keyword=", 
      "jobs-SRCH",
      "-jobs-",
      "?sc."
    ],
    // For Glassdoor, also check for multiple job listings in the page content
    contentPatterns: [
      "jobs found",
      "search results",
      "filter results",
      "sort by:",
      "job results"
    ],
    // Add exclusion patterns for individual job postings
    exclusionPatterns: [
      "/job-listing/",
      "jobListingId=",
      "jl=",
      "JV_KO"
    ]
  },
  { domain: "linkedin.com", patterns: ["/jobs/search/", "/jobs/collections/"] },
  { domain: "indeed.com", patterns: ["/jobs?", "/jobs/", "q="] },
  { domain: "monster.com", patterns: ["/jobs/search/", "?q="] },
  { domain: "ziprecruiter.com", patterns: ["/jobs/search", "?search="] },
];

// Function to check if current page is a job listing page (showing multiple jobs) rather than a single job posting
const isJobListingPage = () => {
  const currentUrl = window.location.href.toLowerCase();
  const currentDomain = window.location.hostname.toLowerCase().replace("www.", "");
  
  console.log("Checking if job listing page - Current domain:", currentDomain);
  console.log("Checking if job listing page - Current URL:", currentUrl);
  
  // Find the matching domain configuration
  const domainConfig = JOB_LISTING_PATTERNS.find(config => 
    currentDomain.includes(config.domain)
  );
  
  if (domainConfig) {
    console.log("Found matching domain config for:", domainConfig.domain);
    
    // First check exclusion patterns - if any match, this is an individual job posting, not a listing page
    if (domainConfig.exclusionPatterns) {
      const isExcluded = domainConfig.exclusionPatterns.some(pattern => 
        currentUrl.includes(pattern.toLowerCase())
      );
      
      if (isExcluded) {
        console.log("URL matches exclusion pattern - this is an individual job posting");
        return false;
      }
    }
    
    // Check if URL contains any of the patterns for this domain
    const matchingPattern = domainConfig.patterns.find(pattern => 
      currentUrl.includes(pattern.toLowerCase())
    );
    
    if (matchingPattern) {
      console.log("URL matches pattern:", matchingPattern);
      
      // For Glassdoor, do additional content checks
      if (currentDomain.includes("glassdoor.com") && domainConfig.contentPatterns) {
        const pageText = document.body.innerText.toLowerCase();
        
        // Check for multiple job listing indicators in the page content
        const hasListingContent = domainConfig.contentPatterns.some(pattern => 
          pageText.includes(pattern.toLowerCase())
        );
        
        if (hasListingContent) {
          console.log("Page content indicates a job listing page");
          return true;
        }
        
        // Check for multiple job cards/listings on the page
        const jobCards = document.querySelectorAll('[data-test="job-card"], [class*="jobCard"], [class*="job-card"], [class*="jobListing"]');
        if (jobCards.length > 1) {
          console.log(`Found ${jobCards.length} job cards on the page`);
          return true;
        }
      } else {
        // For other sites, URL pattern match is sufficient
        return true;
      }
    } else {
      console.log("URL does not match any patterns for this domain");
    }
  } else {
    console.log("No matching domain configuration found");
  }
  
  return false;
};

// Function to check if current site is a job site using job site list, button text, and apply button
const isJobSite = () => {
  const currentUrl = window.location.href.toLowerCase();

  console.log("Checking if job site - Current URL:", currentUrl);

  // Check if URL matches known job sites
  const isKnownJobSite = JOB_SITES.some((site) => {
    const matches = currentUrl.includes(site);
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


    // Check if any of the elements have the text "apply"
    const matchingElement = elements.find((element) => {
      const text = element.textContent?.toLowerCase().trim() || "";
      const matches = text.includes("apply");
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
  return result;
};

// Function to extract job title based on the job site
const extractJobInfo = async () => {
  const currentDomain = window.location.hostname.replace("www.", "");
  const pageText = document.body.innerText;
  const timestamp = Date.now(); // Add timestamp

  try {
    // Check if we're on a job listing page rather than a specific job posting
    const isListingPage = isJobListingPage();
    console.log("Is job listing page result:", isListingPage);
    
    if (isListingPage) {
      console.log("Detected job listing page, returning early with flag");
      return {
        jobTitle: "",
        domain: currentDomain,
        companyBackground: "",
        jobRequirements: "",
        companyName: currentDomain.split('.')[0],
        potentialAdvocates: [],
        isJobSite: true,
        isJobListingPage: true, // Add this flag to indicate it's a listing page
        errorCode: "JOB_LISTING_PAGE" // Add an error code for the frontend to handle
      };
    }

    // Make sure we're using the absolute backend URL, not a relative one
    const backendUrl = import.meta.env.VITE_BACKEND_URL;
    
    if (!backendUrl || backendUrl === 'undefined') {
      throw new Error('Backend URL is not defined');
    }
    
    // Get job title and company domain using Claude
    const response = await fetch(
      `${backendUrl}/analyze/job-info?_=${timestamp}`, // Add cache buster
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache" // Add no-cache header
        },
        body: JSON.stringify({ 
          pageContent: pageText.substring(0, 3000)
        }),
      }
    );


    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const result = await response.json();
    const jobInfo = {
      jobTitle: result.jobTitle || "",
      domain: result.companyDomain || currentDomain,
      companyBackground: result.companyBackground || "",
      jobRequirements: result.jobRequirements || "",
      companyName: result.companyName || currentDomain.split('.')[0],
      potentialAdvocates: result.potentialAdvocates || [],
      isJobSite: isJobSite(),
      isJobListingPage: false
    };

    return jobInfo;
  } catch (error) {
    console.error("Error extracting job info:", error);
    return {
      jobTitle: "",
      domain: currentDomain,
      companyBackground: "",
      jobRequirements: "",
      companyName: currentDomain.split('.')[0], // Fallback to domain name
      potentialAdvocates: [],
      isJobSite: isJobSite(),
      isJobListingPage: isJobListingPage()
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
