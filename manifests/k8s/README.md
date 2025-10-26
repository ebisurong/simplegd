# Work Order Admin 前后端 K8s 部署指南

本指南帮助你将 `managesys/backend` 与 `managesys/frontend` 容器化并部署到 Kubernetes 集群。

## 1. 构建与推送镜像

将下述命令中的 `<REGISTRY>` 和 `<TAG>` 替换为你的镜像仓库与版本（例如：`docker.io/yourname` 与 `v1`）。

```bash
# 后端
docker build -t <REGISTRY>/workorder-backend:<TAG> ./managesys/backend

# 前端
docker build -t <REGISTRY>/workorder-frontend:<TAG> ./managesys/frontend

# 推送镜像
docker push <REGISTRY>/workorder-backend:<TAG>
docker push <REGISTRY>/workorder-frontend:<TAG>
```

## 2. 替换K8s清单中的占位

编辑以下文件，替换镜像占位：
- `manifests/k8s/backend-deployment.yaml` → `image: <REGISTRY>/workorder-backend:<TAG>`
- `manifests/k8s/frontend-deployment.yaml` → `image: <REGISTRY>/workorder-frontend:<TAG>`

编辑 `manifests/k8s/ingress.yaml` 中的域名占位：
- `admin.example.com`（后台管理界面）
- `api.example.com`（后端API）

如需 HTTPS/TLS，请在 Ingress 中添加 `tls` 配置，并确保集群安装了证书管理（例如 cert-manager）。

## 3. 应用K8s资源

```bash
kubectl apply -f manifests/k8s/namespace.yaml
kubectl apply -f manifests/k8s/backend-deployment.yaml
kubectl apply -f manifests/k8s/backend-service.yaml
kubectl apply -f manifests/k8s/frontend-deployment.yaml
kubectl apply -f manifests/k8s/frontend-service.yaml
kubectl apply -f manifests/k8s/ingress.yaml
```

验证：
```bash
kubectl -n workorder get pods,svc,ingress
kubectl -n workorder logs deploy/backend -f
kubectl -n workorder logs deploy/frontend -f
```

## 4. 重要说明与建议

- Ingress：需要你的集群已安装 NGINX Ingress Controller 或其他实现。
- 后端端口：当前服务使用 `8000` 端口，清单已配置。
- 数据持久化：后端目前使用 SQLite（仓库有 `database.sqlite`）。为了避免容器重建导致数据丢失，建议：
  - 短期：改造后端使数据库路径可通过环境变量配置，并挂载 PVC 到该路径；
  - 长期：迁移到托管数据库（如 PostgreSQL/MySQL），在后端通过环境变量进行连接。
- 前端接口地址：如需通过环境变量注入接口地址，建议在前端使用 `VITE_API_BASE_URL` 并在构建时注入；若当前代码未使用该变量，请在调用处调整。

## 5. 常见问题排查

- Pod无法启动：检查镜像仓库权限与镜像名称是否正确；查看 `kubectl describe pod` 的事件。
- Ingress无法访问：确认 Ingress Controller 已安装；域名解析指向 Ingress 的负载均衡地址。
- 前后端跨域：优先通过同源域名（admin/api）或在后端启用 CORS。

---
如你提供云厂商信息（K8s版本、镜像仓库、域名与证书），我可以进一步为你定制化 Helm Chart、CI/CD（GitHub Actions）与生产级持久化方案。