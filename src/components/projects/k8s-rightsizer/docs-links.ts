/** Primary Kubernetes references behind the tool's behavior and copy. */
export const DOCS = {
  resources: 'https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/',
  quantity: 'https://kubernetes.io/docs/reference/kubernetes-api/common-definitions/quantity/',
  qos: 'https://kubernetes.io/docs/concepts/workloads/pods/pod-qos/',
  eviction: 'https://kubernetes.io/docs/concepts/scheduling-eviction/node-pressure-eviction/',
  hpa: 'https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/',
  vpa: 'https://kubernetes.io/docs/concepts/workloads/autoscaling/vertical-pod-autoscale/',
  resize: 'https://kubernetes.io/docs/tasks/configure-pod-container/resize-container-resources/',
  metrics: 'https://kubernetes.io/docs/tasks/debug/debug-cluster/resource-metrics-pipeline/',
} as const;
