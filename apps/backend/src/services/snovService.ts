import axios from 'axios';

interface Employee {
  first_name: string;
  last_name: string;
  position: string;
  source_page: string;
  email: string;
  company: string;
}

// Define executive titles for easy reference
const EXECUTIVE_TITLES = ["founder", "co-founder", "ceo", "chief executive officer", "president", "owner"];

// Helper function to check if a position is an executive position
const isExecutivePosition = (position: string): boolean => {
  if (!position) return false;
  const lowerPosition = position.toLowerCase();
  return EXECUTIVE_TITLES.some(title => lowerPosition.includes(title));
};

// Helper function to create a unique key for an employee based on first_name, last_name, and source_page
const createEmployeeKey = (employee: Employee): string => {
  return `${employee.first_name.toLowerCase()}_${employee.last_name.toLowerCase()}_${employee.source_page}`;
};

// Helper function to remove duplicate employees based on first_name, last_name, and source_page
const removeDuplicateEmployees = (employees: Employee[]): Employee[] => {
  const uniqueEmployees = new Map<string, Employee>();
  
  for (const employee of employees) {
    const key = createEmployeeKey(employee);
    // Only add if we don't already have an employee with this key
    if (!uniqueEmployees.has(key)) {
      uniqueEmployees.set(key, employee);
    } else {
      console.log(`Removing duplicate employee: ${employee.first_name} ${employee.last_name} from ${employee.source_page}`);
    }
  }
  
  return Array.from(uniqueEmployees.values());
};

export const searchDomainEmployees = async (
  domain: string,
  jobTitle: string,
  potentialAdvocates: string[]
): Promise<Employee[]> => {
  try {
    console.log("Starting searchDomainEmployees with:", { domain, jobTitle });
    console.log("Checking environment variables:", {
      hasClientId: !!process.env.SNOV_CLIENT_ID,
      hasClientSecret: !!process.env.SNOV_CLIENT_SECRET,
    });


    // First get access token
    const tokenResponse = await fetch(
      "https://api.snov.io/v1/oauth/access_token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          grant_type: "client_credentials",
          client_id: process.env.SNOV_CLIENT_ID,
          client_secret: process.env.SNOV_CLIENT_SECRET,
        }),
      }
    );

    console.log("Token response status:", tokenResponse.status);
    const tokenData = await tokenResponse.json();
    console.log("Token response:", tokenData);

    if (!tokenResponse.ok) {
      throw new Error(
        `Failed to get Snov.io access token: ${JSON.stringify(tokenData)}`
      );
    }

    // Start domain search
    console.log("Making domain search request...");
    const searchUrl = "https://api.snov.io/v2/domain-search/start";

    const response = await fetch(searchUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        domain: domain,
      }),
    });

    console.log("Search response status:", response.status);
    const searchData = await response.json();
    console.log("Search response:", searchData);

    // Wait for domain search to complete
    const domainResult = await pollForResults(
      searchData.links.result,
      tokenData.access_token
    );
    console.log("Domain search complete:", domainResult);

    // Get company name from domain result
    let companyName = domainResult.data?.company_name;
    
    // If company name is not available from the API, extract it from the domain

    // Start prospects search
    const prospectsUrl = "https://api.snov.io/v2/domain-search/prospects/start";
    
    // Create an array of positions, with jobTitle as priority, then essential executive positions,
    // then any additional potentialAdvocates up to the 10 item limit
    const essentialPositions = [jobTitle, "founder", "co-founder", "CEO"];
    
    // Calculate how many additional positions we can include from potentialAdvocates
    const remainingSlots = 10 - essentialPositions.length;
    // Take only as many advocates as we have slots for
    const limitedAdvocates = potentialAdvocates.slice(0, Math.max(0, remainingSlots));
    
    // Combine and ensure we don't exceed 10 items
    const positionsToSearch = [...essentialPositions, ...limitedAdvocates].slice(0, 10);
    
    console.log(`Searching with ${positionsToSearch.length} positions:`, positionsToSearch);
    
    const prospectsResponse = await fetch(prospectsUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        domain: domain,
        positions: positionsToSearch,
      }),
    });

    console.log("Prospects response status:", prospectsResponse.status);
    const prospectsData = await prospectsResponse.json();
    console.log("Prospects response:", prospectsData);

    // Check for API errors
    if (!prospectsResponse.ok) {
      if (prospectsResponse.status === 422 && prospectsData.errors) {
        const errorDetails = JSON.stringify(prospectsData.errors);
        throw new Error(`Snov.io validation error: ${errorDetails}`);
      }
      throw new Error(`Prospects search failed: ${JSON.stringify(prospectsData)}`);
    }

    // Wait for prospects search to complete
    const prospectsResult = await pollForResults(
      prospectsData.links.result,
      tokenData.access_token
    );
    console.log("Prospects search complete:", prospectsResult);

    // Add this right after getting prospectsResult
    console.log("Sample prospect with emails:", JSON.stringify(prospectsResult.data[0], null, 2));

    // First, remove duplicate prospects from the API response
    // Create a Map to track unique prospects based on first_name, last_name, and source_page
    const uniqueProspectsMap = new Map<string, any>();
    
    for (const prospect of prospectsResult.data) {
      // Make sure these fields exist before using them
      if (prospect.first_name && prospect.last_name && prospect.source_page) {
        const key = `${prospect.first_name.toLowerCase()}_${prospect.last_name.toLowerCase()}_${prospect.source_page}`;
        
        if (!uniqueProspectsMap.has(key)) {
          uniqueProspectsMap.set(key, prospect);
        } else {
          console.log(`Found duplicate prospect: ${prospect.first_name} ${prospect.last_name} from ${prospect.source_page}`);
        }
      } else {
        // If a prospect is missing any of these fields, still include it
        // Use a unique key based on the object reference
        uniqueProspectsMap.set(`incomplete_${uniqueProspectsMap.size}`, prospect);
      }
    }
    
    // Get the unique prospects back as an array
    const uniqueProspects = Array.from(uniqueProspectsMap.values());
    console.log(`Filtered ${prospectsResult.data.length} prospects down to ${uniqueProspects.length} unique prospects`);

    const getProspectEmails = async (prospect: any): Promise<Employee | null> => {
      try {
        // Case 1: Direct emails object
        if (prospect.emails?.emails?.[0]?.email) {
          return {
            first_name: prospect.first_name,
            last_name: prospect.last_name,
            position: prospect.position,
            source_page: prospect.source_page,
            email: prospect.emails.emails[0].email,
            company: companyName
          };
        }
        
        // Case 2: Need to fetch emails via search_emails_start URL
        if (prospect.search_emails_start) {
          console.log(`Fetching emails for ${prospect.first_name} ${prospect.last_name} using search_emails_start`);
          
          // Make POST request to initiate email search
          const searchResponse = await axios.post(prospect.search_emails_start, {}, {
            headers: { Authorization: `Bearer ${tokenData.access_token}` }
          });
          
          console.log(`Search email response for ${prospect.first_name}:`, searchResponse.data);
          
          // Check if we have a result URL
          if (!searchResponse.data?.links?.result) {
            console.log(`No result URL found for ${prospect.first_name}`);
            return null;
          }
          
          // Poll the result URL until we get emails - use longer timeout for email searches
          // Pass true for checkValidEmails to enable early termination when valid emails are found
          const resultUrl = searchResponse.data.links.result;
          const emailResult = await pollForResults(resultUrl, tokenData.access_token, 20, 4000, true);
          
          console.log(`Email result for ${prospect.first_name}:`, emailResult);
          
          // Check different possible response structures
          if (emailResult?.data?.emails?.[0]?.email) {
            return {
              first_name: prospect.first_name,
              last_name: prospect.last_name,
              position: prospect.position,
              source_page: prospect.source_page,
              email: emailResult.data.emails[0].email,
              company: companyName
            };
          } else if (emailResult?.emails?.[0]?.email) {
            return {
              first_name: prospect.first_name,
              last_name: prospect.last_name,
              position: prospect.position,
              source_page: prospect.source_page,
              email: emailResult.emails[0].email,
              company: companyName
            };
          }
        }
        
        console.log(`No valid email found for ${prospect.first_name} ${prospect.last_name}`);
        return null; // No valid email found
      } catch (error) {
        console.error(`Error fetching emails for prospect ${prospect.first_name}:`, error);
        return null;
      }
    };

    // Sort prospects to prioritize a mix of executives and non-executives
    // We want to include the first two executives and prioritize non-executives for the rest
    const executiveProspects = uniqueProspects.filter((p: any) => isExecutivePosition(p.position));
    const nonExecutiveProspects = uniqueProspects.filter((p: any) => !isExecutivePosition(p.position));
    
    // Take the first two executives (if they exist) and add them to the front of our processing queue
    const priorityExecutives = executiveProspects.slice(0, 2);
    // Add the remaining executives at the end
    const deprioritizedExecutives = executiveProspects.slice(2);
    
    // Combine them in the optimal processing order:
    // 1. First 2 executives (high priority)
    // 2. All non-executives (medium priority)
    // 3. Remaining executives (low priority)
    const sortedProspects = [
      ...priorityExecutives,
      ...nonExecutiveProspects,
      ...deprioritizedExecutives
    ];

    console.log(`Sorted prospects: ${sortedProspects.length} total (${priorityExecutives.length} priority executives, ${nonExecutiveProspects.length} non-executives, ${deprioritizedExecutives.length} deprioritized executives)`);

    // Process all prospects in parallel
    const employeePromises = sortedProspects.map(getProspectEmails);
    
    // Use a more efficient approach that stops when we have enough valid employees
    const employees: Employee[] = [];
    const executiveEmployees: Employee[] = [];
    const nonExecutiveEmployees: Employee[] = [];
    const minRequiredEmployees = 8; // Set minimum threshold
    const maxExecutives = 2; // Maximum number of executives to include
    
    // Process promises in order to check if we have enough results
    for (let i = 0; i < employeePromises.length; i++) {
      const employee = await employeePromises[i];
      if (employee) {
        // Categorize employee based on position
        if (isExecutivePosition(employee.position)) {
          executiveEmployees.push(employee);
        } else {
          nonExecutiveEmployees.push(employee);
        }
        
        // Check if we have enough employees in total
        const totalValidEmployees = 
          nonExecutiveEmployees.length + Math.min(executiveEmployees.length, maxExecutives);
        
        if (totalValidEmployees >= minRequiredEmployees) {
          console.log(`Found ${totalValidEmployees} valid employees (${nonExecutiveEmployees.length} non-executives, ${executiveEmployees.length} executives), stopping early`);
          break;
        }
      }
    }
    
    // Combine the results, limiting executives to maxExecutives
    employees.push(...nonExecutiveEmployees);
    employees.push(...executiveEmployees.slice(0, maxExecutives));
    
    // Final check for duplicates just to be safe
    const finalEmployees = removeDuplicateEmployees(employees);
    const duplicatesRemoved = employees.length - finalEmployees.length;
    if (duplicatesRemoved > 0) {
      console.log(`Removed ${duplicatesRemoved} duplicate employees in final list`);
    }
    
    console.log(`Final employee breakdown: ${finalEmployees.length} total, ${nonExecutiveEmployees.length} non-executives, ${Math.min(executiveEmployees.length, maxExecutives)} executives (prioritized first ${maxExecutives} executives)`);
    
    if (finalEmployees.length === 0) {
      console.error('No valid employees found with all required fields');
      throw new Error('No valid employees found with all required fields');
    }

    console.log("Successfully mapped employees:", finalEmployees.length);
    return finalEmployees;
  } catch (error) {
    console.error("Detailed error in searchDomainEmployees:", error);
    throw error;
  }
};

// Helper function to poll for results with early termination
const pollForResults = async (
  resultUrl: string,
  accessToken: string,
  maxAttempts = 15, 
  initialDelay = 3000,  // Start with a 3-second delay
  checkValidEmails = false // Whether to check for valid emails in the response
): Promise<any> => {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const response = await fetch(resultUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (response.status === 200) {
      const data = await response.json();
      
      console.log(`Poll attempt ${attempt + 1}/${maxAttempts}: Status: ${data.status}, Data:`, 
        checkValidEmails ? JSON.stringify(data).substring(0, 200) + '...' : 'Not checking emails');
      
      // Check if the operation is still in progress
      if (data.status === 'in_progress') {
        // If we're checking for emails and have partial results with valid emails, return early
        if (checkValidEmails) {
          // Check various possible response structures
          const emails = data.data?.emails || data.emails || [];
          const hasValidEmails = emails.length > 0 && 
            emails.some((e: any) => e.email && (e.smtp_status === 'valid' || e.smtp_status === 'unknown'));
          
          if (hasValidEmails) {
            console.log(`Found valid emails in partial results after ${attempt + 1} attempts, returning early`);
            return data;
          }
          
          // Also check if there's a direct email field
          if (data.data?.email || data.email) {
            console.log(`Found direct email in partial results after ${attempt + 1} attempts, returning early`);
            return data;
          }
        }
        
        // Wait before next attempt (exponential backoff)
        const delay = initialDelay * Math.pow(0.5, attempt);
        console.log(`Waiting ${delay}ms before next poll attempt`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      return data;
    }

    // Wait before next attempt (exponential backoff)
    const delay = initialDelay * Math.pow(0.5, attempt);
    console.log(`Received non-200 status (${response.status}), waiting ${delay}ms before retry`);
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  throw new Error('Email search timed out');
};