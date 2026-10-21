// Credential-free live TLS acceptance test. No cookies, tokens, or response bodies.
import https from 'node:https';
const canaries = ['emudhra', 'aaa-emudhra'].flatMap(chain =>
  ['dv', 'ov', 'ev'].flatMap(kind => ['g3b', 'g3c'].map(variant =>
    `${kind}-${variant}-${chain}.we-have-a-problem.com`)));
const controls = ['github.com', 'pypi.org'];
const trustErrors = new Set(['UNABLE_TO_GET_ISSUER_CERT', 'UNABLE_TO_GET_ISSUER_CERT_LOCALLY',
  'UNABLE_TO_VERIFY_LEAF_SIGNATURE', 'SELF_SIGNED_CERT_IN_CHAIN', 'CERT_REVOKED', 'CERT_UNTRUSTED', 'CERT_REJECTED']);

async function check(client, host) {
  const control = controls.includes(host);
  try {
    if (client === 'https') {
      await new Promise((resolve, reject) => {
        const req = https.request(`https://${host}/`, { method: 'HEAD', signal: AbortSignal.timeout(8000) }, response => {
          response.destroy(); resolve();
        });
        req.on('error', reject);
        req.end();
      });
    } else {
      const response = await fetch(`https://${host}/`, {
        method: 'HEAD', redirect: 'manual', signal: AbortSignal.timeout(8000),
      });
      await response.body?.cancel();
    }
    return { client, host, result: control ? 'control_passed' : 'UNEXPECTED_ACCEPTANCE' };
  } catch (error) {
    const code = error.cause?.code ?? error.code;
    return { client, host, result: !control && trustErrors.has(code) ? 'rejected' : 'INCONCLUSIVE', code };
  }
}

const results = [];
for (const client of ['https', 'fetch']) {
  for (const group of [controls, canaries.slice(0, 6), canaries.slice(6)]) {
    results.push(...await Promise.all(group.map(host => check(client, host))));
  }
}
console.log(JSON.stringify({ node: process.version, results }, null, 2));
if (results.some(result => !['control_passed', 'rejected'].includes(result.result))) process.exitCode = 1;
