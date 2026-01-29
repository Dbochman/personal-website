/**
 * Fetch GitHub Actions Billing Data
 *
 * This script fetches billing usage data from the GitHub Enhanced Billing Platform API
 * and saves it to docs/metrics/github-billing-history.json for tracking CI/CD costs.
 *
 * Required environment variables:
 * - GH_BILLING_TOKEN: Personal access token (classic) with `user` scope
 *   OR use GITHUB_TOKEN if running locally with `gh auth` configured
 *
 * Setup instructions:
 * 1. Create a PAT at https://github.com/settings/tokens
 * 2. Select "user" scope (required for billing API)
 * 3. Add to GitHub secrets as GH_BILLING_TOKEN
 *
 * API Endpoint: GET /users/{username}/settings/billing/usage
 * Docs: https://docs.github.com/en/rest/billing/usage
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const HISTORY_FILE = path.join(__dirname, '../docs/metrics/github-billing-history.json');
const MAX_ENTRIES = 52; // ~1 year of weekly data
const GITHUB_USERNAME = 'Dbochman';

async function fetchGitHubBilling() {
  try {
    // Check for token - try GH_BILLING_TOKEN first, fall back to GITHUB_TOKEN
    const token = process.env.GH_BILLING_TOKEN || process.env.GITHUB_TOKEN;

    if (!token) {
      console.log('⚠️  No GitHub token found, skipping');
      console.log('💡 To enable: Set GH_BILLING_TOKEN environment variable (PAT with user scope)');
      console.log('   Or run locally with: gh auth status');
      return;
    }

    console.log(`📊 Fetching GitHub billing data for ${GITHUB_USERNAME}...`);

    // Fetch billing usage from Enhanced Billing Platform
    const response = await fetch(
      `https://api.github.com/users/${GITHUB_USERNAME}/settings/billing/usage`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error(`❌ API error: ${response.status} - ${error.message || response.statusText}`);

      if (response.status === 404) {
        console.log('💡 The billing API may require the "user" scope. Try: gh auth refresh -s user');
      }
      if (response.status === 410) {
        console.log('💡 The legacy billing endpoint is deprecated. This script uses the new Enhanced Billing Platform.');
      }

      process.exit(1);
    }

    const data = await response.json();

    // Guard: Don't save if no usage items
    if (!data.usageItems || data.usageItems.length === 0) {
      console.warn('⚠️  No usage items returned - this might be expected for new accounts');
      // Still save an entry to track that we checked
    }

    // Filter to Actions-related items only
    const actionsItems = (data.usageItems || []).filter(
      item => item.product === 'actions'
    );

    // Aggregate by runner type
    const byRunner = {
      linux: { minutes: 0, grossAmount: 0 },
      macos: { minutes: 0, grossAmount: 0 },
      windows: { minutes: 0, grossAmount: 0 },
    };

    // Aggregate by repository
    const repoMap = new Map();

    // Storage tracking
    const storage = { gbHours: 0, grossAmount: 0 };

    let totalMinutes = 0;
    let totalGrossAmount = 0;
    let totalDiscountAmount = 0;
    let totalNetAmount = 0;

    for (const item of actionsItems) {
      if (item.unitType === 'Minutes') {
        totalMinutes += item.quantity;
        totalGrossAmount += item.grossAmount;
        totalDiscountAmount += item.discountAmount;
        totalNetAmount += item.netAmount;

        // Aggregate by runner
        const sku = item.sku.toLowerCase();
        if (sku.includes('linux')) {
          byRunner.linux.minutes += item.quantity;
          byRunner.linux.grossAmount += item.grossAmount;
        } else if (sku.includes('macos')) {
          byRunner.macos.minutes += item.quantity;
          byRunner.macos.grossAmount += item.grossAmount;
        } else if (sku.includes('windows')) {
          byRunner.windows.minutes += item.quantity;
          byRunner.windows.grossAmount += item.grossAmount;
        }

        // Aggregate by repository
        const repoName = item.repositoryName || 'unknown';
        const existing = repoMap.get(repoName) || { name: repoName, minutes: 0, grossAmount: 0 };
        existing.minutes += item.quantity;
        existing.grossAmount += item.grossAmount;
        repoMap.set(repoName, existing);
      } else if (item.unitType === 'GigabyteHours') {
        storage.gbHours += item.quantity;
        storage.grossAmount += item.grossAmount;
      }
    }

    // Guard: Sanity check for suspiciously high values
    if (totalMinutes > 50000) {
      console.error(`❌ Suspiciously high minutes value (${totalMinutes}) - skipping to prevent bad data`);
      process.exit(1);
    }

    // Build the entry
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const entry = {
      timestamp: now.toISOString(),
      date: now.toISOString().split('T')[0],
      period: {
        start: startOfMonth.toISOString().split('T')[0],
        end: now.toISOString().split('T')[0],
        description: `${startOfMonth.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
      },
      summary: {
        totalMinutes: Math.round(totalMinutes),
        totalGrossAmount: Math.round(totalGrossAmount * 100) / 100,
        totalDiscountAmount: Math.round(totalDiscountAmount * 100) / 100,
        totalNetAmount: Math.round(totalNetAmount * 100) / 100,
      },
      byRunner: {
        linux: {
          minutes: Math.round(byRunner.linux.minutes),
          grossAmount: Math.round(byRunner.linux.grossAmount * 100) / 100,
        },
        macos: {
          minutes: Math.round(byRunner.macos.minutes),
          grossAmount: Math.round(byRunner.macos.grossAmount * 100) / 100,
        },
        windows: {
          minutes: Math.round(byRunner.windows.minutes),
          grossAmount: Math.round(byRunner.windows.grossAmount * 100) / 100,
        },
      },
      byRepository: Array.from(repoMap.values())
        .map(r => ({
          name: r.name,
          minutes: Math.round(r.minutes),
          grossAmount: Math.round(r.grossAmount * 100) / 100,
        }))
        .sort((a, b) => b.minutes - a.minutes),
      storage: {
        gbHours: Math.round(storage.gbHours * 100) / 100,
        grossAmount: Math.round(storage.grossAmount * 100) / 100,
      },
      status: totalMinutes > 0 ? 'valid' : 'empty',
    };

    // Load existing history
    let history = [];
    if (fs.existsSync(HISTORY_FILE)) {
      try {
        history = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf-8'));
      } catch (e) {
        console.warn('⚠️  Could not parse existing history, starting fresh');
        history = [];
      }
    }

    // Check for duplicate entry on same date
    const existingIndex = history.findIndex(h => h.date === entry.date);
    if (existingIndex !== -1) {
      console.log(`📝 Updating existing entry for ${entry.date}`);
      history[existingIndex] = entry;
    } else {
      console.log(`📝 Adding new entry for ${entry.date}`);
      history.push(entry);
    }

    // Trim to max entries
    if (history.length > MAX_ENTRIES) {
      history = history.slice(-MAX_ENTRIES);
    }

    // Sort by date
    history.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Write back
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));

    console.log('✅ GitHub billing data saved successfully!');
    console.log(`   Period: ${entry.period.description}`);
    console.log(`   Total minutes: ${entry.summary.totalMinutes}`);
    console.log(`   Gross amount: $${entry.summary.totalGrossAmount}`);
    console.log(`   Net amount: $${entry.summary.totalNetAmount}`);
    console.log(`   Repositories: ${entry.byRepository.length}`);

  } catch (error) {
    console.error('❌ Error fetching GitHub billing data:', error.message);
    process.exit(1);
  }
}

fetchGitHubBilling();
