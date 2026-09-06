# SubOne

多节点聚合和多订阅聚合，生成统一配置下发，现在支持 Sing-box，Mihomo 与 Loon。


## ✨ 主要特性

- **多机场订阅聚合**：
  - 将多个机场的订阅链接聚合，自动拉取节点，并按国旗/地区自动分类，可自定义正则过滤分类；
- **多节点聚合**：
  - 将零散的节点聚合，支持单条/批量 URI、Clash YAML、Sing-box JSON 格式录入与智能解析；
- **协议与支持**：
  - **支持导入解析**：VLESS (Reality/Vision/gRPC/WS)、VMess、Shadowsocks (SS 2022/AEAD)、Trojan、Hysteria 2、TUIC v5、AnyTLS、WireGuard、Snell (v1~v4)、SOCKS5、HTTP、v2rayn 等协议。
  - **支持输入格式**：URI 链接列表、Base64 订阅、Clash/Mihomo YAML、Sing-box JSON。
- **策略组**：
  - 所见即所得（尽力）的策略组编辑器，支持选择节点组、展开节点、地区正则筛选、多级嵌套；
- **分流规则**  
  - 本地规则，添加 CIDR，DOMAIN，DOMAIN-SUFFIX，DOMAIN-KEYWORD；
  - 远程规则集，添加远程的（GeoSite / GeoIP / SRS / MRS 规则集），并管理去向。
- **模板与智能下发**：
  - 系统默认作了3个模版，设置好的节点、Provider、策略组与分流规则，自动按模板结构注入；
  - 可以自定义模板，加入自定的规则；
  - 根据客户端 User-Agent 自动识别并返回对应客户端格式，或通过 `target` 参数显式指定。

### 📊 协议转换支持

| 代理协议 | URI 链接导入 | Clash YAML 导入 | Sing-box JSON 导入 | Mihomo 下发 | Sing-box 下发 | Loon 下发 |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **VLESS** (Reality/Vision/WS/gRPC) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **VMess** (TCP/WS) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Shadowsocks** (SS 2022/AEAD) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Trojan** (TLS/WS/gRPC) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Hysteria 2** (obfs/sni) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **TUIC** (v5) | ✅ | ✅ | ✅ | ✅ | ✅ | - |
| **AnyTLS** | ✅ | ✅ | ✅ | ✅ | ✅ | - |
| **WireGuard** (双栈/Reserved/MTU) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Snell** (v1~v4/obfs) | ✅ | ✅ | ✅ | ✅ | - | ✅ |
| **SOCKS5** (认证/TLS) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **v2rayN 导出格式** (`v2rayn://`) | ✅ (自动解包) | - | - | ✅ | ✅ | ✅ |

详细配置示例与模板编写说明见 [docs/CONFIG_GUIDE.md](docs/CONFIG_GUIDE.md)。

## 环境要求

- **Node.js**: `>= 20.0.0` (可通过 `node -v` 查看)
- **npm**: `>= 9.0.0`

## 配置

服务启动依赖根目录 `config.json` 或环境变量，示例文件见 [config.example.json](config.example.json)。

### 配置文件 `config.json`

```json
{
  "port": 3456,
  "adminPassword": "YOUR_ADMIN_PASSWORD",
  "subToken": "a3f89b1c2d4e5f60718293a4b5c6d7e8"
}
```

- `port`: 服务监听端口，默认 `3456`。
- `adminPassword`: Web 控制台管理密码。若留空或未设置，则不启用登录鉴权。
- `subToken`: 订阅路径的访问密钥。若未填写，服务首次启动时会自动生成 32 位随机字符串并写入此文件。

业务数据（订阅源、自建节点、策略组、分流规则、模板等）保存在 `data/config.json` 中，由管理后台自动维护。

### 环境变量（可选）

也可直接通过环境变量配置：
- `PORT`
- `ADMIN_PASSWORD`
- `SUB_TOKEN`

## 部署

### 1. 源码编译

```bash
# 确认 Node 版本 >= 20
node -v

# 安装后端依赖
npm install

# 安装前端依赖
cd web && npm install && cd ..

# 编译后端与前端
npm run build
```

### 2. 后台常驻运行 (Systemd 服务)

创建服务文件 `/etc/systemd/system/subone.service`：

```ini
[Unit]
Description=SubOne Subscription Service
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/root/subone
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=5
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

> 注：若 `npm` 路径不在 `/usr/bin/npm`，可通过 `which npm` 查询并替换 `ExecStart` 路径；`WorkingDirectory` 请替换为实际项目所在目录。

管理服务命令：

```bash
# 重载并启动服务，设置开机自启
systemctl daemon-reload
systemctl enable --now subone

# 查看运行状态
systemctl status subone

# 查看实时日志
journalctl -u subone -f

# 重启 / 停止服务
systemctl restart subone
systemctl stop subone
```

### 3. 反向代理 (Caddy)

公网部署建议使用 Caddy 反向代理并自动申请 HTTPS 证书：

```caddy
sub.yourdomain.com {
    reverse_proxy 127.0.0.1:3456
    encode gzip zstd
}
```

```bash
caddy reload
```

## 订阅链接

| 用途 | 请求路径 | 说明 |
| :--- | :--- | :--- |
| 自动识别客户端 | `/s/<subToken>` | 根据客户端 User-Agent 自动返回 Mihomo、Sing-box 或 Loon 格式 |
| 指定 Mihomo 格式 | `/s/<subToken>?target=mihomo` | 输出 Mihomo YAML 配置 |
| 指定 Sing-box 格式 | `/s/<subToken>?target=singbox` | 输出 Sing-box JSON 配置 |
| 指定 Loon 格式 | `/s/<subToken>?target=loon` | 输出 Loon 配置 |
| 指定模板渲染 | `/s/<subToken>?template=<模版ID>` | 使用指定模板渲染输出 |
