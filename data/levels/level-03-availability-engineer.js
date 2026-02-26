window.KUBECRAFT_LEVEL_DATA = window.KUBECRAFT_LEVEL_DATA || [];
window.KUBECRAFT_LEVEL_DATA.push({
  "id": "level-3",
  "title": "Level 3 · Availability Engineer",
  "difficulty": "Intermediate",
  "badgeIcon": "⚙️",
  "badgeName": "Availability Engineer",
  "description": "Control scheduling decisions and workload placement with affinities, disruption budgets, and production-safe scheduling policy.",
  "status": "active",
  "targetQuestionCount": 20,
  "focus": [
    "Scheduling & Policy"
  ],
  "questions": [
    {
      "type": "quiz",
      "q": "What are taints and tolerations in Kubernetes?",
      "context": "# GPU node pool is tainted:\nkubectl describe node gpu-node-1\nTaints: gpu=true:NoSchedule\n\n# Your regular Go web service pods won't schedule there.\n# But your ML training pods need to run there.",
      "options": [
        "Taints mark nodes to repel pods; tolerations let specific pods override a taint and schedule there",
        "Taints encrypt data on nodes; tolerations decrypt it for authorized pods",
        "Taints limit CPU usage on nodes; tolerations allow bursting beyond limits",
        "Taints are the same as node labels; tolerations are pod labels"
      ],
      "answer": 0,
      "explain": "Taints are applied to nodes to repel pods that don't explicitly tolerate them. Tolerations are set on pods to allow (but not require) scheduling on tainted nodes. This is how you dedicate node pools — only pods with the right toleration can land on a tainted node.",
      "wrongReasons": [
        null,
        "Taints have nothing to do with encryption. Encryption at rest is configured via EncryptionConfiguration for etcd. Taints are purely a scheduling mechanism.",
        "CPU limits are controlled by resource limits in the pod spec, not taints. Taints control WHERE pods can schedule, not HOW MUCH resource they use.",
        "Labels and taints are different mechanisms. Labels are key-value metadata for selection (used by Services, Deployments). Taints actively repel pods — labels don't. Tolerations are not labels either; they're a scheduling override."
      ],
      "tip": "Go tip: Taint effects: NoSchedule (prevent new pods), PreferNoSchedule (soft preference), NoExecute (evict existing pods too). Use NoSchedule for dedicated node pools; NoExecute for emergency node isolation.",
      "deepDive": "Common patterns: (1) Dedicate GPU nodes: taint with gpu=true:NoSchedule, add toleration to ML pods. (2) Isolate control plane: master nodes are tainted node-role.kubernetes.io/control-plane:NoSchedule by default. (3) Node maintenance: taint a node before drain to stop new pods immediately. Taints + nodeSelector together ensure pods both CAN and WILL land on specific nodes.",
      "groupId": "schedulingPolicy",
      "shuffleGroup": 1,
      "isBoss": false
    },
    {
      "type": "quiz",
      "q": "You have nodes labeled `disktype: ssd`. How do you ensure your Go database pods run ONLY on SSD nodes?",
      "context": "kubectl get nodes --show-labels\nNAME     LABELS\nnode-1   disktype=ssd\nnode-2   disktype=ssd\nnode-3   disktype=hdd\n\n# Your database needs fast disk I/O",
      "options": [
        "Use nodeSelector in the pod spec: nodeSelector: {disktype: ssd}",
        "Use podAffinity to attract to other database pods",
        "Set resource requests for disk IOPS in the container spec",
        "Create a taint on HDD nodes and don't add a toleration"
      ],
      "answer": 0,
      "explain": "nodeSelector is the simplest way to constrain pods to nodes with specific labels. Adding `nodeSelector: {disktype: ssd}` to the pod spec ensures the scheduler only places the pod on nodes with that label. If no matching node exists, the pod stays Pending.",
      "wrongReasons": [
        null,
        "podAffinity attracts pods toward other pods, not toward node properties. You'd use it to co-locate services that need low-latency communication, not to select node hardware.",
        "Kubernetes doesn't have native disk IOPS resource requests. Storage performance is managed through StorageClass and PersistentVolume configurations, not scheduling constraints.",
        "Adding a taint to HDD nodes could work but it's backwards — it blocks ALL pods from HDD nodes unless they tolerate it. nodeSelector is the direct, targeted solution for 'run only here.'"
      ],
      "tip": "Go tip: For more expressive node selection (In, NotIn, Exists, DoesNotExist operators), use nodeAffinity instead of nodeSelector. It supports soft preferences (preferredDuringScheduling) that nodeSelector can't do.",
      "deepDive": "nodeSelector vs nodeAffinity: nodeSelector is a simple equality match (key=value). nodeAffinity supports set-based operators (In, NotIn, Gt, Lt) and has both required and preferred modes. Use nodeSelector for simple cases; nodeAffinity when you need 'prefer SSD but allow HDD if needed.'",
      "groupId": "schedulingPolicy",
      "isBoss": false
    },
    {
      "type": "quiz",
      "q": "You have 3 pods that must NEVER run on the same node (for high availability). What do you configure?",
      "context": "# 3 replicas of critical Go service\n# If a node goes down, other replicas must still work\n# How to guarantee spread across nodes?",
      "options": [
        "podAffinity — attract pods to the same node",
        "podAntiAffinity — repel pods away from nodes that already have a matching pod",
        "nodeSelector — pin each pod to a specific named node",
        "taints and tolerations — mark nodes as unavailable"
      ],
      "answer": 1,
      "explain": "podAntiAffinity with requiredDuringSchedulingIgnoredDuringExecution ensures the scheduler NEVER places two pods with matching labels on the same node. If no valid node exists, the pod stays Pending.",
      "wrongReasons": [
        "podAffinity attracts pods to nodes that ALREADY have a matching pod — the opposite of what you want. This would cluster all replicas together, defeating the purpose of HA.",
        null,
        "nodeSelector pins pods to specific nodes by label (e.g., node-type=gpu). It doesn't spread pods — it restricts where they can go. You'd still need to configure one nodeSelector per pod instance.",
        "Taints and tolerations control which pods CAN run on a node (tolerate a taint to be allowed). They don't spread pods across nodes automatically."
      ],
      "tip": "Go tip: Also consider TopologySpreadConstraints (newer than antiAffinity) for more flexible spreading across zones, regions, and custom topology keys. Better for multi-AZ deployments.",
      "deepDive": "# Example podAntiAffinity:\naffinity:\n  podAntiAffinity:\n    requiredDuringSchedulingIgnoredDuringExecution:\n    - labelSelector:\n        matchLabels:\n          app: my-go-service\n      topologyKey: kubernetes.io/hostname",
      "groupId": "schedulingPolicy",
      "shuffleGroup": 2,
      "isBoss": false
    },
    {
      "type": "quiz",
      "q": "You want to evenly spread your Go service pods across 3 availability zones. What is the best Kubernetes feature for this?",
      "context": "# Cluster spans 3 zones: us-east-1a, us-east-1b, us-east-1c\n# 6 replicas → want 2 per zone\n# If uneven, max 1 pod difference between zones",
      "options": [
        "podAntiAffinity with requiredDuringScheduling",
        "TopologySpreadConstraints with maxSkew: 1 and topologyKey: topology.kubernetes.io/zone",
        "nodeSelector — pin 2 pods to each zone's nodes manually",
        "PodDisruptionBudget — it automatically balances across zones"
      ],
      "answer": 1,
      "explain": "TopologySpreadConstraints let you define how pods spread across topology domains (zones, nodes, regions). maxSkew: 1 means the difference in pod count between any two zones can't exceed 1 — keeping distribution even.",
      "wrongReasons": [
        "podAntiAffinity prevents co-location on the same node/zone, but it's all-or-nothing with 'required' mode. It doesn't balance evenly — it just prevents overlap. With 6 pods and 3 zones, antiAffinity can't express 'max 2 per zone.'",
        null,
        "Manual nodeSelector per pod replica doesn't work with Deployments (all pods get the same spec). You'd need separate Deployments per zone, which defeats the purpose of a single scalable Deployment.",
        "PDB protects availability during disruptions but has nothing to do with pod placement or zone balancing. It limits how many pods can be unavailable, not where they're scheduled."
      ],
      "tip": "Go tip: Combine TopologySpreadConstraints with whenUnsatisfiable: DoNotSchedule (strict) or ScheduleAnyway (best-effort). For critical services, use DoNotSchedule to guarantee spread.",
      "deepDive": "# Example:\ntopologySpreadConstraints:\n- maxSkew: 1\n  topologyKey: topology.kubernetes.io/zone\n  whenUnsatisfiable: DoNotSchedule\n  labelSelector:\n    matchLabels:\n      app: my-go-service\n\nThis is more flexible than podAntiAffinity because it handles partial fills gracefully and supports multiple topology levels simultaneously (spread across zones AND within each zone across nodes).",
      "groupId": "schedulingPolicy",
      "shuffleGroup": 2,
      "isBoss": false
    },
    {
      "type": "quiz",
      "q": "What is a PodDisruptionBudget (PDB) and why should you create one for your Go service?",
      "context": "# k8s admin is draining nodes for maintenance\n# kubectl drain node-1 --ignore-daemonsets\n# Your 3-replica service suddenly drops to 0 replicas!",
      "options": [
        "A budget cap for pod compute costs in a namespace",
        "A policy that limits how many pods can be simultaneously unavailable during voluntary disruptions",
        "A QoS class that prioritizes pod scheduling over others",
        "An autoscaling policy triggered by disruption events"
      ],
      "answer": 1,
      "explain": "PDB defines minAvailable or maxUnavailable for your pods during voluntary disruptions (node drains, cluster upgrades). Without a PDB, drain can kill all your pods at once. With PDB, drain respects your availability requirements.",
      "wrongReasons": [
        "There's no cost budget concept in standard k8s. ResourceQuota limits resource consumption per namespace, but that's entirely different from disruption budgets.",
        null,
        "QoS classes (Guaranteed, Burstable, BestEffort) are determined by your resource requests/limits configuration, not a separate policy object. They affect eviction priority, not availability during drains.",
        "PDB is not an autoscaler. HPA and KEDA handle autoscaling. PDB is a safety net that blocks operations that would violate your availability guarantees."
      ],
      "tip": "Go tip: For a 3-replica service, set minAvailable: 2 or maxUnavailable: 1. This lets one pod be drained at a time while keeping 2 running. Without PDB, node drain could kill all 3 simultaneously.",
      "deepDive": "# Example PDB:\napiVersion: policy/v1\nkind: PodDisruptionBudget\nmetadata:\n  name: my-go-service-pdb\nspec:\n  minAvailable: 2\n  selector:\n    matchLabels:\n      app: my-go-service\n\nPDB only protects against voluntary disruptions (drains, upgrades). It does NOT protect against involuntary disruptions (node crash, OOM kill). For involuntary disruption resilience, combine PDB with podAntiAffinity or TopologySpreadConstraints.",
      "groupId": "schedulingPolicy",
      "isBoss": false
    },
    {
      "type": "quiz",
      "q": "During a cluster resource shortage, Kubernetes needs to decide which pods to evict to make room for higher-priority workloads. What resource defines pod priority?",
      "context": "# Cluster is full — no resources for new critical pods\n# Some low-priority batch jobs should yield resources\n# How does k8s know which pods are more important?",
      "options": [
        "ResourceQuota — limits total resources per namespace",
        "LimitRange — sets default resource limits per pod",
        "PriorityClass — assigns a numeric priority value to pods",
        "PodDisruptionBudget — protects pods from being evicted"
      ],
      "answer": 2,
      "explain": "PriorityClass assigns a numeric priority to pods. When the cluster can't fit a high-priority pod, the scheduler can preempt (evict) lower-priority pods to free resources. Higher number = higher priority.",
      "wrongReasons": [
        "ResourceQuota caps total resources per namespace but doesn't establish priority between pods. It prevents over-consumption, not priority-based eviction.",
        "LimitRange sets defaults and boundaries for individual pod resource specs. It doesn't affect scheduling priority or preemption decisions.",
        null,
        "PDB limits voluntary disruptions (like drains) but doesn't affect preemption. The scheduler can still evict pods for preemption regardless of PDB."
      ],
      "tip": "Go tip: Create a 'critical' PriorityClass for production services and a 'low' one for batch/dev workloads. Use preemptionPolicy: PreemptLowerPriority (default) for production and Never for batch jobs that shouldn't displace others.",
      "deepDive": "# Example:\napiVersion: scheduling.k8s.io/v1\nkind: PriorityClass\nmetadata:\n  name: high-priority\nvalue: 1000000\nglobalDefault: false\ndescription: \"For production-critical services\"\n\nBuilt-in system priorities exist (like system-cluster-critical at 2000000000). Never set your pods higher than system priorities or you risk evicting control plane components.",
      "groupId": "schedulingPolicy",
      "isBoss": false
    },
    {
      "type": "quiz",
      "q": "Under memory pressure, Kubernetes evicts pods based on their QoS class. Which class is evicted FIRST?",
      "context": "# Node memory usage: 95%\n# kubelet starts eviction process\n#\n# Pod A: requests=limits (Guaranteed)\n# Pod B: requests < limits (Burstable)\n# Pod C: no requests/limits  (BestEffort)",
      "options": [
        "Guaranteed — strictest config means least flexible for eviction",
        "Burstable — middle ground gets evicted first",
        "BestEffort — no resource guarantees, evicted first",
        "All pods are evicted equally regardless of QoS"
      ],
      "answer": 2,
      "explain": "Eviction order: BestEffort first (no resource guarantees), then Burstable (if exceeding requests), then Guaranteed last. BestEffort pods have no scheduling reservation, so the kubelet reclaims their resources first.",
      "wrongReasons": [
        "Guaranteed pods are evicted LAST because they have committed resources (requests == limits). The kubelet protects them as long as possible since they've reserved exactly what they need.",
        "Burstable pods are evicted after BestEffort. Among Burstable pods, those using the most above their requests are evicted first.",
        null,
        "QoS class is a key factor in eviction priority. Pods without resource specs are the most vulnerable during resource pressure."
      ],
      "tip": "Go tip: Always set both requests and limits for production Go services — at minimum to get Burstable QoS. For critical services, set requests == limits for Guaranteed QoS and maximum eviction protection.",
      "deepDive": "The kubelet eviction manager monitors node resources and triggers eviction at configurable thresholds (e.g., memory.available < 100Mi). Within BestEffort, pods consuming the most memory are evicted first. Within Burstable, pods exceeding their requests by the largest margin go first. Guaranteed pods are only evicted if the node is in extreme distress and system processes need memory.",
      "groupId": "schedulingPolicy",
      "isBoss": false
    },
    {
      "type": "quiz",
      "q": "A worker node loses network connectivity and becomes NotReady. What happens to pods running on it?",
      "context": "kubectl get nodes\nNAME       STATUS     ROLES    AGE\nnode-1     Ready      worker   30d\nnode-2     NotReady   worker   30d   ← lost contact\nnode-3     Ready      worker   30d\n\n# node-2 has 5 pods running on it",
      "options": [
        "Pods are immediately killed and rescheduled to other nodes",
        "After a grace period (~5 minutes), the control plane marks pods for deletion and the scheduler creates replacements on healthy nodes",
        "Pods keep running on the unreachable node indefinitely and are never rescheduled",
        "The scheduler live-migrates pods to another node without interruption"
      ],
      "answer": 1,
      "explain": "When a node goes NotReady, the node controller waits for pod-eviction-timeout (default ~5 minutes) before marking pods for deletion. If the node recovers before the timeout, nothing happens. If not, pods are evicted and the Deployment controller creates replacements on healthy nodes.",
      "wrongReasons": [
        "Pods are NOT immediately rescheduled. Kubernetes waits to avoid unnecessary disruption from transient network blips. The grace period prevents flapping.",
        null,
        "Pods do NOT run indefinitely on unreachable nodes. After the eviction timeout, the control plane takes action. However, if the node is actually still running (just network-partitioned), the pods might still be running there — creating a split-brain scenario until the node recovers.",
        "Kubernetes does not support live migration of pods. Pods are stateless units that are terminated and recreated, not moved. New pods start fresh on the target node."
      ],
      "tip": "Go tip: Design your Go service for sudden termination — use graceful shutdown, externalize state to a database or cache, and ensure idempotent request handling. When pods move between nodes, in-memory state is lost.",
      "deepDive": "The default eviction timeout (~5 min) is a trade-off: too short causes unnecessary churn from brief network glitches; too long leaves failed nodes unresolved. For stateful workloads, this delay can cause issues — consider shorter timeouts with node problem detectors. Also note: terminated pods on the unreachable node may still be running ('zombie pods') — use fencing (e.g., STONITH) in critical environments.",
      "groupId": "schedulingPolicy",
      "isBoss": false
    },
    {
      "type": "quiz",
      "q": "Why should you add a preStop lifecycle hook with a short sleep to pods in a cluster with regular node drains?",
      "context": "lifecycle:\n  preStop:\n    exec:\n      command: [\"sh\", \"-c\", \"sleep 5\"]\n\n# Why sleep before shutdown?\n# SIGTERM is sent immediately after preStop completes",
      "options": [
        "It backs up pod data to a PersistentVolume before termination",
        "It gives time for endpoint removal to propagate across the cluster before the pod starts shutting down",
        "It automatically migrates the pod to another node before shutdown",
        "It prevents the pod from being terminated entirely"
      ],
      "answer": 1,
      "explain": "When a pod is being terminated, two things happen in parallel: (1) the pod is removed from Service endpoints, and (2) SIGTERM is sent. The preStop sleep gives kube-proxy and ingress controllers time to remove the pod from their routing tables BEFORE the app starts shutting down — preventing requests from being sent to a dying pod.",
      "wrongReasons": [
        "preStop doesn't handle data backup. Use PersistentVolumes for durable data and external backup solutions (Velero) for backup operations.",
        null,
        "Kubernetes does not migrate pods. Pods are terminated and recreated. preStop runs before termination — it cannot move a pod to another node.",
        "preStop delays termination but does NOT prevent it. After preStop completes and terminationGracePeriodSeconds expires, the pod is forcefully killed (SIGKILL). preStop is a grace window, not a veto."
      ],
      "tip": "Go tip: Set preStop sleep to 3-5 seconds. Combined with your Go app's graceful shutdown (http.Server.Shutdown), this creates a clean sequence: (1) preStop sleep → endpoints removed, (2) SIGTERM → app drains connections, (3) app exits cleanly.",
      "deepDive": "The full termination sequence: Pod marked for deletion → preStop hook runs + pod removed from Endpoints (parallel) → preStop completes → SIGTERM sent → app shuts down → if app doesn't exit within terminationGracePeriodSeconds, SIGKILL. Without the preStop sleep, new requests can arrive AFTER SIGTERM because endpoint removal is asynchronous.",
      "groupId": "schedulingPolicy",
      "isBoss": false
    },
    {
      "type": "quiz",
      "q": "Multiple teams share your cluster. How do you prevent one team's namespace from consuming all available CPU and memory?",
      "context": "# Team A: 'payments' namespace — critical\n# Team B: 'analytics' namespace — batch processing\n# Problem: analytics jobs consumed all cluster resources\n# payments pods went Pending!",
      "options": [
        "ResourceQuota — sets hard limits on total resource consumption per namespace",
        "LimitRange — sets default requests/limits for individual pods",
        "NetworkPolicy — restricts network access between namespaces",
        "PodDisruptionBudget — limits pod termination during disruptions"
      ],
      "answer": 0,
      "explain": "ResourceQuota caps the total resources (CPU, memory, pod count, etc.) a namespace can consume. If the analytics namespace has a ResourceQuota of 8 CPU / 16Gi memory, it can't exceed that — leaving resources available for the payments namespace.",
      "wrongReasons": [
        null,
        "LimitRange sets defaults and bounds for individual containers/pods (e.g., default CPU request = 100m). It doesn't cap total namespace consumption — a team could still create thousands of small pods.",
        "NetworkPolicy controls network traffic between pods and namespaces. It's a network security tool, not a resource governance tool.",
        "PDB protects pods during voluntary disruptions (drains, upgrades). It doesn't limit resource consumption or prevent one namespace from hogging cluster capacity."
      ],
      "tip": "Go tip: When ResourceQuota is active in a namespace, every pod MUST specify resource requests/limits — otherwise creation is rejected. Pair ResourceQuota with LimitRange to auto-inject defaults for pods that forget.",
      "deepDive": "# Example ResourceQuota:\napiVersion: v1\nkind: ResourceQuota\nmetadata:\n  name: analytics-quota\n  namespace: analytics\nspec:\n  hard:\n    requests.cpu: \"8\"\n    requests.memory: 16Gi\n    limits.cpu: \"16\"\n    limits.memory: 32Gi\n    pods: \"50\"\n\nResourceQuota also supports object count limits (e.g., max 10 Services, max 5 PVCs per namespace).",
      "groupId": "schedulingPolicy",
      "shuffleGroup": 3,
      "isBoss": false
    },
    {
      "type": "quiz",
      "q": "Developers keep deploying pods without resource requests or limits. What resource automatically injects default values?",
      "context": "# Problem: pods created with no resources specified\nkubectl get pod new-app -o yaml\nresources: {}  # nothing set!\n\n# This causes unpredictable scheduling and BestEffort QoS",
      "options": [
        "ResourceQuota — caps total namespace resources",
        "LimitRange — sets default, min, and max resource values per container",
        "PriorityClass — assigns scheduling priority",
        "Admission controller webhook — validates YAML before applying"
      ],
      "answer": 1,
      "explain": "LimitRange defines default resource requests/limits that are automatically injected into containers that don't specify them. It also enforces minimum and maximum bounds — rejecting pods that request too little or too much.",
      "wrongReasons": [
        "ResourceQuota caps total namespace consumption but doesn't inject defaults into individual pods. Without LimitRange, pods that forget resource specs are rejected when ResourceQuota is active.",
        null,
        "PriorityClass affects scheduling priority and preemption, not resource defaults. It determines which pods yield to others, not what resources they request.",
        "Admission controllers are a general mechanism. LimitRange IS implemented as an admission controller, but the specific resource you create is called LimitRange — not a raw webhook."
      ],
      "tip": "Go tip: LimitRange + ResourceQuota work together: LimitRange injects sensible defaults so developers don't need to remember; ResourceQuota caps the namespace total so no team over-consumes.",
      "deepDive": "# Example LimitRange:\napiVersion: v1\nkind: LimitRange\nmetadata:\n  name: default-limits\n  namespace: production\nspec:\n  limits:\n  - default:\n      cpu: 500m\n      memory: 256Mi\n    defaultRequest:\n      cpu: 100m\n      memory: 128Mi\n    type: Container\n\nLimitRange also supports min/max bounds: min.cpu: 50m rejects pods requesting less than 50m CPU.",
      "groupId": "schedulingPolicy",
      "shuffleGroup": 3,
      "isBoss": false
    },
    {
      "type": "command",
      "q": "Build the kubectl command to mark node \"worker-3\" as unschedulable so no new pods are placed on it.",
      "context": "# Preparing for node maintenance\n# Step 1: Stop new pods from landing here\n# Step 2: Drain existing pods (separate command)",
      "tokens": [
        "kubectl",
        "cordon",
        "worker-3",
        "uncordon",
        "drain",
        "taint",
        "node",
        "--ignore-daemonsets"
      ],
      "answer": [
        "kubectl",
        "cordon",
        "worker-3"
      ],
      "explain": "`kubectl cordon` marks a node as SchedulingDisabled. Existing pods keep running, but the scheduler won't place new pods there. This is the safe first step before maintenance.",
      "wrongReasons": [],
      "tip": "After maintenance, use `kubectl uncordon worker-3` to allow scheduling again. Forgetting to uncordon is a common mistake that leads to 'why are my pods Pending on a 3-node cluster with only 2 schedulable nodes?'",
      "deepDive": "Under the hood, cordon sets the node.kubernetes.io/unschedulable taint on the node. You can verify with `kubectl describe node worker-3 | grep -i taint`. The Unschedulable field in the node spec is also set to true.",
      "groupId": "schedulingPolicy",
      "shuffleGroup": 4,
      "isBoss": false
    },
    {
      "type": "command",
      "q": "Build the kubectl command to safely evict all pods from node \"worker-3\" for maintenance, ignoring DaemonSet-managed pods.",
      "context": "# Node cordoned, now need to move workloads off\n# DaemonSets (log agents, node exporters) should stay",
      "tokens": [
        "kubectl",
        "drain",
        "worker-3",
        "--ignore-daemonsets",
        "--delete-emptydir-data",
        "cordon",
        "uncordon",
        "delete",
        "node"
      ],
      "answer": [
        "kubectl",
        "drain",
        "worker-3",
        "--ignore-daemonsets",
        "--delete-emptydir-data"
      ],
      "explain": "`kubectl drain` cordons the node and evicts all pods. --ignore-daemonsets is required because DaemonSet pods can't be evicted (they're managed per-node). --delete-emptydir-data acknowledges that emptyDir volume data will be lost.",
      "wrongReasons": [],
      "tip": "If a pod has a PDB, drain respects it — waiting until eviction won't violate minAvailable. If drain stalls, check which PDB is blocking with `kubectl get pdb`.",
      "deepDive": "Drain evicts pods one by one, respecting PDBs. If a PDB prevents eviction, drain waits (use --timeout to set a deadline). Add --force to evict pods not managed by a controller (bare pods), but they won't be recreated. Drain order: check PDB → send eviction API → wait for pod to terminate → next pod.",
      "groupId": "schedulingPolicy",
      "shuffleGroup": 4,
      "isBoss": false
    },
    {
      "type": "command",
      "q": "Build the kubectl command to mark node \"worker-3\" as schedulable again after maintenance is complete.",
      "context": "# Maintenance done, node is healthy\n# Currently: SchedulingDisabled\n# Need to allow new pods again",
      "tokens": [
        "kubectl",
        "uncordon",
        "worker-3",
        "cordon",
        "drain",
        "taint",
        "node",
        "--force"
      ],
      "answer": [
        "kubectl",
        "uncordon",
        "worker-3"
      ],
      "explain": "`kubectl uncordon` removes the SchedulingDisabled status, allowing the scheduler to place new pods on the node again. Always uncordon after maintenance — forgetting is a common operational mistake.",
      "wrongReasons": [],
      "tip": "After uncordon, existing pods on other nodes won't automatically move back. The scheduler only places NEW pods (from scale-up, restarts, or deployments). To rebalance, use `kubectl rollout restart` or a descheduler.",
      "deepDive": "The Kubernetes descheduler (an optional add-on) can automatically rebalance pods across nodes after maintenance. It identifies pods on over-loaded nodes and evicts them so the scheduler can redistribute. Without it, manual rollout restarts are the quickest rebalancing method.",
      "groupId": "schedulingPolicy",
      "shuffleGroup": 4,
      "isBoss": false
    },
    {
      "type": "command",
      "q": "Build the kubectl command to add a NoSchedule taint with key \"maintenance\" and value \"true\" to node \"worker-3\".",
      "context": "# Tainting node before maintenance window\n# Prevents new pods without the right toleration",
      "tokens": [
        "kubectl",
        "taint",
        "nodes",
        "worker-3",
        "maintenance=true:NoSchedule",
        "cordon",
        "label",
        "--overwrite",
        "NoExecute"
      ],
      "answer": [
        "kubectl",
        "taint",
        "nodes",
        "worker-3",
        "maintenance=true:NoSchedule"
      ],
      "explain": "`kubectl taint nodes <node> key=value:effect` adds a taint. NoSchedule prevents new pods from being scheduled unless they tolerate this taint. Existing pods are not affected (use NoExecute to also evict existing pods).",
      "wrongReasons": [],
      "tip": "To remove a taint, add a minus at the end: `kubectl taint nodes worker-3 maintenance=true:NoSchedule-`. The trailing minus means 'remove this taint.'",
      "deepDive": "Taint effects: NoSchedule (block new pods), PreferNoSchedule (soft — scheduler avoids but doesn't block), NoExecute (evict existing pods AND block new ones). NoExecute with tolerationSeconds lets existing pods stay for a grace period before eviction.",
      "groupId": "schedulingPolicy",
      "shuffleGroup": 1,
      "isBoss": false
    },
    {
      "type": "command",
      "q": "Build the kubectl command to check current CPU and memory usage across all cluster nodes.",
      "context": "# Investigating cluster capacity\n# Need to see which nodes have resource headroom",
      "tokens": [
        "kubectl",
        "top",
        "nodes",
        "pods",
        "get",
        "describe",
        "--sort-by=cpu",
        "-A"
      ],
      "answer": [
        "kubectl",
        "top",
        "nodes"
      ],
      "explain": "`kubectl top nodes` shows real-time CPU and memory usage for each node (requires metrics-server). It displays both absolute usage and percentage of allocatable capacity — essential for capacity planning and scheduling decisions.",
      "wrongReasons": [],
      "tip": "Combine with `kubectl describe node <name>` to see the gap between allocated (requested) resources and actual usage. High allocation + low usage = right-sizing opportunity.",
      "deepDive": "kubectl top requires metrics-server to be installed in the cluster. It reads from the Metrics API (metrics.k8s.io). For historical data, use Prometheus + Grafana. Note: 'top' shows actual usage; 'describe node' shows requested (allocated) resources. The difference between allocated and actual is your over-provisioning margin.",
      "groupId": "schedulingPolicy",
      "isBoss": false
    },
    {
      "type": "scenario",
      "q": "🚨 INCIDENT: After a maintenance window, all new pods are stuck in Pending. Events show: \"0/4 nodes had taint {maintenance=true: NoSchedule}, that the pod didn't tolerate.\" The maintenance is over. What is the fix?",
      "context": "kubectl get pods\nNAME            READY   STATUS    RESTARTS   AGE\nnew-deploy-abc  0/1     Pending   0          15m\n\nkubectl describe pod new-deploy-abc\nEvents:\n  Warning  FailedScheduling  0/4 nodes available:\n           4 node(s) had taint {maintenance=true: NoSchedule},\n           that the pod didn't tolerate.",
      "options": [
        "🔧 Remove the stale taint: kubectl taint nodes --all maintenance=true:NoSchedule-",
        "🏷️ Add a toleration for the maintenance taint to every pod spec",
        "🔄 Restart the kube-scheduler — it must be stuck",
        "📈 Add new untainted nodes to the cluster"
      ],
      "answer": 0,
      "explain": "Someone forgot to remove the maintenance taint after the window closed. The fix is to remove the taint with the trailing minus syntax. All pods waiting to schedule will immediately become eligible for placement.",
      "wrongReasons": [
        null,
        "Adding tolerations to every pod defeats the purpose of taints. The maintenance is over — the taint should be removed, not tolerated. Tolerating a maintenance taint in every pod makes it meaningless.",
        "The scheduler is working correctly — it's correctly rejecting pods that don't tolerate the taint. Restarting the scheduler won't change the taint configuration.",
        "Adding nodes is expensive and slow. The existing nodes are healthy — they just have a stale taint from the completed maintenance window."
      ],
      "tip": "Go tip: Automate taint management in your maintenance scripts: add taint at start, remove at end. Use a CI/CD step or CronJob to verify no stale maintenance taints exist after business hours.",
      "deepDive": "Post-maintenance checklist: (1) Uncordon all nodes: kubectl uncordon <node>, (2) Remove maintenance taints: kubectl taint nodes --all maintenance-, (3) Verify with: kubectl get nodes and kubectl describe nodes | grep Taint. Stale taints and forgotten cordons are among the most common 'invisible' scheduling problems in production clusters.",
      "groupId": "schedulingPolicy",
      "shuffleGroup": 1,
      "isBoss": false
    },
    {
      "type": "scenario",
      "q": "🚨 INCIDENT: During planned node maintenance, `kubectl drain worker-2` evicts all 3 replicas of your payment service simultaneously. Users report 2 minutes of complete downtime. What should you have created to prevent this?",
      "context": "kubectl drain worker-2 --ignore-daemonsets\n# All 3 payment-svc pods were on worker-2\n# All evicted at once → 0 available replicas\n# New pods took 2 min to start on other nodes\n\nMONITORING: 100% error rate for 2 minutes",
      "options": [
        "🛡️ A PodDisruptionBudget with minAvailable: 2 so drain evicts only 1 pod at a time",
        "📈 Scale to 100 replicas so some always survive drain",
        "⏩ Use the --force flag to drain faster and reduce downtime",
        "🔧 Set terminationGracePeriodSeconds: 0 for instant pod restarts"
      ],
      "answer": 0,
      "explain": "A PDB with minAvailable: 2 tells drain it can only evict 1 of the 3 pods at a time. The drain waits for the evicted pod to be rescheduled and Ready on another node before evicting the next one. This prevents simultaneous eviction of all replicas.",
      "wrongReasons": [
        null,
        "More replicas help if spread across multiple nodes, but if all are on one node (like here), drain still evicts all of them. The real fix is PDB + podAntiAffinity to both spread pods AND protect during drain.",
        "--force bypasses PDB protections and evicts pods not managed by controllers. It makes the problem worse, not better, and increases the blast radius of a drain.",
        "terminationGracePeriodSeconds: 0 means SIGKILL immediately — no graceful shutdown, no connection draining. It makes the outage shorter but messier (dropped requests, potentially corrupt state)."
      ],
      "tip": "Go tip: Two fixes needed here: (1) PDB to limit simultaneous evictions, and (2) podAntiAffinity to spread replicas across nodes so drain of one node doesn't affect all replicas.",
      "deepDive": "This incident reveals two problems: (1) No PDB allowed simultaneous eviction, and (2) all pods on one node (no spreading). The complete fix: PDB (minAvailable: 2) + podAntiAffinity (spread across nodes) + preStop hook (clean shutdown during drain). These three together form the availability triad for production services.",
      "groupId": "schedulingPolicy",
      "shuffleGroup": 4,
      "isBoss": false
    },
    {
      "type": "scenario",
      "q": "🚨 INCIDENT: An availability zone outage takes down all 6 replicas of your Go API because they were all scheduled in the same zone. What should you configure to prevent this?",
      "context": "# Cluster spans: us-east-1a, us-east-1b, us-east-1c\n# All 6 api-server pods were in us-east-1a\n# Zone us-east-1a went down → complete service outage\n\nkubectl get pods -o wide  (before outage)\nNAME              NODE        ZONE\napi-server-1      node-1a-1   us-east-1a\napi-server-2      node-1a-2   us-east-1a\napi-server-3      node-1a-1   us-east-1a\n... (all 6 in us-east-1a)",
      "options": [
        "📊 TopologySpreadConstraints with topologyKey: topology.kubernetes.io/zone and maxSkew: 1",
        "🔄 kubectl rollout restart to redistribute pods after the outage",
        "📈 Double the replica count to 12 pods",
        "🛡️ PodDisruptionBudget with minAvailable: 4"
      ],
      "answer": 0,
      "explain": "TopologySpreadConstraints with zone topology key ensures pods are evenly distributed across zones. With maxSkew: 1 and 6 replicas across 3 zones, you'd get 2 pods per zone. A single zone failure would only take out 2 of 6 replicas.",
      "wrongReasons": [
        null,
        "rollout restart recreates pods but doesn't guarantee zone distribution. The scheduler might place them all in the same zone again if that zone has the most available resources.",
        "More replicas don't help if they all end up in the same zone. Without topology constraints, 12 pods could still cluster in one zone.",
        "PDB protects against voluntary disruptions (drains, upgrades), not zone failures. Zone outage is an involuntary disruption — PDB has no effect."
      ],
      "tip": "Go tip: Combine TopologySpreadConstraints (zone spread) with podAntiAffinity (node spread within zones) for maximum resilience. This handles both zone-level and node-level failures.",
      "deepDive": "Multi-zone strategy: (1) TopologySpreadConstraints spread pods across zones, (2) PDB protects during planned maintenance, (3) Regional load balancing (cloud LB or Gateway API) routes traffic to healthy zones. For database pods (StatefulSets), zone-aware PVC provisioning ensures volumes and pods are in the same zone to avoid cross-zone latency.",
      "groupId": "schedulingPolicy",
      "shuffleGroup": 2,
      "isBoss": false
    },
    {
      "type": "scenario",
      "q": "🚨 BOSS INCIDENT: During a planned node drain, your 3-replica critical service experiences complete downtime for 4 minutes. Post-mortem reveals: (1) all replicas were on the same node, (2) no PDB existed, (3) pods exited immediately on SIGTERM without draining connections. What combination of fixes prevents all three root causes?",
      "context": "POST-MORTEM TIMELINE:\n00:00  kubectl drain node-2 --ignore-daemonsets\n00:01  All 3 pods evicted simultaneously (no PDB)\n00:01  Pods received SIGTERM → exited instantly (no graceful shutdown)\n00:01  In-flight requests dropped (connection reset)\n00:01  Service: 0/3 replicas available\n00:04  New pods Ready on other nodes → service restored\n\nROOT CAUSES:\n1. No pod spreading → all replicas on one node\n2. No PDB → simultaneous eviction allowed\n3. No preStop/graceful shutdown → dropped in-flight requests",
      "options": [
        "🛡️ Add podAntiAffinity (spread across nodes) + PDB with minAvailable: 2 + preStop hook with sleep for clean endpoint removal",
        "📈 Scale to 20 replicas and hope some survive any drain",
        "🔒 Taint all nodes with NoExecute so they can never be drained",
        "🔧 Set terminationGracePeriodSeconds: 300 alone — longer shutdown fixes everything"
      ],
      "answer": 0,
      "explain": "All three root causes need separate fixes: podAntiAffinity ensures replicas are on different nodes so draining one node doesn't remove all replicas. PDB with minAvailable: 2 limits drain to evicting 1 pod at a time. preStop hook delays SIGTERM until endpoints are removed, preventing in-flight request drops. Together, they form the availability triad for production services.",
      "wrongReasons": [
        null,
        "More replicas without spreading or PDB can still all land on one node and be drained simultaneously. Scaling alone doesn't fix architectural availability problems.",
        "NoExecute taint on all nodes prevents ALL pods from running anywhere. This would take down your entire cluster, not protect it. Taints are for node isolation, not drain prevention.",
        "terminationGracePeriodSeconds only controls how long k8s waits before SIGKILL. Without graceful shutdown in the app code, the process still exits immediately on SIGTERM. Without antiAffinity and PDB, all pods are still evicted simultaneously from the same node."
      ],
      "tip": "Go tip: The availability triad for production Go services on Kubernetes: (1) Spread pods across failure domains, (2) Protect with PDB during voluntary disruptions, (3) Handle SIGTERM gracefully with preStop + http.Server.Shutdown.",
      "deepDive": "Production-grade availability checklist:\n- podAntiAffinity or TopologySpreadConstraints (spread across nodes/zones)\n- PDB with minAvailable or maxUnavailable (protect during drains/upgrades)\n- preStop hook with sleep 3-5s (endpoint removal propagation)\n- Graceful shutdown in app (drain in-flight requests)\n- readinessProbe (gate traffic to ready pods only)\n- Resource requests/limits (prevent scheduling issues and OOM)\n\nThis boss question tests the combination. Real incidents rarely have one root cause — production resilience requires defense in depth.",
      "groupId": "schedulingPolicy",
      "isBoss": true
    }
  ]
});
