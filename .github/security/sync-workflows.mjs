// Generate the offline first step: a local composite action needs checkout first.
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { load } from 'js-yaml';

const directory = new URL('../workflows/', import.meta.url);
const source = readFileSync(new URL('bootstrap.py', import.meta.url), 'utf8').trimEnd();
const command = `python3 - <<'PY'\n${source}\nPY\n`;
const block = [
  '      # BEGIN GENERATED TLS BOOTSTRAP — .github/security/sync-workflows.mjs',
  '      - &tls-bootstrap',
  '        id: tls',
  '        name: Bootstrap CI trust (offline)',
  '        timeout-minutes: 2',
  '        shell: bash',
  '        run: |',
  ...command.trimEnd().split('\n').map(line => `          ${line}`.trimEnd()),
  '      # END GENERATED TLS BOOTSTRAP',
].join('\n');
let stale = false;
for (const filename of readdirSync(directory).filter(name => name.endsWith('.yml'))) {
  const path = new URL(filename, directory);
  const original = readFileSync(path, 'utf8');
  let result = original.replace(/      # BEGIN GENERATED TLS BOOTSTRAP[^\n]*\n[\s\S]*?      # END GENERATED TLS BOOTSTRAP\n/g, '')
    .replace(/      - \*tls-bootstrap\n/g, '');
  if (!load(result).env) {
    result = result.replace(/^jobs:/m, 'env:\n  NODE_OPTIONS: --use-openssl-ca\n  NODE_USE_SYSTEM_CA: "0"\n  NODE_EXTRA_CA_CERTS: ""\n\njobs:');
  }
  let first = true;
  const multipleJobs = Object.keys(load(result).jobs).length > 1;
  result = result.replace(/^    steps:\n/gm, match => {
    const insertion = first ? (multipleJobs ? block : block.replace('- &tls-bootstrap', '-')) : '      - *tls-bootstrap';
    first = false;
    return `${match}${insertion}\n`;
  });
  // Failure/always handlers must not make credential-bearing calls if trust
  // preparation failed. Preserve their original behavior after a good bootstrap.
  result = result.replace(/^        if: (.+)$/gm, (line, condition) => {
    if (!/\b(always|failure|cancelled)\(/.test(condition) || condition.includes('steps.tls.outcome')) return line;
    const expression = condition.replace(/^\$\{\{\s*|\s*\}\}$/g, '');
    return "        if: ${{ (" + expression + ") && steps.tls.outcome == 'success' }}";
  });
  const workflow = load(result);
  if (workflow.env.NODE_OPTIONS !== '--use-openssl-ca' ||
      workflow.env.NODE_USE_SYSTEM_CA !== '0' || workflow.env.NODE_EXTRA_CA_CERTS !== '') {
    throw new Error(`Unexpected Node trust settings: ${filename}`);
  }
  for (const [name, job] of Object.entries(workflow.jobs)) {
    if (!['ubuntu-latest', 'ubuntu-24.04'].includes(job['runs-on']) ||
        job.steps?.[0]?.run !== command || job.steps[0].id !== 'tls' || job.steps[0].if || job.steps[0]['continue-on-error']) {
      throw new Error(`Unsupported/unprotected job: ${filename}:${name}`);
    }
    for (const step of job.steps.slice(1)) {
      if (step.uses?.startsWith('actions/setup-node@') && step.with?.['node-version'] !== '24.22.1') {
        throw new Error(`Unpinned/affected build Node: ${filename}:${name}`);
      }
      if (/\b(always|failure|cancelled)\(/.test(step.if ?? '') && !step.if.includes("steps.tls.outcome == 'success'")) {
        throw new Error(`Unguarded failure handler: ${filename}:${name}`);
      }
    }
    for (const env of [job.env, ...job.steps.map(step => step.env)]) {
      if (env && Object.keys(env).some(key => /^(NODE_OPTIONS|NODE_USE_SYSTEM_CA|NODE_EXTRA_CA_CERTS|SSL_CERT_FILE|SSL_CERT_DIR)$/.test(key))) {
        throw new Error(`Trust override in ${filename}:${name}`);
      }
    }
  }
  if (original !== result) {
    stale = true;
    if (!process.argv.includes('--check')) writeFileSync(path, result);
    else console.error(`Stale TLS bootstrap: ${fileURLToPath(path)}`);
  }
}
if (stale && process.argv.includes('--check')) process.exitCode = 1;
