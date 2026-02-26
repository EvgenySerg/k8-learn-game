window.KUBECRAFT_LEVEL_DATA = window.KUBECRAFT_LEVEL_DATA || [];
window.KUBECRAFT_LEVEL_DATA.push({
  "id": "level-0",
  "title": "Level 0 · Mission Briefing",
  "difficulty": "Absolute Beginner",
  "badgeIcon": "🚀",
  "badgeName": "Mission Ready",
  "description": "Learn the building blocks of Kubernetes: clusters, nodes, pods, containers, services, deployments, namespaces, and your primary tool — kubectl.",
  "status": "active",
  "shuffleQuestions": false,
  "targetQuestionCount": 15,
  "focus": [
    "Cluster Architecture",
    "Pods & Workloads",
    "Services & Networking"
  ],
  "questions": [
    {
      "type": "quiz",
      "q": "What is Kubernetes?",
      "context": "# You've containerized your Go service with Docker.\n# Now you need to run it reliably across multiple servers.\n# What tool solves this?",
      "options": [
        "A programming language for cloud applications",
        "A container orchestration platform that automates deployment, scaling, and management of containerized applications",
        "A cloud provider like AWS or GCP",
        "A CI/CD pipeline tool like Jenkins or GitHub Actions"
      ],
      "answer": 1,
      "explain": "Kubernetes (k8s) is a container orchestration platform. It takes your containerized applications and manages where they run, how many copies exist, how they recover from failures, and how they communicate — across a fleet of machines.",
      "wrongReasons": [
        "Kubernetes is not a programming language. You write your app in Go, Python, Java, etc. and Kubernetes runs the containerized result.",
        null,
        "Kubernetes runs ON cloud providers (or bare metal) but is not a cloud provider itself. AWS has EKS, GCP has GKE, Azure has AKS — all managed Kubernetes services.",
        "CI/CD tools build and test your code. Kubernetes is where the built artifacts (container images) actually run in production. They complement each other."
      ],
      "tip": "Go tip: Kubernetes was originally designed by Google and is written in Go. Reading its source code is a great way to learn advanced Go patterns like controllers, informers, and client-go.",
      "deepDive": "Kubernetes automates the operational tasks you'd otherwise do manually: restarting crashed processes, distributing workloads across servers, scaling up during traffic spikes, and rolling out new versions without downtime. The name comes from Greek for 'helmsman' — the person who steers the ship.\n\nOfficial Kubernetes docs:\n- https://kubernetes.io/docs/concepts/overview/\n- https://kubernetes.io/docs/concepts/overview/components/",
      "groupId": "clusterArchitecture",
      "isBoss": false
    },
    {
      "type": "quiz",
      "q": "A Kubernetes cluster has two main parts. What are they?",
      "context": "# A cluster is a set of machines running Kubernetes.\n# It has a 'brain' and 'workers'.\n#\n# Brain: makes decisions (scheduling, API, state)\n# Workers: run your actual application containers",
      "options": [
        "Frontend and Backend",
        "Control Plane (brain) and Worker Nodes (muscle)",
        "Master Database and Replica Databases",
        "Load Balancer and Application Server"
      ],
      "answer": 1,
      "explain": "The Control Plane makes all cluster decisions: the API server receives commands, etcd stores cluster state, the scheduler places pods on nodes, and controllers ensure desired state matches reality. Worker Nodes run your actual application pods via the kubelet agent.",
      "wrongReasons": [
        "Frontend/Backend describes application architecture, not Kubernetes cluster architecture. K8s can run both frontend and backend apps, but the cluster itself is split into control plane and workers.",
        null,
        "etcd (on the control plane) stores cluster state, but the architecture is not 'master DB + replica DB.' Worker nodes run application containers, not database replicas.",
        "A load balancer can sit in front of a cluster, but the cluster itself is organized as control plane + worker nodes, not LB + app server."
      ],
      "tip": "Go tip: The control plane components (API server, scheduler, controller-manager) are all Go binaries. You can inspect their flags with `kubectl describe pod -n kube-system` to see how they're configured.",
      "deepDive": "Control plane components: kube-apiserver (the front door for all API calls), etcd (distributed key-value store for all cluster state), kube-scheduler (decides which node runs each pod), kube-controller-manager (runs reconciliation loops). Each worker node runs: kubelet (manages pods on that node) and kube-proxy (handles network rules for Service routing).\n\nOfficial Kubernetes docs:\n- https://kubernetes.io/docs/concepts/overview/components/\n- https://kubernetes.io/docs/concepts/architecture/",
      "groupId": "clusterArchitecture",
      "isBoss": false
    },
    {
      "type": "quiz",
      "q": "What is a Node in Kubernetes?",
      "context": "# Your cluster has 3 nodes:\nkubectl get nodes\nNAME       STATUS   ROLES           AGE\nnode-1     Ready    control-plane   30d\nnode-2     Ready    <none>          30d\nnode-3     Ready    <none>          30d",
      "options": [
        "A single container running your application",
        "A machine (physical or virtual) that runs pods as part of the cluster",
        "A network endpoint that routes traffic",
        "A configuration file for Kubernetes"
      ],
      "answer": 1,
      "explain": "A Node is a machine — physical server or virtual machine — that Kubernetes uses to run pods. Each node runs a kubelet agent that communicates with the control plane, receives pod assignments, and reports node health back to the cluster.",
      "wrongReasons": [
        "A container runs inside a pod, which runs on a node. Containers are the innermost layer, not the machine-level layer.",
        null,
        "Network endpoints are managed by Services and Ingress, not Nodes. Nodes are the compute machines themselves.",
        "Configuration is stored in ConfigMaps, Secrets, and YAML manifests. A Node is a running machine, not a file."
      ],
      "tip": "Go tip: Use `kubectl describe node <name>` to see a node's capacity (CPU, memory), current allocations, and conditions. This is essential when debugging scheduling issues.",
      "deepDive": "Nodes report their status via the kubelet heartbeat. If the control plane loses contact with a node (default timeout: 40s), it marks the node as NotReady and begins rescheduling pods to healthy nodes. Use `kubectl get nodes` to quickly check cluster health during incidents.\n\nOfficial Kubernetes docs:\n- https://kubernetes.io/docs/concepts/architecture/nodes/\n- https://kubernetes.io/docs/concepts/scheduling-eviction/node-pressure-eviction/",
      "groupId": "clusterArchitecture",
      "isBoss": false
    },
    {
      "type": "quiz",
      "q": "What is a Pod in Kubernetes?",
      "context": "# You've built a Go binary and packaged it as a Docker image.\n# How does Kubernetes run it?\n\nkubectl get pods\nNAME            READY   STATUS    RESTARTS   AGE\nmy-go-app-abc   1/1     Running   0          5m",
      "options": [
        "A virtual machine that runs your operating system",
        "The smallest deployable unit in Kubernetes — a wrapper around one or more containers",
        "A physical server in the data center",
        "A Docker image stored in a registry"
      ],
      "answer": 1,
      "explain": "A Pod is the smallest unit Kubernetes can create and manage. It wraps one or more containers that share the same network namespace (same IP, same localhost) and can share storage volumes. In most cases, you run one main container per pod.",
      "wrongReasons": [
        "Pods are not VMs. They are lightweight wrappers around containers. Containers share the host OS kernel, unlike VMs which each run a full OS.",
        null,
        "Physical servers are Nodes, not Pods. Pods run ON nodes. Many pods can share a single node.",
        "A Docker image is a build artifact stored in a registry. A Pod is a running instance created from an image. The image is the blueprint; the pod is the live process."
      ],
      "tip": "Go tip: Your Go binary runs as a process inside a container, inside a pod. From the Go app's perspective, it's just a normal Linux process — net.Listen, os.Getenv, and file I/O all work as expected.",
      "deepDive": "Pods are ephemeral — they can be killed and recreated at any time (node failure, scaling, updates). Never store important state inside a pod's filesystem. Use PersistentVolumes for data that must survive restarts. This 'cattle not pets' model is fundamental to Kubernetes design.\n\nOfficial Kubernetes docs:\n- https://kubernetes.io/docs/concepts/workloads/pods/\n- https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/",
      "groupId": "podsWorkloads",
      "isBoss": false
    },
    {
      "type": "quiz",
      "q": "What is the relationship between a Container and a Pod?",
      "context": "# A pod with one container (most common):\nspec:\n  containers:\n  - name: my-go-app\n    image: myapp:v1\n\n# A pod with two containers (sidecar pattern):\nspec:\n  containers:\n  - name: my-go-app\n    image: myapp:v1\n  - name: log-shipper\n    image: fluentd:latest",
      "options": [
        "They are the same thing — just different names",
        "A container is an isolated process; a pod groups one or more containers with shared networking and storage",
        "A pod runs inside a container",
        "Containers are for production; pods are for development only"
      ],
      "answer": 1,
      "explain": "A container is a single isolated process (your Go binary). A pod groups one or more containers that need to work closely together — they share the same IP address, can communicate via localhost, and can mount the same volumes. Most pods have just one container.",
      "wrongReasons": [
        "They are different concepts at different levels. A container is the process layer; a pod is the Kubernetes scheduling and networking layer that wraps containers.",
        null,
        "It's the other way around: containers run inside pods. A pod is the outer wrapper that Kubernetes manages.",
        "Both are used in production. Pods are the standard deployment unit across all environments."
      ],
      "tip": "Go tip: The sidecar pattern is common — your Go app as the main container plus a logging agent, proxy (like Envoy), or config reloader as a second container in the same pod.",
      "deepDive": "Containers within a pod share the network namespace (same IP, same port space) and can share volumes. They are co-scheduled on the same node. Use multi-container pods for tightly coupled processes (app + sidecar), not for unrelated services. Unrelated services should be separate pods behind separate Services.\n\nOfficial Kubernetes docs:\n- https://kubernetes.io/docs/concepts/containers/\n- https://kubernetes.io/docs/concepts/workloads/pods/",
      "groupId": "podsWorkloads",
      "isBoss": false
    },
    {
      "type": "quiz",
      "q": "What is a Deployment in Kubernetes?",
      "context": "# You want to run 3 copies of your Go service\n# and update them without downtime.\n\napiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: api-server\nspec:\n  replicas: 3",
      "options": [
        "A one-time action that creates a single pod",
        "A higher-level resource that manages pods — handles replicas, updates, and rollbacks",
        "A network configuration for routing traffic",
        "A script that installs Kubernetes on a server"
      ],
      "answer": 1,
      "explain": "A Deployment is the standard way to run stateless applications in Kubernetes. It manages a set of identical pods: maintains the desired replica count, performs rolling updates when you change the image, and supports rollback if something goes wrong.",
      "wrongReasons": [
        "Deployments are not one-time. They are a persistent desired-state declaration. Kubernetes continuously reconciles the cluster to match what the Deployment specifies.",
        null,
        "Network routing is handled by Services and Ingress, not Deployments. Deployments manage the lifecycle of pods (create, update, scale, rollback).",
        "Installing Kubernetes is done by tools like kubeadm, kops, or managed services (EKS/GKE/AKS). A Deployment is a resource you create inside an already-running cluster."
      ],
      "tip": "Go tip: You almost never create bare pods directly. Always use a Deployment so Kubernetes can restart crashed pods, scale replicas, and manage rolling updates for you.",
      "deepDive": "Deployments work through ReplicaSets — each update creates a new ReplicaSet. The Deployment controller scales the new one up and the old one down, following your update strategy (RollingUpdate or Recreate). Old ReplicaSets are kept for rollback history.\n\nOfficial Kubernetes docs:\n- https://kubernetes.io/docs/concepts/workloads/controllers/deployment/\n- https://kubernetes.io/docs/concepts/workloads/controllers/replicaset/",
      "groupId": "podsWorkloads",
      "isBoss": false
    },
    {
      "type": "quiz",
      "q": "What is a Service in Kubernetes?",
      "context": "# Your Go service has 3 pod replicas.\n# Each pod gets a different IP that changes on restart.\n# How do other services find and talk to yours?\n\napiVersion: v1\nkind: Service\nmetadata:\n  name: api-svc\nspec:\n  selector:\n    app: api-server\n  ports:\n  - port: 80\n    targetPort: 8080",
      "options": [
        "A background process that runs your application code",
        "A stable network endpoint that routes traffic to a set of pods matched by labels",
        "A monitoring dashboard for pod health",
        "A type of container image"
      ],
      "answer": 1,
      "explain": "A Service provides a stable IP address and DNS name that routes traffic to pods matching its label selector. Pod IPs are ephemeral — they change on every restart. The Service abstraction gives other components a fixed address that always reaches healthy pods.",
      "wrongReasons": [
        "Application processes run inside containers, inside pods. A Service is a networking abstraction, not a process.",
        null,
        "Monitoring is handled by tools like Prometheus and Grafana, not Services. A Service is purely about network routing.",
        "Container images are stored in registries (Docker Hub, ECR, GCR). A Service is a live cluster resource for traffic routing."
      ],
      "tip": "Go tip: Inside the cluster, call other services by DNS name: http.Get(\"http://api-svc:80/endpoint\"). Kubernetes DNS resolves the Service name to its ClusterIP automatically.",
      "deepDive": "Services discover pods through label selectors. When a pod matches the selector AND passes its readiness probe, its IP is added to the Service's Endpoints list. This is how traffic only reaches healthy pods. The most common Service type is ClusterIP (internal only).\n\nOfficial Kubernetes docs:\n- https://kubernetes.io/docs/concepts/services-networking/service/\n- https://kubernetes.io/docs/concepts/services-networking/dns-pod-service/",
      "groupId": "servicesNetworking",
      "isBoss": false
    },
    {
      "type": "quiz",
      "q": "What is a Namespace in Kubernetes?",
      "context": "kubectl get namespaces\nNAME              STATUS   AGE\ndefault           Active   30d\nkube-system       Active   30d\nkube-public       Active   30d\nproduction        Active   10d\nstaging           Active   10d",
      "options": [
        "A physical partition that runs on separate hardware",
        "A logical partition within a cluster for organizing and isolating resources",
        "A type of DNS record",
        "A folder on the node's filesystem"
      ],
      "answer": 1,
      "explain": "A Namespace is a logical boundary within a cluster. Resources in different namespaces can have the same name without conflict. Namespaces let you separate environments (dev, staging, prod) or teams within a single cluster, with RBAC and resource quotas scoped per namespace.",
      "wrongReasons": [
        "Namespaces are logical, not physical. Pods from different namespaces can run on the same node. For physical isolation, you need separate clusters.",
        null,
        "DNS is involved (services get namespace-scoped DNS names), but a Namespace itself is an organizational resource, not a DNS record.",
        "Namespaces exist at the Kubernetes API level, not on the filesystem. They organize API objects like Pods, Services, and ConfigMaps."
      ],
      "tip": "Go tip: Always specify `-n <namespace>` in kubectl commands to avoid accidentally operating on the wrong environment. Set a default with `kubectl config set-context --current --namespace=staging`.",
      "deepDive": "Every cluster starts with three namespaces: `default` (where resources go if no namespace is specified), `kube-system` (control plane components like CoreDNS, kube-proxy), and `kube-public` (cluster-wide readable resources). Create your own namespaces for application workloads.\n\nOfficial Kubernetes docs:\n- https://kubernetes.io/docs/concepts/overview/working-with-objects/namespaces/\n- https://kubernetes.io/docs/concepts/overview/working-with-objects/",
      "groupId": "clusterArchitecture",
      "isBoss": false
    },
    {
      "type": "quiz",
      "q": "What is kubectl?",
      "context": "# You've got a Kubernetes cluster running.\n# How do you interact with it?\n\n$ kubectl get pods\n$ kubectl apply -f deployment.yaml\n$ kubectl logs my-app-pod",
      "options": [
        "A container runtime that runs Docker images",
        "The command-line tool for communicating with the Kubernetes API server",
        "A web dashboard for managing clusters",
        "A package manager for installing Kubernetes"
      ],
      "answer": 1,
      "explain": "kubectl (pronounced 'kube-control' or 'kube-cuddle') is the CLI tool that sends requests to the Kubernetes API server. Every action — creating pods, reading logs, scaling deployments — goes through kubectl to the API server, which validates and executes the request.",
      "wrongReasons": [
        "Container runtimes (containerd, CRI-O) run on each node and manage the actual container lifecycle. kubectl is a client tool you run on your workstation.",
        null,
        "Kubernetes has a web dashboard (kubernetes-dashboard), but kubectl is the primary CLI tool. Most production operations use kubectl or GitOps tools, not the dashboard.",
        "Installing Kubernetes is done by kubeadm, kops, or managed services. kubectl manages resources inside an already-running cluster."
      ],
      "tip": "Go tip: kubectl reads its config from ~/.kube/config, which specifies cluster addresses and credentials. Use `kubectl config get-contexts` to see available clusters and `kubectl config use-context <name>` to switch.",
      "deepDive": "kubectl communicates with the kube-apiserver over HTTPS. The API server authenticates the request, checks RBAC authorization, validates the resource spec, and stores the result in etcd. All other components (scheduler, controllers, kubelet) watch the API server for changes — kubectl is just one of many API clients.\n\nOfficial Kubernetes docs:\n- https://kubernetes.io/docs/reference/kubectl/\n- https://kubernetes.io/docs/reference/kubectl/quick-reference/",
      "groupId": "clusterArchitecture",
      "isBoss": false
    },
    {
      "type": "command",
      "q": "Build the kubectl command to list all running pods in the default namespace.",
      "context": "# First thing you do when checking a cluster:\n# 'What's running right now?'",
      "tokens": [
        "kubectl",
        "get",
        "pods",
        "nodes",
        "services",
        "describe",
        "-n",
        "kube-system"
      ],
      "answer": [
        "kubectl",
        "get",
        "pods"
      ],
      "explain": "`kubectl get pods` lists all pods in the default namespace. It shows the pod name, readiness status (READY), current state (STATUS), restart count, and age. This is typically the first command you run when checking cluster health.",
      "wrongReasons": [],
      "tip": "Add `-A` or `--all-namespaces` to see pods across ALL namespaces. Add `-o wide` for extra details like node placement and pod IP.",
      "deepDive": "Common status values: Running (healthy), Pending (waiting for scheduling or image pull), CrashLoopBackOff (container keeps crashing), ImagePullBackOff (can't pull the image), Completed (finished successfully, common for Jobs). Learning to read pod status quickly is a core operational skill.\n\nOfficial Kubernetes docs:\n- https://kubernetes.io/docs/reference/generated/kubectl/kubectl-commands#get\n- https://kubernetes.io/docs/tasks/debug/debug-application/debug-running-pod/",
      "groupId": "podsWorkloads",
      "isBoss": false
    },
    {
      "type": "command",
      "q": "Build the kubectl command to list all namespaces in the cluster.",
      "context": "# You just joined a new team.\n# First question: what environments/namespaces exist?",
      "tokens": [
        "kubectl",
        "get",
        "namespaces",
        "pods",
        "nodes",
        "describe",
        "-o",
        "wide"
      ],
      "answer": [
        "kubectl",
        "get",
        "namespaces"
      ],
      "explain": "`kubectl get namespaces` (or `kubectl get ns` for short) lists all namespaces in the cluster. This is how you discover what environments, teams, or system components exist in a cluster you're new to.",
      "wrongReasons": [],
      "tip": "Most kubectl resource names have short aliases: `ns` for namespaces, `po` for pods, `svc` for services, `deploy` for deployments, `no` for nodes. Use them to type faster.",
      "deepDive": "When you run `kubectl get pods` without `-n`, it defaults to the `default` namespace. System components live in `kube-system`. Always check which namespace you're targeting — operating on the wrong namespace is a common and preventable mistake.\n\nOfficial Kubernetes docs:\n- https://kubernetes.io/docs/reference/generated/kubectl/kubectl-commands#get\n- https://kubernetes.io/docs/concepts/overview/working-with-objects/namespaces/",
      "groupId": "clusterArchitecture",
      "isBoss": false
    },
    {
      "type": "command",
      "q": "Build the kubectl command to list all nodes in the cluster.",
      "context": "# Checking cluster capacity:\n# How many machines are available?",
      "tokens": [
        "kubectl",
        "get",
        "nodes",
        "pods",
        "namespaces",
        "describe",
        "-A",
        "--watch"
      ],
      "answer": [
        "kubectl",
        "get",
        "nodes"
      ],
      "explain": "`kubectl get nodes` lists all machines in the cluster with their status (Ready/NotReady), roles (control-plane, worker), and age. This is how you verify cluster health at the infrastructure level.",
      "wrongReasons": [],
      "tip": "If a node shows NotReady, pods on it may be rescheduled to other nodes. Use `kubectl describe node <name>` to see why — check Conditions and Events at the bottom.",
      "deepDive": "Node status is reported by the kubelet heartbeat. Key conditions: Ready (kubelet is healthy), MemoryPressure (low memory), DiskPressure (low disk), PIDPressure (too many processes). When a node goes NotReady, the control plane waits a grace period before rescheduling pods (default: 5 minutes via pod-eviction-timeout).\n\nOfficial Kubernetes docs:\n- https://kubernetes.io/docs/reference/generated/kubectl/kubectl-commands#get\n- https://kubernetes.io/docs/concepts/architecture/nodes/",
      "groupId": "clusterArchitecture",
      "isBoss": false
    },
    {
      "type": "quiz",
      "q": "What are the four required top-level fields in a Kubernetes YAML manifest?",
      "context": "apiVersion: apps/v1      # ???\nkind: Deployment         # ???\nmetadata:                # ???\n  name: my-app\nspec:                    # ???\n  replicas: 3",
      "options": [
        "apiVersion, kind, metadata, spec",
        "name, image, port, replicas",
        "type, config, data, template",
        "version, resource, labels, containers"
      ],
      "answer": 0,
      "explain": "Every Kubernetes resource has four top-level fields: `apiVersion` (which API group and version), `kind` (resource type like Deployment, Service, Pod), `metadata` (name, namespace, labels), and `spec` (the desired state you want Kubernetes to maintain).",
      "wrongReasons": [
        null,
        "name, image, port, and replicas are fields that appear INSIDE metadata and spec, not at the top level. They are part of the resource definition, not the structural envelope.",
        "These are not standard Kubernetes fields. Kubernetes uses a specific API structure that all resources follow.",
        "version/resource/labels/containers are subfields within the standard top-level structure, not the top-level fields themselves."
      ],
      "tip": "Go tip: Use `kubectl explain deployment.spec` to explore any resource's fields interactively. It works like built-in API documentation right from your terminal.",
      "deepDive": "apiVersion determines which API group handles the resource (e.g., apps/v1 for Deployments, v1 for Pods and Services). kind identifies the resource type. metadata.name is required and must be unique within its namespace. spec defines your desired state — Kubernetes controllers continuously work to make reality match your spec.\n\nOfficial Kubernetes docs:\n- https://kubernetes.io/docs/concepts/overview/working-with-objects/\n- https://kubernetes.io/docs/reference/kubectl/generated/kubectl_explain/",
      "groupId": "podsWorkloads",
      "isBoss": false
    },
    {
      "type": "scenario",
      "q": "A pod has been in 'Pending' status for 5 minutes. Which Kubernetes component is responsible for assigning pods to nodes?",
      "context": "kubectl get pods\nNAME          READY   STATUS    RESTARTS   AGE\nmy-app-xyz    0/1     Pending   0          5m\n\n# The pod exists but hasn't started running yet.\n# Something hasn't done its job...",
      "options": [
        "🔧 kubelet",
        "📡 kube-apiserver",
        "📋 kube-scheduler",
        "💾 etcd"
      ],
      "answer": 2,
      "explain": "The kube-scheduler watches for newly created pods with no assigned node and selects the best node based on resource availability, constraints, and affinity rules. A pod stuck in Pending usually means the scheduler cannot find a suitable node (insufficient resources, taints, or affinity conflicts).",
      "wrongReasons": [
        "The kubelet runs pods AFTER they've been assigned to its node. It doesn't decide which node to use — that's the scheduler's job.",
        "The API server receives and stores the pod definition, but it doesn't make scheduling decisions. It's the front door, not the dispatcher.",
        null,
        "etcd stores the cluster state (including the pod definition), but it doesn't make decisions. It's a database, not a decision-maker."
      ],
      "tip": "Go tip: When a pod is Pending, run `kubectl describe pod <name>` and look at the Events section. The scheduler writes messages there explaining why it couldn't place the pod.",
      "deepDive": "The scheduler scoring process: (1) filter out nodes that don't meet requirements (resources, taints, affinity), (2) score remaining nodes by preference (spread, resource balance), (3) pick the highest-scoring node. If no node passes the filter phase, the pod stays Pending until conditions change.\n\nOfficial Kubernetes docs:\n- https://kubernetes.io/docs/concepts/scheduling-eviction/kube-scheduler/\n- https://kubernetes.io/docs/tasks/debug/debug-application/debug-running-pod/",
      "groupId": "clusterArchitecture",
      "isBoss": false
    },
    {
      "type": "scenario",
      "q": "🚨 FIRST MISSION: You're given this cluster output. Which pod needs attention and why?",
      "context": "kubectl get pods -n production\nNAME              READY   STATUS             RESTARTS   AGE\nfrontend-abc      1/1     Running            0          2h\napi-server-def    1/1     Running            0          2h\nworker-ghi        0/1     CrashLoopBackOff   5          10m\ndatabase-jkl      1/1     Running            0          1d",
      "options": [
        "📋 frontend-abc — it's been running too long (2 hours)",
        "🔍 api-server-def — it shows 0 restarts which is suspicious",
        "🚨 worker-ghi — CrashLoopBackOff with 5 restarts means it keeps crashing",
        "💾 database-jkl — oldest pod (1 day) might be stale"
      ],
      "answer": 2,
      "explain": "worker-ghi is in CrashLoopBackOff — it keeps starting, crashing, and restarting (5 times in 10 minutes). READY shows 0/1, meaning zero of one container is ready. The other pods are healthy: Running with 1/1 Ready. Long uptime and zero restarts are GOOD signs, not problems.",
      "wrongReasons": [
        "Running for 2 hours is perfectly normal. Long-running pods with 0 restarts indicate stability.",
        "Zero restarts is ideal — it means the pod has been stable since creation. High restart counts are the warning sign.",
        null,
        "A pod running for 1 day with 1/1 Ready is healthy. Kubernetes pods are designed to run indefinitely until updated or removed."
      ],
      "tip": "Go tip: Reading `kubectl get pods` output is your most fundamental skill. Focus on: STATUS (Running = good), READY (1/1 = good), and RESTARTS (low = good). Anything else needs investigation.",
      "deepDive": "Quick health checklist: STATUS should be Running (for long-lived services) or Completed (for Jobs). READY should show all containers ready (1/1, 2/2). RESTARTS should be 0 or very low. AGE helps establish timeline. When you spot a problem pod, your next commands are `kubectl describe pod <name>` for events and `kubectl logs <name>` for application output.\n\nOfficial Kubernetes docs:\n- https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/\n- https://kubernetes.io/docs/tasks/debug/debug-application/debug-running-pod/",
      "groupId": "podsWorkloads",
      "isBoss": true
    }
  ]
});
