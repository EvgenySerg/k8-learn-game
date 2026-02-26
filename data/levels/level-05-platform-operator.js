window.KUBECRAFT_LEVEL_DATA = window.KUBECRAFT_LEVEL_DATA || [];
window.KUBECRAFT_LEVEL_DATA.push({
  "id": "level-5",
  "title": "Level 5 · Platform Operator",
  "difficulty": "Advanced",
  "badgeIcon": "🚀",
  "badgeName": "Platform Operator",
  "description": "Run Kubernetes as a product: observability, incident triage, and platform hardening for multi-team production environments.",
  "status": "active",
  "targetQuestionCount": 24,
  "focus": [
    "Observability",
    "Advanced Topics"
  ],
  "questions": [
    {
      "type": "quiz",
      "q": "You want to expose your Go service metrics to Prometheus running in the same cluster. What is the standard pattern?",
      "context": "// In your Go server:\nimport \"github.com/prometheus/client_golang/prometheus/promhttp\"\n\n// How does Prometheus find and scrape this?",
      "options": [
        "Push metrics to Prometheus using a push gateway every 15 seconds",
        "Expose /metrics HTTP endpoint and add a ServiceMonitor or annotations for scraping",
        "Write metrics to a log file that Prometheus reads via a log exporter",
        "Register the Go service IP directly in Prometheus configuration"
      ],
      "answer": 1,
      "explain": "Prometheus uses a pull model. Your Go service exposes GET /metrics (via promhttp.Handler()). Prometheus scrapes it periodically. In k8s, add pod annotations or a ServiceMonitor (Prometheus Operator) for auto-discovery.",
      "wrongReasons": [
        null,
        "Pushgateway exists but is only recommended for short-lived jobs (batch, cron) that can't be scraped. For long-running Go services, pull-based scraping is always preferred — it also detects when a pod is down (scrape fails).",
        "Log-based metrics (parsing log files) is an anti-pattern — fragile, slow, and resource-intensive. Native Prometheus instrumentation via client_golang is the standard for Go.",
        "Hardcoding pod IPs in Prometheus config is unmanageable at scale and breaks every time a pod restarts. k8s service discovery (kubernetes_sd_config) or ServiceMonitors handle dynamic pod IPs automatically."
      ],
      "tip": "Go tip:\nmux.Handle(\"/metrics\", promhttp.Handler())\n// Register custom metrics:\nvar reqDuration = prometheus.NewHistogramVec(\n  prometheus.HistogramOpts{Name: \"http_request_duration_seconds\"},\n  []string{\"method\", \"path\", \"status\"},\n)",
      "deepDive": "# ServiceMonitor for Prometheus Operator auto-discovery:\napiVersion: monitoring.coreos.com/v1\nkind: ServiceMonitor\nmetadata:\n  name: my-go-service\nspec:\n  selector:\n    matchLabels:\n      app: my-go-service\n  endpoints:\n  - port: metrics\n    interval: 15s",
      "groupId": "observability",
      "isBoss": false
    },
    {
      "type": "command",
      "q": "Build the kubectl command to get all events in the \"production\" namespace, sorted by time, to diagnose a recent incident.",
      "context": "# Something happened in production namespace\n# Need to see cluster events in chronological order",
      "tokens": [
        "kubectl",
        "get",
        "events",
        "-n",
        "production",
        "--sort-by=.lastTimestamp",
        "describe",
        "logs",
        "pods"
      ],
      "answer": [
        "kubectl",
        "get",
        "events",
        "-n",
        "production",
        "--sort-by=.lastTimestamp"
      ],
      "explain": "kubectl get events lists cluster events (scheduling failures, OOMKills, image pulls, probe failures). --sort-by=.lastTimestamp shows them in chronological order — critical for incident timelines.",
      "wrongReasons": [],
      "tip": "Add --field-selector type=Warning to see only warning events. Events are deleted after ~1 hour by default — for longer retention, ship events to your logging system with event exporters.",
      "deepDive": "Events capture things logs miss: why a pod was evicted, which node failed to schedule, when a Secret was mounted, liveness probe failures before a crash. Always check events first in an incident: kubectl get events -n prod --sort-by=.lastTimestamp | tail -20",
      "groupId": "observability",
      "isBoss": false
    },
    {
      "type": "quiz",
      "q": "What is a Kubernetes Namespace and why should your team use multiple namespaces?",
      "context": "# Current state: everything in \"default\" namespace\n# Team has: dev, staging, prod environments\n# Also has: frontend team, backend team, platform team",
      "options": [
        "Namespaces are virtual clusters for isolation: separate RBAC, ResourceQuota, NetworkPolicy per namespace",
        "Namespaces are physical network segments that separate node pools",
        "Namespaces are just labels — they don't provide any real isolation",
        "Each namespace runs on a dedicated node and has its own kubelet"
      ],
      "answer": 0,
      "explain": "Namespaces provide logical isolation: separate RBAC (who can do what), ResourceQuota (CPU/memory limits per namespace), and NetworkPolicy (network rules). They're ideal for env separation or team isolation.",
      "wrongReasons": [
        null,
        "Namespaces are a Kubernetes API concept, not a network or hardware boundary. Pods in different namespaces run on the same nodes and can communicate over the network (unless blocked by NetworkPolicy).",
        "Namespaces do provide real isolation mechanisms — RBAC scope, ResourceQuota, and NetworkPolicy can all be namespace-scoped. They're not just cosmetic labels.",
        "Namespaces don't map to physical nodes. All nodes run all namespaces' pods. Node isolation requires NodeSelector, Taints/Tolerations, or dedicated node pools."
      ],
      "tip": "Go tip: Use separate namespaces per environment (dev/staging/prod) and per team (platform/backend/frontend). Cross-namespace service calls use the FQDN: service.namespace.svc.cluster.local.",
      "deepDive": "ResourceQuota prevents a dev namespace from consuming all cluster resources: set limits on CPU, memory, and object counts (pods, secrets, services). LimitRange sets per-pod defaults so devs don't accidentally run pods with no limits.",
      "groupId": "advancedTopics",
      "isBoss": false
    },
    {
      "type": "quiz",
      "q": "You need to run a database (PostgreSQL) in Kubernetes. What is the MOST IMPORTANT concern compared to running stateless Go services?",
      "context": "# Stateless Go API: easy in k8s\n# PostgreSQL in k8s: many more concerns...\n# What's the #1 difference?",
      "options": [
        "Databases need more CPU than Go services",
        "Persistent storage, stable network identity, and ordered startup/shutdown (use StatefulSet, not Deployment)",
        "Databases can't use ConfigMaps for configuration",
        "PostgreSQL containers always need to run as root"
      ],
      "answer": 1,
      "explain": "Databases are stateful: they need persistent storage (PVC) that survives pod restarts, stable pod names (pod-0, pod-1) for replication, and ordered startup. StatefulSet provides all of this; Deployment doesn't.",
      "wrongReasons": [
        null,
        "CPU is configured via resource requests/limits for any workload — there's nothing inherently different about databases needing more CPU than Go services. Memory may differ, but it's not the core k8s concern.",
        "Databases absolutely can use ConfigMaps for postgresql.conf settings, and Secrets for passwords. ConfigMaps work for any pod type.",
        "PostgreSQL should NOT run as root. Use a non-root user (postgres user = UID 70 in official images). This is a good practice but not what differentiates stateful from stateless workloads."
      ],
      "tip": "Go tip: For production databases, seriously consider managed cloud databases (RDS, Cloud SQL, PlanetScale) instead of self-managed in k8s. The operational complexity of running stateful DBs in k8s is high — use the StatefulSet pattern only if you have expertise.",
      "deepDive": "StatefulSet guarantees: stable network identities (pod-0.svc, pod-1.svc), ordered pod creation (pod-0 before pod-1), and per-pod PVCs that aren't deleted when pods restart. Use for: PostgreSQL, Redis Cluster, Elasticsearch, Kafka.",
      "groupId": "advancedTopics",
      "isBoss": false
    },
    {
      "type": "scenario",
      "q": "🚨 INCIDENT: Your Go service suddenly can't reach an external API (api.partner.com). Other services work fine. What do you check?",
      "context": "# Error in Go service logs:\n# dial tcp: lookup api.partner.com: no such host\n\n# Other services in same namespace: working fine\n# Same service, different pod: also broken\n# kubectl exec into pod: nslookup api.partner.com → FAIL",
      "options": [
        "🌐 Check NetworkPolicy — it may be blocking egress DNS",
        "🔄 Restart the kube-dns/CoreDNS pods",
        "📋 kubectl describe pod — check env vars",
        "🔍 Check if the partner API is down externally"
      ],
      "answer": 0,
      "explain": "If nslookup fails inside the pod but works elsewhere, and a NetworkPolicy exists, it may be blocking UDP port 53 (DNS) egress. NetworkPolicies default-deny can block DNS if egress rules don't explicitly allow kube-dns.",
      "wrongReasons": [
        null,
        "Restarting CoreDNS would affect ALL pods cluster-wide, but the problem is isolated to one service. If other services resolve DNS fine, CoreDNS is probably working. Start with the scope of impact — one service = likely local policy.",
        "kubectl describe pod shows env vars, resource limits, and events — but \"no such host\" is a DNS resolution failure, not an env var problem. The nslookup test already confirms it's DNS.",
        "Checking if the partner API is down externally is a valid thought, but the error \"no such host\" means DNS lookup failed entirely — the request never even reached the partner's servers. External downtime would show a connection refused or timeout, not DNS failure."
      ],
      "tip": "Go tip: Always allow egress DNS in your NetworkPolicy: {ports: [{protocol: UDP, port: 53}, {protocol: TCP, port: 53}], to: [{namespaceSelector: {matchLabels: {name: kube-system}}}]}",
      "deepDive": "Debug DNS in k8s: kubectl run -it --rm debug --image=busybox --restart=Never -- nslookup api.partner.com. If this works from a plain pod but not your service pod, the issue is namespace-scoped NetworkPolicy.",
      "groupId": "advancedTopics",
      "isBoss": true
    }
  ]
});
