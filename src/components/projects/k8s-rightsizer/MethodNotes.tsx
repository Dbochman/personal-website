import type { ReactNode } from 'react';
import { POSTURES, POSTURE_CONFIG, memoryRequestPercentile } from './calculations';
import { DOCS } from './docs-links';

const PROMQL = `# Replace NS and CTR. Results are per pod; max() keeps the busiest pod.
# CPU P95 and max, in cores (enter as 0.23 or 230m)
max(quantile_over_time(0.95, rate(container_cpu_usage_seconds_total{namespace="NS", container="CTR"}[5m])[7d:5m]))
max(max_over_time(rate(container_cpu_usage_seconds_total{namespace="NS", container="CTR"}[5m])[7d:5m]))

# Memory P95 and max, in bytes (plain byte values are accepted)
max(quantile_over_time(0.95, container_memory_working_set_bytes{namespace="NS", container="CTR"}[7d]))
max(max_over_time(container_memory_working_set_bytes{namespace="NS", container="CTR"}[7d]))

# Throttling ratio: share of CPU periods where the limit stopped the container
sum(rate(container_cpu_cfs_throttled_periods_total{namespace="NS", container="CTR"}[5m]))
  / sum(rate(container_cpu_cfs_periods_total{namespace="NS", container="CTR"}[5m]))`;

function DocLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-foreground underline underline-offset-2">
      {children}
    </a>
  );
}

const multiplier = (value: number) => value.toFixed(1);

export function MethodNotes() {
  return (
    <section id="rightsizer-method" aria-labelledby="rightsizer-method-title" className="scroll-mt-24 space-y-6 border-t pt-6 text-sm [overflow-wrap:anywhere]">
      <h2 id="rightsizer-method-title" className="text-xl font-semibold">How it works</h2>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-2">
          <h3 className="font-semibold">What to measure</h3>
          <p className="text-muted-foreground">
            Use one container's usage per replica, over a window that covers peak traffic, deploys, and scheduled
            jobs. A week or two is a common starting point. For CPU, take a rate of
            {' '}<code className="text-xs">container_cpu_usage_seconds_total</code>. For memory, use the working set
            {' '}(<code className="text-xs">container_memory_working_set_bytes</code>), the same measure the kubelet
            {' '}uses for <DocLink href={DOCS.eviction}>memory-pressure eviction</DocLink>.
          </p>
          <p className="text-muted-foreground">
            A 5-minute rate averages away sub-second bursts, and CPU limits are enforced over much shorter periods.
            A container can be throttled even when its measured peak sits under the limit, so check throttling too.
          </p>
          <details className="rounded-md border border-dashed px-4 py-3">
            <summary className="cursor-pointer text-muted-foreground">Example PromQL (Prometheus with cAdvisor metrics)</summary>
            <pre className="mt-3 overflow-x-auto whitespace-pre text-xs text-muted-foreground">{PROMQL}</pre>
          </details>
        </div>

        <div className="space-y-2">
          <h3 className="font-semibold">How values are computed</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <caption className="sr-only">Formulas used by each sizing posture</caption>
              <thead className="text-muted-foreground">
                <tr>
                  <th scope="col" className="py-1.5 pr-2 font-medium">Posture</th>
                  <th scope="col" className="py-1.5 pr-2 font-medium">CPU request</th>
                  <th scope="col" className="py-1.5 pr-2 font-medium">Memory request</th>
                  <th scope="col" className="py-1.5 font-medium">Limits</th>
                </tr>
              </thead>
              <tbody className="font-mono">
                {POSTURES.map((posture) => {
                  const config = POSTURE_CONFIG[posture];
                  const memoryPercentile = memoryRequestPercentile(posture).toUpperCase();
                  return (
                    <tr key={posture} className="border-t border-border">
                      <th scope="row" className="py-1.5 pr-2 font-sans font-normal">{config.label}</th>
                      <td className="py-1.5 pr-2">{config.basePercentile.toUpperCase()} × {multiplier(config.requestMultiplier)}</td>
                      <td className="py-1.5 pr-2">{memoryPercentile} × {multiplier(config.requestMultiplier)}</td>
                      <td className="py-1.5">Max × {multiplier(config.limitMultiplier)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
            <li>Memory requests never use P50. Memory can't be throttled, and pods using more than they request are evicted first under node memory pressure. This is a heuristic that lowers that exposure, not a guarantee.</li>
            <li>CPU rounds up to 10m (100m above 1 core); memory rounds up by at most 12.5%. Floors are 10m and 16Mi.</li>
            <li>A missing P50 is replaced by P95 and a missing P99 by Max. Nothing is estimated.</li>
            <li>Units follow <DocLink href={DOCS.quantity}>Kubernetes quantities</DocLink>: <code className="text-xs">500m</code> CPU is half a core, but <code className="text-xs">500m</code> memory is half a byte.</li>
          </ul>
        </div>

        <div className="space-y-2">
          <h3 className="font-semibold">Kubernetes behavior that matters</h3>
          <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
            <li>The scheduler places pods by their requests, and a limit without a request becomes the request. <DocLink href={DOCS.resources}>Resource management</DocLink></li>
            <li>CPU above the limit is throttled. Memory above the limit gets the container OOM-killed, though only once the kernel detects memory pressure.</li>
            <li>Under node pressure, the kubelet evicts pods using more than their requests first, then ranks by priority and how far usage exceeds requests. Pods within their requests go last but can still be evicted. QoS class is only a rough guide to that order. <DocLink href={DOCS.eviction}>Node-pressure eviction</DocLink>, <DocLink href={DOCS.qos}>QoS classes</DocLink></li>
            <li>HPA CPU utilization is a percentage of the request, so changing the request changes when it scales. <DocLink href={DOCS.hpa}>HPA</DocLink></li>
          </ul>
        </div>

        <div className="space-y-2">
          <h3 className="font-semibold">Limitations</h3>
          <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
            <li>Percentiles describe the window you measured. They don't cover growth, failover traffic, cold caches, or new features.</li>
            <li>One container at a time. Sidecars and init containers need their own numbers.</li>
            <li>Runtimes with their own memory ceilings (JVM heap, <code className="text-xs">GOMEMLIMIT</code>, Node&apos;s <code className="text-xs">--max-old-space-size</code>) need those adjusted with the memory limit.</li>
            <li>
              For a second opinion from live data, run a <DocLink href={DOCS.vpa}>VerticalPodAutoscaler</DocLink> in
              {' '}<code className="text-xs">Off</code> mode, which records recommendations without applying them.
              {' '}On v1.35+, <DocLink href={DOCS.resize}>in-place resize</DocLink> can shorten each rollout step.
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
