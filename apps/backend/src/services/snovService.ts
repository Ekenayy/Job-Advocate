import axios from 'axios';

interface Employee {
  first_name: string;
  last_name: string;
  position: string;
  source_page: string;
  email: string;
}

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

    // Start prospects search
    const prospectsUrl = "https://api.snov.io/v2/domain-search/prospects/start";
    const prospectsResponse = await fetch(prospectsUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        domain: domain,
        positions: [jobTitle, ...potentialAdvocates, "founder", "cofounder", "co-founder", "CEO"],
      }),
    });

    console.log("Prospects response status:", prospectsResponse.status);
    const prospectsData = await prospectsResponse.json();
    console.log("Prospects response:", prospectsData);

    // Wait for prospects search to complete
    const prospectsResult = await pollForResults(
      prospectsData.links.result,
      tokenData.access_token
    );
    console.log("Prospects search complete:", prospectsResult);

    // Add this right after getting prospectsResult
    console.log("Sample prospect with emails:", JSON.stringify(prospectsResult.data[0], null, 2));

    const getProspectEmails = async (prospect: any): Promise<Employee | null> => {
      try {
        // Case 1: Direct emails object
        if (prospect.emails?.emails?.[0]?.email) {
          return {
            first_name: prospect.first_name,
            last_name: prospect.last_name,
            position: prospect.position,
            source_page: prospect.source_page,
            email: prospect.emails.emails[0].email
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
          const emailResult = await pollForResults(resultUrl, tokenData.access_token, 15, 3000, true);
          
          console.log(`Email result for ${prospect.first_name}:`, emailResult);
          
          // Check different possible response structures
          if (emailResult?.data?.emails?.[0]?.email) {
            return {
              first_name: prospect.first_name,
              last_name: prospect.last_name,
              position: prospect.position,
              source_page: prospect.source_page,
              email: emailResult.data.emails[0].email
            };
          } else if (emailResult?.emails?.[0]?.email) {
            return {
              first_name: prospect.first_name,
              last_name: prospect.last_name,
              position: prospect.position,
              source_page: prospect.source_page,
              email: emailResult.emails[0].email
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

    // Process all prospects in parallel
    const employeePromises = prospectsResult.data.map(getProspectEmails);
    
    // Use a more efficient approach that stops when we have enough valid employees
    const employees: (Employee | null)[] = [];
    const minRequiredEmployees = 7; // Set minimum threshold
    
    // Process promises in batches to check if we have enough results
    for (let i = 0; i < employeePromises.length; i++) {
      const employee = await employeePromises[i];
      if (employee) {
        employees.push(employee);
        
        // If we have enough valid employees, stop processing the rest
        if (employees.filter(Boolean).length >= minRequiredEmployees) {
          console.log(`Found ${minRequiredEmployees} valid employees, stopping early`);
          break;
        }
      }
    }
    
    if (employees.length === 0) {
      throw new Error('No valid employees found with all required fields');
    }

    console.log("Successfully mapped employees:", employees.length);
    return employees.filter((emp): emp is Employee => emp !== null);
  } catch (error) {
    console.error("Detailed error in searchDomainEmployees:", error);
    throw error;
  }
};

// Helper function to poll for results with early termination
const pollForResults = async (
  resultUrl: string,
  accessToken: string,
  maxAttempts = 10, 
  initialDelay = 2000,  // Start with a 2-second delay
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
        const delay = initialDelay * Math.pow(1.5, attempt);
        console.log(`Waiting ${delay}ms before next poll attempt`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      return data;
    }

    // Wait before next attempt (exponential backoff)
    const delay = initialDelay * Math.pow(1.5, attempt);
    console.log(`Received non-200 status (${response.status}), waiting ${delay}ms before retry`);
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  throw new Error('Email search timed out');
};