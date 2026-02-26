window.KUBECRAFT_LEVEL_DATA = window.KUBECRAFT_LEVEL_DATA || [];
window.KUBECRAFT_LEVEL_DATA.push({
  "id": "level-2",
  "title": "Level 2 · Runtime Defender",
  "difficulty": "Beginner+",
  "badgeIcon": "🛡️",
  "badgeName": "Runtime Defender",
  "description": "Build reliability under pressure by handling configuration, secrets, and rollout safety in real deployment scenarios.",
  "status": "active",
  "targetQuestionCount": 20,
  "focus": [
    "Storage & Config",
    "Deployments & Rollouts"
  ],
  "questions": [
    {
      "type": "scenario",
      "q": "🚨 INCIDENT: After switching to a private container registry, new pods fail with ImagePullBackOff: 'unauthorized: authentication required.' How do you fix this?",
      "context": "kubectl describe pod payments-api\nEvents:\n  Warning  Failed  Failed to pull image \"registry.company.io/payments:v2\":\n           unauthorized: authentication required\n\n# The image exists in the registry.\n# You can pull it locally with docker login + docker pull.",
      "options": [
        "🔑 Create a docker-registry Secret with registry credentials and add imagePullSecrets to the pod spec",
        "🔧 Set imagePullPolicy: Always to force a fresh pull",
        "🌐 Add the registry URL to CoreDNS configuration",
        "📦 Pre-pull the image on every node manually"
      ],
      "answer": 0,
      "explain": "Private registries require authentication. Create a Secret of type docker-registry with your credentials, then reference it in the pod spec under `imagePullSecrets`. This tells the kubelet to authenticate before pulling.",
      "wrongReasons": [
        null,
        "imagePullPolicy controls WHEN to pull (Always, IfNotPresent, Never), not authentication. Setting Always still fails with 'unauthorized' because no credentials are provided.",
        "CoreDNS handles cluster-internal DNS resolution, not registry authentication. The registry is reachable (the error is 'unauthorized', not 'connection refused'), it just requires a login.",
        "Pre-pulling on every node is fragile, doesn't scale, and breaks when new nodes are added. imagePullSecrets is the standard, declarative solution that works automatically on any node."
      ],
      "tip": "Go tip: Create the secret with: kubectl create secret docker-registry reg-creds --docker-server=registry.company.io --docker-username=user --docker-password=pass. Then add imagePullSecrets: [{name: reg-creds}] to your pod spec or attach it to the default ServiceAccount.",
      "deepDive": "For convenience, attach the pull secret to a ServiceAccount so all pods using that account inherit it automatically: kubectl patch serviceaccount default -p '{\"imagePullSecrets\": [{\"name\": \"reg-creds\"}]}'. This avoids adding imagePullSecrets to every Deployment individually. Rotate credentials regularly and scope them per environment.",
      "groupId": "storageConfig",
      "isBoss": false
    },
    {
      "type": "quiz",
      "q": "You want your Go service to read its database password from Kubernetes. What is the MOST SECURE method?",
      "context": "// You want to avoid this:\ndbPass := os.Getenv(\"DB_PASSWORD\") // but set HOW?\n\n// Options: env var from Secret, or file from Secret volume?",
      "options": [
        "Store in a Kubernetes Secret and pass via the Downward API as a pod annotation",
        "Inject as env var via secret.envFrom in Pod spec",
        "Mount the Secret as a file and use os.ReadFile(\"/etc/secrets/db-pass\")",
        "Store in a ConfigMap (it's encrypted anyway)"
      ],
      "answer": 2,
      "explain": "File-mounted Secrets are more secure: env vars leak in /proc/self/environ, crash dumps, debug logs, and child processes. File-mounted Secrets also support rotation — when the Secret is updated, the file updates without a pod restart.",
      "wrongReasons": [
        "The Downward API exposes pod metadata (labels, annotations, resource limits) — not Secret values. It cannot read Secret data. Annotations are also visible in plain text via kubectl describe pod, making this even less secure than env vars.",
        "Env var injection from Secrets is common and acceptable, but less secure than file mounting. The main risk: any subprocess, panic dump, or env dump reveals the secret. kubectl describe pod also shows env var names (not values, but exposes the secret name).",
        null,
        "ConfigMaps are NOT encrypted — they store plaintext. Secrets are base64-encoded (not encrypted!) by default in etcd. To actually encrypt at rest, you need EncryptionConfiguration or an external KMS like AWS KMS or Vault."
      ],
      "tip": "Go tip: os.ReadFile(\"/etc/secrets/db-pass\") or use fsnotify to watch for secret rotation. Consider hashicorp/vault-agent-injector for dynamic short-lived credentials.",
      "deepDive": "Even k8s Secrets aren't truly encrypted by default — they're base64 in etcd. Enable etcd encryption at rest, use Sealed Secrets (Bitnami) or External Secrets Operator with a real secrets manager (AWS Secrets Manager, GCP Secret Manager, Vault).",
      "groupId": "storageConfig",
      "isBoss": false
    },
    {
      "type": "quiz",
      "q": "What is the difference between a ConfigMap and a Secret in Kubernetes?",
      "context": "# When to use which?\nConfigMap: used for ???\nSecret:    used for ???",
      "options": [
        "ConfigMaps for config files/env vars; Secrets for sensitive data with base64 encoding and stricter RBAC defaults",
        "ConfigMaps are persistent; Secrets are deleted after pod restarts",
        "Secrets are encrypted by default in etcd; ConfigMaps are stored in plain text",
        "Secrets are always mounted as read-only volumes; ConfigMaps can be mounted as writable volumes"
      ],
      "answer": 0,
      "explain": "ConfigMaps store non-sensitive configuration (feature flags, config files, URLs). Secrets store sensitive data — they're base64-encoded and by default only mounted into pods that explicitly request them, with tighter RBAC.",
      "wrongReasons": [
        null,
        "Both ConfigMaps and Secrets persist in etcd until deleted. Neither is ephemeral. They survive pod restarts — that's the point. You mount them into pods; the data lives independently of the pod lifecycle.",
        "This is a common misconception! Secrets are NOT encrypted by default — they're base64-encoded, which is trivially reversible (echo \"cGFzc3dvcmQ=\" | base64 -d). You must enable encryption at rest separately.",
        "Both ConfigMaps and Secrets are read-only when mounted as volumes — writeability is not what distinguishes them. The real differences are RBAC defaults, base64 encoding, and intended use (sensitive vs non-sensitive data)."
      ],
      "tip": "Go tip: Use viper or envconfig library to load config from both env vars (from ConfigMaps) and files (from Secrets). This makes local development (no k8s) and production (with k8s) work seamlessly.",
      "deepDive": "RBAC tip: Grant read access to ConfigMaps broadly, but lock down Secret access tightly. Use separate ServiceAccounts per deployment so a compromised service can't read Secrets it doesn't need.",
      "groupId": "storageConfig",
      "isBoss": false
    },
    {
      "type": "quiz",
      "q": "Your Go service writes temporary files during request processing. Which volume type should you use for fast, ephemeral scratch space shared between containers in the same pod?",
      "context": "# Go service writes temp files, reads by sidecar\n# Volume must be:\n# - Fast (in-memory ok)\n# - Deleted when pod dies\n# - Shared between containers in same pod",
      "options": [
        "persistentVolumeClaim (PVC)",
        "emptyDir",
        "hostPath",
        "downwardAPI volume with writable flag"
      ],
      "answer": 1,
      "explain": "emptyDir creates a temporary directory on the node, shared between all containers in the pod, and deleted when the pod dies. Setting emptyDir.medium: Memory uses tmpfs (RAM) for maximum speed.",
      "wrongReasons": [
        "PVC (PersistentVolumeClaim) provisions durable storage that outlives pods — overkill and slower for temp data. It also requires a StorageClass and PersistentVolume to exist. Use for databases, not scratch space.",
        null,
        "hostPath mounts a directory from the node's filesystem. It creates security risks (pods can read sensitive node files), isn't portable across nodes (data is on a specific node), and violates pod isolation.",
        "downwardAPI volumes expose pod metadata (labels, annotations, resource limits) as read-only files — they cannot be used for scratch writes. There is no 'writable flag' for downwardAPI volumes."
      ],
      "tip": "Go tip: os.TempDir() in a container returns /tmp, which may be on the container layer (slow). Mount emptyDir at /tmp in your pod spec for faster temp file I/O: volumeMounts: [{name: tmp, mountPath: /tmp}]",
      "deepDive": "For emptyDir with Memory backend: it counts against the container's memory limit. If your Go service writes 500MB to tmpfs but your memory limit is 512Mi, you'll OOMKill. Account for this in your resource limits.",
      "groupId": "storageConfig",
      "isBoss": false
    },
    {
      "type": "command",
      "q": "Build the kubectl command to create a Secret named \"db-creds\" with key \"password\" set to \"s3cr3t\" in the \"staging\" namespace.",
      "context": "# Need to securely store DB credentials\n# Don't put them in YAML files in git!",
      "tokens": [
        "kubectl",
        "create",
        "secret",
        "generic",
        "db-creds",
        "--from-literal=password=s3cr3t",
        "-n",
        "staging",
        "configmap",
        "apply"
      ],
      "answer": [
        "kubectl",
        "create",
        "secret",
        "generic",
        "db-creds",
        "--from-literal=password=s3cr3t",
        "-n",
        "staging"
      ],
      "explain": "kubectl create secret generic creates a generic Secret. --from-literal=key=value sets key-value pairs directly. The value is automatically base64-encoded by k8s.",
      "wrongReasons": [],
      "tip": "Never commit Secret values to Git! Use --from-file=password=/path/to/file for file-based secrets. In CI/CD, inject values from your secret manager (Vault, AWS SM) at deploy time.",
      "deepDive": "Alternatives to kubectl create secret: Sealed Secrets (encrypted YAML safe for Git), External Secrets Operator (syncs from AWS/GCP/Vault), or Helm secrets plugin. All are better than storing raw Secrets in version control.",
      "groupId": "storageConfig",
      "isBoss": false
    },
    {
      "type": "quiz",
      "q": "You have a config.yaml file your Go service reads at startup. How should you deliver it to the pod?",
      "context": "# Your Go app does:\ncfg, err := os.ReadFile(\"/etc/app/config.yaml\")\n\n# How does config.yaml get into the container?",
      "options": [
        "COPY it into the Docker image at build time",
        "Mount a ConfigMap as a volume at /etc/app/",
        "Mount a PersistentVolumeClaim and write config.yaml to it during a CI/CD pipeline step",
        "Use an init container to fetch config.yaml from an S3 bucket at pod startup"
      ],
      "answer": 1,
      "explain": "Mounting a ConfigMap as a volume makes the config file available at the specified path inside the container. This decouples configuration from the image — the same image works in dev, staging, and production with different ConfigMaps.",
      "wrongReasons": [
        "Baking config into the image means rebuilding and redeploying for every config change. It also leaks environment-specific values into your container registry.",
        null,
        "PVCs are designed for persistent application data (databases, uploads), not config files. This approach requires provisioning storage, adds a CI/CD dependency, and doesn't version-couple config with the Deployment. ConfigMaps are purpose-built for this.",
        "While this pattern works, it adds significant complexity: S3 credentials management, init container failure handling, network dependency at startup, and no version coupling between config and Deployment. ConfigMaps are the native, declarative solution that keeps config in the cluster."
      ],
      "tip": "Go tip: Use viper.SetConfigFile(\"/etc/app/config.yaml\") for file-based config. Combine with viper.WatchConfig() to pick up ConfigMap changes without restarting.",
      "deepDive": "When a ConfigMap is mounted as a volume, Kubernetes uses symbolic links internally. On update, it atomically swaps the symlink target so your app sees a consistent snapshot. The update delay is typically under 60 seconds (configurable via kubelet sync period). Note: subPath mounts do NOT receive automatic updates.",
      "groupId": "storageConfig",
      "isBoss": false
    },
    {
      "type": "command",
      "q": "Build the kubectl command to create a ConfigMap named \"app-config\" from a local file \"config.yaml\" in namespace \"production\".",
      "context": "# You have a config.yaml ready locally\n# Need to create a ConfigMap from it",
      "tokens": [
        "kubectl",
        "create",
        "configmap",
        "app-config",
        "--from-file=config.yaml",
        "-n",
        "production",
        "secret",
        "generic",
        "apply"
      ],
      "answer": [
        "kubectl",
        "create",
        "configmap",
        "app-config",
        "--from-file=config.yaml",
        "-n",
        "production"
      ],
      "explain": "`kubectl create configmap --from-file` creates a ConfigMap with the file name as the key and file contents as the value. For config.yaml, the resulting key is 'config.yaml' inside the ConfigMap data.",
      "wrongReasons": [],
      "tip": "Use --from-file=custom-key=config.yaml to override the key name. Use --from-env-file for .env-style key=value files that should become individual ConfigMap entries.",
      "deepDive": "For GitOps workflows, define ConfigMaps in YAML manifests and use `kubectl apply`. The imperative `create` command is useful for one-off setups or scripts, but declarative YAML in Git is the production standard for traceability and reproducibility.",
      "groupId": "storageConfig",
      "isBoss": false
    },
    {
      "type": "quiz",
      "q": "You need to inject a single value from a ConfigMap as an environment variable in your Go pod. Which field do you use?",
      "context": "env:\n- name: LOG_LEVEL\n  valueFrom:\n    configMapKeyRef:\n      name: app-config\n      key: log_level\n\n# vs\n\nenvFrom:\n- configMapRef:\n    name: app-config",
      "options": [
        "env with valueFrom.configMapKeyRef — selects a single key",
        "envFrom with configMapRef — imports ALL keys as env vars",
        "Both do the same thing",
        "Use volumes instead — env vars can't read from ConfigMaps"
      ],
      "answer": 0,
      "explain": "`env.valueFrom.configMapKeyRef` injects a single specific key as an env var with a name you control. `envFrom` imports ALL keys from the ConfigMap, which is convenient but gives you less control over naming and can pollute the env with unexpected variables.",
      "wrongReasons": [
        null,
        "envFrom imports ALL keys, which is useful but not what the question asks. Use envFrom when the ConfigMap is designed as a complete env set. For selective injection, use valueFrom.",
        "They behave differently: env+valueFrom is selective (one key), envFrom is bulk (all keys). Choosing the wrong one either misses values or over-exposes config.",
        "ConfigMaps absolutely can be used as env var sources. This is one of the two main consumption methods (the other being volume mounts)."
      ],
      "tip": "Go tip: Use os.Getenv(\"LOG_LEVEL\") with a sensible default: level := os.Getenv(\"LOG_LEVEL\"); if level == \"\" { level = \"info\" }. This makes your app work both inside and outside k8s.",
      "deepDive": "Key difference: env vars from ConfigMaps are set at pod creation time and do NOT update when the ConfigMap changes. You must restart the pod to pick up new values. Volume-mounted ConfigMaps update automatically (within ~60s). Choose your method based on whether hot-reload matters.",
      "groupId": "storageConfig",
      "isBoss": false
    },
    {
      "type": "scenario",
      "q": "🚨 INCIDENT: You updated a ConfigMap but your Go pods still use the old config values. What is the MOST LIKELY cause?",
      "context": "kubectl edit configmap app-config  # ✅ changed LOG_LEVEL to debug\nkubectl get configmap app-config -o yaml  # ✅ shows new value\n\nBut pods still log at INFO level...",
      "options": [
        "🔄 ConfigMap is injected via env vars — pods need a restart to pick up changes",
        "🔒 RBAC is blocking the pod from reading the updated ConfigMap",
        "🐛 The ConfigMap update didn't actually save",
        "⏱️ Wait 24 hours — ConfigMap sync is daily"
      ],
      "answer": 0,
      "explain": "Environment variables are set once at pod creation. They are NOT live-updated when the source ConfigMap changes. To pick up the new value, you must restart the pod (or use volume mounts, which auto-sync within ~60 seconds).",
      "wrongReasons": [
        null,
        "If the pod could read the ConfigMap at startup, RBAC is not the issue. ConfigMap reads are checked at pod creation, not on every access.",
        "The question confirms the ConfigMap shows the new value via kubectl get. The update saved successfully — the problem is how the pod consumes it.",
        "Volume-mounted ConfigMaps sync within about 60 seconds. There is no 24-hour delay. The issue here is env var injection, which never syncs."
      ],
      "tip": "Go tip: For hot-reloadable config, mount ConfigMaps as files and use fsnotify or viper.WatchConfig() to detect changes without pod restarts.",
      "deepDive": "This is one of the most common config-related surprises. Env vars are snapshots from pod creation. Volume mounts use kubelet sync (default ~60s). For critical config changes, `kubectl rollout restart deployment/<name>` forces all pods to recreate and pick up new env values. In GitOps, a config change should trigger a pod rollout automatically.",
      "groupId": "storageConfig",
      "isBoss": false
    },
    {
      "type": "quiz",
      "q": "Your Go service needs to persist data across pod restarts (e.g., SQLite database). Which storage approach is correct?",
      "context": "# Pod restarts → data must survive\n# Need durable, writable storage\n# emptyDir? PVC? hostPath?",
      "options": [
        "emptyDir — it persists between restarts",
        "PersistentVolumeClaim (PVC) — requests durable storage that outlives pods",
        "hostPath — stores data on the node disk",
        "ConfigMap — store data as key-value pairs"
      ],
      "answer": 1,
      "explain": "A PersistentVolumeClaim (PVC) requests storage from the cluster that survives pod restarts, rescheduling, and even node failures (depending on the storage backend). It is the standard Kubernetes approach for durable, writable data.",
      "wrongReasons": [
        "emptyDir is deleted when the pod is removed. It only survives container restarts within the same pod, not pod rescheduling or deletion.",
        null,
        "hostPath ties data to a specific node. If the pod moves to another node, the data is gone. It also breaks pod isolation and is a security risk in multi-tenant clusters.",
        "ConfigMaps are for configuration data, not application-generated data. They are read-only when mounted and have a 1MB size limit."
      ],
      "tip": "Go tip: For embedded databases (SQLite, BoltDB), mount a PVC at the data directory. Use os.MkdirAll to handle first-run when the directory is empty.",
      "deepDive": "PVCs are bound to PersistentVolumes (PVs) provisioned by a StorageClass. Most cloud providers support dynamic provisioning — you create a PVC and the cloud automatically creates a disk. Access modes matter: ReadWriteOnce (single node), ReadOnlyMany (multiple nodes read), ReadWriteMany (multiple nodes read/write, requires NFS or similar).",
      "groupId": "storageConfig",
      "isBoss": false
    },
    {
      "type": "quiz",
      "q": "You want zero-downtime deployments for your Go service. Which Deployment strategy and maxUnavailable value achieves this?",
      "context": "strategy:\n  type: ????????\n  rollingUpdate:\n    maxUnavailable: ?  # zero downtime!\n    maxSurge: 1",
      "options": [
        "Recreate — maxUnavailable: 0",
        "RollingUpdate — maxUnavailable: 0",
        "RollingUpdate — maxUnavailable: 1",
        "BlueGreen — maxUnavailable: 50%"
      ],
      "answer": 1,
      "explain": "RollingUpdate with maxUnavailable: 0 means k8s never terminates an old pod before a new one passes its readinessProbe. No traffic is dropped. maxSurge: 1 allows one extra pod during the rollout.",
      "wrongReasons": [
        "Recreate strategy kills ALL old pods first, then starts new ones. This causes downtime equal to the time it takes to pull and start new containers. Never use Recreate for user-facing services.",
        null,
        "RollingUpdate with maxUnavailable: 1 means one pod can be terminated before a replacement is ready. With a 3-replica deployment, you momentarily have only 2 pods — 33% capacity reduction. Acceptable in some cases, but not zero-downtime.",
        "BlueGreen is not a built-in Kubernetes Deployment strategy (it's a deployment pattern implemented with two separate Deployments). It's powerful but requires more infra setup (two full environments)."
      ],
      "tip": "Go tip: Implement graceful shutdown! When k8s sends SIGTERM, your Go server has terminationGracePeriodSeconds (default 30s) to finish in-flight requests. Use http.Server.Shutdown(ctx) with a timeout context.",
      "deepDive": "// Graceful shutdown in Go:\nsrv := &http.Server{Addr: \":8080\", Handler: mux}\ngo srv.ListenAndServe()\n<-sigChan // wait for SIGTERM\nctx, cancel := context.WithTimeout(context.Background(), 25*time.Second)\ndefer cancel()\nsrv.Shutdown(ctx) // finish in-flight requests",
      "groupId": "deploymentsRollouts",
      "isBoss": false
    },
    {
      "type": "quiz",
      "q": "What is the relationship between a Deployment and a ReplicaSet in Kubernetes?",
      "context": "kubectl get rs\nNAME                   DESIRED   CURRENT   READY\napi-server-7f8b9c6d    3         3         3\napi-server-5a4e2b1c    0         0         0     # old revision",
      "options": [
        "A Deployment is a wrapper that adds labels to a ReplicaSet but otherwise they have the same spec and behavior",
        "A Deployment creates and manages ReplicaSets, which in turn manage pods",
        "ReplicaSets are deprecated — Deployments replaced them entirely",
        "You must create ReplicaSets manually before creating a Deployment"
      ],
      "answer": 1,
      "explain": "A Deployment manages ReplicaSets. Each time you update the pod template (e.g., new image), the Deployment creates a new ReplicaSet and scales it up while scaling the old one down. Old ReplicaSets are kept (scaled to 0) for rollback history.",
      "wrongReasons": [
        "Deployments add far more than labels. They provide rollout strategy (RollingUpdate/Recreate), revision history with rollback capability, progressDeadlineSeconds, and status tracking — none of which ReplicaSets have. Their specs are structurally different.",
        null,
        "ReplicaSets are not deprecated. Deployments use them internally. You rarely create ReplicaSets directly, but they are a core part of how Deployments work.",
        "Deployments create ReplicaSets automatically. You never need to create them by hand. If you see ReplicaSets in kubectl get rs, they were created by a Deployment."
      ],
      "tip": "Go tip: Use `kubectl get rs -o wide` to see which ReplicaSet owns which image version. This helps trace which revision is currently serving traffic during a rollout.",
      "deepDive": "The Deployment controller keeps old ReplicaSets (scaled to 0) as rollback points. `revisionHistoryLimit` (default 10) controls how many are retained. Use `kubectl rollout history deployment/<name>` to see revisions and `kubectl rollout undo --to-revision=N` to revert to a specific one.",
      "groupId": "deploymentsRollouts",
      "isBoss": false
    },
    {
      "type": "quiz",
      "q": "What is the key difference between `kubectl apply` and `kubectl create`?",
      "context": "# Two ways to create resources:\nkubectl create -f deployment.yaml\nkubectl apply  -f deployment.yaml\n\n# Which should you use in production?",
      "options": [
        "apply is declarative (can create AND update); create is imperative (fails if resource exists)",
        "create is for production; apply is only for testing",
        "apply performs a rolling update automatically; create replaces the resource in-place",
        "create is for first-time setup; apply is for updates only — using apply on a new resource fails"
      ],
      "answer": 0,
      "explain": "`kubectl apply` is declarative: it creates the resource if it doesn't exist, or updates it if it does. `kubectl create` is imperative: it only creates and fails if the resource already exists. In production and GitOps workflows, `apply` is the standard because you can re-run it safely.",
      "wrongReasons": [
        null,
        "The opposite is true. apply is the production standard because it's idempotent and works with version-controlled manifests. create is useful for one-time imperative commands.",
        "apply does NOT perform a rolling update — it computes a three-way merge patch between the new manifest, the last-applied annotation, and live state. Rolling updates are triggered by the Deployment controller when the pod template changes, regardless of whether you used apply or create.",
        "This is backwards. apply creates the resource if it doesn't exist — that's the whole point of declarative management. It handles both creation and updates idempotently, which is why it's the CI/CD and GitOps standard."
      ],
      "tip": "Go tip: In CI/CD pipelines, always use `kubectl apply -f` so deployments are idempotent. If the pipeline reruns (retries), apply won't fail on existing resources.",
      "deepDive": "Under the hood, `apply` uses a three-way merge: it compares the new manifest, the last-applied annotation, and the live cluster state to compute a minimal patch. This is why `apply` adds the `kubectl.kubernetes.io/last-applied-configuration` annotation. For GitOps tools (ArgoCD, Flux), this declarative model is the foundation — Git is the source of truth, and the tool continuously applies desired state.",
      "groupId": "deploymentsRollouts",
      "isBoss": false
    },
    {
      "type": "scenario",
      "q": "🚨 INCIDENT: During rolling updates, users report brief connection reset errors. Old pods are killed before finishing in-flight requests. What is the fix?",
      "context": "# During deployment rollout:\n# 1. New pod starts, passes readiness\n# 2. Old pod receives SIGTERM\n# 3. Old pod immediately exits ← PROBLEM\n# 4. In-flight HTTP requests get connection reset",
      "options": [
        "🛑 Implement graceful shutdown: catch SIGTERM and drain in-flight requests before exiting",
        "📈 Scale to 100 replicas so some always survive",
        "⏸️ Set maxUnavailable: 0 (this alone fixes it)",
        "🔄 Switch to Recreate strategy"
      ],
      "answer": 0,
      "explain": "When Kubernetes sends SIGTERM, your app must stop accepting new connections and finish in-flight requests before exiting. Without graceful shutdown, the process exits immediately and TCP connections are reset mid-request.",
      "wrongReasons": [
        null,
        "More replicas reduce the chance but don't eliminate it. Every pod terminated during rollout can drop connections if it doesn't handle SIGTERM properly.",
        "maxUnavailable: 0 prevents old pods from being killed until new ones are Ready, but old pods still receive SIGTERM during the transition. Without graceful shutdown in the app, connections are still reset.",
        "Recreate kills ALL pods first — this makes the problem much worse, causing full downtime instead of intermittent resets."
      ],
      "tip": "Go tip: Use signal.NotifyContext(ctx, syscall.SIGTERM) and http.Server.Shutdown(ctx) with a 25s timeout (leave 5s buffer under the default 30s terminationGracePeriodSeconds).",
      "deepDive": "Full zero-downtime recipe: (1) readinessProbe gates traffic, (2) preStop hook adds a brief sleep (2-5s) so endpoints propagate removal before shutdown begins, (3) app catches SIGTERM and drains connections, (4) terminationGracePeriodSeconds is long enough for the drain. The preStop sleep is critical because endpoint removal is asynchronous — without it, new requests can arrive after SIGTERM.",
      "groupId": "deploymentsRollouts",
      "isBoss": false
    },
    {
      "type": "command",
      "q": "Build the kubectl command to update the container image of deployment `api-server` to `myapp:v2` in namespace `production`.",
      "context": "# New version built and tested\n# Need to trigger a rolling update quickly",
      "tokens": [
        "kubectl",
        "set",
        "image",
        "deployment/api-server",
        "api-server=myapp:v2",
        "-n",
        "production",
        "rollout",
        "restart",
        "scale"
      ],
      "answer": [
        "kubectl",
        "set",
        "image",
        "deployment/api-server",
        "api-server=myapp:v2",
        "-n",
        "production"
      ],
      "explain": "`kubectl set image` updates the container image in a Deployment, triggering a rolling update. The format is `container-name=image:tag`. This is the fastest imperative way to deploy a new version.",
      "wrongReasons": [],
      "tip": "After set image, immediately run `kubectl rollout status deployment/api-server -n production` to watch convergence. If it stalls, `kubectl rollout undo` reverts to the previous revision.",
      "deepDive": "In production, prefer `kubectl apply -f` with an updated manifest in Git over `set image`. Imperative image updates are useful for emergencies but drift from GitOps source of truth. If you use imperative changes, commit the manifest update to Git immediately after to prevent ArgoCD/Flux from reverting your change.",
      "groupId": "deploymentsRollouts",
      "isBoss": false
    },
    {
      "type": "command",
      "q": "Build the kubectl command to roll back deployment `api-server` in namespace `production` to the previous revision.",
      "context": "# v2 deploy is broken!\n# Need to revert to last known good version immediately",
      "tokens": [
        "kubectl",
        "rollout",
        "undo",
        "deployment/api-server",
        "-n",
        "production",
        "restart",
        "status",
        "history",
        "--to-revision=1"
      ],
      "answer": [
        "kubectl",
        "rollout",
        "undo",
        "deployment/api-server",
        "-n",
        "production"
      ],
      "explain": "`kubectl rollout undo` reverts a Deployment to its previous ReplicaSet revision. Kubernetes scales up the old ReplicaSet and scales down the current one using the same rolling update strategy.",
      "wrongReasons": [],
      "tip": "Add `--to-revision=N` to roll back to a specific revision, not just the previous one. Use `kubectl rollout history deployment/api-server` to see available revisions first.",
      "deepDive": "Rollback creates a new revision (it doesn't rewind history). The old ReplicaSet is reused, so it's fast — no image pull needed if the node already has it cached. For GitOps, also revert the commit in Git to keep source of truth aligned with cluster state.",
      "groupId": "deploymentsRollouts",
      "isBoss": false
    },
    {
      "type": "command",
      "q": "Build the kubectl command to trigger a rolling restart of deployment `api-server` in namespace `production` without changing the image.",
      "context": "# ConfigMap updated, env vars need refresh\n# Need to restart pods gracefully — no image change",
      "tokens": [
        "kubectl",
        "rollout",
        "restart",
        "deployment/api-server",
        "-n",
        "production",
        "delete",
        "pods",
        "scale",
        "--replicas=0"
      ],
      "answer": [
        "kubectl",
        "rollout",
        "restart",
        "deployment/api-server",
        "-n",
        "production"
      ],
      "explain": "`kubectl rollout restart` triggers a graceful rolling restart by adding a timestamp annotation to the pod template. New pods are created and old ones terminated following the Deployment's update strategy — no downtime with RollingUpdate.",
      "wrongReasons": [],
      "tip": "This is the safest way to refresh env-var-based config. Never scale to 0 and back up — that causes full downtime.",
      "deepDive": "Under the hood, `rollout restart` patches the pod template with a `kubectl.kubernetes.io/restartedAt` annotation. This triggers the Deployment controller to create a new ReplicaSet and perform a standard rolling update. It respects maxSurge and maxUnavailable settings.",
      "groupId": "deploymentsRollouts",
      "isBoss": false
    },
    {
      "type": "scenario",
      "q": "🚨 INCIDENT: After deploying v3, error rate spikes to 50%. Rollout is still in progress (2/3 new pods Ready). What is the safest immediate action?",
      "context": "kubectl rollout status deployment/api-server -n production\nWaiting for rollout to finish: 2 of 3 updated replicas are available...\n\nMONITORING: Error rate 50% and climbing\nPREVIOUS VERSION: v2 was stable",
      "options": [
        "⏪ kubectl rollout undo — revert to the last stable revision immediately",
        "🗑️ kubectl delete deployment — remove everything and start fresh",
        "📈 kubectl scale --replicas=10 — add more pods to absorb errors",
        "⏸️ Wait for the rollout to complete — errors might resolve"
      ],
      "answer": 0,
      "explain": "During an active bad rollout, `kubectl rollout undo` is the fastest safe recovery. It reverts the Deployment to the previous ReplicaSet (v2) using the existing update strategy, restoring stable pods while draining the broken ones.",
      "wrongReasons": [
        null,
        "Deleting the Deployment removes ALL pods (old and new), causing complete downtime. Never delete — roll back instead.",
        "Scaling a broken version just creates more broken pods. The error is in the new code, not in capacity.",
        "Waiting lets the rollout finish replacing all old pods with broken ones, potentially increasing error rate to 100%. Act fast to preserve the remaining healthy v2 pods."
      ],
      "tip": "Go tip: After rollback, review what caused the failure. Check probe endpoints, startup logs, and config diffs between v2 and v3 before retrying.",
      "deepDive": "For safer deploys, set `progressDeadlineSeconds` (default 600s) so k8s automatically marks a rollout as Failed if it doesn't converge in time. Pair with monitoring alerts on rollout status and error rate. In GitOps, revert the Git commit to prevent the controller from re-applying the bad version.",
      "groupId": "deploymentsRollouts",
      "isBoss": false
    },
    {
      "type": "scenario",
      "q": "🚨 INCIDENT: New pods are stuck in ContainerCreating. kubectl describe shows: 'configmap \"app-config-v2\" not found.' What is the fix?",
      "context": "kubectl get pods\nNAME              READY   STATUS              RESTARTS\napi-server-abc    0/1     ContainerCreating   0\n\nkubectl describe pod api-server-abc\nEvents:\n  Warning  FailedMount  configmap \"app-config-v2\" not found",
      "options": [
        "🔧 Create the missing ConfigMap or fix the reference name in the Deployment spec",
        "🗑️ Delete the pod and hope it works on retry",
        "📈 Scale the Deployment to more replicas",
        "🔄 Restart the kubelet on the node"
      ],
      "answer": 0,
      "explain": "Pods stay in ContainerCreating when a referenced ConfigMap or Secret doesn't exist. Either create the missing ConfigMap or correct the name in the volume/env reference. Until resolved, no amount of retries or scaling will help.",
      "wrongReasons": [
        null,
        "The new pod will fail with the same error — the ConfigMap is still missing. Deleting only adds noise and wastes time during an incident.",
        "More replicas create more pods stuck in ContainerCreating with the same missing ConfigMap error.",
        "The kubelet is working correctly — it's reporting that the requested ConfigMap doesn't exist. The fix is at the application manifest level, not the node level."
      ],
      "tip": "Go tip: Use `optional: true` on ConfigMap/Secret volume references for non-critical config so pods can start even if the ConfigMap is temporarily missing.",
      "deepDive": "This commonly happens when ConfigMap/Secret names include version suffixes and someone deploys a new version without creating the matching config first. In CI/CD, always create ConfigMaps and Secrets BEFORE applying the Deployment that references them. Helm and Kustomize handle this ordering automatically.",
      "groupId": "storageConfig",
      "isBoss": false
    },
    {
      "type": "scenario",
      "q": "🚨 INCIDENT: New Deployment rollout is stuck. kubectl rollout status shows new pods not becoming Ready. What is the MOST LIKELY cause?",
      "context": "ROLLOUT STATUS: ⏸ Waiting...\nREADY: 1/3 new pods  |  OLD PODS: 2 still running\n\nNEW POD STATUS: Running but 0/1 Ready (3 mins)\n# Pod is Running but not Ready — what does this mean?",
      "options": [
        "🧠 Insufficient cluster resources (CPU/memory requests too high)",
        "🏷️ Wrong image tag — ImagePullBackOff error",
        "⚡ readinessProbe is failing on new pods",
        "🔐 RBAC permissions blocking the Deployment controller"
      ],
      "answer": 2,
      "explain": "Running but not Ready means the container is up, but the readinessProbe keeps failing. k8s won't route traffic to unready pods and won't advance the rollout until new pods are Ready. Check the probe endpoint and the new image's startup behavior.",
      "wrongReasons": [
        "Insufficient resources would cause pods to stay in Pending state, not Running. If pods are Running, the scheduler already found resources. The issue is post-start.",
        "ImagePullBackOff means the container never starts — the pod would show ErrImagePull or ImagePullBackOff status, not Running. If it's Running, the image was pulled successfully.",
        null,
        "RBAC issues would prevent the Deployment controller from creating pods at all, or would appear as error events in kubectl describe deployment. Pods reaching Running state means the controller works fine."
      ],
      "tip": "Go tip: Your /readyz endpoint should return 200 only when the app is truly ready: DB connected, caches warm, config loaded. During startup, return 503 until everything is initialized.",
      "deepDive": "Debug steps: (1) kubectl describe pod <new-pod> — look at \"Readiness\" probe status in Events. (2) kubectl exec <pod> -- curl -v localhost:8080/readyz — test the probe endpoint directly. (3) Check if new version has different startup time needing initialDelaySeconds adjustment.",
      "groupId": "deploymentsRollouts",
      "isBoss": true
    }
  ]
});
