import assert from 'node:assert/strict';
import { test } from 'node:test';
import { collectDailyBlogReport } from './fetch-ga4-blog-daily.mjs';

const timeZone = 'America/New_York';
const now = new Date('2026-11-01T01:30:00Z');
const options = { property: 'properties/test', now, pageSize: 2 };
const row = (date, page, views = 1) => ({
  dimensionValues: [{ value: date.replaceAll('-', '') }, { value: page }],
  metricValues: [{ value: String(views) }, { value: '1' }, { value: '1' }],
});
function mockClient(rows, metadata = {}) {
  const calls = [];
  return { calls, async runReport(request) {
    calls.push(request);
    if (request.dimensions.length === 1) return [{ metadata: { timeZone } }];
    return [{ rows: rows.slice(request.offset, request.offset + request.limit), rowCount: rows.length,
      metadata: { timeZone, ...metadata } }];
  } };
}

test('backfills actual daily per-path counts, paginating beyond the first response', async () => {
  const client = mockClient([
    row('2026-09-01', '/blog/one', 3), row('2026-09-01', '/blog/two', 2),
    row('2026-10-29', '/blog/new-post', 4),
  ]);
  const report = await collectDailyBlogReport(client, options);
  assert.deepEqual(report.coverage, { startDate: '2026-01-01', endDate: '2026-10-29' });
  assert.equal(report.days.length, 302);
  assert.equal(report.days.find(d => d.date === '2026-09-01').pageViews, 5);
  assert.deepEqual(report.days.find(d => d.date === '2026-09-02').pages, []);
  assert.equal(report.days.at(-1).pages[0].page, '/blog/new-post');
  assert.deepEqual(client.calls.slice(1).map(c => c.offset), [0, 2]);
  assert.deepEqual(client.calls[1].dimensions.map(d => d.name), ['date', 'pagePath']);
  assert.equal(client.calls[1].dateRanges[0].endDate, '2026-10-29');
  assert.ok(client.calls[1].dimensionFilter.andGroup);
});

test('replaces refreshed days, including newly empty days, and fills collection gaps', async () => {
  const previous = await collectDailyBlogReport(mockClient([
    row('2026-09-01', '/blog/keep', 3), row('2026-10-29', '/blog/removed', 4),
  ]), options);
  const report = await collectDailyBlogReport(mockClient([row('2026-10-30', '/blog/new', 7)]), {
    ...options, previous, now: new Date('2026-11-04T12:00:00Z'),
  });
  assert.equal(report.coverage.endDate, '2026-11-02');
  assert.equal(report.days.find(d => d.date === '2026-09-01').pageViews, 3);
  assert.equal(report.days.find(d => d.date === '2026-10-29').pageViews, 0);
  assert.equal(report.days.find(d => d.date === '2026-10-30').pageViews, 7);
  assert.equal(new Set(report.days.map(d => d.date)).size, report.days.length);
});

test('reruns replace values rather than accumulating duplicate counts', async () => {
  const previous = await collectDailyBlogReport(mockClient([row('2026-10-29', '/blog/post', 4)]), options);
  const repeated = await collectDailyBlogReport(mockClient([row('2026-10-29', '/blog/post', 4)]), { ...options, previous });
  assert.deepEqual(repeated, previous);
});

test('rejects incomplete/thresholded/sampled reports instead of manufacturing zeros', async () => {
  for (const metadata of [
    { dataLossFromOtherRow: true }, { subjectToThresholding: true },
    { dataTruncationReasons: [{}] },
    { samplingMetadatas: [{ samplesReadCount: '50', samplingSpaceSize: '100' }] },
  ]) await assert.rejects(collectDailyBlogReport(mockClient([], metadata), options), /incomplete/);
});

test('rejects missing pages, repeated rows, invalid counts, and non-post paths', async () => {
  const duplicate = row('2026-10-29', '/blog/duplicate');
  for (const rows of [[duplicate, duplicate], [row('2026-10-29', '/blog/')], [row('2026-10-29', '/blog/post', -1)]]) {
    await assert.rejects(collectDailyBlogReport(mockClient(rows), options));
  }
  const client = mockClient([]);
  const runReport = client.runReport.bind(client);
  client.runReport = async request => {
    const [response] = await runReport(request);
    if (request.dimensions.length === 2) response.rowCount = 10;
    return [response];
  };
  await assert.rejects(collectDailyBlogReport(client, options), /pagination/);
});

test('rejects a timezone change rather than mixing incompatible daily boundaries', async () => {
  await assert.rejects(collectDailyBlogReport(mockClient([]), {
    ...options, previous: { schemaVersion: 1, timeZone: 'UTC' },
  }), /timezone/);
});
