window.KUBECRAFT_LEVEL_DATA = window.KUBECRAFT_LEVEL_DATA || [];
window.KUBECRAFT_LEVEL_DATA.push({
  "id": "level-1",
  "title": "Level 1 · Cluster Rookie",
  "difficulty": "Beginner",
  "badgeIcon": "🧭",
  "badgeName": "Rookie Navigator",
  "description": "Master Kubernetes vocabulary and first-response actions: pods, requests/limits, probes, service DNS, and safe imperative commands.",
  "status": "active",
  "targetQuestionCount": 21,
  "focus": [
    "Pods & Workloads",
    "Services & Networking"
  ],
  "questions": [
    {
      "type": "quiz",
      "q": "Your Go batch Job keeps failing with a database connection error. Which field in the Job spec controls how many times Kubernetes retries before marking the Job as Failed?",
      "context": "# Your Go migration job:\nlog.Fatal(\"DB connection timeout\") // exits non-zero\n\nkubectl get jobs\nNAME         COMPLETIONS   DURATION\ndb-migrate   0/1           10m       # stuck retrying",
      "options": [
        "backoffLimit",
        "restartPolicy: Never",
        "maxSurge",
        "terminationGracePeriodSeconds"
      ],
      "answer": 0,
      "explain": "The correct field is `backoffLimit` in the Job spec. It sets how many failed pod attempts are allowed before the entire Job is marked Failed. The default is 6. This is unique to Jobs — Deployments use `restartPolicy: Always` and restart pods indefinitely with no retry cap.",
      "wrongReasons": [
        null,
        "restartPolicy: Never would stop the pod from restarting at all — useful for one-shot tasks, but it's not what controls the retry limit count in Jobs.",
        "maxSurge controls how many extra pods can exist during a rolling update. It has nothing to do with crash retry behavior.",
        "terminationGracePeriodSeconds is how long k8s waits after sending SIGTERM before force-killing with SIGKILL. It's about graceful shutdown, not retries."
      ],
      "tip": "Go tip: Use os.Exit(1) for fatal errors. k8s detects non-zero exit codes and restarts the pod. For Jobs with backoff, implement idempotent operations!",
      "deepDive": "For one-shot workloads, combine `backoffLimit` with `activeDeadlineSeconds` so failed Jobs do not retry forever. Kubernetes uses exponential backoff between retries (10s, 20s, 40s… up to 6 min). Tune `completions` and `parallelism` for batch fan-out patterns. During incidents, use `kubectl describe job <name>` and inspect pod events to distinguish app exits from image pull failures or scheduling constraints.\n\nOfficial Kubernetes docs:\n- https://kubernetes.io/docs/concepts/workloads/controllers/job/\n- https://kubernetes.io/docs/reference/kubernetes-api/workload-resources/job-v1/",
      "groupId": "podsWorkloads",
      "isBoss": false
    },
    {
      "type": "quiz",
      "q": "What is the difference between a Pod's \"request\" and \"limit\" for CPU in Kubernetes?",
      "context": "resources:\n  requests:\n    cpu: \"250m\"   # what does this do?\n  limits:\n    cpu: \"500m\"   # and this?",
      "options": [
        "requests = guaranteed minimum for scheduling; limits = hard cap enforced at runtime",
        "requests = max CPU allowed; limits = burst threshold",
        "Both are the same, just aliases in the spec",
        "requests = per-container; limits = per-node"
      ],
      "answer": 0,
      "explain": "Requests and limits serve different control-plane purposes. `requests.cpu` is used by the scheduler to reserve capacity on a node, while `limits.cpu` is enforced at runtime through cgroups. If your app tries to use more than its limit, it is throttled rather than killed.",
      "wrongReasons": [
        null,
        "This is backwards. requests is the minimum guaranteed, not the max. limits is the ceiling. A pod CAN burst above requests (up to limits) if the node has spare capacity.",
        "They are entirely different fields with different behaviors. Mixing them up leads to either over-scheduling (too-low requests) or throttled pods (too-low limits).",
        "Both requests and limits operate per container, not per node. The scheduler uses the sum of requests across all containers in a pod to find a suitable node."
      ],
      "tip": "Go tip: Use runtime.NumCPU() carefully — in containers it returns the host CPU count, not your limit! Use go.uber.org/automaxprocs to auto-set GOMAXPROCS based on CPU limits.",
      "deepDive": "In production, set CPU requests from observed steady-state usage and limits from safe burst headroom. Too-low limits cause latency spikes from throttling; too-high requests reduce bin-packing efficiency and increase cost. Kubernetes assigns a QoS class based on how you set these: Guaranteed (requests == limits), Burstable (requests < limits), or BestEffort (no requests/limits). Under memory pressure, BestEffort pods are evicted first. Track throttling metrics and p95 latency together to choose better values.\n\nOfficial Kubernetes docs:\n- https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/\n- https://kubernetes.io/docs/tasks/configure-pod-container/assign-cpu-resource/",
      "groupId": "podsWorkloads",
      "isBoss": false
    },
    {
      "type": "quiz",
      "q": "Your Go service needs a liveness probe. It's a gRPC server (no HTTP). What is the correct probe type to use?",
      "context": "# Your service ONLY exposes gRPC on port 9090\n# No HTTP server at all\nlivenessProbe:\n  ???:\n    port: 9090",
      "options": [
        "httpGet (convert your service to HTTP)",
        "exec (run a script inside the container)",
        "grpc (native gRPC health protocol)",
        "tcpSocket (check if the port is open)"
      ],
      "answer": 2,
      "explain": "For a pure gRPC service, use the native `grpc` probe type. Kubernetes calls the standard gRPC health endpoint directly, which avoids wrapper scripts and gives a protocol-accurate health signal.",
      "wrongReasons": [
        "You do not need to convert a gRPC service to HTTP just for probing. If your app is already gRPC-native, use the protocol-native probe.",
        "exec probes can work, but they are heavier and more fragile because each check starts a process inside the container.",
        null,
        "tcpSocket only proves the port accepts connections. It does not prove the gRPC application can serve requests correctly."
      ],
      "tip": "Go tip: Import google.golang.org/grpc/health/grpc_health_v1. Register with grpc_health_v1.RegisterHealthServer(s, health.NewServer()) and k8s handles the rest.",
      "deepDive": "Native gRPC probes became stable in Kubernetes 1.27 (alpha since 1.24). Implement `grpc.health.v1.Health` in your Go service and return `SERVING` only when dependencies required to handle traffic are healthy. Use readiness to gate traffic and liveness to recover deadlocks. On older clusters, use the `grpc_health_probe` binary in an exec probe as a fallback.\n\nOfficial Kubernetes docs:\n- https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/\n- https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/#define-a-grpc-liveness-probe",
      "groupId": "podsWorkloads",
      "isBoss": false
    },
    {
      "type": "scenario",
      "q": "🚨 INCIDENT: Pod stuck in \"Pending\" for 10 minutes. kubectl describe pod shows: \"0/3 nodes are available: 3 Insufficient memory.\" What is the best FIX?",
      "context": "kubectl get pods\nNAME          READY   STATUS    RESTARTS\nmy-api-xyz    0/1     Pending   0         10m\n\nkubectl describe pod my-api-xyz\nEvents:\n  Warning  FailedScheduling  0/3 nodes available:\n           3 Insufficient memory.",
      "options": [
        "📉 Lower resources.requests.memory in the Deployment spec",
        "🔄 Delete and recreate the pod — it's probably a glitch",
        "📊 kubectl top nodes — check actual node memory usage",
        "➕ Add more nodes to the cluster immediately"
      ],
      "answer": 0,
      "explain": "The scheduler rejects placement because requested memory exceeds what any node can reserve. The fix is to right-size `resources.requests.memory` based on actual observed usage (e.g., from monitoring or pprof). Blindly lowering requests without data risks OOMKill later, so verify real consumption first, then adjust.",
      "wrongReasons": [
        null,
        "Deleting and recreating won't help — the scheduler will reject it again for the exact same reason. This is a resource constraint, not a transient error.",
        "kubectl top nodes shows live usage and is a good secondary step, but the events already pinpoint the cause — insufficient memory headroom for scheduling. Start by right-sizing requests based on known usage data.",
        "Adding nodes is a valid long-term fix but it's disproportionate as a first step. First check if your memory request is accurate — many devs set requests too high by copying prod values to test configs."
      ],
      "tip": "Go tip: Profile your Go service with pprof to get realistic memory numbers. runtime.MemStats.Sys gives actual OS memory used. Set requests to ~80% of typical steady-state, limits to 2x.",
      "deepDive": "Use a quick triage sequence: check pod events, inspect the Deployment resource requests, compare with node allocatable capacity, then right-size requests based on real usage. Requests drive scheduling; limits do not. After remediation, verify the pod schedules and monitor memory usage to avoid repeated Pending/OOM cycles.\n\nOfficial Kubernetes docs:\n- https://kubernetes.io/docs/tasks/configure-pod-container/assign-memory-resource/\n- https://kubernetes.io/docs/concepts/scheduling-eviction/kube-scheduler/",
      "groupId": "podsWorkloads",
      "isBoss": false
    },
    {
      "type": "command",
      "q": "Build the kubectl command to scale your \"api-gateway\" Deployment to 5 replicas in the \"production\" namespace.",
      "context": "# Your Go service is getting heavy traffic\n# Need to scale up immediately",
      "tokens": [
        "kubectl",
        "scale",
        "deployment",
        "api-gateway",
        "--replicas=5",
        "-n",
        "production",
        "get",
        "pods",
        "--watch"
      ],
      "answer": [
        "kubectl",
        "scale",
        "deployment",
        "api-gateway",
        "--replicas=5",
        "-n",
        "production"
      ],
      "explain": "`kubectl scale deployment api-gateway --replicas=5 -n production` is the direct imperative action for fast horizontal scaling. It updates desired replicas immediately through the Deployment controller.",
      "wrongReasons": [],
      "tip": "In production, prefer editing the Deployment YAML and running kubectl apply — keeps your Git state (GitOps) in sync with the cluster. Imperative commands are great for emergencies.",
      "deepDive": "After scaling, confirm readiness with `kubectl rollout status deployment/api-gateway -n production` and verify endpoints increased behind the Service. In GitOps environments, mirror emergency imperative changes back to Git quickly so desired state in source control matches live cluster state and does not get reverted unexpectedly.\n\nOfficial Kubernetes docs:\n- https://kubernetes.io/docs/reference/generated/kubectl/kubectl-commands#scale\n- https://kubernetes.io/docs/concepts/workloads/controllers/deployment/",
      "groupId": "podsWorkloads",
      "isBoss": false
    },
    {
      "type": "quiz",
      "q": "In your Pod spec, what does initContainers do, and when would a Go developer use it?",
      "context": "spec:\n  initContainers:\n  - name: wait-for-db\n    image: busybox\n    command: ['sh', '-c', 'until nc -z db-svc 5432; do sleep 2; done']\n  containers:\n  - name: my-go-app\n    image: myapp:v1",
      "options": [
        "Run sidecar containers alongside the main app forever",
        "Run setup containers that must complete before the main container starts",
        "Initialize environment variables from ConfigMaps",
        "Pre-pull container images to speed up startup"
      ],
      "answer": 1,
      "explain": "initContainers run sequentially before any app container starts, and each must exit successfully (exit code 0) before the next one begins. If any init container fails, the pod restarts. They are ideal for dependency checks, migrations, or config generation tasks that must complete before serving traffic.",
      "wrongReasons": [
        "Sidecars run alongside the app for the pod lifetime. initContainers are temporary setup steps that finish before main containers start.",
        null,
        "ConfigMap value injection is configured through `env`, `envFrom`, or mounted volumes, not by initContainers alone.",
        "Image caching/pull behavior is handled by kubelet and image policy settings, not by initContainers."
      ],
      "tip": "Go tip: Use initContainers to run db migrations (with golang-migrate or pressly/goose) before your main Go service starts. This ensures the schema is ready before the app accepts traffic.",
      "deepDive": "Typical pattern: initContainer waits for database/network prerequisites, writes generated files into a shared volume, and exits. Keep init logic idempotent and quick. If init fails repeatedly, inspect init container logs first, because main app logs may never appear until init completes.\n\nOfficial Kubernetes docs:\n- https://kubernetes.io/docs/concepts/workloads/pods/init-containers/\n- https://kubernetes.io/docs/concepts/workloads/pods/sidecar-containers/",
      "groupId": "podsWorkloads",
      "isBoss": false
    },
    {
      "type": "quiz",
      "q": "Your Go HTTP service runs inside k8s. Another service needs to call it. What hostname should the caller use if they're in the SAME namespace?",
      "context": "// Calling service in go-services namespace\n// Target: \"inventory-svc\" also in go-services namespace\n\nresp, err := http.Get(\"http://????????/items\")",
      "options": [
        "http://inventory-svc/items",
        "http://localhost/items",
        "http://10.0.0.5/items (pod IP)",
        "http://inventory-svc.go-services.svc.cluster.local/items"
      ],
      "answer": 0,
      "explain": "Inside one namespace, Kubernetes DNS search paths let you call a Service by short name (`inventory-svc`). This resolves to the Service ClusterIP without hardcoded pod addresses.",
      "wrongReasons": [
        null,
        "localhost refers to the loopback interface on the same pod. You'd use this to talk to a sidecar container in the same pod, not a different Service.",
        "Pod IPs are ephemeral — they change every time a pod restarts. Never hardcode pod IPs. Always use Service names, which are stable DNS entries.",
        "The full FQDN (inventory-svc.go-services.svc.cluster.local) also works and is needed for cross-namespace calls, but within the same namespace the short form is sufficient and cleaner."
      ],
      "tip": "Go tip: Inject service URLs via environment variables or ConfigMaps: DB_URL=http://inventory-svc:8080. Use os.Getenv(\"INVENTORY_URL\") in your Go code — never hardcode k8s DNS names.",
      "deepDive": "For cross-namespace calls, use `service.namespace` or full FQDN (`service.namespace.svc.cluster.local`). Prefer Service DNS names over pod IPs because pods are ephemeral. During debugging, compare DNS resolution with actual Service endpoints to catch selector or readiness mismatches.\n\nOfficial Kubernetes docs:\n- https://kubernetes.io/docs/concepts/services-networking/dns-pod-service/\n- https://kubernetes.io/docs/concepts/services-networking/service/",
      "groupId": "servicesNetworking",
      "isBoss": false
    },
    {
      "type": "quiz",
      "q": "What is the difference between ClusterIP, NodePort, and LoadBalancer Service types?",
      "context": "# Which type for which use case?\ntype: ClusterIP    # ???\ntype: NodePort     # ???\ntype: LoadBalancer # ???",
      "options": [
        "ClusterIP=internal only; NodePort=exposed on node IP:port; LoadBalancer=cloud load balancer",
        "ClusterIP=external; NodePort=internal; LoadBalancer=DNS only",
        "All three do the same thing, just different names for clarity",
        "ClusterIP=HTTP only; NodePort=TCP only; LoadBalancer=UDP only"
      ],
      "answer": 0,
      "explain": "ClusterIP is internal-only service exposure, NodePort opens a fixed port on each node, and LoadBalancer provisions an external cloud LB. Choose based on traffic origin and operational cost model.",
      "wrongReasons": [
        null,
        "This is inverted. ClusterIP is internal, not external. NodePort is exposed outside but only via node IPs (awkward for production). LoadBalancer is the cloud-native external exposure.",
        "They are very different! ClusterIP pods can't be reached from outside the cluster. Using the wrong type can either expose services publicly by accident or make them unreachable.",
        "All Service types support multiple protocols (TCP, UDP, HTTP at the application layer). The type determines *routing* and *exposure*, not which protocol is allowed."
      ],
      "tip": "Go tip: For local development with kind/minikube, use kubectl port-forward instead of NodePort. For production, use LoadBalancer or Ingress (which sits in front of a ClusterIP Service).",
      "deepDive": "In production HTTP systems, the common pattern is Ingress (or Gateway API) fronting ClusterIP Services. This avoids one LoadBalancer per Service and centralizes TLS, routing, and policy. NodePort is useful for labs and on-prem patterns but rarely the primary public entry strategy in cloud setups. There is also `ExternalName`, a fourth Service type that acts as a CNAME alias to an external DNS name — useful for referencing managed databases or external APIs through in-cluster DNS.\n\nOfficial Kubernetes docs:\n- https://kubernetes.io/docs/concepts/services-networking/service/\n- https://kubernetes.io/docs/tutorials/kubernetes-basics/expose/expose-intro/",
      "groupId": "servicesNetworking",
      "isBoss": false
    },
    {
      "type": "scenario",
      "q": "🚨 INCIDENT: Your pod is in CrashLoopBackOff. What is the best FIRST command to identify the root cause quickly?",
      "context": "kubectl get pods\nNAME            READY   STATUS             RESTARTS\npayments-api    0/1     CrashLoopBackOff   7",
      "options": [
        "📋 kubectl logs payments-api --previous",
        "🗑️ kubectl delete pod payments-api",
        "📈 kubectl scale deployment payments-api --replicas=5",
        "🔧 kubectl drain worker-1 --ignore-daemonsets"
      ],
      "answer": 0,
      "explain": "Start with `kubectl logs payments-api --previous` to inspect the last crashed container run. CrashLoopBackOff is usually caused by startup failure, bad config, failed dependency, or probe misconfiguration.",
      "wrongReasons": [
        null,
        "Deleting the pod hides evidence and often recreates the same failing pod with the same crash behavior.",
        "Scaling a crashing deployment just creates more crashing pods and noise.",
        "Node drain is unrelated unless you already proved a node issue, which this symptom does not show."
      ],
      "tip": "Go tip: Ensure your app logs fatal startup errors before exit. Silent exits make CrashLoop debugging much harder.",
      "deepDive": "Recommended sequence: previous logs, `kubectl describe pod` events, image/config references, then probe/resource settings. Avoid deleting pods before collecting evidence. If logs are empty, verify command/entrypoint and check whether the process exits before logging initialization.\n\nOfficial Kubernetes docs:\n- https://kubernetes.io/docs/tasks/debug/debug-application/debug-running-pod/\n- https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/",
      "groupId": "podsWorkloads",
      "isBoss": false
    },
    {
      "type": "command",
      "q": "Build the kubectl command to show logs from the previous crashed container instance for pod `payments-api`.",
      "context": "# Pod keeps restarting\n# Need logs from the last failed run",
      "tokens": [
        "kubectl",
        "logs",
        "payments-api",
        "--previous",
        "-f",
        "describe",
        "pod",
        "-n",
        "default"
      ],
      "answer": [
        "kubectl",
        "logs",
        "payments-api",
        "--previous"
      ],
      "explain": "`kubectl logs payments-api --previous` retrieves logs from the last terminated container instance, which is essential when a pod restarts rapidly and current logs are incomplete.",
      "wrongReasons": [],
      "tip": "Add `-n <namespace>` in real environments to avoid pulling logs from a similarly named pod in the wrong namespace.",
      "deepDive": "For multi-container pods, add `-c <container>` to target the right process. Pair previous logs with events and restart count to distinguish app crashes from probe kills, OOM events, or image/runtime issues. Capture these diagnostics before rollout changes to preserve root-cause evidence.\n\nOfficial Kubernetes docs:\n- https://kubernetes.io/docs/reference/generated/kubectl/kubectl-commands#logs\n- https://kubernetes.io/docs/tasks/debug/debug-application/debug-running-pod/",
      "groupId": "podsWorkloads",
      "isBoss": false
    },
    {
      "type": "quiz",
      "q": "What is the core difference between livenessProbe and readinessProbe?",
      "context": "livenessProbe:  # ?\nreadinessProbe: # ?",
      "options": [
        "liveness decides if container should be restarted; readiness decides if pod should receive traffic",
        "liveness is only for HTTP and readiness is only for TCP",
        "readiness restarts the container; liveness removes pod from Service endpoints",
        "They are interchangeable and used for the same purpose"
      ],
      "answer": 0,
      "explain": "Liveness asks \"should this container be restarted?\" while readiness asks \"should this pod receive traffic right now?\" Keeping these responsibilities separate prevents both false restarts and bad traffic routing.",
      "wrongReasons": [
        null,
        "Both probes support multiple handlers (HTTP, TCP, exec, and gRPC in modern clusters).",
        "This is reversed. Readiness controls traffic routing; liveness can cause restarts.",
        "Misusing them causes either premature restarts or traffic sent to unready pods."
      ],
      "tip": "Go tip: Implement lightweight `/healthz` and `/readyz` with different semantics. Avoid using heavy DB queries in liveness endpoints.",
      "deepDive": "Use startupProbe for slow-booting apps so liveness does not kill containers during initialization. Key probe settings: `periodSeconds` (how often to check), `failureThreshold` (consecutive failures before action), and `initialDelaySeconds` (grace period before first check). Keep readiness strict enough to protect users and liveness conservative enough to avoid restart storms. A common mistake is using identical endpoints for both — readiness should reflect dependency health, while liveness should only detect deadlocks or unrecoverable states.\n\nOfficial Kubernetes docs:\n- https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/\n- https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/",
      "groupId": "podsWorkloads",
      "isBoss": false
    },
    {
      "type": "command",
      "q": "Build the command to list pods in namespace `production` with node/IP details.",
      "context": "# Need quick placement visibility during troubleshooting",
      "tokens": [
        "kubectl",
        "get",
        "pods",
        "-n",
        "production",
        "-o",
        "wide",
        "describe",
        "--watch",
        "nodes"
      ],
      "answer": [
        "kubectl",
        "get",
        "pods",
        "-n",
        "production",
        "-o",
        "wide"
      ],
      "explain": "`kubectl get pods -n production -o wide` adds node and pod IP placement data to standard pod listing, which is useful for networking and scheduling triage.",
      "wrongReasons": [],
      "tip": "Use this with `kubectl get endpoints <svc> -n production` to verify traffic routing to expected pods.",
      "deepDive": "Use wide output together with `kubectl get nodes -o wide` and Service endpoints to trace request path from client to Service to pod to node. This helps detect zone skew, node hotspots, or unexpected pod placement when incidents are topology-related.\n\nOfficial Kubernetes docs:\n- https://kubernetes.io/docs/reference/generated/kubectl/kubectl-commands#get\n- https://kubernetes.io/docs/concepts/architecture/nodes/",
      "groupId": "servicesNetworking",
      "isBoss": false
    },
    {
      "type": "scenario",
      "q": "🚨 INCIDENT: Service `checkout-svc` returns connection errors, but all pods are Running and selected by labels. What should you check FIRST?",
      "context": "kubectl get svc checkout-svc -o yaml\nspec:\n  port: 80\n  targetPort: 8081\n\nPods listen on containerPort: 8080",
      "options": [
        "🔍 Verify Service targetPort matches the container's listening port",
        "🌐 Check DNS resolution — run nslookup from inside a pod",
        "🛡️ Check if a NetworkPolicy is blocking traffic to the pods",
        "🔄 Restart the pods to force Service endpoint refresh"
      ],
      "answer": 0,
      "explain": "The context shows targetPort: 8081 but pods listen on containerPort: 8080. This one-digit mismatch means the Service sends traffic to a port nobody is listening on, causing connection refused errors even though everything else looks healthy.",
      "wrongReasons": [
        null,
        "DNS resolution would fail with 'unknown host', not connection errors. The fact that you're getting connection errors means DNS resolved successfully — traffic reached a pod IP but hit the wrong port.",
        "NetworkPolicy blocks would result in timeout errors (packets dropped), not connection refused. Connection refused means the packet arrived but nothing was listening on that port.",
        "Restarting pods does not change the Service port configuration. The Service will still forward to targetPort 8081, and the new pods will still listen on 8080. The mismatch persists."
      ],
      "tip": "Go tip: Keep service port constants centralized in code/config to avoid drift between app and manifests.",
      "deepDive": "Validate all three layers together: container listens on expected port, Service `targetPort` points to that port (number or name), and endpoints exist for ready pods. Named ports can reduce mistakes during port refactors, but names must match exactly between pod spec and Service.\n\nOfficial Kubernetes docs:\n- https://kubernetes.io/docs/concepts/services-networking/service/\n- https://kubernetes.io/docs/tasks/debug/debug-application/debug-service/",
      "groupId": "servicesNetworking",
      "isBoss": false
    },
    {
      "type": "command",
      "q": "Build the command to expose deployment `checkout-api` as ClusterIP service `checkout-svc` on port 80 targeting container port 8080.",
      "context": "# Need internal cluster-only access for checkout API",
      "tokens": [
        "kubectl",
        "expose",
        "deployment",
        "checkout-api",
        "--name=checkout-svc",
        "--port=80",
        "--target-port=8080",
        "--type=ClusterIP",
        "get",
        "services"
      ],
      "answer": [
        "kubectl",
        "expose",
        "deployment",
        "checkout-api",
        "--name=checkout-svc",
        "--port=80",
        "--target-port=8080",
        "--type=ClusterIP"
      ],
      "explain": "This command creates an internal ClusterIP Service mapping port 80 to container port 8080 for pods selected from the deployment.",
      "wrongReasons": [],
      "tip": "Even if you use imperative commands in labs, commit equivalent YAML in Git for production traceability.",
      "deepDive": "After creating the Service, verify with `kubectl get svc checkout-svc` and `kubectl get endpoints checkout-svc`. If endpoints are empty, selector/label mismatch or pod readiness is usually the cause. Keep declarative manifests as the source of truth even if imperative commands are used for speed.\n\nOfficial Kubernetes docs:\n- https://kubernetes.io/docs/reference/generated/kubectl/kubectl-commands#expose\n- https://kubernetes.io/docs/concepts/services-networking/service/",
      "groupId": "servicesNetworking",
      "isBoss": false
    },
    {
      "type": "quiz",
      "q": "How does a Kubernetes Service know which pods to send traffic to?",
      "context": "apiVersion: v1\nkind: Service\nmetadata:\n  name: api-svc\nspec:\n  selector:\n    app: api        # <-- what does this do?\n  ports:\n  - port: 80\n    targetPort: 8080",
      "options": [
        "It matches pods by name prefix (e.g., pods starting with 'api-')",
        "It uses the selector field to match pods with matching labels",
        "It automatically discovers all pods in the same namespace",
        "It routes to pods based on their IP addresses"
      ],
      "answer": 1,
      "explain": "Services use label selectors to find their target pods. A Service with `selector: {app: api}` routes traffic only to pods that have the label `app: api`. If a pod's labels don't match, the Service ignores it — even if the pod is Running in the same namespace.",
      "wrongReasons": [
        "Kubernetes does not match by name prefix. Pod names are generated by ReplicaSets with random suffixes. The Service-to-pod link is always through labels, not names.",
        null,
        "Services do NOT auto-discover all pods. Without a matching selector, a Service has zero endpoints. This is by design — it gives you precise control over traffic routing.",
        "Pod IPs are ephemeral and change on every restart. Services use labels (stable metadata) to find pods, then resolve current IPs through Endpoints or EndpointSlice objects."
      ],
      "tip": "Go tip: Use `kubectl get endpoints api-svc` to see which pod IPs the Service actually routes to. If the list is empty, your labels don't match the selector.",
      "deepDive": "Labels are key-value pairs attached to any Kubernetes object. Selectors are queries that filter by those labels. This pattern is used everywhere: Services select pods, Deployments manage ReplicaSets, NetworkPolicies select targets. A mismatch between a Service selector and pod labels is one of the most common causes of 'Service not working' incidents.\n\nOfficial Kubernetes docs:\n- https://kubernetes.io/docs/concepts/services-networking/service/\n- https://kubernetes.io/docs/concepts/services-networking/endpoint-slices/",
      "groupId": "servicesNetworking",
      "isBoss": false
    },
    {
      "type": "scenario",
      "q": "🚨 INCIDENT: A pod shows `ImagePullBackOff` status. What does this mean and what should you check FIRST?",
      "context": "kubectl get pods\nNAME            READY   STATUS             RESTARTS   AGE\npayments-api    0/1     ImagePullBackOff   0          3m\n\nkubectl describe pod payments-api\nEvents:\n  Warning  Failed  Failed to pull image \"myapp:v2.1\":\n           rpc error: manifest for myapp:v2.1 not found",
      "options": [
        "🔍 The image name or tag is wrong — verify the image exists in the registry",
        "🔄 Restart the kubelet on the node",
        "📈 Increase CPU requests so the image can download faster",
        "🛡️ Add a NetworkPolicy to allow image pulls"
      ],
      "answer": 0,
      "explain": "ImagePullBackOff means Kubernetes tried to pull the container image and failed. The most common causes are: wrong image name, wrong tag (typo or tag doesn't exist), or missing registry credentials. Always check the Events in `kubectl describe pod` — they tell you exactly what went wrong.",
      "wrongReasons": [
        null,
        "The kubelet is working correctly — it's reporting the pull failure. The problem is the image reference, not the kubelet process.",
        "CPU requests affect scheduling and runtime throttling, not image downloads. Image pulls are a network operation handled by the container runtime.",
        "NetworkPolicy controls pod-to-pod traffic, not image pulls. Image pulls go through the container runtime (containerd/CRI-O) on the node, outside the pod network."
      ],
      "tip": "Go tip: Always use specific image tags (myapp:v2.1.0 or commit SHA) instead of :latest. If :latest changes in the registry, you can't tell which version is running in your cluster.",
      "deepDive": "Common ImagePullBackOff causes: (1) typo in image name or tag, (2) tag doesn't exist in the registry, (3) private registry without authentication (needs imagePullSecrets — covered in L2), (4) registry is unreachable (network/firewall). The 'BackOff' part means k8s retries with increasing delays (10s, 20s, 40s...) to avoid hammering the registry.\n\nOfficial Kubernetes docs:\n- https://kubernetes.io/docs/concepts/containers/images/\n- https://kubernetes.io/docs/tasks/configure-pod-container/pull-image-private-registry/",
      "groupId": "podsWorkloads",
      "isBoss": false
    },
    {
      "type": "command",
      "q": "Build the command to watch rollout progress of deployment `checkout-api` in namespace `production`.",
      "context": "# Deployment updated\n# Need to confirm whether rollout is healthy",
      "tokens": [
        "kubectl",
        "rollout",
        "status",
        "deployment/checkout-api",
        "-n",
        "production",
        "history",
        "restart",
        "get",
        "pods"
      ],
      "answer": [
        "kubectl",
        "rollout",
        "status",
        "deployment/checkout-api",
        "-n",
        "production"
      ],
      "explain": "`kubectl rollout status deployment/checkout-api -n production` tracks whether the Deployment update converges successfully or stalls.",
      "wrongReasons": [],
      "tip": "Use rollout status in CI to fail fast when readiness never converges after deploy.",
      "deepDive": "If rollout stalls, inspect Deployment conditions, ReplicaSet status, probe failures, and events. Use `kubectl rollout history` for revision context and `kubectl rollout undo` when rollback is safer than continued retries. Tie rollout checks into CI/CD gates for safer releases.\n\nOfficial Kubernetes docs:\n- https://kubernetes.io/docs/reference/generated/kubectl/kubectl-commands#rollout\n- https://kubernetes.io/docs/concepts/workloads/controllers/deployment/",
      "groupId": "deploymentsRollouts",
      "isBoss": false
    },
    {
      "type": "quiz",
      "q": "Your team runs separate environments in one cluster. What Kubernetes resource isolates workloads by team or environment?",
      "context": "# You have:\n# - Team A: payments service (production)\n# - Team B: payments service (staging)\n# Both named 'payments-api' — how to avoid conflicts?",
      "options": [
        "Namespaces — logical partitions within a cluster",
        "Nodes — assign each team their own node",
        "Labels — tag pods with team=A or team=B",
        "Separate clusters for each team"
      ],
      "answer": 0,
      "explain": "Namespaces provide logical isolation within a single cluster. They allow different teams or environments to use the same resource names (e.g., both can have a 'payments-api' Deployment) without conflict. RBAC, ResourceQuotas, and NetworkPolicies can all be scoped per namespace.",
      "wrongReasons": [
        null,
        "Dedicating nodes per team wastes resources and doesn't solve naming conflicts. Pods on separate nodes can still see each other's Services unless restricted by NetworkPolicy.",
        "Labels help organize and select resources but don't provide name isolation. Two Deployments named 'payments-api' with different labels still conflict in the same namespace.",
        "Separate clusters provide the strongest isolation but are expensive to operate. Namespaces give sufficient isolation for most multi-team and multi-environment setups."
      ],
      "tip": "Go tip: Always use `-n <namespace>` in kubectl commands, or set a default with `kubectl config set-context --current --namespace=staging` to avoid accidentally modifying the wrong environment.",
      "deepDive": "Every cluster starts with `default`, `kube-system` (control plane components), and `kube-public` (cluster-wide readable resources). In practice, create namespaces per environment (dev, staging, prod) or per team. Pair namespaces with ResourceQuotas to cap CPU/memory per team and LimitRanges to set default requests/limits for pods that don't specify them.\n\nOfficial Kubernetes docs:\n- https://kubernetes.io/docs/concepts/overview/working-with-objects/namespaces/\n- https://kubernetes.io/docs/concepts/policy/resource-quotas/",
      "groupId": "podsWorkloads",
      "isBoss": false
    },
    {
      "type": "scenario",
      "q": "🚨 INCIDENT: After traffic spike, pods restart with `OOMKilled`. What is the best first remediation?",
      "context": "kubectl describe pod\nLast State: Terminated\nReason: OOMKilled\nExit Code: 137",
      "options": [
        "📈 Increase memory limit/request based on observed usage and profile the app",
        "⚙️ Set CPU limit to 0 to avoid throttling",
        "🔀 Change Service type to LoadBalancer",
        "🚫 Disable liveness probe permanently"
      ],
      "answer": 0,
      "explain": "OOMKilled means container memory usage exceeded its limit. First right-size memory requests/limits using measured usage, then investigate allocation spikes or leaks.",
      "wrongReasons": [
        null,
        "CPU limit changes do not fix memory exhaustion.",
        "Service type does not affect container memory limits.",
        "Disabling liveness can hide failures and is unrelated to OOM root cause."
      ],
      "tip": "Go tip: Capture heap profiles under load (`pprof`) and cap cache sizes to avoid unbounded memory growth in containers.",
      "deepDive": "Use heap profiles, GC metrics, and traffic correlation to separate normal burst from leak behavior. Requests influence scheduling; limits enforce runtime ceilings. Repeated OOM under peak load usually means either memory limit is too low, workload is underprovisioned, or app memory lifecycle needs optimization.\n\nOfficial Kubernetes docs:\n- https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/\n- https://kubernetes.io/docs/concepts/workloads/pods/pod-qos/",
      "groupId": "podsWorkloads",
      "isBoss": false
    },
    {
      "type": "command",
      "q": "Build the kubectl command to get detailed information about pod `api-server` in namespace `production`, including events and conditions.",
      "context": "# Pod is misbehaving — need full details:\n# status, events, volumes, probe results",
      "tokens": [
        "kubectl",
        "describe",
        "pod",
        "api-server",
        "-n",
        "production",
        "get",
        "logs",
        "-o",
        "yaml"
      ],
      "answer": [
        "kubectl",
        "describe",
        "pod",
        "api-server",
        "-n",
        "production"
      ],
      "explain": "`kubectl describe pod` shows a comprehensive view: metadata, containers, conditions, volumes, and events. It is the single most useful debugging command — always check it before diving into logs or raw YAML.",
      "wrongReasons": [],
      "tip": "Go tip: `kubectl describe` works on any resource type — try `describe svc`, `describe node`, `describe deployment` to debug routing, capacity, and rollout issues respectively.",
      "deepDive": "The Events section at the bottom of describe output is especially valuable. It shows scheduling decisions, image pull results, probe outcomes, and restart reasons. Events are retained for about 1 hour by default, so capture them early during incidents. For persistent event history, forward cluster events to your logging system.\n\nOfficial Kubernetes docs:\n- https://kubernetes.io/docs/reference/generated/kubectl/kubectl-commands#describe\n- https://kubernetes.io/docs/tasks/debug/debug-application/debug-running-pod/",
      "groupId": "podsWorkloads",
      "isBoss": false
    },
    {
      "type": "scenario",
      "q": "🚨 INCIDENT: Your Go HTTP server returns 503 to 30% of requests. Your Deployment has 3 pods, all Running. What do you check FIRST?",
      "context": "NAMESPACE: production\nDEPLOYMENT: http-server  DESIRED: 3  CURRENT: 3\nPOD STATUS: Running Running Running\n\nERROR RATE: 30% of requests return 503 from the load balancer",
      "options": [
        "📋 kubectl logs <pod> — check app-level errors",
        "🔍 kubectl describe svc — check Service selector labels match pod labels",
        "📊 kubectl top pods — check CPU/memory pressure",
        "🔄 kubectl rollout restart — just restart everything"
      ],
      "answer": 1,
      "explain": "Pods showing Running does not guarantee they receive traffic — that depends on the Service selector matching pod labels AND pods passing readiness probes. With intermittent 503s, first validate the Service-to-pod routing chain: selector labels, endpoint list, and readiness state. A mismatch at any layer causes partial failures.",
      "wrongReasons": [
        "Logs are useful next, but first confirm traffic is reaching the intended ready endpoints. Otherwise log analysis can mislead by focusing on healthy pods only.",
        null,
        "CPU/memory pressure can increase latency, but 503 typically indicates upstream endpoint availability or routing issues first.",
        "Immediate restart can mask symptoms without fixing selector/readiness/root-cause configuration problems."
      ],
      "tip": "Go tip: kubectl get endpoints <service-name> shows the actual pod IPs the Service routes to. Compare this count with your replica count — they should match.",
      "deepDive": "Use this sequence: `kubectl describe svc`, `kubectl get endpoints`, and pod labels/readiness checks. Ensure endpoint count matches ready replicas and that selectors target only intended pods. Once routing is confirmed, then inspect app logs and resource pressure for secondary contributing factors.\n\nOfficial Kubernetes docs:\n- https://kubernetes.io/docs/concepts/services-networking/service/\n- https://kubernetes.io/docs/tasks/debug/debug-application/debug-service/",
      "groupId": "servicesNetworking",
      "isBoss": true
    }
  ]
});
