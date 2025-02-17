interface Employee {
  first_name: string;
  last_name: string;
  position: string;
  source_page: string;
  email: string;
}

interface Prospect {
  first_name: string;
  last_name: string;
  position: string;
  source_page: string;
  emails: {
    searching_date: string;
    emails: Array<{
      email: string;
      smtp_status: string;
    }>;
  };
}

export const searchDomainEmployees = async (
  domain: string,
  jobTitle: string
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
        positions: [jobTitle, "founder", "cofounder", "co-founder", "CEO"],
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

    const employees = prospectsResult.data
      .map((prospect: Prospect) => {
        // Check if we have an email
        if (!prospect.emails?.emails?.[0]?.email) {
          console.log('No email found for prospect:', prospect.first_name);
          return null;
        }

        // Return employee with the first email
        return {
          first_name: prospect.first_name,
          last_name: prospect.last_name,
          position: prospect.position,
          source_page: prospect.source_page,
          email: prospect.emails.emails[0].email
        };
      })
      .filter((employee: Employee | null): employee is Employee => employee !== null);

    if (employees.length === 0) {
      throw new Error('No valid employees found with all required fields');
    }

    console.log("Successfully mapped employees:", employees.length);
    return employees;
  } catch (error) {
    console.error("Detailed error in searchDomainEmployees:", error);
    throw error;
  }
};

// Helper function to poll for results
const pollForResults = async (
  resultUrl: string,
  accessToken: string,
  maxAttempts = 5
): Promise<any> => {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const response = await fetch(resultUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (response.status === 200) {
      return await response.json();
    }

    // Wait before next attempt (exponential backoff)
    await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
  }

  throw new Error('Email search timed out');
};