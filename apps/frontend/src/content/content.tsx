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
  
  // Find the matching domain configuration
  const domainConfig = JOB_LISTING_PATTERNS.find(config => 
    currentDomain.includes(config.domain)
  );
  
  if (domainConfig) {
    // First check exclusion patterns - if any match, this is an individual job posting, not a listing page
    if (domainConfig.exclusionPatterns) {
      const isExcluded = domainConfig.exclusionPatterns.some(pattern => 
        currentUrl.includes(pattern.toLowerCase())
      );
      
      if (isExcluded) {
        return false;
      }
    }
    
    // Check if URL contains any of the patterns for this domain
    const matchingPattern = domainConfig.patterns.find(pattern => 
      currentUrl.includes(pattern.toLowerCase())
    );
    
    if (matchingPattern) {
      // For Glassdoor, do additional content checks
      if (currentDomain.includes("glassdoor.com") && domainConfig.contentPatterns) {
        const pageText = document.body.innerText.toLowerCase();
        
        // Check for multiple job listing indicators in the page content
        const hasListingContent = domainConfig.contentPatterns.some(pattern => 
          pageText.includes(pattern.toLowerCase())
        );
        
        if (hasListingContent) {
          return true;
        }
        
        // Check for multiple job cards/listings on the page
        const jobCards = document.querySelectorAll('[data-test="job-card"], [class*="jobCard"], [class*="job-card"], [class*="jobListing"]');
        if (jobCards.length > 1) {
          return true;
        }
      } else {
        // For other sites, URL pattern match is sufficient
        return true;
      }
    }
  }
  
  return false;
};

// Function to check if current site is a job site using job site list, button text, and apply button
const isJobSite = () => {
  const currentUrl = window.location.href.toLowerCase();

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
  const pageUrl = window.location.href;
  const timestamp = Date.now(); // Add timestamp

  try {
    // Check if we're on a job listing page rather than a specific job posting
    const isListingPage = isJobListingPage();
    
    if (isListingPage) {
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

    // Extract domain hints from the page
    const domainHints = extractDomainHints();

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
          pageContent: pageText.substring(0, 3000),
          pageUrl: pageUrl,
          currentDomain: currentDomain,
          domainHints: domainHints
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

// Helper function to extract domain hints from the page
const extractDomainHints = () => {
  const hints = {
    links: [] as string[],
    emails: [] as string[],
    metaTags: {} as Record<string, string>,
    socialProfiles: [] as string[],
    hostingPlatform: "",
  };
  
  // 1. Extract links that might point to the company website
  const links = Array.from(document.querySelectorAll('a[href]'));
  const companyLinks = links.filter(link => {
    const href = (link.getAttribute('href') || '').toLowerCase();
    // Look for company website links - often labeled as "website", "company site", etc.
    const linkText = link.textContent?.toLowerCase() || '';
    return (
      (linkText.includes('website') || 
       linkText.includes('company') || 
       linkText.includes('homepage') ||
       linkText.includes('official site')) &&
      href.startsWith('http') &&
      !href.includes('linkedin.com') &&
      !href.includes('glassdoor.com') &&
      !href.includes('indeed.com')
    );
  });
  
  // Add company links to hints
  hints.links = companyLinks.map(link => link.getAttribute('href') || '').filter(Boolean);
  
  // 2. Extract emails that might contain company domain
  const emailRegex = /[a-zA-Z0-9._%+-]+@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
  const pageText = document.body.innerText;
  let match;
  const emailDomains = new Set<string>();
  
  while ((match = emailRegex.exec(pageText)) !== null) {
    if (match[1]) {
      emailDomains.add(match[1]);
    }
  }
  
  hints.emails = Array.from(emailDomains);
  
  // 3. Extract meta tags that might contain company info
  const metaTags = document.querySelectorAll('meta[property], meta[name]');
  metaTags.forEach(tag => {
    const name = tag.getAttribute('property') || tag.getAttribute('name');
    const content = tag.getAttribute('content');
    
    if (name && content) {
      // Look for Open Graph tags, Twitter cards, etc.
      if (
        name.includes('og:site_name') || 
        name.includes('og:url') || 
        name.includes('twitter:domain') ||
        name.includes('application-name')
      ) {
        hints.metaTags[name] = content;
      }
    }
  });
  
  // 4. Look for social media profile links
  const socialLinks = links.filter(link => {
    const href = (link.getAttribute('href') || '').toLowerCase();
    return (
      href.includes('linkedin.com/company/') ||
      href.includes('facebook.com/') ||
      href.includes('twitter.com/') ||
      href.includes('instagram.com/')
    ) && !href.includes('/share') && !href.includes('/sharer');
  });
  
  hints.socialProfiles = socialLinks.map(link => link.getAttribute('href') || '').filter(Boolean);
  
  // 5. Detect if the job is hosted on a known platform
  const currentUrl = window.location.href.toLowerCase();
  if (currentUrl.includes('greenhouse.io')) {
    hints.hostingPlatform = 'greenhouse';
  } else if (currentUrl.includes('lever.co')) {
    hints.hostingPlatform = 'lever';
  } else if (currentUrl.includes('workday.com')) {
    hints.hostingPlatform = 'workday';
  } else if (currentUrl.includes('ashbyhq.com')) {
    hints.hostingPlatform = 'ashby';
  }
  
  // If we're on a job hosting platform, try to extract the company name from the URL
  if (hints.hostingPlatform) {
    const urlParts = currentUrl.split('/');
    if (hints.hostingPlatform === 'greenhouse') {
      // Example: https://boards.greenhouse.io/companyname/jobs/12345
      const ghIndex = urlParts.findIndex(part => part.includes('greenhouse.io'));
      if (ghIndex >= 0 && ghIndex + 1 < urlParts.length) {
        const possibleCompany = urlParts[ghIndex + 1].split('?')[0];
        if (possibleCompany && possibleCompany !== 'jobs') {
          hints.metaTags['greenhouse-company'] = possibleCompany;
        }
      }
    } else if (hints.hostingPlatform === 'lever') {
      // Example: https://jobs.lever.co/companyname/12345
      const leverIndex = urlParts.findIndex(part => part.includes('lever.co'));
      if (leverIndex >= 0 && leverIndex + 1 < urlParts.length) {
        const possibleCompany = urlParts[leverIndex + 1].split('?')[0];
        if (possibleCompany) {
          hints.metaTags['lever-company'] = possibleCompany;
        }
      }
    }
  }
  
  return hints;
};

// Send a message to the background script to indicate that the content script is ready
chrome.runtime.sendMessage({ action: "CONTENT_SCRIPT_READY", url: window.location.href });

// Listen for messages from the extension
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "GET_JOB_INFO") {
    extractJobInfo().then(jobInfo => {
      // Send the job info back to the extension
      chrome.runtime.sendMessage({ 
        action: "JOB_INFO_RESULT", 
        jobInfo: jobInfo,
        tabId: sender.tab?.id
      });
      
      // Also send a response to the original request
      sendResponse(jobInfo);
    }).catch(error => {
      chrome.runtime.sendMessage({ 
        action: "JOB_INFO_ERROR", 
        error: error.message,
        tabId: sender.tab?.id
      });
      
      // Send an error response
      sendResponse({ error: error.message });
    });
    
    return true; // Required for async response
  } else if (request.action === "OPEN_SIDE_PANEL") {
    chrome.runtime.sendMessage({ action: "OPEN_SIDE_PANEL" });
    return true; // Add return value for this path
  } else if (request.action === "PING") {
    // Simple ping to check if content script is loaded
    sendResponse({ status: "alive", url: window.location.href });
    return true;
  }
  
  return false; // Add default return
});

// Auto-open side panel if we're on a job site
if (isJobSite()) {
  chrome.runtime.sendMessage({ action: "OPEN_SIDE_PANEL" });
}
