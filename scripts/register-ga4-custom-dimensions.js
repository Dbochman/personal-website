/**
 * Register custom dimensions in GA4 for tool interaction tracking
 *
 * GA4 requires event parameters to be registered as custom dimensions
 * before they can be queried via the Data API. Without registration,
 * the API returns "(not set)" for these dimensions.
 *
 * This is a one-time setup script. Run it once, then tool_name and action
 * will appear in your GA4 reports and Data API queries.
 *
 * Required environment variables:
 * - GA4_CREDENTIALS: Base64-encoded service account JSON credentials
 * - GA4_PROPERTY_ID: Your GA4 property ID (format: properties/123456789)
 *
 * The service account needs "Editor" role on the GA4 property
 * (Admin > Property Access Management). Viewer is not sufficient.
 *
 * Usage:
 *   GA4_CREDENTIALS="..." GA4_PROPERTY_ID="properties/123456789" node scripts/register-ga4-custom-dimensions.js
 *
 * Or manually in GA4 Admin:
 *   1. Go to https://analytics.google.com
 *   2. Admin > Custom definitions > Create custom dimension
 *   3. Add: tool_name (event scope), action (event scope), event_label (event scope)
 */

const { google } = require('googleapis');

const DIMENSIONS = [
  {
    parameterName: 'tool_name',
    displayName: 'Tool Name',
    description: 'Which interactive tool was used (e.g., slo_calculator, cli_playground)',
    scope: 'EVENT',
  },
  {
    parameterName: 'action',
    displayName: 'Tool Action',
    description: 'What action the user performed (e.g., calculate, tab_switch, command_run)',
    scope: 'EVENT',
  },
  {
    parameterName: 'event_label',
    displayName: 'Event Label',
    description: 'Additional context for the tool interaction (e.g., tab name, preset)',
    scope: 'EVENT',
  },
];

async function main() {
  const credentialsBase64 = process.env.GA4_CREDENTIALS;
  const propertyId = process.env.GA4_PROPERTY_ID;

  if (!credentialsBase64 || !propertyId) {
    console.error('Missing required environment variables: GA4_CREDENTIALS, GA4_PROPERTY_ID');
    process.exit(1);
  }

  const credentials = JSON.parse(Buffer.from(credentialsBase64, 'base64').toString('utf-8'));

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/analytics.edit'],
  });

  const analyticsAdmin = google.analyticsadmin({ version: 'v1beta', auth });

  // List existing custom dimensions to avoid duplicates
  let existingParams = new Set();
  try {
    const res = await analyticsAdmin.properties.customDimensions.list({ parent: propertyId });
    existingParams = new Set((res.data.customDimensions || []).map(d => d.parameterName));
    console.log(`Found ${existingParams.size} existing custom dimensions`);
  } catch (error) {
    console.log('Could not list existing dimensions:', error.message);
  }

  for (const dim of DIMENSIONS) {
    if (existingParams.has(dim.parameterName)) {
      console.log(`Already registered: ${dim.parameterName}`);
      continue;
    }

    try {
      await analyticsAdmin.properties.customDimensions.create({
        parent: propertyId,
        requestBody: {
          parameterName: dim.parameterName,
          displayName: dim.displayName,
          description: dim.description,
          scope: dim.scope,
        },
      });
      console.log(`Registered: ${dim.parameterName} -> "${dim.displayName}"`);
    } catch (error) {
      if (error.code === 409) {
        console.log(`Already registered: ${dim.parameterName}`);
      } else {
        console.error(`Failed to register ${dim.parameterName}:`, error.message);
      }
    }
  }

  console.log('\nDone! Custom dimensions should appear in GA4 reports within 24-48 hours.');
  console.log('The Data API (fetch-ga4-data.js) will show tool names and actions instead of "(not set)".');
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
