window.KUBECRAFT_LEVEL_DATA = [];

window.KUBECRAFT_GROUP_CATALOG = {
  podsWorkloads: {
    label: 'Pods & Workloads',
    tags: ['pods', 'workloads', 'probes', 'resources']
  },
  servicesNetworking: {
    label: 'Services & Networking',
    tags: ['services', 'dns', 'traffic', 'networking']
  },
  storageConfig: {
    label: 'Storage & Config',
    tags: ['configmap', 'secret', 'volumes', 'storage']
  },
  deploymentsRollouts: {
    label: 'Deployments & Rollouts',
    tags: ['deployment', 'rollout', 'release', 'availability']
  },
  schedulingPolicy: {
    label: 'Scheduling & Policy',
    tags: ['scheduling', 'pdb', 'affinity', 'policy']
  },
  autoscaling: {
    label: 'Autoscaling',
    tags: ['hpa', 'keda', 'scaling', 'capacity']
  },
  rbacSecurity: {
    label: 'RBAC & Security',
    tags: ['rbac', 'serviceaccount', 'security', 'least-privilege']
  },
  operatorsCrds: {
    label: 'Operators & CRDs',
    tags: ['operator', 'controller', 'crd', 'reconcile']
  },
  observability: {
    label: 'Observability',
    tags: ['metrics', 'logs', 'tracing', 'incident']
  },
  advancedTopics: {
    label: 'Advanced Topics',
    tags: ['namespace', 'statefulset', 'debugging', 'operations']
  },
  helmGitops: {
    label: 'Helm & GitOps',
    tags: ['helm', 'gitops', 'argocd', 'delivery']
  },
  ingressTls: {
    label: 'Ingress & TLS',
    tags: ['ingress', 'tls', 'cert-manager', 'edge']
  },
  clusterArchitecture: {
    label: 'Cluster Architecture',
    tags: ['control-plane', 'kubelet', 'etcd', 'architecture']
  },
  policyGovernance: {
    label: 'Policy & Governance',
    tags: ['opa', 'kyverno', 'compliance', 'governance']
  },
  multiCluster: {
    label: 'Multi-Cluster Operations',
    tags: ['fleet', 'federation', 'global-traffic', 'regional-failover']
  },
  disasterRecovery: {
    label: 'Disaster Recovery',
    tags: ['backup', 'restore', 'rpo', 'rto']
  },
  serviceMesh: {
    label: 'Service Mesh',
    tags: ['mesh', 'mtls', 'traffic-policy', 'zero-trust']
  },
  performanceCost: {
    label: 'Performance & Cost',
    tags: ['optimization', 'finops', 'capacity', 'efficiency']
  },
  ciCdDelivery: {
    label: 'CI/CD & Delivery',
    tags: ['pipeline', 'canary', 'blue-green', 'release']
  }
};
