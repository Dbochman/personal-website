import { defineWorkersConfig } from '@cloudflare/vitest-pool-workers/config';

export default defineWorkersConfig({
	test: {
		poolOptions: {
			workers: {
				// Never load Wrangler's remote production KV binding into tests.
				main: './src/index.ts',
				miniflare: {
					compatibilityDate: '2025-09-06', // Locked test runtime's supported date
					kvNamespaces: ['SESSIONS'],
					bindings: {
						REPO_OWNER: 'fixture-owner',
						REPO_NAME: 'fixture-repo',
						WORKER_URL: 'https://worker.test',
						ALLOWED_ORIGINS: 'https://app.test,http://localhost:5173',
						GITHUB_PAT: 'test-only-token',
						GITHUB_CLIENT_ID: 'test-only-client',
						GITHUB_CLIENT_SECRET: 'test-only-secret',
					},
				},
			},
		},
	},
});
