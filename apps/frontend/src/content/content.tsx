/// <reference types="vite/client" />

// List of common job site domains
const JOB_SITES = [
  'linkedin.com/jobs',
  'indeed.com',
  'glassdoor.com',
  'monster.com',
  'careers.google.com',
  'jobs.lever.co',
  'greenhouse.io',
  'workday.com',
  // Add more job sites as needed
];

// Function to check if current site is a job site
const isJobSite = () => {
  const currentUrl = window.location.href.toLowerCase();
  return JOB_SITES.some(site => currentUrl.includes(site));
};

// Send message to background script if we're on a job site
if (isJobSite()) {
  chrome.runtime.sendMessage({ action: 'OPEN_SIDE_PANEL' });
}
