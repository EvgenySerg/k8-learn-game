window.KUBECRAFT_LEVEL_DATA = window.KUBECRAFT_LEVEL_DATA || [];
window.KUBECRAFT_LEVEL_DATA.push({
  "id": "level-7",
  "title": "Level 7 · CKA Core Foundations",
  "difficulty": "Expert Foundations",
  "badgeIcon": "📘",
  "badgeName": "CKA Core Strategist",
  "description": "Covers cluster architecture, kubelet lifecycle, control plane components, and CKA-aligned troubleshooting fundamentals.",
  "status": "active",
  "targetQuestionCount": 28,
  "focus": [
    "Cluster Architecture",
    "Core Components",
    "Troubleshooting"
  ],
  "questions": [
    {
      "type": "quiz",
      "q": "Which Kubernetes control plane component is the single entry point for all cluster API operations?",
      "context": "# You run kubectl apply, kubectl get, kubectl delete\n# All those operations must hit one core component first",
      "options": [
        "kube-apiserver",
        "kube-scheduler",
        "kube-controller-manager",
        "kubelet"
      ],
      "answer": 0,
      "explain": "kube-apiserver is the front door of the cluster. Every read/write operation goes through it, and other control plane components also communicate via the API server.",
      "wrongReasons": [
        null,
        "kube-scheduler only decides which node should run pending Pods. It does not expose the main cluster API endpoint.",
        "kube-controller-manager runs reconciliation loops (Deployment, Node, Job, etc.) but it is not the API entry point.",
        "kubelet runs on each node and manages local containers. It is a node agent, not a control plane API endpoint."
      ],
      "tip": "Go tip: If your operator or client-go app fails with API errors, verify API server reachability and RBAC before debugging controller logic.",
      "deepDive": "The API server persists desired and current state in etcd, enforces authn/authz/admission, and provides watch streams that controllers use to reconcile state.",
      "groupId": "clusterArchitecture",
      "isBoss": false
    },
    {
      "type": "scenario",
      "q": "🚨 INCIDENT: A Pod stays Pending. describe output shows: \"node(s) had taint {node-role.kubernetes.io/control-plane: }.\" What should you do first?",
      "context": "kubectl describe pod web-7d6d9\nEvents:\n  Warning  FailedScheduling  0/3 nodes are available:\n  1 node(s) had taint {node-role.kubernetes.io/control-plane: }, that the pod didn't tolerate.",
      "options": [
        "Add the required toleration to the Pod spec (or schedule to worker nodes)",
        "Restart kube-scheduler because scheduling is broken",
        "Delete the Pod repeatedly until it lands",
        "Scale the Deployment to 0 then back to 1"
      ],
      "answer": 0,
      "explain": "The error explicitly states a taint/toleration mismatch. Either add a matching toleration or ensure the workload targets worker nodes only.",
      "wrongReasons": [
        null,
        "The scheduler is functioning correctly; it is enforcing taints. Restarting components does not solve policy mismatches.",
        "Recreating the same Pod with the same spec results in the same scheduling failure.",
        "Replica scaling does not change taints or tolerations, so the placement issue remains."
      ],
      "tip": "Go tip: When running control-plane-adjacent tools in-cluster, keep tolerations explicit and minimal to avoid accidental scheduling on restricted nodes.",
      "deepDive": "Taints repel pods; tolerations allow (but do not force) placement. Combine tolerations with nodeSelector/affinity when you need deterministic placement.",
      "groupId": "clusterArchitecture",
      "isBoss": false
    },
    {
      "type": "command",
      "q": "Build the command to cordon node \"worker-2\" so new Pods are not scheduled there.",
      "context": "# Planned maintenance window\n# Existing pods can keep running for now",
      "tokens": [
        "kubectl",
        "cordon",
        "worker-2",
        "drain",
        "--ignore-daemonsets",
        "uncordon",
        "get",
        "nodes"
      ],
      "answer": [
        "kubectl",
        "cordon",
        "worker-2"
      ],
      "explain": "cordon marks a node as unschedulable for new pods while leaving existing workloads running.",
      "wrongReasons": [],
      "tip": "Use cordon before drain. Cordon stops new placements immediately; drain handles controlled eviction when you're ready.",
      "deepDive": "Cordon is reversible with kubectl uncordon <node>. It is safe for quick mitigation when a node shows early warning signs.",
      "groupId": "clusterArchitecture",
      "isBoss": false
    },
    {
      "type": "quiz",
      "q": "What is the key operational difference between `kubectl cordon` and `kubectl drain`?",
      "context": "# Both are used for node maintenance\n# But they affect workloads differently",
      "options": [
        "cordon blocks new scheduling; drain evicts running pods from the node",
        "cordon evicts pods; drain only marks unschedulable",
        "They are aliases and behave the same",
        "drain works only on control plane nodes"
      ],
      "answer": 0,
      "explain": "cordon only prevents new pods from being scheduled. drain performs eviction of eligible running pods so the node can be safely maintained.",
      "wrongReasons": [
        null,
        "This is reversed. Eviction is drain behavior, not cordon behavior.",
        "They are distinct commands with different impact and safety characteristics.",
        "drain is primarily used for worker maintenance and can target any node, subject to disruption rules and flags."
      ],
      "tip": "Go tip: During production maintenance, sequence is usually cordon -> drain -> maintenance -> uncordon.",
      "deepDive": "drain respects PodDisruptionBudgets. If PDB constraints block eviction, drain will fail until availability constraints are satisfied or adjusted.",
      "groupId": "clusterArchitecture",
      "isBoss": false
    },
    {
      "type": "scenario",
      "q": "🚨 INCIDENT: Node `worker-1` became NotReady right after a host patch. What is your first high-signal troubleshooting action?",
      "context": "kubectl get nodes\nNAME       STATUS\nworker-1   NotReady\nworker-2   Ready\nworker-3   Ready",
      "options": [
        "Check kubelet logs on the node: journalctl -u kubelet -xe",
        "Delete the Node object from the API server immediately",
        "Restart etcd on the control plane",
        "Recreate all Deployments in kube-system"
      ],
      "answer": 0,
      "explain": "NotReady usually starts with kubelet or node-level runtime/network issues. kubelet logs provide the fastest and most specific signal.",
      "wrongReasons": [
        null,
        "Deleting the Node object can hide root cause and may trigger unnecessary rescheduling without fixing host health.",
        "etcd restart is unrelated to a single node becoming NotReady after host patching.",
        "Recreating system workloads is disruptive and does not target the likely failing component."
      ],
      "tip": "Go tip: Standardize an incident checklist in your repo so on-call engineers run the same first-diagnosis commands every time.",
      "deepDive": "Also inspect container runtime status, disk pressure, and CNI health. Node conditions and Events often correlate with kubelet log errors.",
      "groupId": "clusterArchitecture",
      "isBoss": false
    },
    {
      "type": "command",
      "q": "Build the command to drain `worker-2` safely, ignoring DaemonSets and allowing emptyDir cleanup.",
      "context": "# You're preparing node replacement\n# Need clean eviction behavior for regular workloads",
      "tokens": [
        "kubectl",
        "drain",
        "worker-2",
        "--ignore-daemonsets",
        "--delete-emptydir-data",
        "cordon",
        "uncordon",
        "get",
        "pods",
        "-A"
      ],
      "answer": [
        "kubectl",
        "drain",
        "worker-2",
        "--ignore-daemonsets",
        "--delete-emptydir-data"
      ],
      "explain": "This is the standard drain pattern for node maintenance when workloads can be safely evicted and temporary local data removed.",
      "wrongReasons": [],
      "tip": "Run a quick PDB check before draining to avoid surprise eviction failures during maintenance windows.",
      "deepDive": "DaemonSet pods are intentionally excluded because they are node-scoped agents. They are recreated as node lifecycle changes.",
      "groupId": "clusterArchitecture",
      "isBoss": false
    },
    {
      "type": "quiz",
      "q": "Where does kubelet watch for static Pod manifests on a kubeadm-based control plane node by default?",
      "context": "# You edited a static pod manifest manually\n# Need the canonical path",
      "options": [
        "/etc/kubernetes/manifests",
        "/var/lib/kubelet/pods",
        "/etc/systemd/system/kubelet.d",
        "/opt/kubernetes/static"
      ],
      "answer": 0,
      "explain": "kubelet monitors /etc/kubernetes/manifests for static pod definitions and automatically creates/restarts those control plane pods.",
      "wrongReasons": [
        null,
        "/var/lib/kubelet/pods contains runtime pod data, not the source manifests for static control plane pods.",
        "systemd drop-ins configure kubelet process behavior, not static pod manifests.",
        "This path is not the kubeadm default location for static pod manifests."
      ],
      "tip": "Go tip: When debugging control plane outages, confirm manifest syntax and mounted cert paths before changing anything else.",
      "deepDive": "Because static pods are node-local, they are not managed by Deployments. kubelet directly ensures those pod manifests are running.",
      "groupId": "clusterArchitecture",
      "isBoss": false
    },
    {
      "type": "scenario",
      "q": "🚨 INCIDENT: Service discovery fails cluster-wide right after a CoreDNS ConfigMap change. What should you do first?",
      "context": "Symptoms:\n- App logs show: dial tcp: lookup db-svc: no such host\n- Multiple namespaces affected\n- Change just applied to coredns ConfigMap",
      "options": [
        "Inspect CoreDNS logs and rollout status in kube-system",
        "Restart every workload in every namespace",
        "Delete all Service objects to force recreation",
        "Disable kube-proxy on all nodes"
      ],
      "answer": 0,
      "explain": "Given the timing and blast radius, CoreDNS health and config validity are the highest-signal first checks.",
      "wrongReasons": [
        null,
        "Restarting app workloads treats symptoms and causes major disruption while DNS root cause remains.",
        "Deleting Service objects is destructive and unrelated to a likely DNS control plane issue.",
        "kube-proxy changes are high risk and not the first response to a config-related DNS outage."
      ],
      "tip": "Go tip: Add graceful DNS retry with bounded backoff in clients to reduce immediate outage impact during control plane incidents.",
      "deepDive": "Use: kubectl -n kube-system logs deploy/coredns and kubectl -n kube-system rollout status deploy/coredns. Validate the Corefile before rolling updates.",
      "groupId": "servicesNetworking",
      "isBoss": false
    },
    {
      "type": "quiz",
      "q": "What is the primary responsibility of etcd in Kubernetes?",
      "context": "# Control plane component responsibilities\n# Which one is the source of truth for cluster state?",
      "options": [
        "Persist desired/current cluster state as key-value data",
        "Schedule Pods onto nodes",
        "Run container processes on each node",
        "Terminate HTTPS traffic for Services"
      ],
      "answer": 0,
      "explain": "etcd is the durable backing store for Kubernetes state. API objects and their revisions are persisted there and served via kube-apiserver.",
      "wrongReasons": [
        null,
        "Scheduling decisions are made by kube-scheduler, not etcd.",
        "Container lifecycle on nodes is managed by kubelet and container runtime.",
        "Service ingress/edge TLS termination is handled by Ingress controllers or LBs, not etcd."
      ],
      "tip": "Go tip: Treat API writes carefully in controllers; every update becomes etcd churn. Use patch/minimal updates to reduce control plane pressure.",
      "deepDive": "etcd reliability directly impacts control plane availability. Production clusters require regular etcd snapshot strategy and validated restore procedures.",
      "groupId": "clusterArchitecture",
      "isBoss": false
    },
    {
      "type": "command",
      "q": "Build the command to make node `worker-2` schedulable again after maintenance.",
      "context": "# Maintenance completed\n# Node was previously cordoned",
      "tokens": [
        "kubectl",
        "uncordon",
        "worker-2",
        "cordon",
        "drain",
        "--ignore-daemonsets",
        "get",
        "nodes"
      ],
      "answer": [
        "kubectl",
        "uncordon",
        "worker-2"
      ],
      "explain": "uncordon flips the node back to schedulable so new Pods can be placed there.",
      "wrongReasons": [],
      "tip": "Use a post-maintenance checklist: node Ready, no pressure conditions, daemonsets healthy, then uncordon.",
      "deepDive": "If you skip uncordon, autoscalers and schedulers may overload remaining nodes while this node stays idle.",
      "groupId": "clusterArchitecture",
      "isBoss": false
    },
    {
      "type": "scenario",
      "q": "🚨 INCIDENT: `kubectl drain worker-3` fails with `cannot evict pod as it would violate the pod's disruption budget`. What is the best next step?",
      "context": "drain output:\nerror when evicting pods/checkout-api-6d58: Cannot evict pod as it would violate the pod's disruption budget.",
      "options": [
        "Review and temporarily adjust the PodDisruptionBudget or rollout capacity, then retry drain",
        "Force-delete pods with --grace-period=0 --force immediately",
        "Delete the Node object and let workloads recover automatically",
        "Restart kube-controller-manager to ignore PDB constraints"
      ],
      "answer": 0,
      "explain": "PDB is doing its job: preserving availability during voluntary disruption. Fix capacity/PDB policy first, then drain safely.",
      "wrongReasons": [
        null,
        "Force deletion bypasses graceful disruption controls and can create avoidable downtime.",
        "Deleting node objects is destructive and does not solve disruption policy constraints.",
        "Controller restart does not disable or bypass PDB semantics."
      ],
      "tip": "Go tip: Before maintenance, pre-scale critical Deployments so PDB budgets can be honored during drain.",
      "deepDive": "PDB protects voluntary disruptions only. Unexpected node failure can still break availability, so pair PDB with multi-zone spread and proper replicas.",
      "groupId": "schedulingPolicy",
      "isBoss": false
    },
    {
      "type": "quiz",
      "q": "Which factors does kube-scheduler primarily evaluate when deciding where to place a Pod?",
      "context": "# Pending Pod scheduling pipeline\n# Filter and score candidate nodes",
      "options": [
        "Resource requests plus constraints like node selectors, affinities, taints/tolerations, and topology rules",
        "Only CPU limits and image pull policy",
        "Pod logs and previous restart count",
        "Node hostname alphabetic order"
      ],
      "answer": 0,
      "explain": "Scheduler placement is based on feasible resources and policy constraints, then scoring/priorities across eligible nodes.",
      "wrongReasons": [
        null,
        "CPU limits and imagePullPolicy are not the core placement model. Requests and constraints drive feasibility.",
        "Runtime logs/restart history are operational signals, not scheduler placement criteria.",
        "Node selection is policy/resource driven, not lexical ordering."
      ],
      "tip": "Go tip: Right-size requests for Go services; inflated requests reduce schedulability and waste capacity.",
      "deepDive": "Scheduler first filters infeasible nodes, then scores remaining nodes for best fit and balancing goals. Misconfigured affinity rules can reduce candidate nodes to zero.",
      "groupId": "schedulingPolicy",
      "isBoss": false
    },
    {
      "type": "command",
      "q": "Build the command to list cluster events across all namespaces sorted by newest timestamp.",
      "context": "# You need a fast timeline during incident triage",
      "tokens": [
        "kubectl",
        "get",
        "events",
        "-A",
        "--sort-by=.lastTimestamp",
        "describe",
        "pods",
        "-n",
        "kube-system",
        "--watch"
      ],
      "answer": [
        "kubectl",
        "get",
        "events",
        "-A",
        "--sort-by=.lastTimestamp"
      ],
      "explain": "This gives a cross-namespace event timeline, which is often the fastest way to identify when and where failures started.",
      "wrongReasons": [],
      "tip": "Pair event timeline with `kubectl describe` on affected objects to correlate scheduler, kubelet, and controller messages.",
      "deepDive": "Events are ephemeral and high-volume; capture them early in incidents before retention windows rotate out critical clues.",
      "groupId": "observability",
      "isBoss": false
    },
    {
      "type": "scenario",
      "q": "🚨 INCIDENT: Multiple Pods stop scheduling on `worker-1`. Node conditions show `DiskPressure=True`. What should you do first?",
      "context": "kubectl describe node worker-1\nConditions:\n  DiskPressure   True\n  MemoryPressure False\n  PIDPressure    False",
      "options": [
        "Investigate node disk usage and reclaim space (images/logs/ephemeral data), then verify condition clears",
        "Increase every Deployment replica count to spread load",
        "Restart kube-apiserver to refresh node conditions",
        "Delete all PVCs in the namespace"
      ],
      "answer": 0,
      "explain": "DiskPressure is a node-level resource issue. Fix node storage pressure first; scheduler will continue restricting placement until pressure is resolved.",
      "wrongReasons": [
        null,
        "Replica scaling can worsen pressure and does not resolve root node storage exhaustion.",
        "API server restart is unrelated to actual node disk saturation.",
        "Deleting PVCs is dangerous and typically unrelated to node-local disk pressure root cause."
      ],
      "tip": "Go tip: Emit structured disk-usage metrics and alerts from node agents to catch pressure before it blocks scheduling.",
      "deepDive": "Kubelet eviction and image GC behavior are tied to disk thresholds. Tune runtime log rotation and image cleanup policy for stable node operations.",
      "groupId": "clusterArchitecture",
      "isBoss": false
    },
    {
      "type": "quiz",
      "q": "What is the main role of kube-controller-manager in the Kubernetes control plane?",
      "context": "# Think reconciliation loops\n# Which component continuously drives actual state toward desired state?",
      "options": [
        "Run controller loops (Deployment, Node, Job, endpoints, etc.) to reconcile cluster state",
        "Expose the Kubernetes API endpoint and admission chain",
        "Store cluster state as a distributed key-value database",
        "Run workload containers on nodes"
      ],
      "answer": 0,
      "explain": "kube-controller-manager hosts multiple controllers that watch API objects and reconcile current state to desired state.",
      "wrongReasons": [
        null,
        "API serving and admission are kube-apiserver responsibilities.",
        "State persistence is etcd's responsibility.",
        "Node-level workload execution is handled by kubelet + container runtime."
      ],
      "tip": "Go tip: Controller patterns in client-go mimic this reconciliation model: observe, compare desired vs actual, act idempotently.",
      "deepDive": "Controllers are eventually consistent loops. They rely on watches and retries, so idempotency and conflict-safe updates are critical.",
      "groupId": "clusterArchitecture",
      "isBoss": false
    },
    {
      "type": "command",
      "q": "Build the command to inspect all conditions and recent events for node `worker-1`.",
      "context": "# Node health triage during incident\n# Need condition, taint, and event details",
      "tokens": [
        "kubectl",
        "describe",
        "node",
        "worker-1",
        "get",
        "nodes",
        "-o",
        "wide",
        "drain",
        "--ignore-daemonsets"
      ],
      "answer": [
        "kubectl",
        "describe",
        "node",
        "worker-1"
      ],
      "explain": "`kubectl describe node` gives high-signal operational data: conditions, taints, allocatable resources, and node events.",
      "wrongReasons": [],
      "tip": "In serious incidents, snapshot `describe node` output early so you retain evidence even if node state changes later.",
      "deepDive": "Combine node describe with kubelet logs and runtime metrics to differentiate scheduler policy issues from host health failures.",
      "groupId": "clusterArchitecture",
      "isBoss": false
    },
    {
      "type": "scenario",
      "q": "👹 BOSS INCIDENT: `kubectl` requests to the cluster time out after a manual edit to `kube-apiserver.yaml` on the control plane node. What is the fastest safe recovery?",
      "context": "Facts:\n- API server static pod was edited manually\n- Other node processes are healthy\n- Cluster access is degraded from outside the control plane node",
      "options": [
        "Restore a known-good kube-apiserver static pod manifest in /etc/kubernetes/manifests and let kubelet recreate it",
        "Run kubectl rollout restart deployment/kube-apiserver -n kube-system",
        "Delete /var/lib/etcd and restart all control plane services",
        "Scale CoreDNS to zero to reduce control plane load"
      ],
      "answer": 0,
      "explain": "kube-apiserver is a static pod in kubeadm setups. Restoring a valid manifest is the direct and least-destructive path to recover API availability.",
      "wrongReasons": [
        null,
        "There is no standard kube-apiserver Deployment to restart in this setup. If API server is down, kubectl rollout actions may not even execute.",
        "Deleting etcd data is catastrophic and unnecessary for a manifest misconfiguration incident.",
        "CoreDNS is downstream from API server control plane health; scaling it does not repair API server startup failures."
      ],
      "tip": "Go tip: Keep versioned backups of control plane static manifests and cert paths in a secure runbook repo for rapid incident rollback.",
      "deepDive": "After restoring manifest syntax/flags/volume mounts, watch kubelet logs and static pod status locally. Once API server returns, validate etcd, scheduler, controller-manager, and admission health.",
      "groupId": "clusterArchitecture",
      "isBoss": true
    }
  ]
});
