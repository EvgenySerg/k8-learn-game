window.KUBECRAFT_LEVEL_DATA = window.KUBECRAFT_LEVEL_DATA || [];
window.KUBECRAFT_LEVEL_DATA.push({
  "id": "level-4",
  "title": "Level 4 · Control Plane Specialist",
  "difficulty": "Intermediate+",
  "badgeIcon": "🧠",
  "badgeName": "Control Plane Specialist",
  "description": "Learn autoscaling behavior, secure access boundaries, and reconciliation-driven platform extension patterns.",
  "status": "active",
  "targetQuestionCount": 24,
  "focus": [
    "Autoscaling",
    "RBAC & Security",
    "Operators & CRDs"
  ],
  "questions": [
    {
      "type": "command",
      "q": "Build the kubectl command to apply \"deployment.yaml\" and then watch the rollout status of \"my-service\".",
      "context": "# CI/CD pipeline step\n# Apply manifest, then wait for rollout to complete",
      "tokens": [
        "kubectl",
        "apply",
        "-f",
        "deployment.yaml",
        "&&",
        "rollout",
        "status",
        "deployment/my-service",
        "get",
        "pods"
      ],
      "answer": [
        "kubectl",
        "apply",
        "-f",
        "deployment.yaml",
        "&&",
        "kubectl",
        "rollout",
        "status",
        "deployment/my-service"
      ],
      "explain": "kubectl apply -f applies the manifest declaratively. && chains the second command. kubectl rollout status watches and blocks until the rollout completes (exit 0) or fails (exit 1).",
      "wrongReasons": [],
      "tip": "Add --timeout=5m to rollout status so your CI pipeline fails after a timeout instead of hanging: kubectl rollout status deployment/my-service --timeout=5m",
      "deepDive": "In GitHub Actions / GitLab CI: the exit code of rollout status determines if the pipeline step passes or fails. Exit 1 on timeout lets you auto-trigger rollback. Combine with kubectl rollout undo if the status fails.",
      "groupId": "deploymentsRollouts",
      "isBoss": false
    },
    {
      "type": "quiz",
      "q": "You want your Go API to automatically scale between 2 and 10 replicas based on CPU. Which resource do you create?",
      "context": "# Go API with variable traffic patterns\n# 2am: 2 pods needed\n# 2pm: maybe 10 pods needed\n# Don't want to manually scale",
      "options": [
        "VerticalPodAutoscaler (VPA)",
        "HorizontalPodAutoscaler (HPA)",
        "ClusterAutoscaler",
        "PodDisruptionBudget (PDB)"
      ],
      "answer": 1,
      "explain": "HPA watches metrics (CPU, memory, or custom) and automatically adjusts the replica count of a Deployment. It calls the same scale API you'd call manually.",
      "wrongReasons": [
        "VPA adjusts the resource requests/limits of existing pods (makes pods bigger/smaller), not the number of pods. It often requires pod restarts to apply changes. VPA and HPA on the same Deployment conflict — use one or the other (usually HPA for stateless Go services).",
        null,
        "ClusterAutoscaler scales the number of NODES in the cluster, not pods. It triggers when pods are Pending due to insufficient node resources. It's complementary to HPA — HPA scales pods, CA scales nodes.",
        "PDB protects availability during disruptions — it doesn't scale anything. It's a defensive policy, not a scaling mechanism."
      ],
      "tip": "Go tip: For accurate CPU-based HPA, expose /metrics with Prometheus histograms. For queue-based Go workers, use KEDA (Kubernetes Event-Driven Autoscaling) — scale based on queue depth, not just CPU.",
      "deepDive": "# HPA example:\nkubectl autoscale deployment my-go-api \\\n  --min=2 --max=10 --cpu-percent=70\n\n# Or declarative YAML with custom metrics for Go:\n# scale when p95 latency > 200ms using Prometheus adapter",
      "groupId": "autoscaling",
      "isBoss": false
    },
    {
      "type": "quiz",
      "q": "Your Go service processes messages from a Kafka topic. You want to scale based on consumer lag. What tool is best suited for this?",
      "context": "# Go Kafka consumer\n# Low traffic: 2 replicas enough\n# High traffic: need 20 replicas\n# CPU usage is low even during high traffic (I/O bound)",
      "options": [
        "HPA with CPU metric — CPU should correlate with Kafka load",
        "KEDA (Kubernetes Event-Driven Autoscaling) with Kafka trigger",
        "VPA — make each pod use more CPU to handle more messages",
        "Manual scaling via a cron job that checks lag"
      ],
      "answer": 1,
      "explain": "KEDA extends k8s with event-driven scaling triggers. The Kafka scaler reads consumer group lag and scales your Deployment proportionally — 1 pod per N lagging messages, for example.",
      "wrongReasons": [
        "HPA on CPU won't work well for I/O-bound Kafka consumers. A pod waiting on Kafka messages uses near-zero CPU while its lag grows. CPU-based HPA would never scale up even with 1 million unprocessed messages.",
        null,
        "VPA makes pods bigger (more CPU/memory), not more numerous. For a Kafka consumer, the bottleneck is number of goroutines/partitions reading, not per-pod resources. More pods = more parallel partition consumers.",
        "A cron job polling Kafka lag and running kubectl scale is DIY KEDA — fragile, hard to test, and reinventing the wheel. KEDA is open-source, battle-tested, and handles edge cases you'd need to solve yourself."
      ],
      "tip": "Go tip: Each Kafka partition can be consumed by one goroutine. Scale your Deployment replicas up to the number of partitions for maximum parallelism. Use confluent-kafka-go or segmentio/kafka-go.",
      "deepDive": "KEDA supports 50+ scalers: RabbitMQ, Redis, AWS SQS, Prometheus metrics, cron schedules, and more. For Go microservices using queues, KEDA + ScaledObject replaces complex custom autoscaling logic entirely.",
      "groupId": "autoscaling",
      "isBoss": false
    },
    {
      "type": "quiz",
      "q": "Your Go service uses client-go to list pods in the cluster. The pod shows \"Error: pods is forbidden.\" What do you need to create?",
      "context": "// In Go code using client-go:\npods, err := clientset.CoreV1().Pods(\"\").List(ctx, v1.ListOptions{})\n// Error: pods is forbidden: User \"system:serviceaccount:default:default\"\n// cannot list resource \"pods\" in API group \"\" at the cluster scope",
      "options": [
        "A NetworkPolicy to allow cluster API access",
        "A ServiceAccount, ClusterRole with pod list permission, and ClusterRoleBinding",
        "An Ingress rule to expose the k8s API internally",
        "A PodSecurityPolicy allowing the pod to call the API"
      ],
      "answer": 1,
      "explain": "RBAC controls what API operations pods can perform. You need: (1) ServiceAccount for the pod's identity, (2) ClusterRole with rules: [{apiGroups:[\"\"], resources:[\"pods\"], verbs:[\"list\"]}], (3) ClusterRoleBinding linking them.",
      "wrongReasons": [
        "NetworkPolicy controls pod-to-pod and pod-to-external network traffic. The k8s API server is accessible from pods by default via the kubernetes.default.svc ClusterIP — this is a permissions issue, not a network issue.",
        null,
        "Ingress rules expose Services externally (HTTP routes). The k8s API server already has an internal ClusterIP endpoint accessible to pods. No Ingress needed for pods to talk to the API server.",
        "PodSecurityPolicy is deprecated (removed in k8s 1.25). Even when it existed, it controlled pod-level security (root, host network, etc.) — not API permissions. RBAC handles API permissions."
      ],
      "tip": "Go tip: Use in-cluster config in your Go operator: config, _ := rest.InClusterConfig(). This automatically uses the pod's ServiceAccount token mounted at /var/run/secrets/kubernetes.io/serviceaccount/token.",
      "deepDive": "Principle of least privilege: create a dedicated ServiceAccount (not the default one) for your Go operator/controller. Grant only the exact verbs and resources it needs. Audit with: kubectl auth can-i list pods --as=system:serviceaccount:default:my-sa",
      "groupId": "rbacSecurity",
      "isBoss": false
    },
    {
      "type": "quiz",
      "q": "What is the difference between a Role and a ClusterRole in Kubernetes RBAC?",
      "context": "# Your Go controller needs to:\n# - List pods in its namespace\n# - List nodes cluster-wide\n# Which RBAC objects for each?",
      "options": [
        "Role = namespace-scoped permissions; ClusterRole = cluster-wide permissions",
        "Role = read-only permissions; ClusterRole = read/write permissions",
        "They are identical — ClusterRole is just Role applied to all namespaces",
        "Role = for users; ClusterRole = for ServiceAccounts (pods)"
      ],
      "answer": 0,
      "explain": "Role is scoped to a single namespace (bound via RoleBinding). ClusterRole applies cluster-wide (bound via ClusterRoleBinding) and can also grant access to cluster-scoped resources like Nodes.",
      "wrongReasons": [
        null,
        "Both Role and ClusterRole can grant any verbs (get, list, create, delete, patch, update, watch). The difference is scope (namespace vs cluster), not permission level.",
        "ClusterRole can be bound to a single namespace via RoleBinding (not ClusterRoleBinding). This lets you define a reusable ClusterRole but apply it per-namespace. A ClusterRoleBinding makes it cluster-wide.",
        "Both Role and ClusterRole apply to Users, Groups, and ServiceAccounts equally. The subject type is configured in the binding (RoleBinding/ClusterRoleBinding), not in the Role itself."
      ],
      "tip": "Go tip: When writing a controller with controller-runtime, use the +kubebuilder:rbac:... markers to auto-generate RBAC manifests. Example: //+kubebuilder:rbac:groups=\"\",resources=pods,verbs=get;list;watch",
      "deepDive": "Common cluster-scoped resources requiring ClusterRole: nodes, persistentvolumes, clusterroles, namespaces, customresourcedefinitions. Namespace-scoped (Role is enough): pods, services, deployments, secrets, configmaps.",
      "groupId": "rbacSecurity",
      "isBoss": false
    },
    {
      "type": "command",
      "q": "Build the kubectl command to check whether the \"deployer\" ServiceAccount in namespace \"ci\" can create Deployments.",
      "context": "# Security audit: verify CI service account permissions\n# Principle of least privilege check",
      "tokens": [
        "kubectl",
        "auth",
        "can-i",
        "create",
        "deployments",
        "--as=system:serviceaccount:ci:deployer",
        "-n",
        "ci",
        "get",
        "describe"
      ],
      "answer": [
        "kubectl",
        "auth",
        "can-i",
        "create",
        "deployments",
        "--as=system:serviceaccount:ci:deployer",
        "-n",
        "ci"
      ],
      "explain": "kubectl auth can-i <verb> <resource> --as=<user> checks if a given user/serviceaccount has a specific permission. Returns \"yes\" or \"no\" — great for security auditing.",
      "wrongReasons": [],
      "tip": "Use kubectl auth can-i --list --as=system:serviceaccount:ci:deployer -n ci to see ALL permissions a ServiceAccount has. Run this as part of your security reviews.",
      "deepDive": "Automate RBAC auditing in CI: run kubectl auth can-i for all permissions your service account needs, and fail the pipeline if any returns \"no\". This catches permission regressions before they hit production.",
      "groupId": "rbacSecurity",
      "isBoss": false
    },
    {
      "type": "quiz",
      "q": "What is a Kubernetes Operator and when would you write one in Go?",
      "context": "# You manage a fleet of Go microservices\n# Each service needs: Deployment + Service + HPA + ConfigMap\n# Currently: 4 separate YAML files per microservice\n# Operators can help...",
      "options": [
        "A kubectl plugin that adds new CLI commands",
        "A controller that manages Custom Resources, encoding operational knowledge (create, scale, heal, upgrade)",
        "A Helm chart that packages multiple resources together",
        "A cluster-level admin role with elevated permissions"
      ],
      "answer": 1,
      "explain": "An Operator is a controller that watches Custom Resources (CRDs) and manages k8s resources to match the desired state. It encodes human operational knowledge — \"how to run this software\" — in code.",
      "wrongReasons": [
        "kubectl plugins (via PATH discovery or krew) add CLI subcommands but don't run continuously in the cluster. Operators are server-side, always-running controllers in pods.",
        null,
        "Helm packages resources into templates but is a one-time deployment tool, not a continuous controller. Helm doesn't react to failures, scale based on state, or perform automated remediation.",
        "Cluster admin roles are RBAC concepts. Operators need appropriate permissions, but \"Operator\" refers to the controller pattern, not a security role."
      ],
      "tip": "Go tip: Use kubebuilder or operator-sdk to scaffold Go operators. The reconcile loop pattern maps perfectly to Go: watch for changes, compute diff, apply — idempotent and restartable.",
      "deepDive": "Famous Go operators: etcd-operator, prometheus-operator, cert-manager. The controller-runtime library (used by kubebuilder) handles watches, queuing, caching, and leader election. Your job: write the Reconcile(ctx, req) function.",
      "groupId": "operatorsCrds",
      "isBoss": false
    },
    {
      "type": "quiz",
      "q": "In a Kubernetes controller (Operator) written in Go, what is the reconciliation loop responsible for?",
      "context": "// Simplified reconcile function\nfunc (r *MyAppReconciler) Reconcile(ctx context.Context, req ctrl.Request) (ctrl.Result, error) {\n    // What should this function do?\n}",
      "options": [
        "Run once at startup to create initial resources, then exit",
        "Compare desired state (CR spec) with actual state (cluster), and make changes to converge them",
        "Forward HTTP requests from the CR to the correct pod",
        "Validate incoming kubectl apply commands before they reach the API server"
      ],
      "answer": 1,
      "explain": "Reconcile is called whenever the watched resource changes (or on a requeue). It must read the current state, compare to desired state, and apply changes. It must be idempotent — safe to run multiple times.",
      "wrongReasons": [
        "Reconcile runs continuously — it's re-triggered on changes, errors, and periodic requeues. If it exits after creating resources, your operator won't react to failures, drift, or updates. The always-running reconcile loop is what makes operators powerful.",
        null,
        "HTTP request forwarding is what a Service and Ingress do. Operators manage the lifecycle of k8s resources (create/update/delete Deployments, Services, etc.), not runtime request routing.",
        "Admission webhooks (ValidatingWebhookConfiguration, MutatingWebhookConfiguration) validate or mutate API requests before they're stored. Reconcile runs after resources are stored in etcd."
      ],
      "tip": "Go tip: Always make Reconcile idempotent. Use ctrl.Result{RequeueAfter: time.Minute} to periodically re-check. Use client.Patch instead of client.Update to avoid overwriting concurrent changes.",
      "deepDive": "// Idiomatic reconcile pattern in Go:\nfunc (r *Reconciler) Reconcile(ctx context.Context, req ctrl.Request) (ctrl.Result, error) {\n  var obj myv1.MyApp\n  if err := r.Get(ctx, req.NamespacedName, &obj); err != nil {\n    return ctrl.Result{}, client.IgnoreNotFound(err)\n  }\n  // compare and apply...\n  return ctrl.Result{RequeueAfter: 30 * time.Second}, nil\n}",
      "groupId": "operatorsCrds",
      "isBoss": false
    },
    {
      "type": "command",
      "q": "Build the kubectl command to create a HorizontalPodAutoscaler for deployment \"api-server\" with min 2, max 10 replicas, targeting 70% CPU in namespace \"production\".",
      "context": "# Go API traffic is spiky\n# Need automatic scaling between 2–10 pods\n# Target: 70% average CPU utilization",
      "tokens": [
        "kubectl",
        "autoscale",
        "deployment",
        "api-server",
        "--min=2",
        "--max=10",
        "--cpu-percent=70",
        "-n",
        "production",
        "scale",
        "set",
        "--replicas=10",
        "hpa"
      ],
      "answer": [
        "kubectl",
        "autoscale",
        "deployment",
        "api-server",
        "--min=2",
        "--max=10",
        "--cpu-percent=70",
        "-n",
        "production"
      ],
      "explain": "`kubectl autoscale` creates an HPA resource targeting the specified deployment. It watches average CPU utilization across all pods and adjusts replicas between --min and --max to keep usage near --cpu-percent.",
      "wrongReasons": [],
      "tip": "After creating, verify with `kubectl get hpa -n production`. The TARGETS column shows current vs target CPU. If it shows <unknown>/70%, your pods are missing resources.requests.cpu.",
      "deepDive": "The imperative command creates the equivalent of a declarative HPA YAML. For production, commit the HPA manifest to Git. HPA checks metrics every 15 seconds (default) and applies a stabilization window to prevent flapping. Combine with PDB to protect availability during scale-down.\n\nOfficial Kubernetes docs:\n- https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/\n- https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale-walkthrough/",
      "groupId": "autoscaling",
      "isBoss": false
    },
    {
      "type": "quiz",
      "q": "You created an HPA targeting 70% CPU, but `kubectl get hpa` shows TARGETS as `<unknown>/70%`. Pods are Running and healthy. What is the MOST LIKELY cause?",
      "context": "kubectl get hpa\nNAME         REFERENCE              TARGETS         MINPODS   MAXPODS   REPLICAS\napi-server   Deployment/api-server  <unknown>/70%   2         10        2\n\n# metrics-server is installed and working\n# kubectl top pods shows CPU usage fine",
      "options": [
        "Pods are missing resources.requests.cpu — HPA can't calculate percentage without a baseline",
        "metrics-server is not installed in the cluster",
        "Prometheus is not connected to the HPA",
        "The CPU limit is set too low for HPA to read"
      ],
      "answer": 0,
      "explain": "HPA calculates CPU utilization as (current usage / requested CPU) * 100%. Without `resources.requests.cpu` set on the container, HPA has no denominator and shows <unknown>. This is the most common HPA misconfiguration.",
      "wrongReasons": [
        null,
        "The context states metrics-server is installed and kubectl top works. If metrics-server were missing, kubectl top would fail too. The issue is in the pod spec, not the metrics pipeline.",
        "Standard CPU/memory HPA uses the Metrics API (metrics-server), not Prometheus. Prometheus is needed only for custom metrics via the Prometheus Adapter. Basic CPU scaling works without Prometheus.",
        "CPU limits cap how much CPU a container can use, but they don't affect HPA's ability to read metrics. HPA uses requests as the baseline denominator, not limits."
      ],
      "tip": "Go tip: Always set both requests and limits for containers under HPA. A good starting point: requests = steady-state usage (from kubectl top), limits = 2x requests for burst headroom.",
      "deepDive": "HPA formula: desiredReplicas = ceil(currentReplicas * (currentMetricValue / desiredMetricValue)). For CPU: currentMetricValue = average(pod CPU usage / pod CPU request) across all pods. Without requests, this fraction is undefined. The <unknown> state also appears briefly after HPA creation while the first metrics scrape completes (~15s).\n\nOfficial Kubernetes docs:\n- https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/\n- https://kubernetes.io/docs/reference/kubernetes-api/workload-resources/horizontal-pod-autoscaler-v2/",
      "groupId": "autoscaling",
      "isBoss": false
    },
    {
      "type": "scenario",
      "q": "🚨 INCIDENT: HPA scaled your Go API to 10 pods during a traffic spike. Traffic returned to normal 20 minutes ago, but replicas are still at 10. CPU is at 15%. Why hasn't HPA scaled down?",
      "context": "kubectl get hpa\nNAME         TARGETS   MINPODS   MAXPODS   REPLICAS\napi-server   15%/70%   2         10        10\n\n# Traffic spike ended 20 min ago\n# CPU is well below target\n# Expected: scale down to 2-3 pods\n# Actual: still 10 pods",
      "options": [
        "🔄 Delete the HPA and recreate it — it's stuck",
        "⏱️ HPA has a stabilization window for scale-down (default 5 min) — check behavior.scaleDown settings for a longer custom window",
        "📈 Increase maxReplicas so HPA has room to adjust",
        "🗑️ Manually delete the extra pods to force scale-down"
      ],
      "answer": 1,
      "explain": "HPA v2 has a `behavior.scaleDown` field with a stabilization window (default 300s / 5 min). If someone configured a longer window (e.g., 30 min), HPA waits that long after metrics drop before reducing replicas. Check `kubectl get hpa api-server -o yaml` for custom behavior settings.",
      "wrongReasons": [
        "Deleting and recreating HPA resets its state but doesn't fix the configuration. If a custom stabilization window is set, the new HPA will behave the same way. Always check the spec before recreating.",
        null,
        "Increasing maxReplicas allows scaling UP further, not down. The problem is HPA not scaling DOWN. maxReplicas has no effect on scale-down behavior.",
        "Manually deleting pods managed by a Deployment triggers immediate recreation. The Deployment controller maintains the desired replica count set by HPA, so new pods replace deleted ones instantly."
      ],
      "tip": "Go tip: Tune scale-down behavior for your workload. Stateless Go APIs can scale down aggressively (short window). Services with warm caches or connection pools benefit from slower scale-down to avoid cold-start latency spikes.",
      "deepDive": "HPA v2 behavior example for fast scale-down:\nbehavior:\n  scaleDown:\n    stabilizationWindowSeconds: 60\n    policies:\n    - type: Percent\n      value: 50\n      periodSeconds: 60\n\nThis allows removing up to 50% of pods per minute, with only 60s stabilization. The default (5 min, 100% per 15s) is conservative to prevent flapping.\n\nOfficial Kubernetes docs:\n- https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/#configurable-scaling-behavior\n- https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/#scaling-policies",
      "groupId": "autoscaling",
      "isBoss": false
    },
    {
      "type": "quiz",
      "q": "When should you use VerticalPodAutoscaler (VPA) instead of HorizontalPodAutoscaler (HPA)?",
      "context": "# Scenario: single-instance PostgreSQL on k8s\n# Can't add more replicas (primary is one)\n# But sometimes needs more CPU/memory\n# HPA won't help here — what will?",
      "options": [
        "VPA is always better than HPA — use it for everything",
        "VPA right-sizes resource requests for workloads that cannot scale horizontally (single-instance DBs, legacy apps)",
        "Use VPA and HPA together on the same Deployment for maximum efficiency",
        "VPA scales the number of nodes, not pods"
      ],
      "answer": 1,
      "explain": "VPA adjusts a pod's CPU/memory requests based on observed usage. It's designed for workloads where adding replicas isn't possible — single-primary databases, batch jobs, or legacy apps that don't support horizontal scaling.",
      "wrongReasons": [
        "VPA is NOT always better. For stateless services (like Go APIs), HPA is usually preferred because adding pods is faster and less disruptive than resizing. VPA often requires pod restarts to apply new requests.",
        null,
        "Running VPA and HPA on the same Deployment for the same metric (CPU) causes conflicts — both try to adjust the workload simultaneously. VPA changes requests, which changes HPA's percentage calculation, creating a feedback loop. Use one or the other per metric.",
        "VPA adjusts pod-level resources (requests/limits), not node count. ClusterAutoscaler handles node scaling. VPA makes pods bigger or smaller; ClusterAutoscaler makes the cluster bigger or smaller."
      ],
      "tip": "Go tip: VPA in 'Off' mode is useful even without auto-applying: it observes your Go service and recommends optimal CPU/memory requests. Use it to right-size before production without any risk of restarts.",
      "deepDive": "VPA modes: Off (recommendations only — safest), Initial (set requests at pod creation, no restarts), Auto (update requests and restart pods). In production, start with Off to collect data, then move to Initial. Auto mode restarts pods, which can cause brief disruptions. VPA pairs well with ClusterAutoscaler: VPA right-sizes pods, CA ensures nodes can accommodate them.\n\nOfficial Kubernetes docs:\n- https://github.com/kubernetes/autoscaler/tree/master/vertical-pod-autoscaler\n- https://kubernetes.io/docs/concepts/workloads/autoscaling/",
      "groupId": "autoscaling",
      "isBoss": false
    },
    {
      "type": "quiz",
      "q": "How does the Kubernetes ClusterAutoscaler decide when to add new nodes to the cluster?",
      "context": "# HPA scaled your Go API to 15 pods\n# But only 10 fit on existing nodes\n# 5 pods are Pending:\n\nkubectl get pods\nNAME              READY   STATUS    RESTARTS\napi-server-1..10  1/1     Running   0\napi-server-11     0/1     Pending   0\n... (5 Pending pods)",
      "options": [
        "When average CPU across all nodes exceeds 80%",
        "When pods are Pending because no node has enough allocatable resources to satisfy their requests",
        "When HPA reaches maxReplicas and requests more pods",
        "When a PodDisruptionBudget is violated during a node drain"
      ],
      "answer": 1,
      "explain": "ClusterAutoscaler watches for pods stuck in Pending with scheduling failures due to insufficient resources. When it detects unschedulable pods, it simulates adding nodes from configured node groups and provisions new ones if they would allow the pending pods to schedule.",
      "wrongReasons": [
        "ClusterAutoscaler does NOT react to aggregate CPU utilization. It only reacts to unschedulable pods — Pending pods with events like 'Insufficient cpu' or 'Insufficient memory'. Nodes can be at 95% CPU without triggering CA if no pods are Pending.",
        null,
        "HPA doesn't 'request more pods' beyond maxReplicas. If HPA is at maxReplicas and load keeps growing, it stays at max. ClusterAutoscaler only triggers when those max pods can't fit on existing nodes (Pending state).",
        "PDB violations during drain cause drain to stall, not node scaling. PDB protects existing pods during voluntary disruptions. ClusterAutoscaler respects PDBs when removing underutilized nodes, but PDB doesn't trigger node addition."
      ],
      "tip": "Go tip: ClusterAutoscaler + HPA work together: HPA scales pods up → pods go Pending if no room → CA adds nodes → pods schedule. The reverse: CA removes underutilized nodes → pods reschedule on remaining nodes. Set PDB to protect during node removal.",
      "deepDive": "CA also scales DOWN: it identifies nodes where all pods could be rescheduled elsewhere and removes them (respecting PDBs and scale-down delays). Key settings: --scale-down-utilization-threshold (default 0.5 — remove nodes below 50% utilization), --scale-down-delay-after-add (default 10min — wait after adding before considering removal).\n\nOfficial Kubernetes docs:\n- https://github.com/kubernetes/autoscaler/tree/master/cluster-autoscaler\n- https://kubernetes.io/docs/concepts/cluster-administration/cluster-autoscaling/",
      "groupId": "autoscaling",
      "isBoss": false
    },
    {
      "type": "command",
      "q": "Build the kubectl command to create a ServiceAccount named \"app-deployer\" in namespace \"production\".",
      "context": "# Setting up dedicated identity for CI/CD pipeline\n# Don't want to use the default ServiceAccount",
      "tokens": [
        "kubectl",
        "create",
        "serviceaccount",
        "app-deployer",
        "-n",
        "production",
        "role",
        "clusterrole",
        "secret",
        "--user"
      ],
      "answer": [
        "kubectl",
        "create",
        "serviceaccount",
        "app-deployer",
        "-n",
        "production"
      ],
      "explain": "`kubectl create serviceaccount` creates a dedicated identity for pods or CI/CD pipelines. Each ServiceAccount gets a unique token that RBAC rules can target, isolating permissions from other workloads in the namespace.",
      "wrongReasons": [],
      "tip": "Always create a dedicated ServiceAccount for each application or pipeline. The default ServiceAccount in each namespace has minimal permissions, but sharing it across apps violates least-privilege.",
      "deepDive": "After creating the ServiceAccount, assign it to pods via `spec.serviceAccountName: app-deployer` in the pod spec. Then create a Role/ClusterRole + RoleBinding/ClusterRoleBinding to grant it specific permissions. Without a binding, the ServiceAccount has no API permissions beyond discovery.\n\nOfficial Kubernetes docs:\n- https://kubernetes.io/docs/tasks/configure-pod-container/configure-service-account/\n- https://kubernetes.io/docs/reference/access-authn-authz/service-accounts-admin/",
      "groupId": "rbacSecurity",
      "isBoss": false
    },
    {
      "type": "command",
      "q": "Build the kubectl command to create a RoleBinding named \"deploy-binding\" that binds the Role \"deployer\" to ServiceAccount \"app-deployer\" in namespace \"production\".",
      "context": "# Role 'deployer' exists with create/update Deployment perms\n# ServiceAccount 'app-deployer' exists\n# Need to connect them",
      "tokens": [
        "kubectl",
        "create",
        "rolebinding",
        "deploy-binding",
        "--role=deployer",
        "--serviceaccount=production:app-deployer",
        "-n",
        "production",
        "clusterrolebinding",
        "--user=deployer",
        "--group=deployers",
        "auth"
      ],
      "answer": [
        "kubectl",
        "create",
        "rolebinding",
        "deploy-binding",
        "--role=deployer",
        "--serviceaccount=production:app-deployer",
        "-n",
        "production"
      ],
      "explain": "A RoleBinding links a Role (permissions) to a subject (ServiceAccount, User, or Group) within a namespace. The format `--serviceaccount=namespace:name` identifies the ServiceAccount. Without this binding, the Role's permissions are defined but not granted to anyone.",
      "wrongReasons": [],
      "tip": "Use `kubectl get rolebinding -n production` to verify. For cross-namespace access, use ClusterRoleBinding instead. To audit: `kubectl auth can-i --list --as=system:serviceaccount:production:app-deployer -n production`.",
      "deepDive": "Three types of subjects in bindings: User (for humans via OIDC/certificates), Group (for groups of users), ServiceAccount (for pods/automation). The --serviceaccount flag uses namespace:name format because ServiceAccounts are namespace-scoped. A RoleBinding can reference a ClusterRole too — this grants the ClusterRole's permissions but only within the binding's namespace.\n\nOfficial Kubernetes docs:\n- https://kubernetes.io/docs/reference/access-authn-authz/rbac/\n- https://kubernetes.io/docs/reference/generated/kubectl/kubectl-commands#-em-rolebinding-em-",
      "groupId": "rbacSecurity",
      "isBoss": false
    },
    {
      "type": "quiz",
      "q": "PodSecurityPolicy (PSP) was removed in Kubernetes 1.25. What is the built-in replacement for enforcing pod security standards?",
      "context": "# Security audit flagged:\n# - Containers running as root\n# - Pods with hostNetwork: true\n# - Privileged containers\n# Need to enforce baseline security across namespaces",
      "options": [
        "Pod Security Admission (PSA) with three profiles: privileged, baseline, restricted",
        "OPA Gatekeeper — it replaced PSP as a built-in feature",
        "NetworkPolicy — it controls both network and pod security",
        "SecurityContext alone — just set it on every pod"
      ],
      "answer": 0,
      "explain": "Pod Security Admission (PSA) is the built-in replacement, stable since k8s 1.25. It enforces three profiles per namespace via labels: privileged (unrestricted), baseline (prevents known privilege escalations), restricted (hardened best practices).",
      "wrongReasons": [
        null,
        "OPA Gatekeeper is a powerful third-party policy engine, but it's NOT built-in. PSA is the native replacement. Gatekeeper offers more flexibility (custom policies) but requires separate installation and maintenance.",
        "NetworkPolicy controls network traffic between pods (L3/L4 rules). It has nothing to do with pod security contexts, privilege escalation, or host access. They solve different problems.",
        "SecurityContext fields (runAsNonRoot, readOnlyRootFilesystem, etc.) are set per-pod, but nothing enforces that developers actually set them. PSA enforces security profiles cluster-wide — pods that violate the profile are rejected at admission."
      ],
      "tip": "Go tip: Label your namespace to enforce restricted profile: kubectl label ns production pod-security.kubernetes.io/enforce=restricted. This rejects any pod running as root or requesting privileged access.",
      "deepDive": "PSA enforcement modes per namespace: enforce (reject violating pods), audit (log violations but allow), warn (warn users but allow). Start with warn/audit to discover violations, then switch to enforce. The restricted profile requires: runAsNonRoot, drop ALL capabilities, readOnlyRootFilesystem recommended, no hostNetwork/hostPID/hostIPC.\n\nOfficial Kubernetes docs:\n- https://kubernetes.io/docs/concepts/security/pod-security-admission/\n- https://kubernetes.io/docs/concepts/security/pod-security-standards/",
      "groupId": "rbacSecurity",
      "isBoss": false
    },
    {
      "type": "scenario",
      "q": "🚨 INCIDENT: Your Go operator reads Secrets via client-go but gets \"secrets is forbidden\". A ServiceAccount and a Role granting get/list on secrets both exist. What is MOST LIKELY missing?",
      "context": "// Go operator code:\nsecret, err := clientset.CoreV1().Secrets(\"production\").Get(ctx, \"db-creds\", v1.GetOptions{})\n// Error: secrets \"db-creds\" is forbidden:\n// User \"system:serviceaccount:production:operator-sa\"\n// cannot get resource \"secrets\" in API group \"\" in namespace \"production\"\n\nkubectl get sa operator-sa -n production    # ✅ exists\nkubectl get role secret-reader -n production # ✅ exists, has get/list on secrets",
      "options": [
        "🔑 The Secret \"db-creds\" doesn't exist in the namespace",
        "🔗 A RoleBinding linking the Role to the ServiceAccount is missing",
        "🌐 Need a ClusterRole instead of a Role for Secrets",
        "📛 The namespace on the Secret doesn't match the ServiceAccount namespace"
      ],
      "answer": 1,
      "explain": "A Role defines WHAT permissions exist. A RoleBinding connects WHO gets those permissions. Without a RoleBinding, the Role is just a definition with no effect. Create: `kubectl create rolebinding operator-secret-access --role=secret-reader --serviceaccount=production:operator-sa -n production`.",
      "wrongReasons": [
        "If the Secret didn't exist, the error would be 'not found', not 'forbidden'. 'Forbidden' means the API server checked RBAC and denied the request before even looking for the resource.",
        null,
        "A namespace-scoped Role is correct for reading Secrets within a single namespace. ClusterRole is only needed if the operator reads Secrets across ALL namespaces. The error is about a missing binding, not insufficient scope.",
        "Both the ServiceAccount and the Secret are in the 'production' namespace (confirmed in the error message and context). Namespace mismatch would show a different namespace in the error."
      ],
      "tip": "Go tip: Debug RBAC issues with: kubectl auth can-i get secrets --as=system:serviceaccount:production:operator-sa -n production. This returns 'yes' or 'no' instantly without needing to run the actual code.",
      "deepDive": "RBAC troubleshooting checklist: (1) ServiceAccount exists? (2) Role/ClusterRole has the right verbs and resources? (3) RoleBinding/ClusterRoleBinding connects them? (4) Pod spec has serviceAccountName set? Missing any one of these four causes 'forbidden'. Check all four before debugging further.\n\nOfficial Kubernetes docs:\n- https://kubernetes.io/docs/reference/access-authn-authz/rbac/\n- https://kubernetes.io/docs/tasks/configure-pod-container/configure-service-account/",
      "groupId": "rbacSecurity",
      "isBoss": false
    },
    {
      "type": "quiz",
      "q": "In Kubernetes 1.24+, ServiceAccount tokens are no longer auto-created as long-lived Secrets. How are tokens provided to pods now?",
      "context": "# Old behavior (pre-1.24):\n# Creating a ServiceAccount auto-generated a Secret with a never-expiring token\n#\n# New behavior (1.24+):\n# kubectl get secrets -n production\n# → No auto-generated token Secret for new ServiceAccounts",
      "options": [
        "You must manually create a Secret of type kubernetes.io/service-account-token for each ServiceAccount",
        "Projected volumes with short-lived, auto-rotated tokens via the TokenRequest API",
        "Tokens are injected as environment variables by the kubelet",
        "Tokens are stored in ConfigMaps instead of Secrets"
      ],
      "answer": 1,
      "explain": "Since k8s 1.24, the kubelet uses the TokenRequest API to obtain short-lived, audience-bound tokens and mounts them via projected volumes at /var/run/secrets/kubernetes.io/serviceaccount/token. Tokens auto-rotate (default 1 hour) and are scoped to a specific audience, reducing blast radius if leaked.",
      "wrongReasons": [
        "Manual Secret creation is still supported as a fallback for legacy integrations, but it's NOT the default mechanism. Manually created token Secrets are long-lived and less secure — the projected volume approach is the standard.",
        null,
        "Tokens are NOT injected as environment variables. They're mounted as files via projected volumes. Environment variables would be visible in /proc, kubectl describe, and crash dumps — file mounts are more secure.",
        "ConfigMaps are not used for tokens. Tokens are sensitive credentials — ConfigMaps store non-sensitive configuration data. Even the old approach used Secrets, not ConfigMaps."
      ],
      "tip": "Go tip: In-cluster Go clients (client-go, controller-runtime) automatically read the projected token from the mounted path. rest.InClusterConfig() handles this transparently. No code changes needed for the 1.24+ token format.",
      "deepDive": "Benefits of bound tokens: (1) short-lived (auto-rotate every hour vs never-expiring), (2) audience-bound (scoped to the API server, not reusable elsewhere), (3) object-bound (invalidated when the pod is deleted). For external systems that need a long-lived token, you can still manually create a Secret of type kubernetes.io/service-account-token, but this is discouraged.\n\nOfficial Kubernetes docs:\n- https://kubernetes.io/docs/reference/access-authn-authz/service-accounts-admin/\n- https://kubernetes.io/docs/concepts/storage/projected-volumes/",
      "groupId": "rbacSecurity",
      "isBoss": false
    },
    {
      "type": "quiz",
      "q": "What is a CustomResourceDefinition (CRD) and what happens when you create one in a cluster?",
      "context": "# You want to manage a custom 'GoMicroservice' resource:\n# kubectl apply -f gomicroservice-crd.yaml\n# kubectl get gomicroservices\n# kubectl describe gomicroservice payments-api\n\n# How does this work?",
      "options": [
        "A CRD is a Helm chart that packages multiple resources into one install command",
        "A CRD extends the Kubernetes API by registering a new resource type, managed via kubectl and the API server like built-in resources",
        "A CRD is a special container image format for running operators",
        "A CRD is a type of ConfigMap that stores resource definitions"
      ],
      "answer": 1,
      "explain": "A CRD tells the Kubernetes API server about a new resource type. Once created, users can create/read/update/delete instances of that type using kubectl, client-go, or any k8s client — just like Pods or Deployments. The API server handles storage, validation, and versioning.",
      "wrongReasons": [
        "Helm charts package Kubernetes manifests into deployable bundles. A CRD is a single API resource that extends the cluster's vocabulary — completely different from Helm's templating and packaging mechanism.",
        null,
        "CRDs are API extensions stored in etcd, not container images. An Operator (which runs as a container) watches CRDs and acts on them, but the CRD itself is a schema definition, not executable code.",
        "ConfigMaps store key-value configuration data. CRDs are schema definitions registered with the API server that create entirely new API endpoints. They live at different levels of the k8s architecture."
      ],
      "tip": "Go tip: Use kubebuilder to generate CRD YAML from Go struct definitions. Add //+kubebuilder:validation markers to your Go types for automatic OpenAPI schema generation — the API server validates CRs at admission time.",
      "deepDive": "CRDs support: OpenAPI v3 schema validation (reject malformed CRs), multiple versions with conversion webhooks, subresources (status, scale), and printer columns for kubectl output formatting. For complex validation beyond schema, pair CRDs with ValidatingAdmissionWebhooks.\n\nOfficial Kubernetes docs:\n- https://kubernetes.io/docs/tasks/extend-kubernetes/custom-resources/custom-resource-definitions/\n- https://kubernetes.io/docs/concepts/extend-kubernetes/api-extension/custom-resources/",
      "groupId": "operatorsCrds",
      "isBoss": false
    },
    {
      "type": "command",
      "q": "Build the kubectl command to list all CustomResourceDefinitions installed in the cluster.",
      "context": "# Security audit: need inventory of all API extensions\n# Which custom resource types are registered?",
      "tokens": [
        "kubectl",
        "get",
        "crd",
        "describe",
        "customresources",
        "api-resources",
        "--all-namespaces",
        "crds",
        "-o",
        "wide"
      ],
      "answer": [
        "kubectl",
        "get",
        "crd"
      ],
      "explain": "`kubectl get crd` lists all CustomResourceDefinitions registered in the cluster. CRDs are cluster-scoped resources — no namespace flag needed. The output shows the CRD name, creation time, and API group.",
      "wrongReasons": [],
      "tip": "Use `kubectl api-resources` to see ALL resource types (built-in + custom) with their API groups, namespaced status, and short names. This is broader than `get crd` and helps discover what's available in an unfamiliar cluster.",
      "deepDive": "To inspect a specific CRD's schema: `kubectl get crd gomicroservices.example.com -o yaml`. To list instances of a custom resource: `kubectl get gomicroservices -A`. For operator debugging, check CRD status conditions — a CRD with NamesAccepted=False has a naming conflict with an existing resource.\n\nOfficial Kubernetes docs:\n- https://kubernetes.io/docs/tasks/extend-kubernetes/custom-resources/custom-resource-definitions/\n- https://kubernetes.io/docs/reference/generated/kubectl/kubectl-commands#get",
      "groupId": "operatorsCrds",
      "isBoss": false
    },
    {
      "type": "quiz",
      "q": "Your Go operator needs to clean up an external cloud load balancer before a custom resource is deleted. What Kubernetes mechanism prevents the resource from being removed before cleanup completes?",
      "context": "# User runs: kubectl delete gomicroservice payments-api\n# Operator must:\n#   1. Delete the external cloud LB\n#   2. Remove DNS records\n#   3. THEN allow the CR to be deleted\n# Without this mechanism, the CR vanishes instantly and cleanup never runs",
      "options": [
        "preStop lifecycle hooks on the operator pod",
        "Setting DeletionTimestamp manually on the resource",
        "Finalizers — strings in metadata.finalizers that block deletion until the controller removes them",
        "ownerReferences — the CR owns the external resource"
      ],
      "answer": 2,
      "explain": "Finalizers are strings added to a resource's metadata.finalizers list. When deletion is requested, Kubernetes sets deletionTimestamp but does NOT remove the object until all finalizers are cleared. The controller sees the deletionTimestamp, performs cleanup, then removes its finalizer string — allowing garbage collection to proceed.",
      "wrongReasons": [
        "preStop hooks run when a POD is terminated, not when a custom resource is deleted. CRs are API objects stored in etcd — they don't have containers or lifecycle hooks.",
        "You don't set DeletionTimestamp manually — Kubernetes sets it automatically when kubectl delete is called. DeletionTimestamp is a signal to controllers that deletion was requested, but it alone doesn't prevent removal. Finalizers provide the actual blocking mechanism.",
        null,
        "ownerReferences define parent-child relationships between k8s objects for garbage collection. External cloud resources (LBs, DNS records) are NOT Kubernetes objects and can't have ownerReferences. Finalizers bridge the gap to external systems."
      ],
      "tip": "Go tip: In your Reconcile function, check if obj.DeletionTimestamp != nil. If set, run cleanup logic, then remove your finalizer: controllerutil.RemoveFinalizer(&obj, \"myapp.example.com/cleanup\"). Always add the finalizer during resource creation.",
      "deepDive": "Finalizer pattern in Go operators:\n1. On create/update: ensure finalizer is present (controllerutil.AddFinalizer)\n2. On delete (DeletionTimestamp set): run cleanup, then remove finalizer\n3. If cleanup fails: return error → controller retries\n4. When all finalizers removed: k8s garbage-collects the object\n\nDanger: if the controller is down and can't remove its finalizer, the resource is stuck in Terminating forever. Always monitor operator health.\n\nOfficial Kubernetes docs:\n- https://kubernetes.io/docs/concepts/overview/working-with-objects/finalizers/\n- https://book.kubebuilder.io/reference/using-finalizers",
      "groupId": "operatorsCrds",
      "isBoss": false
    },
    {
      "type": "quiz",
      "q": "Your organization wants to enforce that every Deployment must have resource requests and limits set. Which Kubernetes mechanism intercepts API requests and rejects those that violate the policy?",
      "context": "# Current problem: developers deploy without resource specs\n# Need to enforce at API level — not just documentation\n# Rejected pods should get a clear error message\n\nkubectl apply -f deployment.yaml\n# Error: admission webhook denied: container 'app' missing resources.requests.cpu",
      "options": [
        "ValidatingAdmissionWebhook — intercepts and rejects non-compliant API requests before they are stored",
        "LimitRange — automatically injects default requests/limits into pods",
        "ResourceQuota — caps total resource consumption per namespace",
        "A CronJob that periodically audits Deployments and deletes non-compliant ones"
      ],
      "answer": 0,
      "explain": "ValidatingAdmissionWebhooks intercept API requests after authentication and authorization but before persistence to etcd. Your webhook server inspects the Deployment spec and returns Allow or Deny with a clear error message. This is policy enforcement at the API gateway.",
      "wrongReasons": [
        null,
        "LimitRange injects defaults when resource specs are missing — it fills in the gaps rather than rejecting. It's complementary but doesn't enforce that developers explicitly set their own values. Some orgs want developers to think about resource sizing, not rely on defaults.",
        "ResourceQuota caps the total resource consumption for a namespace (e.g., max 16 CPU). It doesn't inspect individual Deployment specs for missing fields. A pod with no requests could still be created if the namespace quota isn't exhausted.",
        "A CronJob that audits and deletes is reactive, not preventive. Non-compliant resources run in the cluster until the CronJob catches them. Admission webhooks prevent non-compliant resources from ever being created — shift-left enforcement."
      ],
      "tip": "Go tip: Use controller-runtime's webhook package to build admission webhooks in Go. For policy-as-code without custom webhooks, consider OPA Gatekeeper or Kyverno — both provide ValidatingAdmissionPolicy via declarative rules.",
      "deepDive": "Two types of admission webhooks: Validating (approve/reject — can't modify) and Mutating (can modify the request, e.g., inject sidecar containers). Mutating runs first, then validating. Kubernetes 1.28+ also has ValidatingAdmissionPolicy — a built-in, CEL-based alternative to webhooks for simple validation rules without running a webhook server.\n\nOfficial Kubernetes docs:\n- https://kubernetes.io/docs/reference/access-authn-authz/extensible-admission-controllers/\n- https://kubernetes.io/docs/reference/access-authn-authz/validating-admission-policy/",
      "groupId": "operatorsCrds",
      "isBoss": false
    },
    {
      "type": "scenario",
      "q": "🚨 INCIDENT: You created a custom resource but your Go operator does nothing. The operator pod is Running and healthy. Logs show: \"not the leader, waiting for leader election.\" What is happening?",
      "context": "kubectl get pods -n operator-system\nNAME                         READY   STATUS    RESTARTS\nmy-operator-controller-abc   1/1     Running   0        5m\nmy-operator-controller-def   1/1     Running   0        5m\n\nLogs (both pods):\nINFO  not the leader, waiting for leader election\nINFO  attempting to acquire leader lease operator-system/my-operator-lock...",
      "options": [
        "📋 The CRD is not installed — the operator can't find the resource type",
        "🔗 RBAC is missing — the operator can't read custom resources",
        "🔒 Leader election is active and neither pod has acquired the lease — check for a stale Lease object from a previously crashed operator",
        "🐛 The operator image is wrong — it doesn't contain the controller code"
      ],
      "answer": 2,
      "explain": "Leader election ensures only one operator replica actively reconciles at a time (preventing duplicate actions). Both pods are waiting to acquire a Lease object. If a previous operator crashed without releasing its lease, the lock persists until its lease duration expires. Check `kubectl get lease -n operator-system` for a stale lock.",
      "wrongReasons": [
        "If the CRD were missing, the operator would log errors like 'no matches for kind GoMicroservice' or fail to start its controller. The logs specifically show leader election as the blocker, not missing resources.",
        "RBAC errors would appear as 'forbidden' in the operator logs when it tries to list or watch resources. The logs show leader election messages, not permission errors. The operator hasn't even started reconciling yet.",
        null,
        "The operator IS running and logging meaningful messages about leader election. A wrong image would show different behavior: crash loops, 'exec format error', or completely different logs."
      ],
      "tip": "Go tip: In development, disable leader election to simplify debugging: mgr, _ := ctrl.NewManager(cfg, ctrl.Options{LeaderElection: false}). Re-enable for production where multiple replicas run for HA.",
      "deepDive": "Leader election uses a Lease (or ConfigMap/Endpoint) as a distributed lock. The leader renews the lease periodically (default 15s). If it fails to renew within the lease duration (default 15s), another replica can acquire it. To fix stale leases: delete the Lease object (`kubectl delete lease my-operator-lock -n operator-system`) and let pods re-compete. For single-replica operators, leader election adds unnecessary complexity — disable it.\n\nOfficial Kubernetes docs:\n- https://kubernetes.io/docs/concepts/architecture/leases/\n- https://pkg.go.dev/sigs.k8s.io/controller-runtime/pkg/leaderelection",
      "groupId": "operatorsCrds",
      "isBoss": false
    },
    {
      "type": "scenario",
      "q": "📊 OBSERVABILITY: You notice your Go service's p99 latency spiked 3 hours ago. kubectl top pods shows normal CPU/memory. What is your BEST next step?",
      "context": "# Prometheus alert fired 3h ago: p99 > 2s\n# kubectl top pods: all green\n# Pods: Running, Ready\n# Logs: no obvious errors\n\n# Where do you look next?",
      "options": [
        "🔄 Restart all pods — probably a memory leak",
        "📈 Check distributed traces (Jaeger/Zipkin) for slow spans",
        "📋 SSH into a pod and run top",
        "💾 Increase memory limits — probably GC pressure"
      ],
      "answer": 1,
      "explain": "Distributed traces show WHERE in the request path latency occurred — which service, which DB query, which external call. Logs and metrics show WHAT happened; traces show WHERE and WHY.",
      "wrongReasons": [
        "Restarting pods erases the problem without understanding it — and the in-memory state that might reveal the cause. If it's a memory leak, it'll come back. If it was a downstream dependency spike, restarting does nothing.",
        null,
        "SSH-ing into a pod (kubectl exec) and running top shows current CPU/memory — the spike was 3 hours ago, so current metrics won't help. Also, running top in a container shows host-level data, not container-scoped data.",
        "Increasing limits without evidence is cargo-cult ops. kubectl top shows normal memory. Raising limits won't fix a latency issue caused by a slow database query or downstream service timeout."
      ],
      "tip": "Go tip: Add OpenTelemetry tracing to your Go service: go.opentelemetry.io/otel. Instrument http.Client and database calls. Use otel.GetTracerProvider() to propagate trace context via HTTP headers.",
      "deepDive": "Observability stack for Go on k8s: Prometheus (metrics) + Grafana (dashboards) + Loki (logs) + Tempo or Jaeger (traces) + OpenTelemetry SDK in Go. Use the three pillars together — a slow p99 trace narrows to a slow DB span, which leads you to a Prometheus query showing DB connection pool exhaustion.",
      "groupId": "observability",
      "isBoss": true
    }
  ]
});
