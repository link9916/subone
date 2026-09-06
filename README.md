# SubOne

多节点聚合和多订阅聚合，生成统一配置下发，现在支持 Sing-box，Mihomo 与 Loon。


## ✨ 主要特性

- **多订阅分流配置（多 Profile）**：
  - 支持创建多个独立订阅，每个订阅拥有专属的 Token 链接；
  - 自由定制每个订阅包含的节点（国家/关键字初筛 + 手动勾选）、启用的策略组、分流规则以及绑定的客户端配置模版；
- **多节点聚合**：
  - 将零散的节点聚合，支持单条/批量 URI、Clash YAML、Sing-box JSON 格式录入与智能解析；
- **协议与支持**：
  - **支持导入解析**：VLESS (Reality/Vision/gRPC/WS)、VMess、Shadowsocks (SS 2022/AEAD)、Trojan、Hysteria 2、TUIC v5、AnyTLS、WireGuard、Snell (v1~v4)、SOCKS5、HTTP、v2rayn 等协议。
  - **支持输入格式**：URI 链接列表、Base64 订阅、Clash/Mihomo YAML、Sing-box JSON。
- **策略组**：
  - 所见即所得的策略组配置，支持节点筛选、多级嵌套；
  - 内置**安全回退保护机制**，避免分流规则引用的策略组未启用时导致客户端报错崩溃；
- **分流规则**：
  - 本地规则：CIDR、DOMAIN、DOMAIN-SUFFIX、DOMAIN-KEYWORD 等；
  - 远程规则集：GeoSite / GeoIP / SRS / MRS 规则集统一管理与去向分流；
- **模板与智能下发**：
  - 默认提供 Sing-box、Mihomo 与 Loon 的标准模版，其它需要的策略可以通过在模版中编辑控制，实时生效；
  - 每个订阅可为不同客户端绑定专属模版；
  - 根据客户端 User-Agent 智能下发对应格式，无 UA 时默认下发 Sing-box 格式，亦可通过 URL 显式指定。


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

业务数据（订阅源、自建节点、策略组、分流规则、模板等）保存在 `data/subone_config.json` 中，由管理后台自动维护。

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

每个订阅均拥有专属的独立 Token，支持通用自适应链接与各类客户端专用链接：

| 用途 | 请求路径 | 说明 |
| :--- | :--- | :--- |
| **通用自适应订阅** | `/s/<Token>` | 根据客户端 User-Agent 智能识别输出；若无 UA 标识（如浏览器或通用抓取）**默认输出 Sing-box 格式** |
| **指定 Sing-box 格式** | `/s/<Token>?target=singbox` 或 `/s/<Token>/singbox` | 输出 Sing-box JSON 完整配置 |
| **指定 Mihomo 格式** | `/s/<Token>?target=mihomo` 或 `/s/<Token>/mihomo` | 输出 Mihomo / ShellCrash YAML 格式配置 |
| **指定 Loon 格式** | `/s/<Token>?target=loon` 或 `/s/<Token>/loon` | 输出 Loon Conf 格式配置 |
| **临时指定模版** | `/s/<Token>?template=<模版ID>` | 临时覆盖订阅默认绑定的模版渲染输出 |

> **提示**：在 Web 管理首页的各订阅卡片中，点击对应客户端按钮即可一键复制对应的完整链接或生成专属二维码扫码导入。
