window.KUBECRAFT_LEVEL_DATA = window.KUBECRAFT_LEVEL_DATA || [];
window.KUBECRAFT_LEVEL_DATA.push({
  "id": "level-6",
  "title": "Level 6 · Kubernetes Mastermind",
  "difficulty": "Expert",
  "badgeIcon": "👑",
  "badgeName": "Kubernetes Mastermind",
  "description": "Combine GitOps, ingress, TLS, and advanced operations into expert-level decision making for high-stakes production clusters.",
  "status": "active",
  "targetQuestionCount": 24,
  "focus": [
    "Helm & GitOps",
    "Ingress & TLS"
  ],
  "questions": [
    {
      "type": "command",
      "q": "Build the kubectl command to get a shell inside a running \"api-server\" pod to debug it live.",
      "context": "# Pod is running but behaving unexpectedly\n# Need to inspect filesystem, run curl, check env vars",
      "tokens": [
        "kubectl",
        "exec",
        "-it",
        "api-server",
        "--",
        "sh",
        "logs",
        "describe",
        "run",
        "/bin/bash"
      ],
      "answer": [
        "kubectl",
        "exec",
        "-it",
        "api-server",
        "--",
        "sh"
      ],
      "explain": "kubectl exec -it <pod> -- <command> runs an interactive command in a running container. -i keeps stdin open, -t allocates a TTY. Use sh if the image has no bash (e.g., Alpine or distroless).",
      "wrongReasons": [],
      "tip": "If your image is distroless (no shell!), use kubectl debug: kubectl debug -it api-server --image=busybox --target=api-server. Creates a sidecar debug container without modifying the running container.",
      "deepDive": "For production debugging without modifying running pods: (1) kubectl debug for ephemeral debug containers, (2) kubectl cp to copy files out, (3) kubectl port-forward to access internal ports. Avoid exec in prod — prefer observability tools instead.",
      "groupId": "advancedTopics",
      "isBoss": false
    },
    {
      "type": "quiz",
      "q": "What is Helm and when should you use it for your Go microservices?",
      "context": "# Your Go service needs:\n# - Deployment (different image per env)\n# - Service\n# - HPA\n# - ConfigMap (different values per env)\n# - Ingress\n\n# Maintaining 3 environments × 5 files = 15 YAML files",
      "options": [
        "A Go package manager like go mod for Kubernetes packages",
        "A Kubernetes package manager: templates + values files for deploying apps across environments",
        "A continuous deployment tool that watches Git and applies changes automatically",
        "A CLI that replaces kubectl with a simpler interface"
      ],
      "answer": 1,
      "explain": "Helm is a package manager for Kubernetes. You define templates (with {{.Values.image.tag}}), and provide different values.yaml per environment. One chart, many deployments.",
      "wrongReasons": [
        null,
        "Helm is not related to Go modules. It's a k8s tooling concept. Go module management (go mod) handles Go source dependencies; Helm manages k8s application packaging.",
        "That's GitOps (ArgoCD, Flux). Helm is a templating/packaging tool, not a CD pipeline. Helm can be used by GitOps tools (ArgoCD manages Helm releases), but Helm itself doesn't watch Git.",
        "Helm uses kubectl under the hood for applying manifests. It doesn't replace kubectl — you still use kubectl for debugging and inspecting live resources. helm install/upgrade handles deployments."
      ],
      "tip": "Go tip: Create a base Helm chart for your Go microservices that includes best practices: non-root securityContext, resource limits, readiness/liveness probes, PDB. Reuse it across all your Go services as a library chart.",
      "deepDive": "Helm chart structure: Chart.yaml (metadata), values.yaml (defaults), templates/ (k8s manifests with Go templating). Use helm diff (plugin) to preview changes before applying. Combine with ArgoCD for full GitOps: Git push → ArgoCD detects → helm upgrade.",
      "groupId": "helmGitops",
      "isBoss": false
    },
    {
      "type": "quiz",
      "q": "What is GitOps and how does ArgoCD implement it for Kubernetes?",
      "context": "# Current workflow:\n# Dev → kubectl apply -f → cluster (manual, error-prone)\n\n# GitOps workflow:\n# Dev → git push → ??? → cluster (automated, audited)",
      "options": [
        "GitOps = storing secrets in Git; ArgoCD encrypts them automatically",
        "GitOps = Git as source of truth; ArgoCD watches Git, detects drift, and syncs the cluster to match",
        "GitOps = a CI/CD pipeline that runs tests; ArgoCD runs Go tests before deploying",
        "GitOps = a branching strategy; ArgoCD creates k8s clusters per Git branch"
      ],
      "answer": 1,
      "explain": "GitOps: the desired state of the cluster is declared in Git. ArgoCD continuously compares the live cluster state to Git, detects drift, and automatically (or on approval) syncs the cluster to match Git.",
      "wrongReasons": [
        null,
        "Storing secrets in Git unencrypted is a security disaster. GitOps doesn't require secrets in Git — use Sealed Secrets or External Secrets Operator. ArgoCD manages manifests, not secret encryption.",
        "ArgoCD handles deployment (CD), not testing (CI). Your CI pipeline (GitHub Actions, GitLab CI) runs tests and builds container images. ArgoCD deploys the result. They're complementary, not the same.",
        "ArgoCD can create namespaces but not entire clusters per branch. That's cluster fleet management (Cluster API, Crossplane). ArgoCD ApplicationSets can deploy to multiple clusters from one repo, but not create new clusters."
      ],
      "tip": "Go tip: Set up ArgoCD with app-of-apps pattern: one ArgoCD Application that manages all your Go service Applications. Each Go service gets its own Application pointing to its Helm chart.",
      "deepDive": "ArgoCD workflow: (1) Push to Git, (2) ArgoCD detects change (webhook or polling), (3) Compares desired state (Git) vs live state (cluster), (4) Shows diff in UI, (5) Auto-sync or manual approve. All changes are auditable via Git history.",
      "groupId": "helmGitops",
      "isBoss": false
    },
    {
      "type": "command",
      "q": "Build the kubectl command to list all resources in the \"backend\" namespace across ALL resource types.",
      "context": "# Wide audit of everything in backend namespace\n# Need to see all resources: pods, services, deployments, etc.",
      "tokens": [
        "kubectl",
        "get",
        "all",
        "-n",
        "backend",
        "describe",
        "pods",
        "--watch",
        "secrets"
      ],
      "answer": [
        "kubectl",
        "get",
        "all",
        "-n",
        "backend"
      ],
      "explain": "kubectl get all lists the most common resource types (pods, services, deployments, replicasets, statefulsets, daemonsets, jobs, cronjobs). Note: it doesn't include every resource type — use kubectl api-resources for the full list.",
      "wrongReasons": [],
      "tip": "For a truly complete audit: kubectl get $(kubectl api-resources --verbs=list --namespaced -o name | paste -sd,) -n backend. This lists ALL resource types in the namespace including custom resources.",
      "deepDive": "\"all\" in kubectl get all is misleading — it's actually a shorthand for a predefined list of common resources. ConfigMaps, Secrets, ServiceAccounts, Ingresses, and CRDs are NOT included. Always verify when doing a full audit.",
      "groupId": "helmGitops",
      "isBoss": false
    },
    {
      "type": "quiz",
      "q": "You have 10 Go microservices each with their own Service. You don't want 10 separate LoadBalancer Services (expensive!). What's the better solution?",
      "context": "# 10 services, each needs external HTTP access\n# Current: 10 LoadBalancer Services = 10 cloud LBs = $$$\n# Better approach?",
      "options": [
        "Use 10 NodePort Services — they're free",
        "Use one Ingress controller with routing rules to each Service",
        "Merge all services into one monolith to reduce services",
        "Use ExternalName Services to route traffic externally"
      ],
      "answer": 1,
      "explain": "An Ingress controller (nginx, Traefik, AWS ALB Ingress) is a single load balancer that routes HTTP/HTTPS traffic to multiple Services based on host or path rules. One LB for all services.",
      "wrongReasons": [
        null,
        "NodePort Services expose static ports (30000-32767) on every node's IP. They're awkward to use (non-standard ports), require knowing node IPs, and don't support HTTPS termination or path-based routing. Not suitable for production.",
        "Merging microservices into a monolith for cost optimization defeats the architectural purpose. The correct solution is infrastructure optimization (Ingress), not application refactoring.",
        "ExternalName Services create a DNS CNAME to an external hostname — they route traffic OUT of the cluster to external services, not IN to cluster services. Not what you want here."
      ],
      "tip": "Go tip: Use nginx-ingress or Traefik in k8s. Define Ingress rules: api.example.com/users → user-service, api.example.com/orders → order-service. One cloud LB, many Go services.",
      "deepDive": "# Example Ingress routing multiple Go services:\nspec:\n  rules:\n  - host: api.example.com\n    http:\n      paths:\n      - path: /users\n        backend: {service: {name: user-svc, port: {number: 8080}}}\n      - path: /orders\n        backend: {service: {name: order-svc, port: {number: 8080}}}",
      "groupId": "ingressTls",
      "isBoss": false
    },
    {
      "type": "quiz",
      "q": "How do you get automatic free TLS certificates (HTTPS) for your Go services in Kubernetes?",
      "context": "# Your Go services currently serve HTTP only\n# Need HTTPS in production\n# Want automatic renewal — no manual work",
      "options": [
        "Manually generate self-signed certs and store in Secrets",
        "Use cert-manager with a Let's Encrypt ClusterIssuer to auto-provision and renew TLS certs",
        "Enable tls: true in your Ingress — k8s generates certs automatically",
        "Use a LoadBalancer Service — cloud providers handle TLS automatically"
      ],
      "answer": 1,
      "explain": "cert-manager is a k8s controller that watches Ingress resources (or Certificate CRDs), requests TLS certs from Let's Encrypt (or other CAs), stores them as Secrets, and automatically renews before expiry.",
      "wrongReasons": [
        null,
        "Self-signed certs trigger browser warnings (\"Not Secure\") and are rejected by production HTTP clients that verify TLS. Managing manual renewal is error-prone — certs expire at 3am on a Sunday.",
        "There's no built-in k8s cert generation. Setting tls: [] in Ingress tells the Ingress controller to USE an existing Secret for TLS — you still need to provide the cert. cert-manager creates that Secret.",
        "LoadBalancer Services provide L4 (TCP) load balancing. TLS termination at the LB level is possible (cloud-specific annotations) but then your Go service gets HTTP internally. cert-manager + Ingress is the standard k8s way."
      ],
      "tip": "Go tip: cert-manager adds the annotation kubernetes.io/tls-acme: \"true\" support. In Go, once cert-manager provisions the cert, your service gets HTTPS with zero code changes — TLS terminates at the Ingress.",
      "deepDive": "cert-manager flow: (1) You create an Ingress with tls.secretName. (2) cert-manager sees the Ingress. (3) Creates a Certificate resource. (4) Performs ACME challenge (HTTP-01 or DNS-01). (5) Gets cert from Let's Encrypt. (6) Stores in Secret. (7) Renews 30 days before expiry.",
      "groupId": "ingressTls",
      "isBoss": false
    },
    {
      "type": "command",
      "q": "Build the kubectl command to port-forward your local port 9090 to port 8080 on the \"metrics-server\" pod for local debugging.",
      "context": "# metrics-server pod has /metrics on port 8080\n# Want to curl localhost:9090/metrics locally",
      "tokens": [
        "kubectl",
        "port-forward",
        "pod/metrics-server",
        "9090:8080",
        "service/",
        "-n",
        "default",
        "exec"
      ],
      "answer": [
        "kubectl",
        "port-forward",
        "pod/metrics-server",
        "9090:8080"
      ],
      "explain": "kubectl port-forward tunnels local:PORT to pod:PORT over the k8s API. Great for local debugging without exposing the pod externally. Format: LOCAL_PORT:POD_PORT.",
      "wrongReasons": [],
      "tip": "You can also port-forward to a Service: kubectl port-forward service/metrics-server 9090:8080. This picks a healthy pod behind the service automatically — more reliable than pointing to a specific pod.",
      "deepDive": "Port-forward tricks: (1) Forward multiple ports: kubectl port-forward pod/my-pod 9090:8080 9091:9090. (2) Run in background: kubectl port-forward pod/my-pod 9090:8080 &. (3) In CI/CD, use port-forward to run integration tests against a real k8s pod without exposing it publicly.",
      "groupId": "ingressTls",
      "isBoss": false
    },
    {
      "type": "quiz",
      "q": "What is a DaemonSet and when would you use it for Go services in a Kubernetes cluster?",
      "context": "# You need a Go agent running on EVERY node\n# Examples: log collector, metrics exporter, network proxy\n# Deployment won't work because replicas != nodes",
      "options": [
        "A Deployment that automatically sets replicas = node count",
        "A controller that ensures exactly one pod runs on every (or selected) node",
        "A StatefulSet variant for daemon-like background processes",
        "A CronJob that runs on a schedule across all nodes"
      ],
      "answer": 1,
      "explain": "DaemonSet ensures one pod runs on every node (or nodes matching a nodeSelector). When new nodes join the cluster, DaemonSet pods are automatically scheduled on them.",
      "wrongReasons": [
        null,
        "A Deployment with replicas=node_count would work initially, but when nodes are added or removed, you'd have to manually update replicas. DaemonSet handles this automatically and guarantees one-per-node placement.",
        "StatefulSet provides ordered pod identity — pod-0, pod-1. It's for clustered stateful apps, not for \"one per node\" placement. A StatefulSet doesn't respond to node additions.",
        "CronJob runs jobs on a time schedule. It doesn't run pods continuously on every node. For continuous per-node agents (like a metrics exporter), CronJob is completely wrong."
      ],
      "tip": "Go tip: Write your node-level Go agent as a DaemonSet. Common use cases: Prometheus node-exporter, Fluentd/Fluent Bit log shippers, CNI plugins, custom network agents. Access host filesystem via hostPath volumes.",
      "deepDive": "DaemonSet tolerations: system-level DaemonSets (CNI, kube-proxy) need tolerations for control plane taints. Add tolerations: [{operator: Exists}] to run on every node including control plane nodes (useful for cluster-wide security scanners).",
      "groupId": "ingressTls",
      "isBoss": false
    },
    {
      "type": "scenario",
      "q": "🚨 INCIDENT: Your Go service suddenly gets \"context deadline exceeded\" errors when calling another internal service. The target service looks healthy. What's the MOST LIKELY cause?",
      "context": "# Error in Go logs:\n# context deadline exceeded (Client.Timeout exceeded)\n\n# Target service: 3/3 pods Running, Ready\n# Network: pods can ping each other\n# This started after deploying new NetworkPolicy",
      "options": [
        "🐌 Target service is slow — increase your Go client timeout",
        "🚫 New NetworkPolicy is blocking traffic between namespaces",
        "🧠 OOM in target service causing slow GC pauses",
        "🔄 k8s DNS is slow — add DNS caching sidecar"
      ],
      "answer": 1,
      "explain": "The clue is \"started after deploying new NetworkPolicy.\" NetworkPolicy is deny-by-default once applied — if the new policy doesn't explicitly allow ingress from your calling service, traffic is silently dropped, causing timeouts.",
      "wrongReasons": [
        null,
        "If the target service were slow, you'd see high latency, not connection drops. context deadline exceeded can mean the connection was established but the response was too slow — OR the connection was never established. The NetworkPolicy timing is the key clue.",
        "OOM would cause pod restarts, not just slow responses. kubectl get pods would show RESTARTS > 0. The scenario says the target service looks healthy with 3/3 Ready.",
        "DNS issues cause \"no such host\" errors, not timeouts. The Go client is successfully resolving the hostname (otherwise you'd see a different error). The timeout happens at the connection or request level — NetworkPolicy drops the TCP connection attempt."
      ],
      "tip": "Go tip: Use context with both dial timeout and request timeout: client := &http.Client{Timeout: 5*time.Second}. For debugging NetworkPolicy, add a temporary curl test pod: kubectl run test --image=curlimages/curl -it --rm -- curl http://target-svc:8080/healthz",
      "deepDive": "NetworkPolicy debugging: (1) kubectl describe networkpolicy -n <namespace> — review ingress/egress rules. (2) Check if both source and target namespaces have matching labels. (3) Verify the policy allows both the port AND protocol. Common mistake: allowing TCP but forgetting UDP for DNS.",
      "groupId": "ingressTls",
      "isBoss": true
    }
  ]
});
