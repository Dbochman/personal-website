/**
 * kubectl engine - simulates kubectl commands against mock cluster fixtures
 *
 * Architecture: Single source of truth executor used by both Learn and Play modes.
 * For the same {fixture, namespace, command}, output is byte-for-byte identical.
 */

// ============================================================================
// TYPES - K8s-like resource schema
// ============================================================================

interface ObjectMeta {
  name: string;
  namespace?: string;
  labels?: Record<string, string>;
  creationTimestamp: string;
  uid: string;
}

interface ContainerState {
  waiting?: { reason: string; message?: string };
  running?: { startedAt: string };
  terminated?: { exitCode: number; reason: string; message?: string; finishedAt: string };
}

interface ContainerStatus {
  name: string;
  image: string;
  imageID: string;
  ready: boolean;
  restartCount: number;
  state: ContainerState;
  lastState?: ContainerState;
}

interface PodCondition {
  type: string;
  status: 'True' | 'False' | 'Unknown';
  lastTransitionTime: string;
  reason?: string;
  message?: string;
}

interface Pod {
  metadata: ObjectMeta;
  spec: {
    nodeName?: string;
    containers: { name: string; image: string; ports?: { containerPort: number }[] }[];
  };
  status: {
    phase: string;
    podIP?: string;
    hostIP?: string;
    startTime?: string;
    conditions?: PodCondition[];
    containerStatuses?: ContainerStatus[];
  };
}

interface DeploymentCondition {
  type: string;
  status: 'True' | 'False' | 'Unknown';
  lastUpdateTime: string;
  lastTransitionTime: string;
  reason: string;
  message: string;
}

interface Deployment {
  metadata: ObjectMeta;
  spec: {
    replicas: number;
    selector: { matchLabels: Record<string, string> };
    template: { metadata: { labels: Record<string, string> } };
  };
  status: {
    replicas: number;
    readyReplicas: number;
    updatedReplicas: number;
    availableReplicas: number;
    conditions?: DeploymentCondition[];
    observedGeneration?: number;
  };
  revisions?: { revision: number; image: string; changeCause: string }[];
}

interface ReplicaSet {
  metadata: ObjectMeta;
  spec: {
    replicas: number;
    selector: { matchLabels: Record<string, string> };
  };
  status: {
    replicas: number;
    readyReplicas: number;
    availableReplicas: number;
  };
}

interface Service {
  metadata: ObjectMeta;
  spec: {
    type: string;
    clusterIP: string;
    ports: { port: number; targetPort: number; protocol: string; nodePort?: number }[];
    selector?: Record<string, string>;
    externalIPs?: string[];
  };
  status?: {
    loadBalancer?: { ingress?: { ip: string }[] };
  };
}

interface Endpoints {
  metadata: ObjectMeta;
  subsets?: {
    addresses?: { ip: string; nodeName?: string; targetRef?: { name: string; namespace: string } }[];
    ports?: { port: number; protocol: string }[];
  }[];
}

interface NodeCondition {
  type: string;
  status: 'True' | 'False' | 'Unknown';
  lastHeartbeatTime: string;
  lastTransitionTime: string;
  reason: string;
  message: string;
}

interface Node {
  metadata: ObjectMeta;
  spec: {
    taints?: { key: string; value?: string; effect: string }[];
    unschedulable?: boolean;
  };
  status: {
    conditions: NodeCondition[];
    addresses: { type: string; address: string }[];
    capacity: { cpu: string; memory: string; pods: string };
    allocatable: { cpu: string; memory: string; pods: string };
    nodeInfo: {
      kubeletVersion: string;
      osImage: string;
      kernelVersion: string;
      containerRuntimeVersion: string;
    };
  };
}

interface Event {
  metadata: ObjectMeta;
  involvedObject: { kind: string; name: string; namespace?: string; uid: string };
  reason: string;
  message: string;
  source: { component: string; host?: string };
  firstTimestamp: string;
  lastTimestamp: string;
  count: number;
  type: 'Normal' | 'Warning';
}

interface ClusterFixture {
  pods: Pod[];
  deployments: Deployment[];
  replicaSets: ReplicaSet[];
  services: Service[];
  endpoints: Endpoints[];
  nodes: Node[];
  events: Event[];
  logs: Record<string, Record<string, string>>; // pod -> container -> logs
}

// ============================================================================
// EXECUTOR INTERFACE
// ============================================================================

export interface ExecutorOptions {
  fixtureId: string;
  defaultNamespace: string;
}

export interface ExecutorResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

// ============================================================================
// FIXTURES
// ============================================================================

const FIXTURES: Record<string, ClusterFixture> = {
  crashloop: createCrashloopFixture(),
  imagepull: createImagepullFixture(),
  'service-mismatch': createServiceMismatchFixture(),
  'rollout-regression': createRolloutRegressionFixture(),
  'node-pressure': createNodePressureFixture(),
};

function createCrashloopFixture(): ClusterFixture {
  const ts = '2024-01-15T10:20:00Z';
  return {
    pods: [
      {
        metadata: {
          name: 'payment-api-7d4f8b9c5-x2k9m',
          namespace: 'payments',
          labels: { app: 'payment-api', 'pod-template-hash': '7d4f8b9c5', version: 'v2.1.0' },
          creationTimestamp: ts,
          uid: 'pod-1-uid',
        },
        spec: {
          nodeName: 'worker-1',
          containers: [{ name: 'payment-api', image: 'myregistry/payment-api:v2.1.0', ports: [{ containerPort: 8080 }] }],
        },
        status: {
          phase: 'Running',
          podIP: '10.244.1.15',
          hostIP: '10.0.1.10',
          startTime: ts,
          conditions: [
            { type: 'Initialized', status: 'True', lastTransitionTime: ts },
            { type: 'Ready', status: 'False', lastTransitionTime: ts, reason: 'ContainersNotReady', message: 'containers with unready status: [payment-api]' },
            { type: 'ContainersReady', status: 'False', lastTransitionTime: ts },
            { type: 'PodScheduled', status: 'True', lastTransitionTime: ts },
          ],
          containerStatuses: [{
            name: 'payment-api',
            image: 'myregistry/payment-api:v2.1.0',
            imageID: 'docker-pullable://myregistry/payment-api@sha256:abc123',
            ready: false,
            restartCount: 5,
            state: { waiting: { reason: 'CrashLoopBackOff', message: 'back-off 2m40s restarting failed container' } },
            lastState: { terminated: { exitCode: 1, reason: 'Error', message: 'Container exited with code 1', finishedAt: ts } },
          }],
        },
      },
      {
        metadata: {
          name: 'payment-api-7d4f8b9c5-h8j3n',
          namespace: 'payments',
          labels: { app: 'payment-api', 'pod-template-hash': '7d4f8b9c5', version: 'v2.1.0' },
          creationTimestamp: ts,
          uid: 'pod-2-uid',
        },
        spec: {
          nodeName: 'worker-2',
          containers: [{ name: 'payment-api', image: 'myregistry/payment-api:v2.1.0' }],
        },
        status: {
          phase: 'Running',
          podIP: '10.244.2.22',
          hostIP: '10.0.1.11',
          startTime: ts,
          conditions: [
            { type: 'Ready', status: 'False', lastTransitionTime: ts },
          ],
          containerStatuses: [{
            name: 'payment-api',
            image: 'myregistry/payment-api:v2.1.0',
            imageID: 'docker-pullable://myregistry/payment-api@sha256:abc123',
            ready: false,
            restartCount: 5,
            state: { waiting: { reason: 'CrashLoopBackOff', message: 'back-off 2m40s restarting failed container' } },
            lastState: { terminated: { exitCode: 1, reason: 'Error', finishedAt: ts } },
          }],
        },
      },
      {
        metadata: {
          name: 'payment-db-0',
          namespace: 'payments',
          labels: { app: 'payment-db', 'statefulset.kubernetes.io/pod-name': 'payment-db-0' },
          creationTimestamp: '2024-01-10T10:00:00Z',
          uid: 'pod-3-uid',
        },
        spec: {
          nodeName: 'worker-1',
          containers: [{ name: 'postgres', image: 'postgres:15', ports: [{ containerPort: 5432 }] }],
        },
        status: {
          phase: 'Running',
          podIP: '10.244.1.8',
          hostIP: '10.0.1.10',
          startTime: '2024-01-10T10:00:00Z',
          conditions: [{ type: 'Ready', status: 'True', lastTransitionTime: '2024-01-10T10:00:00Z' }],
          containerStatuses: [{
            name: 'postgres',
            image: 'postgres:15',
            imageID: 'docker-pullable://postgres@sha256:def456',
            ready: true,
            restartCount: 0,
            state: { running: { startedAt: '2024-01-10T10:00:00Z' } },
          }],
        },
      },
    ],
    deployments: [
      {
        metadata: {
          name: 'payment-api',
          namespace: 'payments',
          labels: { app: 'payment-api' },
          creationTimestamp: '2024-01-15T10:20:00Z',
          uid: 'deploy-1-uid',
        },
        spec: {
          replicas: 2,
          selector: { matchLabels: { app: 'payment-api' } },
          template: { metadata: { labels: { app: 'payment-api' } } },
        },
        status: {
          replicas: 2,
          readyReplicas: 0,
          updatedReplicas: 2,
          availableReplicas: 0,
          conditions: [
            { type: 'Available', status: 'False', lastUpdateTime: ts, lastTransitionTime: ts, reason: 'MinimumReplicasUnavailable', message: 'Deployment does not have minimum availability.' },
            { type: 'Progressing', status: 'True', lastUpdateTime: ts, lastTransitionTime: ts, reason: 'ReplicaSetUpdated', message: 'ReplicaSet "payment-api-7d4f8b9c5" has successfully progressed.' },
          ],
        },
        revisions: [
          { revision: 3, image: 'myregistry/payment-api:v2.1.0', changeCause: 'kubectl set image deployment/payment-api payment-api=myregistry/payment-api:v2.1.0' },
          { revision: 2, image: 'myregistry/payment-api:v2.0.0', changeCause: 'kubectl set image deployment/payment-api payment-api=myregistry/payment-api:v2.0.0' },
          { revision: 1, image: 'myregistry/payment-api:v1.9.0', changeCause: 'Initial deployment' },
        ],
      },
    ],
    replicaSets: [
      {
        metadata: { name: 'payment-api-7d4f8b9c5', namespace: 'payments', labels: { app: 'payment-api', 'pod-template-hash': '7d4f8b9c5' }, creationTimestamp: ts, uid: 'rs-1-uid' },
        spec: { replicas: 2, selector: { matchLabels: { app: 'payment-api', 'pod-template-hash': '7d4f8b9c5' } } },
        status: { replicas: 2, readyReplicas: 0, availableReplicas: 0 },
      },
    ],
    services: [
      {
        metadata: { name: 'payment-api', namespace: 'payments', labels: { app: 'payment-api' }, creationTimestamp: '2023-12-15T10:00:00Z', uid: 'svc-1-uid' },
        spec: { type: 'ClusterIP', clusterIP: '10.96.45.12', ports: [{ port: 8080, targetPort: 8080, protocol: 'TCP' }], selector: { app: 'payment-api' } },
      },
      {
        metadata: { name: 'payment-db', namespace: 'payments', labels: { app: 'payment-db' }, creationTimestamp: '2023-12-15T10:00:00Z', uid: 'svc-2-uid' },
        spec: { type: 'ClusterIP', clusterIP: '10.96.45.20', ports: [{ port: 5432, targetPort: 5432, protocol: 'TCP' }], selector: { app: 'payment-db' } },
      },
    ],
    endpoints: [
      { metadata: { name: 'payment-api', namespace: 'payments', creationTimestamp: '2023-12-15T10:00:00Z', uid: 'ep-1-uid' }, subsets: [] },
      { metadata: { name: 'payment-db', namespace: 'payments', creationTimestamp: '2023-12-15T10:00:00Z', uid: 'ep-2-uid' }, subsets: [{ addresses: [{ ip: '10.244.1.8', nodeName: 'worker-1' }], ports: [{ port: 5432, protocol: 'TCP' }] }] },
    ],
    nodes: [
      createNode('worker-1'),
      createNode('worker-2'),
    ],
    events: [
      createEvent('pod', 'payment-api-7d4f8b9c5-x2k9m', 'payments', 'Warning', 'BackOff', 'kubelet', 'Back-off restarting failed container', '2m', 5),
      createEvent('pod', 'payment-api-7d4f8b9c5-h8j3n', 'payments', 'Warning', 'BackOff', 'kubelet', 'Back-off restarting failed container', '2m', 5),
      createEvent('pod', 'payment-api-7d4f8b9c5-x2k9m', 'payments', 'Normal', 'Pulled', 'kubelet', 'Container image "myregistry/payment-api:v2.1.0" already present on machine', '12m', 1),
    ],
    logs: {
      'payment-api-7d4f8b9c5-x2k9m': {
        'payment-api': `2024-01-15T10:23:45.123Z INFO  Starting payment-api v2.1.0
2024-01-15T10:23:45.456Z INFO  Connecting to database...
2024-01-15T10:23:46.789Z ERROR Database connection failed: FATAL: password authentication failed for user "payment_svc"
2024-01-15T10:23:46.790Z ERROR Failed to initialize database pool
2024-01-15T10:23:46.791Z FATAL Application startup failed: DatabaseConnectionError
panic: runtime error: database connection required`,
      },
      'payment-api-7d4f8b9c5-h8j3n': {
        'payment-api': `2024-01-15T10:23:47.123Z INFO  Starting payment-api v2.1.0
2024-01-15T10:23:47.456Z INFO  Connecting to database...
2024-01-15T10:23:48.789Z ERROR Database connection failed: FATAL: password authentication failed for user "payment_svc"
2024-01-15T10:23:48.790Z FATAL Application startup failed`,
      },
    },
  };
}

function createImagepullFixture(): ClusterFixture {
  const ts = '2024-01-15T10:00:00Z';
  return {
    pods: [
      {
        metadata: {
          name: 'frontend-web-5f6d7c8b9-k3m2n',
          namespace: 'frontend',
          labels: { app: 'frontend-web', 'pod-template-hash': '5f6d7c8b9' },
          creationTimestamp: ts,
          uid: 'pod-1-uid',
        },
        spec: {
          nodeName: 'worker-1',
          containers: [{ name: 'frontend', image: 'gcr.io/myproject/frontend:v3.0.0' }],
        },
        status: {
          phase: 'Pending',
          conditions: [{ type: 'Ready', status: 'False', lastTransitionTime: ts }],
          containerStatuses: [{
            name: 'frontend',
            image: 'gcr.io/myproject/frontend:v3.0.0',
            imageID: '',
            ready: false,
            restartCount: 0,
            state: { waiting: { reason: 'ImagePullBackOff', message: 'Back-off pulling image "gcr.io/myproject/frontend:v3.0.0"' } },
          }],
        },
      },
      {
        metadata: {
          name: 'frontend-api-6b7c8d9e0-j4k5l',
          namespace: 'frontend',
          labels: { app: 'frontend-api', 'pod-template-hash': '6b7c8d9e0' },
          creationTimestamp: '2024-01-13T10:00:00Z',
          uid: 'pod-2-uid',
        },
        spec: {
          nodeName: 'worker-1',
          containers: [{ name: 'api', image: 'myregistry/frontend-api:v2.0.0' }],
        },
        status: {
          phase: 'Running',
          podIP: '10.244.1.30',
          conditions: [{ type: 'Ready', status: 'True', lastTransitionTime: '2024-01-13T10:00:00Z' }],
          containerStatuses: [{
            name: 'api',
            image: 'myregistry/frontend-api:v2.0.0',
            imageID: 'docker-pullable://myregistry/frontend-api@sha256:abc',
            ready: true,
            restartCount: 0,
            state: { running: { startedAt: '2024-01-13T10:00:00Z' } },
          }],
        },
      },
    ],
    deployments: [
      {
        metadata: { name: 'frontend-web', namespace: 'frontend', labels: { app: 'frontend-web' }, creationTimestamp: ts, uid: 'deploy-1-uid' },
        spec: { replicas: 1, selector: { matchLabels: { app: 'frontend-web' } }, template: { metadata: { labels: { app: 'frontend-web' } } } },
        status: { replicas: 1, readyReplicas: 0, updatedReplicas: 1, availableReplicas: 0 },
      },
      {
        metadata: { name: 'frontend-api', namespace: 'frontend', labels: { app: 'frontend-api' }, creationTimestamp: '2024-01-13T10:00:00Z', uid: 'deploy-2-uid' },
        spec: { replicas: 1, selector: { matchLabels: { app: 'frontend-api' } }, template: { metadata: { labels: { app: 'frontend-api' } } } },
        status: { replicas: 1, readyReplicas: 1, updatedReplicas: 1, availableReplicas: 1 },
      },
    ],
    replicaSets: [],
    services: [
      {
        metadata: { name: 'frontend-web', namespace: 'frontend', labels: { app: 'frontend-web' }, creationTimestamp: '2023-12-15T10:00:00Z', uid: 'svc-1-uid' },
        spec: { type: 'LoadBalancer', clusterIP: '10.96.100.10', ports: [{ port: 80, targetPort: 80, protocol: 'TCP', nodePort: 31234 }], selector: { app: 'frontend-web' } },
        status: { loadBalancer: { ingress: [{ ip: '34.120.55.80' }] } },
      },
    ],
    endpoints: [
      { metadata: { name: 'frontend-web', namespace: 'frontend', creationTimestamp: '2023-12-15T10:00:00Z', uid: 'ep-1-uid' }, subsets: [] },
    ],
    nodes: [createNode('worker-1')],
    events: [
      createEvent('pod', 'frontend-web-5f6d7c8b9-k3m2n', 'frontend', 'Warning', 'Failed', 'kubelet', 'Failed to pull image "gcr.io/myproject/frontend:v3.0.0": rpc error: code = Unknown desc = Error response from daemon: unauthorized: authentication required', '8m', 3),
      createEvent('pod', 'frontend-web-5f6d7c8b9-k3m2n', 'frontend', 'Warning', 'Failed', 'kubelet', 'Error: ImagePullBackOff', '7m', 1),
      createEvent('pod', 'frontend-web-5f6d7c8b9-k3m2n', 'frontend', 'Normal', 'BackOff', 'kubelet', 'Back-off pulling image "gcr.io/myproject/frontend:v3.0.0"', '5m', 10),
    ],
    logs: {},
  };
}

function createServiceMismatchFixture(): ClusterFixture {
  const ts = '2024-01-15T09:00:00Z';
  return {
    pods: [
      {
        metadata: {
          name: 'api-server-8f9g0h1i2-m5n6o',
          namespace: 'api',
          labels: { app: 'api-server', version: 'v2', 'pod-template-hash': '8f9g0h1i2' },
          creationTimestamp: ts,
          uid: 'pod-1-uid',
        },
        spec: {
          nodeName: 'worker-2',
          containers: [{ name: 'api', image: 'myregistry/api-server:v2.0.0', ports: [{ containerPort: 8080 }] }],
        },
        status: {
          phase: 'Running',
          podIP: '10.244.2.50',
          conditions: [{ type: 'Ready', status: 'True', lastTransitionTime: ts }],
          containerStatuses: [{
            name: 'api',
            image: 'myregistry/api-server:v2.0.0',
            imageID: 'docker-pullable://myregistry/api-server@sha256:abc',
            ready: true,
            restartCount: 0,
            state: { running: { startedAt: ts } },
          }],
        },
      },
      {
        metadata: {
          name: 'api-server-8f9g0h1i2-p7q8r',
          namespace: 'api',
          labels: { app: 'api-server', version: 'v2', 'pod-template-hash': '8f9g0h1i2' },
          creationTimestamp: ts,
          uid: 'pod-2-uid',
        },
        spec: {
          nodeName: 'worker-1',
          containers: [{ name: 'api', image: 'myregistry/api-server:v2.0.0', ports: [{ containerPort: 8080 }] }],
        },
        status: {
          phase: 'Running',
          podIP: '10.244.1.51',
          conditions: [{ type: 'Ready', status: 'True', lastTransitionTime: ts }],
          containerStatuses: [{
            name: 'api',
            image: 'myregistry/api-server:v2.0.0',
            imageID: 'docker-pullable://myregistry/api-server@sha256:abc',
            ready: true,
            restartCount: 0,
            state: { running: { startedAt: ts } },
          }],
        },
      },
    ],
    deployments: [
      {
        metadata: { name: 'api-server', namespace: 'api', labels: { app: 'api-server' }, creationTimestamp: ts, uid: 'deploy-1-uid' },
        spec: { replicas: 2, selector: { matchLabels: { app: 'api-server', version: 'v2' } }, template: { metadata: { labels: { app: 'api-server', version: 'v2' } } } },
        status: { replicas: 2, readyReplicas: 2, updatedReplicas: 2, availableReplicas: 2 },
      },
    ],
    replicaSets: [],
    services: [
      {
        metadata: { name: 'api-server', namespace: 'api', labels: { app: 'api-server' }, creationTimestamp: '2023-12-15T10:00:00Z', uid: 'svc-1-uid' },
        spec: {
          type: 'ClusterIP',
          clusterIP: '10.96.200.15',
          ports: [{ port: 8080, targetPort: 8080, protocol: 'TCP' }],
          selector: { app: 'api-server', version: 'v1' }, // Mismatch! Pods have version: v2
        },
      },
    ],
    endpoints: [
      { metadata: { name: 'api-server', namespace: 'api', creationTimestamp: '2023-12-15T10:00:00Z', uid: 'ep-1-uid' }, subsets: [] },
    ],
    nodes: [
      createNode('worker-1'),
      createNode('worker-2'),
    ],
    events: [],
    logs: {
      'api-server-8f9g0h1i2-m5n6o': {
        'api': `2024-01-15T09:00:00.000Z INFO  API server started on :8080
2024-01-15T09:00:01.000Z INFO  Health check endpoint ready
2024-01-15T09:00:02.000Z INFO  Connected to database`,
      },
    },
  };
}

function createRolloutRegressionFixture(): ClusterFixture {
  const ts = '2024-01-15T14:30:00Z';
  return {
    pods: [
      {
        metadata: {
          name: 'web-7a8b9c0d1-e2f3g',
          namespace: 'production',
          labels: { app: 'web', version: 'v4.2.0', 'pod-template-hash': '7a8b9c0d1' },
          creationTimestamp: ts,
          uid: 'pod-1-uid',
        },
        spec: {
          nodeName: 'worker-1',
          containers: [{ name: 'web', image: 'myregistry/web:v4.2.0', ports: [{ containerPort: 8080 }] }],
        },
        status: {
          phase: 'Running',
          podIP: '10.244.1.100',
          conditions: [{ type: 'Ready', status: 'True', lastTransitionTime: ts }],
          containerStatuses: [{
            name: 'web',
            image: 'myregistry/web:v4.2.0',
            imageID: 'docker-pullable://myregistry/web@sha256:v420',
            ready: true,
            restartCount: 0,
            state: { running: { startedAt: ts } },
          }],
        },
      },
      {
        metadata: {
          name: 'web-7a8b9c0d1-h4i5j',
          namespace: 'production',
          labels: { app: 'web', version: 'v4.2.0', 'pod-template-hash': '7a8b9c0d1' },
          creationTimestamp: ts,
          uid: 'pod-2-uid',
        },
        spec: {
          nodeName: 'worker-2',
          containers: [{ name: 'web', image: 'myregistry/web:v4.2.0', ports: [{ containerPort: 8080 }] }],
        },
        status: {
          phase: 'Running',
          podIP: '10.244.2.101',
          conditions: [{ type: 'Ready', status: 'True', lastTransitionTime: ts }],
          containerStatuses: [{
            name: 'web',
            image: 'myregistry/web:v4.2.0',
            imageID: 'docker-pullable://myregistry/web@sha256:v420',
            ready: true,
            restartCount: 0,
            state: { running: { startedAt: ts } },
          }],
        },
      },
    ],
    deployments: [
      {
        metadata: { name: 'web', namespace: 'production', labels: { app: 'web' }, creationTimestamp: '2023-10-15T10:00:00Z', uid: 'deploy-1-uid' },
        spec: { replicas: 2, selector: { matchLabels: { app: 'web' } }, template: { metadata: { labels: { app: 'web' } } } },
        status: {
          replicas: 2,
          readyReplicas: 2,
          updatedReplicas: 2,
          availableReplicas: 2,
          conditions: [
            { type: 'Available', status: 'True', lastUpdateTime: ts, lastTransitionTime: ts, reason: 'MinimumReplicasAvailable', message: 'Deployment has minimum availability.' },
            { type: 'Progressing', status: 'True', lastUpdateTime: ts, lastTransitionTime: ts, reason: 'NewReplicaSetAvailable', message: 'ReplicaSet "web-7a8b9c0d1" has successfully progressed.' },
          ],
        },
        revisions: [
          { revision: 5, image: 'myregistry/web:v4.2.0', changeCause: 'kubectl set image deployment/web web=myregistry/web:v4.2.0' },
          { revision: 4, image: 'myregistry/web:v4.1.0', changeCause: 'kubectl set image deployment/web web=myregistry/web:v4.1.0' },
          { revision: 3, image: 'myregistry/web:v4.0.0', changeCause: 'kubectl set image deployment/web web=myregistry/web:v4.0.0' },
        ],
      },
    ],
    replicaSets: [
      {
        metadata: { name: 'web-7a8b9c0d1', namespace: 'production', labels: { app: 'web', 'pod-template-hash': '7a8b9c0d1' }, creationTimestamp: ts, uid: 'rs-1-uid' },
        spec: { replicas: 2, selector: { matchLabels: { app: 'web', 'pod-template-hash': '7a8b9c0d1' } } },
        status: { replicas: 2, readyReplicas: 2, availableReplicas: 2 },
      },
      {
        metadata: { name: 'web-6z9y8x7w6', namespace: 'production', labels: { app: 'web', 'pod-template-hash': '6z9y8x7w6' }, creationTimestamp: '2024-01-14T10:00:00Z', uid: 'rs-2-uid' },
        spec: { replicas: 0, selector: { matchLabels: { app: 'web', 'pod-template-hash': '6z9y8x7w6' } } },
        status: { replicas: 0, readyReplicas: 0, availableReplicas: 0 },
      },
    ],
    services: [
      {
        metadata: { name: 'web', namespace: 'production', labels: { app: 'web' }, creationTimestamp: '2023-10-15T10:00:00Z', uid: 'svc-1-uid' },
        spec: { type: 'LoadBalancer', clusterIP: '10.96.50.50', ports: [{ port: 443, targetPort: 8080, protocol: 'TCP', nodePort: 32000 }], selector: { app: 'web' } },
        status: { loadBalancer: { ingress: [{ ip: '35.200.100.50' }] } },
      },
    ],
    endpoints: [
      {
        metadata: { name: 'web', namespace: 'production', creationTimestamp: '2023-10-15T10:00:00Z', uid: 'ep-1-uid' },
        subsets: [{ addresses: [{ ip: '10.244.1.100' }, { ip: '10.244.2.101' }], ports: [{ port: 8080, protocol: 'TCP' }] }],
      },
    ],
    nodes: [
      createNode('worker-1'),
      createNode('worker-2'),
    ],
    events: [
      createEvent('deployment', 'web', 'production', 'Normal', 'ScalingReplicaSet', 'deployment-controller', 'Scaled up replica set web-7a8b9c0d1 to 2', '5m', 1),
    ],
    logs: {
      'web-7a8b9c0d1-e2f3g': {
        'web': `2024-01-15T14:30:00.000Z INFO  Starting web v4.2.0
2024-01-15T14:30:01.000Z INFO  Server listening on :8080
2024-01-15T14:30:15.000Z ERROR TypeError: Cannot read property 'userId' of undefined
2024-01-15T14:30:15.001Z ERROR     at handleCheckout (/app/routes/checkout.js:42)
2024-01-15T14:30:16.000Z ERROR TypeError: Cannot read property 'userId' of undefined
2024-01-15T14:30:20.000Z WARN  Error rate exceeds threshold: 45%`,
      },
      'web-7a8b9c0d1-h4i5j': {
        'web': `2024-01-15T14:30:00.000Z INFO  Starting web v4.2.0
2024-01-15T14:30:01.000Z INFO  Server listening on :8080
2024-01-15T14:30:18.000Z ERROR TypeError: Cannot read property 'userId' of undefined
2024-01-15T14:30:22.000Z WARN  Error rate exceeds threshold: 42%`,
      },
    },
  };
}

function createNodePressureFixture(): ClusterFixture {
  const ts = '2024-01-15T09:30:00Z';
  return {
    pods: [
      {
        metadata: {
          name: 'worker-job-a1b2c3d4',
          namespace: 'default',
          labels: { job: 'worker', 'batch.kubernetes.io/job-name': 'worker-job' },
          creationTimestamp: '2024-01-15T09:00:00Z',
          uid: 'pod-1-uid',
        },
        spec: {
          nodeName: 'worker-3',
          containers: [{ name: 'worker', image: 'myregistry/worker:latest' }],
        },
        status: {
          phase: 'Failed',
          conditions: [{ type: 'Ready', status: 'False', lastTransitionTime: ts, reason: 'PodFailed' }],
          containerStatuses: [{
            name: 'worker',
            image: 'myregistry/worker:latest',
            imageID: 'docker-pullable://myregistry/worker@sha256:abc',
            ready: false,
            restartCount: 0,
            state: { terminated: { exitCode: 137, reason: 'OOMKilled', message: 'Container was OOM killed', finishedAt: ts } },
          }],
        },
      },
      {
        metadata: {
          name: 'cache-redis-0',
          namespace: 'default',
          labels: { app: 'cache-redis', 'statefulset.kubernetes.io/pod-name': 'cache-redis-0' },
          creationTimestamp: '2024-01-13T10:00:00Z',
          uid: 'pod-2-uid',
        },
        spec: {
          nodeName: 'worker-3',
          containers: [{ name: 'redis', image: 'redis:7', ports: [{ containerPort: 6379 }] }],
        },
        status: {
          phase: 'Running',
          podIP: '10.244.3.10',
          conditions: [{ type: 'Ready', status: 'True', lastTransitionTime: '2024-01-13T10:00:00Z' }],
          containerStatuses: [{
            name: 'redis',
            image: 'redis:7',
            imageID: 'docker-pullable://redis@sha256:abc',
            ready: true,
            restartCount: 2,
            state: { running: { startedAt: ts } },
          }],
        },
      },
    ],
    deployments: [],
    replicaSets: [],
    services: [],
    endpoints: [],
    nodes: [
      createNode('worker-1'),
      createNode('worker-2'),
      createNodeWithPressure('worker-3'),
    ],
    events: [
      createEvent('pod', 'worker-job-a1b2c3d4', 'default', 'Warning', 'Evicted', 'kubelet', 'The node was low on resource: memory. Container worker was using 1.8Gi, which exceeds its request of 512Mi.', '10m', 1),
      createEvent('node', 'worker-3', '', 'Warning', 'NodeHasDiskPressure', 'node-controller', 'Node worker-3 status is now: NodeHasDiskPressure', '15m', 1),
      createEvent('node', 'worker-3', '', 'Warning', 'NodeHasMemoryPressure', 'node-controller', 'Node worker-3 status is now: NodeHasMemoryPressure', '20m', 1),
    ],
    logs: {},
  };
}

function createNode(name: string): Node {
  return {
    metadata: { name, labels: { 'kubernetes.io/hostname': name, 'node.kubernetes.io/instance-type': 'm5.large' }, creationTimestamp: '2023-12-01T10:00:00Z', uid: `node-${name}-uid` },
    spec: {},
    status: {
      conditions: [
        { type: 'MemoryPressure', status: 'False', lastHeartbeatTime: '2024-01-15T10:00:00Z', lastTransitionTime: '2023-12-01T10:00:00Z', reason: 'KubeletHasSufficientMemory', message: 'kubelet has sufficient memory available' },
        { type: 'DiskPressure', status: 'False', lastHeartbeatTime: '2024-01-15T10:00:00Z', lastTransitionTime: '2023-12-01T10:00:00Z', reason: 'KubeletHasNoDiskPressure', message: 'kubelet has no disk pressure' },
        { type: 'PIDPressure', status: 'False', lastHeartbeatTime: '2024-01-15T10:00:00Z', lastTransitionTime: '2023-12-01T10:00:00Z', reason: 'KubeletHasSufficientPID', message: 'kubelet has sufficient PID available' },
        { type: 'Ready', status: 'True', lastHeartbeatTime: '2024-01-15T10:00:00Z', lastTransitionTime: '2023-12-01T10:00:00Z', reason: 'KubeletReady', message: 'kubelet is posting ready status' },
      ],
      addresses: [
        { type: 'InternalIP', address: `10.0.1.${10 + parseInt(name.replace('worker-', ''))}` },
        { type: 'Hostname', address: name },
      ],
      capacity: { cpu: '4', memory: '16Gi', pods: '110' },
      allocatable: { cpu: '3920m', memory: '15Gi', pods: '110' },
      nodeInfo: { kubeletVersion: 'v1.28.2', osImage: 'Ubuntu 22.04.3 LTS', kernelVersion: '5.15.0-1052-aws', containerRuntimeVersion: 'containerd://1.6.24' },
    },
  };
}

function createNodeWithPressure(name: string): Node {
  const node = createNode(name);
  node.spec.unschedulable = true;
  node.spec.taints = [{ key: 'node.kubernetes.io/unschedulable', effect: 'NoSchedule' }];
  node.status.conditions = [
    { type: 'MemoryPressure', status: 'True', lastHeartbeatTime: '2024-01-15T10:00:00Z', lastTransitionTime: '2024-01-15T09:40:00Z', reason: 'KubeletHasInsufficientMemory', message: 'kubelet has insufficient memory available' },
    { type: 'DiskPressure', status: 'True', lastHeartbeatTime: '2024-01-15T10:00:00Z', lastTransitionTime: '2024-01-15T09:45:00Z', reason: 'KubeletHasDiskPressure', message: 'kubelet has disk pressure' },
    { type: 'PIDPressure', status: 'False', lastHeartbeatTime: '2024-01-15T10:00:00Z', lastTransitionTime: '2023-12-01T10:00:00Z', reason: 'KubeletHasSufficientPID', message: 'kubelet has sufficient PID available' },
    { type: 'Ready', status: 'True', lastHeartbeatTime: '2024-01-15T10:00:00Z', lastTransitionTime: '2023-12-01T10:00:00Z', reason: 'KubeletReady', message: 'kubelet is posting ready status' },
  ];
  node.status.allocatable = { cpu: '3920m', memory: '8Gi', pods: '110' };
  return node;
}

function createEvent(kind: string, name: string, namespace: string, type: 'Normal' | 'Warning', reason: string, component: string, message: string, age: string, count: number): Event {
  return {
    metadata: { name: `${name}.${Date.now().toString(36)}`, namespace: namespace || 'default', creationTimestamp: '2024-01-15T10:00:00Z', uid: `event-${name}-${reason}-uid` },
    involvedObject: { kind: kind.charAt(0).toUpperCase() + kind.slice(1), name, namespace: namespace || undefined, uid: `${kind}-${name}-uid` },
    reason,
    message,
    source: { component },
    firstTimestamp: '2024-01-15T10:00:00Z',
    lastTimestamp: '2024-01-15T10:00:00Z',
    count,
    type,
  };
}

// ============================================================================
// SESSION STATE - mutable fixture state for rollout undo
// ============================================================================

let sessionState: { fixtureId: string; fixture: ClusterFixture } | null = null;

function getFixtureState(fixtureId: string): ClusterFixture {
  if (sessionState && sessionState.fixtureId === fixtureId) {
    return sessionState.fixture;
  }
  const original = FIXTURES[fixtureId];
  if (!original) {
    throw new Error(`Unknown fixture: ${fixtureId}`);
  }
  // Deep clone for session
  sessionState = { fixtureId, fixture: JSON.parse(JSON.stringify(original)) };
  return sessionState.fixture;
}

export function resetFixture(fixtureId: string): void {
  const original = FIXTURES[fixtureId];
  if (original) {
    sessionState = { fixtureId, fixture: JSON.parse(JSON.stringify(original)) };
  }
}

// ============================================================================
// COMMAND PARSER
// ============================================================================

interface ParsedCommand {
  verb: string;
  resources: string[];
  name?: string;
  namespace?: string;
  allNamespaces: boolean;
  output?: string;
  labelSelector?: Record<string, string>;
  fieldSelector?: Record<string, string>;
  container?: string;
  tail?: number;
  since?: string;
  follow: boolean;
  sortBy?: string;
  showLabels: boolean;
  watch: boolean;
  previous: boolean;
  help: boolean;
}

function parseCommand(command: string): ParsedCommand {
  const result: ParsedCommand = {
    verb: '',
    resources: [],
    allNamespaces: false,
    follow: false,
    showLabels: false,
    watch: false,
    previous: false,
    help: false,
  };

  // Tokenize respecting quotes
  const tokens: string[] = [];
  let current = '';
  let inQuote = false;
  let quoteChar = '';

  for (const char of command) {
    if ((char === '"' || char === "'") && !inQuote) {
      inQuote = true;
      quoteChar = char;
    } else if (char === quoteChar && inQuote) {
      inQuote = false;
      quoteChar = '';
    } else if (char === ' ' && !inQuote) {
      if (current) {
        tokens.push(current);
        current = '';
      }
    } else {
      current += char;
    }
  }
  if (current) tokens.push(current);

  // Skip 'kubectl' if present
  let i = 0;
  if (tokens[i] === 'kubectl') i++;

  result.verb = tokens[i] || '';
  i++;

  // Parse resource and name
  while (i < tokens.length && !tokens[i].startsWith('-')) {
    const token = tokens[i];

    // Check for resource/name format
    if (token.includes('/')) {
      const [res, name] = token.split('/');
      if (!result.resources.length || result.verb === 'logs') {
        result.resources.push(res);
        result.name = name;
      } else {
        result.name = name;
      }
    } else if (token.includes(',')) {
      // Multi-resource: svc,endpoints
      result.resources.push(...token.split(','));
    } else if (!result.resources.length) {
      result.resources.push(token);
    } else if (!result.name) {
      result.name = token;
    }
    i++;
  }

  // Parse flags
  while (i < tokens.length) {
    const flag = tokens[i];

    // Handle --flag=value format
    if (flag.includes('=')) {
      const [key, value] = flag.split('=');
      switch (key) {
        case '--namespace':
        case '-n':
          result.namespace = value;
          break;
        case '--output':
        case '-o':
          result.output = value;
          break;
        case '--selector':
        case '-l':
          result.labelSelector = parseLabelSelector(value);
          break;
        case '--field-selector':
          result.fieldSelector = parseLabelSelector(value);
          break;
        case '--container':
        case '-c':
          result.container = value;
          break;
        case '--tail':
          result.tail = parseInt(value, 10);
          break;
        case '--since':
          result.since = value;
          break;
        case '--sort-by':
          result.sortBy = value;
          break;
      }
    } else {
      // Handle -n ns, -o wide, etc.
      switch (flag) {
        case '-n':
        case '--namespace':
          result.namespace = tokens[++i];
          break;
        case '-A':
        case '--all-namespaces':
          result.allNamespaces = true;
          break;
        case '-o':
        case '--output':
          result.output = tokens[++i];
          break;
        case '-l':
        case '--selector':
          result.labelSelector = parseLabelSelector(tokens[++i]);
          break;
        case '--field-selector':
          result.fieldSelector = parseLabelSelector(tokens[++i]);
          break;
        case '-c':
        case '--container':
          result.container = tokens[++i];
          break;
        case '--tail':
          result.tail = parseInt(tokens[++i], 10);
          break;
        case '--since':
          result.since = tokens[++i];
          break;
        case '-f':
        case '--follow':
          result.follow = true;
          break;
        case '--sort-by':
          result.sortBy = tokens[++i];
          break;
        case '--show-labels':
          result.showLabels = true;
          break;
        case '-w':
        case '--watch':
          result.watch = true;
          break;
        case '-p':
        case '--previous':
          result.previous = true;
          break;
        case '-h':
        case '--help':
          result.help = true;
          break;
        default:
          // Handle short form like -owide, -ndefault
          if (flag.startsWith('-o')) {
            result.output = flag.slice(2);
          } else if (flag.startsWith('-n') && flag.length > 2) {
            result.namespace = flag.slice(2);
          } else if (flag.startsWith('-l') && flag.length > 2) {
            result.labelSelector = parseLabelSelector(flag.slice(2));
          } else if (flag.startsWith('-c') && flag.length > 2) {
            result.container = flag.slice(2);
          }
      }
    }
    i++;
  }

  return result;
}

function parseLabelSelector(selector: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const part of selector.split(',')) {
    const [key, value] = part.split('=');
    if (key && value !== undefined) {
      result[key.trim()] = value.trim();
    }
  }
  return result;
}

function matchesLabels(labels: Record<string, string> | undefined, selector: Record<string, string>): boolean {
  if (!labels) return false;
  return Object.entries(selector).every(([key, value]) => labels[key] === value);
}

// ============================================================================
// OUTPUT FORMATTERS
// ============================================================================

function formatAge(timestamp: string): string {
  // In real kubectl, this would be dynamic. For fixtures, we use predetermined ages.
  const ages: Record<string, string> = {
    '2024-01-15T10:20:00Z': '12m',
    '2024-01-15T10:00:00Z': '8m',
    '2024-01-15T09:00:00Z': '1h',
    '2024-01-15T14:30:00Z': '5m',
    '2024-01-15T09:30:00Z': '30m',
    '2024-01-10T10:00:00Z': '5d',
    '2024-01-13T10:00:00Z': '2d',
    '2023-12-15T10:00:00Z': '30d',
    '2023-12-01T10:00:00Z': '45d',
    '2023-10-15T10:00:00Z': '90d',
  };
  return ages[timestamp] || '1d';
}

function getPodStatus(pod: Pod): string {
  const cs = pod.status.containerStatuses?.[0];
  if (cs?.state.waiting) return cs.state.waiting.reason || 'Waiting';
  if (cs?.state.terminated) {
    if (cs.state.terminated.reason === 'OOMKilled') return 'OOMKilled';
    return cs.state.terminated.reason || 'Terminated';
  }
  if (pod.status.phase === 'Failed') return 'Error';
  return pod.status.phase;
}

function getPodReady(pod: Pod): string {
  const total = pod.spec.containers.length;
  const ready = pod.status.containerStatuses?.filter(c => c.ready).length || 0;
  return `${ready}/${total}`;
}

function getPodRestarts(pod: Pod): number {
  return pod.status.containerStatuses?.reduce((sum, c) => sum + c.restartCount, 0) || 0;
}

function formatPodTable(pods: Pod[], wide: boolean, showLabels: boolean, allNs: boolean): string {
  if (pods.length === 0) return 'No resources found.';

  let header = allNs ? 'NAMESPACE     ' : '';
  header += 'NAME                                   READY   STATUS             RESTARTS   AGE';
  if (wide) header += '     IP            NODE';
  if (showLabels) header += '   LABELS';

  const rows = pods.map(p => {
    let row = allNs ? `${(p.metadata.namespace || 'default').padEnd(13)} ` : '';
    row += `${p.metadata.name.padEnd(39)} ${getPodReady(p).padEnd(7)} ${getPodStatus(p).padEnd(18)} ${String(getPodRestarts(p)).padEnd(10)} ${formatAge(p.metadata.creationTimestamp)}`;
    if (wide) {
      row += `     ${(p.status.podIP || '<none>').padEnd(13)} ${p.spec.nodeName || '<none>'}`;
    }
    if (showLabels) {
      const labels = p.metadata.labels ? Object.entries(p.metadata.labels).map(([k, v]) => `${k}=${v}`).join(',') : '<none>';
      row += `   ${labels}`;
    }
    return row;
  });

  return [header, ...rows].join('\n');
}

function formatDeploymentTable(deployments: Deployment[], allNs: boolean): string {
  if (deployments.length === 0) return 'No resources found.';

  let header = allNs ? 'NAMESPACE     ' : '';
  header += 'NAME                    READY   UP-TO-DATE   AVAILABLE   AGE';

  const rows = deployments.map(d => {
    const ready = `${d.status.readyReplicas || 0}/${d.spec.replicas}`;
    let row = allNs ? `${(d.metadata.namespace || 'default').padEnd(13)} ` : '';
    row += `${d.metadata.name.padEnd(23)} ${ready.padEnd(7)} ${String(d.status.updatedReplicas || 0).padEnd(12)} ${String(d.status.availableReplicas || 0).padEnd(11)} ${formatAge(d.metadata.creationTimestamp)}`;
    return row;
  });

  return [header, ...rows].join('\n');
}

function formatReplicaSetTable(replicaSets: ReplicaSet[], allNs: boolean): string {
  if (replicaSets.length === 0) return 'No resources found.';

  let header = allNs ? 'NAMESPACE     ' : '';
  header += 'NAME                    DESIRED   CURRENT   READY   AGE';

  const rows = replicaSets.map(rs => {
    let row = allNs ? `${(rs.metadata.namespace || 'default').padEnd(13)} ` : '';
    row += `${rs.metadata.name.padEnd(23)} ${String(rs.spec.replicas).padEnd(9)} ${String(rs.status.replicas).padEnd(9)} ${String(rs.status.readyReplicas || 0).padEnd(7)} ${formatAge(rs.metadata.creationTimestamp)}`;
    return row;
  });

  return [header, ...rows].join('\n');
}

function formatServiceTable(services: Service[], allNs: boolean): string {
  if (services.length === 0) return 'No resources found.';

  let header = allNs ? 'NAMESPACE     ' : '';
  header += 'NAME                TYPE           CLUSTER-IP      EXTERNAL-IP     PORT(S)          AGE';

  const rows = services.map(s => {
    const externalIP = s.status?.loadBalancer?.ingress?.[0]?.ip || (s.spec.externalIPs?.[0]) || '<none>';
    const ports = s.spec.ports.map(p => p.nodePort ? `${p.port}:${p.nodePort}/${p.protocol}` : `${p.port}/${p.protocol}`).join(',');
    let row = allNs ? `${(s.metadata.namespace || 'default').padEnd(13)} ` : '';
    row += `${s.metadata.name.padEnd(19)} ${s.spec.type.padEnd(14)} ${s.spec.clusterIP.padEnd(15)} ${externalIP.padEnd(15)} ${ports.padEnd(16)} ${formatAge(s.metadata.creationTimestamp)}`;
    return row;
  });

  return [header, ...rows].join('\n');
}

function formatEndpointsTable(endpoints: Endpoints[], allNs: boolean): string {
  if (endpoints.length === 0) return 'No resources found.';

  let header = allNs ? 'NAMESPACE     ' : '';
  header += 'NAME                ENDPOINTS                      AGE';

  const rows = endpoints.map(e => {
    const eps = e.subsets?.flatMap(s =>
      (s.addresses || []).flatMap(a =>
        (s.ports || []).map(p => `${a.ip}:${p.port}`)
      )
    ).join(',') || '<none>';
    let row = allNs ? `${(e.metadata.namespace || 'default').padEnd(13)} ` : '';
    row += `${e.metadata.name.padEnd(19)} ${eps.slice(0, 30).padEnd(30)} ${formatAge(e.metadata.creationTimestamp)}`;
    return row;
  });

  return [header, ...rows].join('\n');
}

function formatNodeTable(nodes: Node[]): string {
  if (nodes.length === 0) return 'No resources found.';

  const header = 'NAME         STATUS                     ROLES    AGE    VERSION';
  const rows = nodes.map(n => {
    const readyCond = n.status.conditions.find(c => c.type === 'Ready');
    let status = readyCond?.status === 'True' ? 'Ready' : 'NotReady';
    if (n.spec.unschedulable) status += ',SchedulingDisabled';
    const memPressure = n.status.conditions.find(c => c.type === 'MemoryPressure' && c.status === 'True');
    const diskPressure = n.status.conditions.find(c => c.type === 'DiskPressure' && c.status === 'True');
    if (memPressure) status = status.replace('Ready', 'Ready,MemoryPressure');
    if (diskPressure) status = status.replace('Ready', 'Ready,DiskPressure');

    const roles = n.metadata.labels?.['node-role.kubernetes.io/control-plane'] ? 'control-plane' : '<none>';
    return `${n.metadata.name.padEnd(12)} ${status.padEnd(26)} ${roles.padEnd(8)} ${formatAge(n.metadata.creationTimestamp).padEnd(6)} ${n.status.nodeInfo.kubeletVersion}`;
  });

  return [header, ...rows].join('\n');
}

function formatEventsTable(events: Event[], allNs: boolean): string {
  if (events.length === 0) return 'No events found.';

  let header = allNs ? 'NAMESPACE     ' : '';
  header += 'LAST SEEN   TYPE      REASON                  OBJECT                                MESSAGE';

  const rows = events.map(e => {
    const obj = `${e.involvedObject.kind.toLowerCase()}/${e.involvedObject.name}`;
    let row = allNs ? `${(e.metadata.namespace || 'default').padEnd(13)} ` : '';
    row += `${formatAge(e.lastTimestamp).padEnd(11)} ${e.type.padEnd(9)} ${e.reason.padEnd(23)} ${obj.padEnd(37)} ${e.message.slice(0, 50)}`;
    return row;
  });

  return [header, ...rows].join('\n');
}

function formatPodDescribe(pod: Pod, events: Event[]): string {
  const cs = pod.status.containerStatuses?.[0];
  const container = pod.spec.containers[0];
  const podEvents = events.filter(e => e.involvedObject.name === pod.metadata.name && e.involvedObject.kind === 'Pod');

  const stateInfo = cs?.state.waiting
    ? `Waiting\n      Reason:       ${cs.state.waiting.reason}\n      Message:      ${cs.state.waiting.message || ''}`
    : cs?.state.running
    ? `Running\n      Started:      ${cs.state.running.startedAt}`
    : cs?.state.terminated
    ? `Terminated\n      Reason:       ${cs.state.terminated.reason}\n      Exit Code:    ${cs.state.terminated.exitCode}\n      Message:      ${cs.state.terminated.message || ''}`
    : 'Unknown';

  const lastStateInfo = cs?.lastState?.terminated
    ? `Terminated\n      Reason:       ${cs.lastState.terminated.reason}\n      Exit Code:    ${cs.lastState.terminated.exitCode}\n      Finished:     ${cs.lastState.terminated.finishedAt}`
    : '<none>';

  const conditions = pod.status.conditions?.map(c =>
    `  ${c.type.padEnd(20)} ${c.status}`
  ).join('\n') || '  <none>';

  const eventLines = podEvents.length > 0
    ? podEvents.map(e => `  ${e.type.padEnd(9)} ${e.reason.padEnd(20)} ${formatAge(e.lastTimestamp).padEnd(8)} ${e.source.component.padEnd(25)} ${e.message}`).join('\n')
    : '  <none>';

  return `Name:             ${pod.metadata.name}
Namespace:        ${pod.metadata.namespace || 'default'}
Priority:         0
Service Account:  default
Node:             ${pod.spec.nodeName || '<none>'}/${pod.status.podIP || '<none>'}
Start Time:       ${pod.status.startTime || '<unknown>'}
Labels:           ${pod.metadata.labels ? Object.entries(pod.metadata.labels).map(([k, v]) => `${k}=${v}`).join('\n                  ') : '<none>'}
Status:           ${pod.status.phase}
IP:               ${pod.status.podIP || '<none>'}
Controlled By:    ReplicaSet/${pod.metadata.name.split('-').slice(0, -1).join('-')}
Containers:
  ${container.name}:
    Container ID:   docker://${pod.metadata.uid.slice(0, 12)}
    Image:          ${container.image}
    Image ID:       ${cs?.imageID || 'docker-pullable://' + container.image}
    Port:           ${container.ports?.[0]?.containerPort || '<none>'}/TCP
    Host Port:      0/TCP
    State:          ${stateInfo}
    Last State:     ${lastStateInfo}
    Ready:          ${cs?.ready || false}
    Restart Count:  ${cs?.restartCount || 0}
Conditions:
  Type              Status
${conditions}
Events:
${eventLines}`;
}

function formatDeploymentDescribe(deployment: Deployment, replicaSets: ReplicaSet[]): string {
  const selector = Object.entries(deployment.spec.selector.matchLabels).map(([k, v]) => `${k}=${v}`).join(',');
  const conditions = deployment.status.conditions?.map(c =>
    `  ${c.type.padEnd(15)} ${c.status.padEnd(7)} ${c.reason}`
  ).join('\n') || '  <none>';

  const newRS = replicaSets.find(rs => rs.status.replicas > 0);
  const oldRS = replicaSets.filter(rs => rs.status.replicas === 0);

  return `Name:                   ${deployment.metadata.name}
Namespace:              ${deployment.metadata.namespace || 'default'}
CreationTimestamp:      ${deployment.metadata.creationTimestamp}
Labels:                 ${deployment.metadata.labels ? Object.entries(deployment.metadata.labels).map(([k, v]) => `${k}=${v}`).join(',') : '<none>'}
Annotations:            deployment.kubernetes.io/revision: ${deployment.revisions?.length || 1}
Selector:               ${selector}
Replicas:               ${deployment.spec.replicas} desired | ${deployment.status.updatedReplicas || 0} updated | ${deployment.status.replicas || 0} total | ${deployment.status.availableReplicas || 0} available | ${(deployment.spec.replicas || 0) - (deployment.status.availableReplicas || 0)} unavailable
StrategyType:           RollingUpdate
MinReadySeconds:        0
RollingUpdateStrategy:  25% max unavailable, 25% max surge
Pod Template:
  Labels:  ${Object.entries(deployment.spec.template.metadata.labels).map(([k, v]) => `${k}=${v}`).join(',')}
Conditions:
  Type           Status  Reason
${conditions}
OldReplicaSets:  ${oldRS.length > 0 ? oldRS.map(rs => `${rs.metadata.name} (${rs.status.replicas}/${rs.spec.replicas} replicas created)`).join(', ') : '<none>'}
NewReplicaSet:   ${newRS ? `${newRS.metadata.name} (${newRS.status.replicas}/${newRS.spec.replicas} replicas created)` : '<none>'}
Events:          <none>`;
}

function formatNodeDescribe(node: Node): string {
  const conditions = node.status.conditions.map(c =>
    `  ${c.type.padEnd(20)} ${c.status.padEnd(9)} ${c.lastHeartbeatTime}   ${c.reason.padEnd(30)} ${c.message}`
  ).join('\n');

  const taints = node.spec.taints?.map(t => `${t.key}=${t.value || ''}:${t.effect}`).join('\n                    ') || '<none>';

  return `Name:               ${node.metadata.name}
Roles:              ${node.metadata.labels?.['node-role.kubernetes.io/control-plane'] ? 'control-plane' : '<none>'}
Labels:             ${Object.entries(node.metadata.labels || {}).map(([k, v]) => `${k}=${v}`).join('\n                    ')}
Annotations:        node.alpha.kubernetes.io/ttl: 0
CreationTimestamp:  ${node.metadata.creationTimestamp}
Taints:             ${taints}
Unschedulable:      ${node.spec.unschedulable || false}
Conditions:
  Type                 Status    LastHeartbeatTime                 Reason                         Message
${conditions}
Addresses:
  InternalIP:  ${node.status.addresses.find(a => a.type === 'InternalIP')?.address || '<none>'}
  Hostname:    ${node.status.addresses.find(a => a.type === 'Hostname')?.address || node.metadata.name}
Capacity:
  cpu:                ${node.status.capacity.cpu}
  memory:             ${node.status.capacity.memory}
  pods:               ${node.status.capacity.pods}
Allocatable:
  cpu:                ${node.status.allocatable.cpu}
  memory:             ${node.status.allocatable.memory}
  pods:               ${node.status.allocatable.pods}
System Info:
  Kernel Version:             ${node.status.nodeInfo.kernelVersion}
  OS Image:                   ${node.status.nodeInfo.osImage}
  Container Runtime Version:  ${node.status.nodeInfo.containerRuntimeVersion}
  Kubelet Version:            ${node.status.nodeInfo.kubeletVersion}`;
}

function formatServiceDescribe(service: Service, endpoints: Endpoints | undefined): string {
  const selector = service.spec.selector ? Object.entries(service.spec.selector).map(([k, v]) => `${k}=${v}`).join(',') : '<none>';
  const externalIP = service.status?.loadBalancer?.ingress?.[0]?.ip || '<none>';
  const eps = endpoints?.subsets?.flatMap(s =>
    (s.addresses || []).flatMap(a =>
      (s.ports || []).map(p => `${a.ip}:${p.port}`)
    )
  ).join(',') || '<none>';

  return `Name:              ${service.metadata.name}
Namespace:         ${service.metadata.namespace || 'default'}
Labels:            ${service.metadata.labels ? Object.entries(service.metadata.labels).map(([k, v]) => `${k}=${v}`).join(',') : '<none>'}
Annotations:       <none>
Selector:          ${selector}
Type:              ${service.spec.type}
IP Family Policy:  SingleStack
IP Families:       IPv4
IP:                ${service.spec.clusterIP}
IPs:               ${service.spec.clusterIP}
${service.spec.type === 'LoadBalancer' ? `LoadBalancer Ingress:  ${externalIP}\n` : ''}Port:              <unset>  ${service.spec.ports[0].port}/${service.spec.ports[0].protocol}
TargetPort:        ${service.spec.ports[0].targetPort}/${service.spec.ports[0].protocol}
${service.spec.ports[0].nodePort ? `NodePort:          <unset>  ${service.spec.ports[0].nodePort}/${service.spec.ports[0].protocol}\n` : ''}Endpoints:         ${eps}
Session Affinity:  None
Events:            <none>`;
}

function formatRolloutStatus(deployment: Deployment): string {
  if ((deployment.status.availableReplicas || 0) === deployment.spec.replicas) {
    return `deployment "${deployment.metadata.name}" successfully rolled out`;
  }
  return `Waiting for deployment "${deployment.metadata.name}" rollout to finish: ${deployment.status.availableReplicas || 0} of ${deployment.spec.replicas} updated replicas are available...`;
}

function formatRolloutHistory(deployment: Deployment): string {
  const revisions = deployment.revisions || [];
  const header = 'REVISION  CHANGE-CAUSE';
  const rows = revisions.map(r => `${r.revision}         ${r.changeCause || '<none>'}`);
  return `deployment.apps/${deployment.metadata.name}\n${header}\n${rows.join('\n')}`;
}

function toYaml(obj: unknown): string {
  // Simple YAML-like output (not full YAML spec)
  return JSON.stringify(obj, null, 2)
    .replace(/"/g, '')
    .replace(/,$/gm, '')
    .replace(/^\{$/gm, '---')
    .replace(/^\}$/gm, '');
}

// ============================================================================
// HELP TEXT - Playground-specific capabilities and limitations
// ============================================================================

const HELP_TEXTS: Record<string, string> = {
  '': `kubectl - Kubernetes CLI Playground

This is a simulated kubectl environment for learning Kubernetes troubleshooting.
Commands run against mock cluster fixtures, not a real cluster.

Available Commands:
  get         Display resources (pods, deployments, services, nodes, events)
  describe    Show detailed information about a resource
  logs        Print container logs
  rollout     Manage deployments (status, history, undo)
  top         Display resource usage (simulated metrics)

Common Flags:
  -n, --namespace     Target namespace
  -A, --all-namespaces  Query all namespaces
  -o, --output        Output format (wide, json, yaml)
  -l, --selector      Filter by label selector
  --help              Show help for a command

Examples:
  get pods -n payments
  describe pod payment-api-7d4f8b9c5-x2k9m -n payments
  logs payment-api-7d4f8b9c5-x2k9m -n payments
  rollout history deployment/web -n production

Limitations:
  • Read-only simulation (no create, apply, delete, edit, exec, port-forward)
  • Fixed fixture data per lesson (5 troubleshooting scenarios)
  • Rollout undo mutates session state but resets on lesson change

Use --help with any command for detailed usage.`,

  get: `kubectl get - Display resources

Usage:
  kubectl get <resource> [name] [flags]

Supported Resources:
  pods, po              List pods with status, ready count, restarts, age
  deployments, deploy   List deployments with replica counts
  replicasets, rs       List replica sets
  services, svc         List services with type, cluster IP, ports
  endpoints, ep         List service endpoints
  nodes, no             List cluster nodes with status and roles
  events, ev            List cluster events (warnings, errors)

Flags:
  -n, --namespace string    Target namespace (default: from lesson)
  -A, --all-namespaces      Query across all namespaces
  -o, --output string       Output format: wide, json, yaml
  -l, --selector string     Filter by label (e.g., -l app=web)
  --show-labels             Show all labels in output
  --sort-by string          Sort by field (e.g., .metadata.name)

Examples:
  get pods -n payments
  get pods -o wide
  get pods -l app=payment-api
  get svc,endpoints -n api
  get events -A --sort-by=.lastTimestamp

Multi-Resource:
  get svc,endpoints         Query multiple resource types at once

Limitations:
  • No support for: configmaps, secrets, ingress, pvc, jobs, cronjobs
  • Field selectors partially supported (spec.nodeName only)
  • Custom columns (-o custom-columns) not supported`,

  describe: `kubectl describe - Show detailed resource information

Usage:
  kubectl describe <resource> [name] [flags]

Supported Resources:
  pod         Full pod details: containers, conditions, events
  deployment  Deployment status, strategy, replica sets
  node        Node conditions, capacity, allocatable resources
  service     Service details, selector, endpoints

Output Includes:
  • Metadata (name, namespace, labels, creation time)
  • Spec (containers, volumes, selectors)
  • Status (conditions, phase, IP addresses)
  • Events (recent warnings and normal events)

Flags:
  -n, --namespace string    Target namespace

Examples:
  describe pod payment-api-7d4f8b9c5-x2k9m -n payments
  describe deployment web -n production
  describe node worker-1
  describe svc api-gateway -n api

Tips:
  • Look at the Events section for troubleshooting clues
  • Check Conditions for Ready, Initialized status
  • Container State shows CrashLoopBackOff, ImagePullBackOff details

Limitations:
  • No describe for: configmap, secret, ingress, pvc, rs
  • Single resource at a time (no wildcards)`,

  logs: `kubectl logs - Print container logs

Usage:
  kubectl logs <pod> [flags]
  kubectl logs <type>/<name> [flags]

Flags:
  -n, --namespace string    Target namespace
  -c, --container string    Container name (if pod has multiple)
  --tail int                Lines of recent logs to show
  --since string            Only logs newer than duration (e.g., 1h, 30m)
  -p, --previous            Show logs from previous container instance
  -f, --follow              Stream logs (simulated - returns current logs)

Examples:
  logs payment-api-7d4f8b9c5-x2k9m -n payments
  logs deployment/web -n production
  logs web-abc123 --tail=50
  logs web-abc123 --previous
  logs web-abc123 -c sidecar

Output:
  • Timestamped log entries
  • Includes ERROR, FATAL, panic messages for troubleshooting
  • Previous logs available for crashed containers

Limitations:
  • Logs are pre-generated per fixture (not real-time)
  • --follow returns immediately (no streaming)
  • --since filters by line number approximation`,

  rollout: `kubectl rollout - Manage deployment rollouts

Usage:
  kubectl rollout <subcommand> <resource> [flags]

Subcommands:
  status      Show rollout status
  history     View rollout revision history
  undo        Rollback to previous revision

Examples:
  rollout status deployment/web -n production
  rollout history deployment/web -n production
  rollout undo deployment/web -n production
  rollout undo deployment/web --to-revision=2 -n production

Flags:
  -n, --namespace string    Target namespace
  --to-revision int         Rollback to specific revision (with undo)

Status Output:
  • "successfully rolled out" - deployment complete
  • Progress messages for ongoing rollouts

History Output:
  • Revision numbers with change causes
  • Shows image versions for each revision

Undo Behavior:
  • Reverts to previous revision (or --to-revision)
  • Session state is mutated until lesson change
  • Use Reset button to restore original fixture state

Limitations:
  • No rollout pause, resume, restart
  • Only deployments supported (not daemonsets, statefulsets)
  • State resets when switching lessons`,

  top: `kubectl top - Display resource usage

Usage:
  kubectl top <resource> [name] [flags]

Supported Resources:
  pods        Show pod CPU and memory usage
  nodes       Show node CPU and memory usage

Flags:
  -n, --namespace string    Target namespace (for pods)
  --sort-by string          Sort by cpu or memory

Examples:
  top pods -n payments
  top pods --sort-by=memory
  top nodes

Output (Pods):
  NAME        CPU(cores)   MEMORY(bytes)
  web-abc123  125m         256Mi

Output (Nodes):
  NAME      CPU(cores)   CPU%   MEMORY(bytes)   MEMORY%
  worker-1  1250m        32%    8192Mi          51%

Note:
  • Metrics are deterministic per fixture (hash-based)
  • Useful for identifying resource-heavy pods
  • Node metrics help diagnose pressure conditions

Limitations:
  • No real metrics-server integration
  • Values are simulated but consistent
  • No container-level metrics (--containers)`,

  events: `kubectl get events - View cluster events

Usage:
  kubectl get events [flags]

Events show important cluster activity:
  • Pod scheduling, pulling images, starting containers
  • Warnings: CrashLoopBackOff, ImagePullBackOff, FailedScheduling
  • Node conditions: MemoryPressure, DiskPressure

Flags:
  -n, --namespace string    Target namespace
  -A, --all-namespaces      Events from all namespaces
  --sort-by string          Sort by field (e.g., .lastTimestamp)
  --field-selector string   Filter by field

Examples:
  get events -n payments
  get events -A --sort-by=.lastTimestamp
  get events --field-selector type=Warning

Output Columns:
  LAST SEEN   TYPE      REASON    OBJECT          MESSAGE

Tips:
  • Filter by type=Warning to focus on problems
  • Sort by timestamp to see recent activity
  • Events expire after ~1 hour in real clusters

Limitations:
  • Events are pre-generated per fixture
  • No watch mode (-w)
  • Limited field selector support`,
};

function getHelpText(verb: string, resources: string[]): string {
  // Check for specific command help
  if (verb && HELP_TEXTS[verb]) {
    return HELP_TEXTS[verb];
  }
  // Check for 'get events' specifically
  if (verb === 'get' && resources.includes('events')) {
    return HELP_TEXTS.events;
  }
  // Default to general help
  return HELP_TEXTS[''];
}

// ============================================================================
// MAIN EXECUTOR
// ============================================================================

export function executeKubectl(command: string, options: ExecutorOptions): ExecutorResult {
  try {
    const fixture = getFixtureState(options.fixtureId);
    const parsed = parseCommand(command);

    // Handle --help flag early (also catches --help/-h as the verb itself)
    if (parsed.help || parsed.verb === '--help' || parsed.verb === '-h' || parsed.verb === 'help' || !command.trim() || command.trim() === 'kubectl') {
      return { stdout: getHelpText(parsed.verb === '--help' || parsed.verb === '-h' || parsed.verb === 'help' ? '' : parsed.verb, parsed.resources), stderr: '', exitCode: 0 };
    }
    const ns = parsed.namespace || options.defaultNamespace;

    // Filter by namespace
    const filterByNs = <T extends { metadata: ObjectMeta }>(items: T[]): T[] =>
      parsed.allNamespaces ? items : items.filter(i => (i.metadata.namespace || 'default') === ns);

    // Filter by label selector
    const filterByLabels = <T extends { metadata: ObjectMeta }>(items: T[]): T[] =>
      parsed.labelSelector ? items.filter(i => matchesLabels(i.metadata.labels, parsed.labelSelector!)) : items;

    // Sort helper
    const sortItems = <T>(items: T[], sortBy: string | undefined): T[] => {
      if (!sortBy) return items;
      // Support simple jsonpath like .metadata.name, .metadata.creationTimestamp
      const path = sortBy.replace(/^\{?\.?/, '').replace(/\}?$/, '').split('.');
      return [...items].sort((a, b) => {
        let aVal: unknown = a;
        let bVal: unknown = b;
        for (const key of path) {
          aVal = (aVal as Record<string, unknown>)?.[key];
          bVal = (bVal as Record<string, unknown>)?.[key];
        }
        return String(aVal || '').localeCompare(String(bVal || ''));
      });
    };

    switch (parsed.verb) {
      case 'get': {
        const outputs: string[] = [];

        for (const resource of parsed.resources) {
          const res = resource.toLowerCase();

          switch (res) {
            case 'pods':
            case 'pod':
            case 'po': {
              let pods = filterByLabels(filterByNs(fixture.pods));
              if (parsed.name) {
                pods = pods.filter(p => p.metadata.name === parsed.name || p.metadata.name.startsWith(parsed.name!));
              }
              pods = sortItems(pods, parsed.sortBy);

              if (parsed.output === 'json') {
                outputs.push(JSON.stringify(pods.length === 1 ? pods[0] : { items: pods }, null, 2));
              } else if (parsed.output === 'yaml') {
                outputs.push(pods.map(p => toYaml(p)).join('\n---\n'));
              } else {
                outputs.push(formatPodTable(pods, parsed.output === 'wide', parsed.showLabels, parsed.allNamespaces));
              }
              break;
            }

            case 'deployments':
            case 'deployment':
            case 'deploy': {
              let deps = filterByLabels(filterByNs(fixture.deployments));
              if (parsed.name) {
                deps = deps.filter(d => d.metadata.name === parsed.name);
              }
              deps = sortItems(deps, parsed.sortBy);

              if (parsed.output === 'json') {
                outputs.push(JSON.stringify(deps.length === 1 ? deps[0] : { items: deps }, null, 2));
              } else if (parsed.output === 'yaml') {
                outputs.push(deps.map(d => toYaml(d)).join('\n---\n'));
              } else {
                outputs.push(formatDeploymentTable(deps, parsed.allNamespaces));
              }
              break;
            }

            case 'replicasets':
            case 'replicaset':
            case 'rs': {
              let rs = filterByLabels(filterByNs(fixture.replicaSets));
              if (parsed.name) {
                rs = rs.filter(r => r.metadata.name === parsed.name);
              }
              rs = sortItems(rs, parsed.sortBy);

              if (parsed.output === 'json') {
                outputs.push(JSON.stringify(rs.length === 1 ? rs[0] : { items: rs }, null, 2));
              } else if (parsed.output === 'yaml') {
                outputs.push(rs.map(r => toYaml(r)).join('\n---\n'));
              } else {
                outputs.push(formatReplicaSetTable(rs, parsed.allNamespaces));
              }
              break;
            }

            case 'services':
            case 'service':
            case 'svc': {
              let svcs = filterByLabels(filterByNs(fixture.services));
              if (parsed.name) {
                svcs = svcs.filter(s => s.metadata.name === parsed.name);
              }
              svcs = sortItems(svcs, parsed.sortBy);

              if (parsed.output === 'json') {
                outputs.push(JSON.stringify(svcs.length === 1 ? svcs[0] : { items: svcs }, null, 2));
              } else if (parsed.output === 'yaml') {
                outputs.push(svcs.map(s => toYaml(s)).join('\n---\n'));
              } else {
                outputs.push(formatServiceTable(svcs, parsed.allNamespaces));
              }
              break;
            }

            case 'endpoints':
            case 'ep': {
              let eps = filterByNs(fixture.endpoints);
              if (parsed.name) {
                eps = eps.filter(e => e.metadata.name === parsed.name);
              }
              eps = sortItems(eps, parsed.sortBy);

              if (parsed.output === 'json') {
                outputs.push(JSON.stringify(eps.length === 1 ? eps[0] : { items: eps }, null, 2));
              } else if (parsed.output === 'yaml') {
                outputs.push(eps.map(e => toYaml(e)).join('\n---\n'));
              } else {
                outputs.push(formatEndpointsTable(eps, parsed.allNamespaces));
              }
              break;
            }

            case 'nodes':
            case 'node':
            case 'no': {
              let nodes = parsed.name ? fixture.nodes.filter(n => n.metadata.name === parsed.name) : fixture.nodes;
              nodes = sortItems(nodes, parsed.sortBy);

              if (parsed.output === 'json') {
                outputs.push(JSON.stringify(nodes.length === 1 ? nodes[0] : { items: nodes }, null, 2));
              } else if (parsed.output === 'yaml') {
                outputs.push(nodes.map(n => toYaml(n)).join('\n---\n'));
              } else {
                outputs.push(formatNodeTable(nodes));
              }
              break;
            }

            case 'events':
            case 'event':
            case 'ev': {
              let events = parsed.allNamespaces
                ? fixture.events
                : fixture.events.filter(e => (e.metadata.namespace || 'default') === ns || !e.involvedObject.namespace);
              events = sortItems(events, parsed.sortBy || '.lastTimestamp');

              if (parsed.output === 'json') {
                outputs.push(JSON.stringify({ items: events }, null, 2));
              } else if (parsed.output === 'yaml') {
                outputs.push(events.map(e => toYaml(e)).join('\n---\n'));
              } else {
                outputs.push(formatEventsTable(events, parsed.allNamespaces));
              }
              break;
            }

            default:
              return { stdout: '', stderr: `error: the server doesn't have a resource type "${res}"`, exitCode: 1 };
          }
        }

        return { stdout: outputs.join('\n\n'), stderr: '', exitCode: 0 };
      }

      case 'describe': {
        const resource = parsed.resources[0]?.toLowerCase();

        switch (resource) {
          case 'pod':
          case 'pods':
          case 'po': {
            const pods = filterByNs(fixture.pods);
            const pod = parsed.name
              ? pods.find(p => p.metadata.name === parsed.name || p.metadata.name.startsWith(parsed.name!))
              : pods[0];
            if (!pod) {
              return { stdout: '', stderr: `Error from server (NotFound): pods "${parsed.name || ''}" not found`, exitCode: 1 };
            }
            return { stdout: formatPodDescribe(pod, fixture.events), stderr: '', exitCode: 0 };
          }

          case 'deployment':
          case 'deployments':
          case 'deploy': {
            const deps = filterByNs(fixture.deployments);
            const dep = parsed.name ? deps.find(d => d.metadata.name === parsed.name) : deps[0];
            if (!dep) {
              return { stdout: '', stderr: `Error from server (NotFound): deployments.apps "${parsed.name || ''}" not found`, exitCode: 1 };
            }
            const rs = filterByNs(fixture.replicaSets).filter(r =>
              matchesLabels(r.metadata.labels, dep.spec.selector.matchLabels)
            );
            return { stdout: formatDeploymentDescribe(dep, rs), stderr: '', exitCode: 0 };
          }

          case 'node':
          case 'nodes': {
            const node = parsed.name ? fixture.nodes.find(n => n.metadata.name === parsed.name) : fixture.nodes[0];
            if (!node) {
              return { stdout: '', stderr: `Error from server (NotFound): nodes "${parsed.name || ''}" not found`, exitCode: 1 };
            }
            return { stdout: formatNodeDescribe(node), stderr: '', exitCode: 0 };
          }

          case 'service':
          case 'services':
          case 'svc': {
            const svcs = filterByNs(fixture.services);
            const svc = parsed.name ? svcs.find(s => s.metadata.name === parsed.name) : svcs[0];
            if (!svc) {
              return { stdout: '', stderr: `Error from server (NotFound): services "${parsed.name || ''}" not found`, exitCode: 1 };
            }
            const ep = filterByNs(fixture.endpoints).find(e => e.metadata.name === svc.metadata.name);
            return { stdout: formatServiceDescribe(svc, ep), stderr: '', exitCode: 0 };
          }

          default:
            return { stdout: '', stderr: `error: the server doesn't have a resource type "${resource || ''}"`, exitCode: 1 };
        }
      }

      case 'logs': {
        const pods = filterByNs(fixture.pods);
        const podName = parsed.resources[0] || parsed.name;
        const pod = pods.find(p => p.metadata.name === podName || p.metadata.name.startsWith(podName || ''));

        if (!pod) {
          return { stdout: '', stderr: `Error from server (NotFound): pods "${podName || ''}" not found in namespace "${ns}"`, exitCode: 1 };
        }

        const podLogs = fixture.logs[pod.metadata.name];
        if (!podLogs) {
          const cs = pod.status.containerStatuses?.[0];
          if (cs?.state.waiting) {
            return { stdout: '', stderr: `Error from server: container "${parsed.container || pod.spec.containers[0].name}" in pod "${pod.metadata.name}" is waiting to start: ${cs.state.waiting.reason}`, exitCode: 1 };
          }
          return { stdout: '', stderr: `Error from server: container "${parsed.container || pod.spec.containers[0].name}" in pod "${pod.metadata.name}" has no logs`, exitCode: 1 };
        }

        // Multi-container handling
        const containerNames = Object.keys(podLogs);
        if (containerNames.length > 1 && !parsed.container) {
          return { stdout: '', stderr: `Error from server: a container name must be specified for pod ${pod.metadata.name}, choose one of: [${containerNames.join(' ')}]`, exitCode: 1 };
        }

        const containerName = parsed.container || containerNames[0];
        let logs = podLogs[containerName];

        if (!logs) {
          return { stdout: '', stderr: `Error from server: container "${containerName}" not found in pod "${pod.metadata.name}"`, exitCode: 1 };
        }

        if (parsed.tail) {
          const lines = logs.split('\n');
          logs = lines.slice(-parsed.tail).join('\n');
        }

        return { stdout: logs, stderr: '', exitCode: 0 };
      }

      case 'rollout': {
        const subcommand = parsed.resources[0];
        const deployName = parsed.name;
        const deps = filterByNs(fixture.deployments);
        const dep = deps.find(d => d.metadata.name === deployName);

        if (!dep) {
          return { stdout: '', stderr: `Error from server (NotFound): deployments.apps "${deployName || ''}" not found`, exitCode: 1 };
        }

        switch (subcommand) {
          case 'status':
            return { stdout: formatRolloutStatus(dep), stderr: '', exitCode: 0 };

          case 'history':
            return { stdout: formatRolloutHistory(dep), stderr: '', exitCode: 0 };

          case 'undo': {
            // Mutate session state to simulate rollback
            if (dep.revisions && dep.revisions.length > 1) {
              const previousRevision = dep.revisions[1];
              // Update pods to reflect rollback (simplified)
              const deployPods = filterByNs(fixture.pods).filter(p =>
                matchesLabels(p.metadata.labels, dep.spec.selector.matchLabels)
              );
              for (const pod of deployPods) {
                const container = pod.spec.containers[0];
                if (container) {
                  container.image = previousRevision.image;
                }
                if (pod.metadata.labels) {
                  pod.metadata.labels.version = previousRevision.image.split(':')[1] || 'unknown';
                }
              }
            }
            return { stdout: `deployment.apps/${dep.metadata.name} rolled back`, stderr: '', exitCode: 0 };
          }

          default:
            return { stdout: '', stderr: `error: unknown command "${subcommand || ''}"`, exitCode: 1 };
        }
      }

      case 'top': {
        const resource = parsed.resources[0]?.toLowerCase();

        if (resource === 'pods' || resource === 'pod') {
          const pods = filterByNs(fixture.pods).filter(p => p.status.phase === 'Running');
          if (pods.length === 0) {
            return { stdout: '', stderr: 'error: Metrics API not available', exitCode: 1 };
          }
          const header = 'NAME                                   CPU(cores)   MEMORY(bytes)';
          // Deterministic values based on pod name hash
          const rows = pods.map(p => {
            const hash = p.metadata.name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
            return `${p.metadata.name.padEnd(39)} ${(hash % 500)}m         ${(hash % 512)}Mi`;
          });
          return { stdout: [header, ...rows].join('\n'), stderr: '', exitCode: 0 };
        }

        if (resource === 'nodes' || resource === 'node') {
          const header = 'NAME         CPU(cores)   CPU%   MEMORY(bytes)   MEMORY%';
          const rows = fixture.nodes.map(n => {
            const hash = n.metadata.name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
            const memPressure = n.status.conditions.find(c => c.type === 'MemoryPressure' && c.status === 'True');
            const memPct = memPressure ? 92 : (hash % 60) + 20;
            return `${n.metadata.name.padEnd(12)} ${(hash % 4000)}m         ${(hash % 80)}%     ${Math.floor(memPct * 80)}Mi          ${memPct}%`;
          });
          return { stdout: [header, ...rows].join('\n'), stderr: '', exitCode: 0 };
        }

        return { stdout: '', stderr: 'error: unknown resource type', exitCode: 1 };
      }

      default:
        return {
          stdout: '',
          stderr: `Error: unknown command "${parsed.verb}"

Usage:
  kubectl get (pods|deployments|services|endpoints|nodes|events) [flags]
  kubectl describe (pod|deployment|service|node) [name] [flags]
  kubectl logs pod-name [-c container] [--tail N] [flags]
  kubectl rollout (status|history|undo) deployment/name [flags]
  kubectl top (pods|nodes) [flags]`,
          exitCode: 1,
        };
    }
  } catch (error) {
    return {
      stdout: '',
      stderr: error instanceof Error ? error.message : 'Unknown error',
      exitCode: 1,
    };
  }
}

// Legacy exports for backward compatibility
export function setFixture(fixtureId: string): void {
  getFixtureState(fixtureId);
}

export default executeKubectl;
