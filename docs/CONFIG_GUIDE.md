# SubOne 详细配置指南与格式规范

本文档详细解说 SubOne 中各类配置的编写格式、规范与实用范例，包含：
1. **独立节点组与单节点配置格式**（URI 链接、Clash YAML、Sing-box JSON、Base64）
2. **自定义配置模版编写指南**（Mihomo YAML、Sing-box JSON、Loon MCF 结构与注入机制）
3. **策略组（Proxy Groups）格式与示例**（手动选择、自动测速、国家/地区正则过滤）
4. **分流规则与远程规则集格式与示例**（本地单条规则、远程规则集、表格化矩阵）

---

## 目录
- [一、独立节点组与单节点配置](#一独立节点组与单节点配置)
  - [1.1 节点分享链接 (URI 格式)](#11-节点分享链接-uri-格式)
  - [1.2 Clash / Mihomo 单节点 YAML 格式](#12-clash--mihomo-单节点-yaml-格式)
  - [1.3 Sing-box 单节点 JSON 格式](#13-sing-box-单节点-json-格式)
  - [1.4 Base64 批量格式](#14-base64-批量格式)
- [二、自定义配置模版编写](#二自定义配置模版编写)
  - [2.1 Mihomo / ShellCrash 模版编写规范](#21-mihomo--shellcrash-模版编写规范)
  - [2.2 Sing-box 模版编写规范](#22-sing-box-模版编写规范)
  - [2.3 Loon 模版编写规范](#23-loon-模版编写规范)
- [三、策略组 (Proxy Groups) 格式与编写](#三策略组-proxy-groups-格式与编写)
  - [3.1 策略组类型说明](#31-策略组类型说明)
  - [3.2 批量导入 YAML 语法范例](#32-批量导入-yaml-语法范例)
  - [3.3 Loon 策略组语法范例](#33-loon-策略组语法范例)
- [四、分流规则 (Rules) 格式与编写](#四分流规则-rules-格式与编写)
  - [4.1 本地规则格式 (Local Rules)](#41-本地规则格式-local-rules)
  - [4.2 远程规则集格式 (Remote Rule-Sets)](#42-远程规则集格式-remote-rule-sets)
  - [4.3 表格化矩阵与去向关联](#43-表格化矩阵与去向关联)

---

## 一、独立节点组与单节点配置

在 SubOne 的 **「订阅源」➔「⭐ 独立节点组」** 面板中，支持直接批量粘贴以下任意格式，系统会自动识别解析并归入节点池。

### 1.1 节点分享链接 (URI 格式)

#### (1) VLESS + Reality + Vision (推荐)
```text
vless://11111111-2222-3333-4444-555555555555@2001:db8::1:8881?encryption=none&flow=xtls-rprx-vision&security=reality&sni=addons.example.org&fp=chrome&pbk=example_public_key&type=tcp#🇯🇵%20JP%20Reality%20Node
```

#### (2) AnyTLS (sing-anytls / mihomo)
```text
anytls://my_secret_password@anytls.example.com:443?sni=sni.example.com&alpn=h2,http/1.1&fp=chrome&insecure=0#🇯🇵%20JP%20AnyTLS
```

#### (3) WireGuard (`wg://` 或 `wireguard://`)
```text
wg://cGFzc3dvcmQxMjM0NTY3OA==@wg.example.com:51820?public_key=cHViMTIzNDU2Nzg=&ip=10.0.0.2/32,fd00::2/128&preshared_key=cHNrMTIzNDU2Nzg=&reserved=[1,2,3]&mtu=1420#🇭🇰%20HK%20WireGuard
```

#### (4) Snell (v1 - v4)
```text
snell://my_snell_psk@snell.example.com:443?version=4&obfs=http&obfs-host=bing.com#🇺🇸%20US%20Snell
```

#### (5) SOCKS5
```text
socks5://username:password@socks.example.com:1080#🇸🇬%20SG%20Socks5
```

#### (6) Hysteria2 / Hy2
```text
hysteria2://my_secure_password@example.com:8881?sni=example.com&insecure=0&obfs=salamander&obfs-password=example_obfs_pwd#🇭🇰%20HK%20Hysteria2
```

#### (7) Shadowsocks (SS 2022 / AEAD)
```text
ss://MjAyMi1ibGFrZTMtYWVzLTEyOC1nY206cGFzc3dvcmQxMjM=@ss.example.com:8885#🇺🇸%20US%20Shadowsocks
```

#### (8) Trojan
```text
trojan://trojan_password@my-trojan-server.com:443?security=tls&sni=my-trojan-server.com#🇸🇬%20SG%20Trojan
```

#### (9) VMess
```text
vmess://eyJhZGQiOiJ2bWVzcy5leGFtcGxlLmNvbSIsImFpZCI6IjAiLCJob3N0IjoiZXhhbXBsZS5jb20iLCJpZCI6IjExMTExMTExLTIyMjItMzMzMy00NDQ0LTU1NTU1NTU1NTU1NSIsIm5ldCI6IndzIiwicGF0aCI6Ii92bWVzcy13cyIsInBvcnQiOiI0NDMiLCJwcyI6IuKZrOK4jSBKUCBWTWVzcyIsInNjeSI6ImF1dG8iLCJzbmkiOiJleGFtcGxlLmNvbSIsInRscyI6InRscyJ9
```

#### (10) TUIC v5
```text
tuic://uuid_here:password_here@tuic-server.com:8443?congestion_control=bbr&alpn=h3&sni=tuic-server.com#🇩🇪%20Germany%20TUIC
```

#### (11) v2rayN 客户端专有格式 (`v2rayn://`)
支持解析 v2rayN 客户端专有的节点导出链接（支持 `v2rayn://{protocol}/{Base64}` 以及 `v2rayn://{Base64}` 格式）。系统会自动解包 Base64 配置并通过 `ConfigType` 与参数结构自动映射为对应的代理节点（Hysteria2、VLESS、VMess、TUIC、WireGuard、Shadowsocks、Trojan 等）：

```text
v2rayn://hysteria2/eyJDb25maWdUeXBlIjo3LCJDb25maWdWZXJzaW9uIjo0LCJSZW1hcmtzIjoi8J-HsPCfh7cgbG9jYWxob3N0IGh5c3RlcmlhMiIsIkFkZHJlc3MiOiJoeXN0ZXJpYTIuZXhhbXBsZS5jb20iLCJQb3J0Ijo4ODgyLCJQYXNzd29yZCI6InBhc3N3b3JkMTIzIiwic25pIjoiZXhhbXBsZS5jb20ifQ==
```

---

### 1.2 Clash / Mihomo 单节点 YAML 格式

支持标准的 YAML 字典或列表形式，涵盖以下主流协议：

```yaml
# VLESS + Reality
- name: "🇯🇵 JP Tokyo Vless"
  type: vless
  server: 2001:db8::1
  port: 8881
  uuid: 11111111-2222-3333-4444-555555555555
  cipher: auto
  tls: true
  flow: xtls-rprx-vision
  servername: addons.example.org
  reality-opts:
    public-key: example_public_key
  client-fingerprint: chrome
  network: tcp

# AnyTLS
- name: "🇯🇵 JP AnyTLS"
  type: anytls
  server: anytls.example.com
  port: 443
  password: my_password
  sni: sni.example.com
  alpn:
    - h2
    - http/1.1
  client-fingerprint: chrome

# WireGuard
- name: "🇭🇰 HK WireGuard"
  type: wireguard
  server: wg.example.com
  port: 51820
  ip: 10.0.0.2
  ipv6: fd00::2
  private-key: private_key_here
  public-key: peer_public_key_here
  preshared-key: preshared_key_here
  reserved: [1, 2, 3]
  mtu: 1420
  udp: true

# Snell
- name: "🇺🇸 US Snell"
  type: snell
  server: snell.example.com
  port: 443
  psk: my_snell_psk
  version: 4
  obfs-opts:
    mode: http
    host: bing.com

# SOCKS5
- name: "🇸🇬 SG Socks5"
  type: socks5
  server: socks.example.com
  port: 1080
  username: myuser
  password: mypassword
  udp: true
```

---

### 1.3 Sing-box 单节点 JSON 格式

支持标准的 Sing-box outbound JSON：

```json
[
  {
    "type": "vless",
    "tag": "🇯🇵 JP Tokyo Vless",
    "server": "2001:db8::1",
    "server_port": 8881,
    "uuid": "11111111-2222-3333-4444-555555555555",
    "flow": "xtls-rprx-vision",
    "tls": {
      "enabled": true,
      "server_name": "addons.example.org",
      "utls": {
        "enabled": true,
        "fingerprint": "chrome"
      },
      "reality": {
        "enabled": true,
        "public_key": "example_public_key"
      }
    },
    "packet_encoding": "xudp"
  },
  {
    "type": "anytls",
    "tag": "🇯🇵 JP AnyTLS",
    "server": "anytls.example.com",
    "server_port": 443,
    "password": "my_password",
    "tls": {
      "enabled": true,
      "server_name": "sni.example.com",
      "alpn": ["h2", "http/1.1"],
      "utls": {
        "enabled": true,
        "fingerprint": "chrome"
      }
    }
  },
  {
    "type": "wireguard",
    "tag": "🇭🇰 HK WireGuard",
    "server": "wg.example.com",
    "server_port": 51820,
    "local_address": ["10.0.0.2/32", "fd00::2/128"],
    "private_key": "private_key_here",
    "peer_public_key": "peer_public_key_here",
    "pre_shared_key": "preshared_key_here",
    "reserved": [1, 2, 3],
    "mtu": 1420
  },
  {
    "type": "socks",
    "tag": "🇸🇬 SG Socks5",
    "server": "socks.example.com",
    "server_port": 1080,
    "version": "5",
    "username": "myuser",
    "password": "mypassword"
  }
]
```

---

### 1.4 Base64 批量格式

将多条 URI 链接（每行一个）通过 Base64 编码后的纯文本字符串，SubOne 同样能自动解码并识别其中的全部节点。

---

## 二、自定义配置模版编写

SubOne 采用**动态注入架构**。您在模版中只需定义核心网络栈（DNS、Inbound、TUN、路由模式等），SubOne 会自动将节点池、策略组与分流矩阵无缝注入到下发配置中。

### 2.1 Mihomo / ShellCrash 模版编写规范

#### (1) 模版核心注入点说明：
- `proxies:` ➔ 自动填入**独立节点组中的节点**。
- `proxy-providers:` ➔ 自动填入已启用的**机场订阅源**（避免单文件臃肿，支持客户端后台自动按时拉取机场）。
- `proxy-groups:` ➔ 自动填入在「策略组」中配置的分组，自动关联 `use: [机场订阅源]` 与手动节点。
- `rules:` ➔ 自动填入在「分流规则」中配置的本地与远程规则矩阵。

#### (2) 完整示例模版：
```yaml
port: 7890
socks-port: 7891
mixed-port: 7892
allow-lan: true
mode: rule
log-level: info
ipv6: false
external-controller: 0.0.0.0:9090
secret: ""

# TUN 旁路由增强配置
tun:
  enable: true
  stack: mixed
  dns-hijack:
    - "any:53"
  auto-route: true
  auto-detect-interface: true

# DNS 配置
dns:
  enable: true
  listen: 0.0.0.0:1053
  ipv6: false
  enhanced-mode: fake-ip
  fake-ip-range: 198.18.0.1/16
  nameserver:
    - 223.5.5.5
    - 119.29.29.29
  fallback:
    - https://dns.cloudflare.com/dns-query
    - https://dns.google/dns-query

# 以下字段留空即可，SubOne 会在下发时自动注入完整结构
proxies: []
proxy-providers: {}
proxy-groups: []
rules: []
```

---

### 2.2 Sing-box 模版编写规范

#### (1) 模版核心注入点说明：
- `outbounds`: SubOne 会将自定义出站、策略组选择器（Selector / URLTest）及基础直连 (`direct`) / DNS 出站 (`dns-out`) 智能融合。
- `route.rules`: 自动按「分流规则」生成的 Sing-box 路由规则列表。
- `route.rule_set`: 自动挂载规则矩阵中涉及的远程 SRS/JSON 规则集。

#### (2) 完整示例模版：
```json
{
  "log": {
    "level": "info",
    "timestamp": true
  },
  "dns": {
    "servers": [
      {
        "tag": "dns-remote",
        "address": "https://1.1.1.1/dns-query",
        "detour": "🚀 节点选择"
      },
      {
        "tag": "dns-direct",
        "address": "223.5.5.5",
        "detour": "direct"
      },
      {
        "tag": "dns-block",
        "address": "rcode://success"
      }
    ],
    "rules": [
      {
        "outbound": "any",
        "server": "dns-direct"
      },
      {
        "rule_set": "geosite-cn",
        "server": "dns-direct"
      },
      {
        "rule_set": "geosite-geolocation-!cn",
        "server": "dns-remote"
      }
    ],
    "final": "dns-remote",
    "strategy": "prefer_ipv4"
  },
  "inbounds": [
    {
      "type": "tun",
      "tag": "tun-in",
      "inet4_address": "172.19.0.1/30",
      "auto_route": true,
      "strict_route": true,
      "sniff": true
    },
    {
      "type": "mixed",
      "tag": "mixed-in",
      "listen": "0.0.0.0",
      "listen_port": 2080,
      "sniff": true
    }
  ],
  "outbounds": [],
  "route": {
    "rules": [],
    "rule_set": [],
    "final": "🐟 漏网之鱼",
    "auto_detect_interface": true
  }
}
```

---

### 2.3 Loon 模版编写规范

#### (1) 模版核心注入点说明：
- `[Proxy]`: 注入独立节点组节点。
- `[Remote Proxy]`: 注入机场远程订阅链接。
- `[Remote Filter]`: 注入各地区/关键词节点过滤器。
- `[Proxy Group]`: 注入策略组。
- `[Rule]`: 注入本地分流规则。
- `[Remote Rule]`: 注入远程分流规则集。

#### (2) 完整示例模版：
```ini
[General]
ipv6-vif = auto
ip-mode = dual
allow-udp-proxy = true
skip-proxy = 192.168.0.0/16,10.0.0.0/8,172.16.0.0/12,localhost,*.local
dns-server = 223.5.5.5, 119.29.29.29

[Proxy]

[Remote Proxy]

[Remote Filter]

[Proxy Group]

[Rule]

[Remote Rule]

FINAL,🐟 漏网之鱼
```

---

## 三、策略组 (Proxy Groups) 格式与编写

在 SubOne 的 **「策略组」** 页面，您可以直观编辑每个策略组，也可以点击 **「大段批量导入」** 粘贴大段 YAML 或 Loon 配置。

### 3.1 策略组类型说明

| 类型 | 说明 | 特有属性 |
| :--- | :--- | :--- |
| `select` | 手动选择节点或子策略组 | `proxies: [...]` (包含节点或子策略组名) |
| `urltest` | 自动测速选取延迟最低节点 | `filter: "正则"` (节点名称正则过滤), `tolerance: 50` |
| `fallback` | 故障转移，首选不可用时自动顺延 | `interval: 300`, `url: "http://..."` |
| `direct` | 直连出站 | 固定指向 DIRECT |

---

### 3.2 批量导入 YAML 语法范例

支持标准的 Clash / Mihomo `proxy-groups:` 语法：

```yaml
proxy-groups:
  # 1. 主节点选择
  - name: 🚀 节点选择
    type: select
    proxies:
      - ♻️ 自动选择
      - 👉 手动选择
      - 🇭🇰 香港节点
      - 🇯🇵 日本节点
      - 🇺🇸 美国节点
      - 🎯 本地直连

  # 2. 专用业务分组
  - name: 🤖 AI 服务
    type: select
    proxies:
      - 🚀 节点选择
      - 🇺🇸 美国节点
      - 🇯🇵 日本节点
      - 🎯 本地直连

  - name: 📹 YouTube
    type: select
    proxies:
      - 🚀 节点选择
      - ♻️ 自动选择
      - 🇭🇰 香港节点
      - 🇯🇵 日本节点
      - 🇺🇸 美国节点

  - name: 🇨🇳 国内服务
    type: select
    proxies:
      - 🎯 本地直连
      - 🚀 节点选择

  - name: 🐟 漏网之鱼
    type: select
    proxies:
      - 🚀 节点选择
      - 🎯 本地直连

  # 3. 自动与地区正则分组 (智能按名称过滤节点)
  - name: ♻️ 自动选择
    type: urltest
    tolerance: 50

  - name: 👉 手动选择
    type: select

  - name: 🇭🇰 香港节点
    type: urltest
    tolerance: 50
    filter: "(?i)(🇭🇰|港|hk|hongkong)"

  - name: 🇯🇵 日本节点
    type: urltest
    tolerance: 50
    filter: "(?i)(🇯🇵|日|jp|japan)"

  - name: 🇺🇸 美国节点
    type: urltest
    tolerance: 50
    filter: "(?i)(🇺🇸|美|us|unitedstates)"

  - name: 🎯 本地直连
    type: select
    proxies:
      - DIRECT
```

---

### 3.3 Loon 策略组语法范例

```ini
[Proxy Group]
🚀 节点选择 = select, ♻️ 自动选择, 👉 手动选择, 🇭🇰 香港节点, 🇯🇵 日本节点, 🇺🇸 美国节点, 🎯 本地直连
🤖 AI 服务 = select, 🚀 节点选择, 🇺🇸 美国节点, 🇯🇵 日本节点
📹 YouTube = select, 🚀 节点选择, ♻️ 自动选择, 🇭🇰 香港节点, 🇯🇵 日本节点
🇨🇳 国内服务 = select, 🎯 本地直连, 🚀 节点选择
🐟 漏网之鱼 = select, 🚀 节点选择, 🎯 本地直连
🎯 本地直连 = select, DIRECT

♻️ 自动选择 = url-test, url = http://www.gstatic.com/generate_204, interval = 300
🇭🇰 香港节点 = url-test, filter = (?i)(🇭🇰|港|hk|hongkong), interval = 300
🇯🇵 日本节点 = url-test, filter = (?i)(🇯🇵|日|jp|japan), interval = 300
🇺🇸 美国节点 = url-test, filter = (?i)(🇺🇸|美|us|unitedstates), interval = 300
```

---

## 四、分流规则 (Rules) 格式与编写

在 SubOne 的 **「分流规则」** 页面，所有本地分流规则与远程规则集以**统一表格矩阵**展现。您可以在表格中直接为每条规则下拉指定其去向策略组。

### 4.1 本地规则格式 (Local Rules)

支持标准逗号分隔行或 YAML 列表，点击 **「📥 导入本地规则」** 贴入：

```text
# 语法：类型, 匹配载荷, 去向策略组 (去向可选，未写时默认分配)
DOMAIN-SUFFIX, openai.com, 🤖 AI 服务
DOMAIN-SUFFIX, anthropic.com, 🤖 AI 服务
DOMAIN-SUFFIX, claude.ai, 🤖 AI 服务
DOMAIN-KEYWORD, chatgpt, 🤖 AI 服务
DOMAIN-KEYWORD, perplexity, 🤖 AI 服务

DOMAIN-SUFFIX, youtube.com, 📹 YouTube
DOMAIN-SUFFIX, googlevideo.com, 📹 YouTube
DOMAIN-SUFFIX, google.com, 🌐 Google

# 局域网直连
IP-CIDR, 10.0.0.0/8, 🎯 本地直连, no-resolve
IP-CIDR, 172.16.0.0/12, 🎯 本地直连, no-resolve
IP-CIDR, 192.168.0.0/16, 🎯 本地直连, no-resolve
IP-CIDR, 127.0.0.0/8, 🎯 本地直连, no-resolve

# PT/BT 下载防漏
DOMAIN-KEYWORD, torrent, 🎯 本地直连
DOMAIN-KEYWORD, bittorrent, 🎯 本地直连
DOMAIN-KEYWORD, tracker, 🎯 本地直连

# 国内域名直连
GEOIP, CN, 🇨🇳 国内服务
FINAL, 🐟 漏网之鱼
```

---

### 4.2 远程规则集格式 (Remote Rule-Sets)

支持直接粘贴 URL 列表、Clash `rule-providers:` 或 Sing-box `rule_set:`，点击 **「🌐 导入远程规则集」** 贴入：

#### 示例 1：纯 URL 快速贴入
```text
https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/sing/geo/geosite/category-ai-!cn.srs
https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/sing/geo/geosite/youtube.srs
https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/sing/geo/geosite/google.srs
https://raw.githubusercontent.com/SagerNet/sing-geosite/rule-set/geosite-cn.srs
https://raw.githubusercontent.com/SagerNet/sing-geoip/rule-set/geoip-cn.srs
```

#### 示例 2：Clash rule-providers YAML 语法贴入
```yaml
rule-providers:
  ai-rules:
    type: http
    behavior: domain
    format: yaml
    url: "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/category-ai-!cn.yaml"
    path: ./ruleset/category-ai.yaml
    interval: 86400
  
  youtube-rules:
    type: http
    behavior: domain
    format: yaml
    url: "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/youtube.yaml"
    path: ./ruleset/youtube.yaml
    interval: 86400
```

---

### 4.3 表格化矩阵与去向关联

导入后，所有规则在控制台中呈现在统一表格中：
1. **类型徽章**：明确标注 `DOMAIN-SUFFIX`、`IP-CIDR`、`RULE-SET`（远程）等。
2. **去向策略组下拉框**：实时联动「策略组」列表。当您需要将 `category-ai-!cn` 从 `🚀 节点选择` 改为 `🇺🇸 美国节点`，**只需在表格下拉框中直接切换，客户端下次拉取时立即生效**。
3. **支持文本互导**：点击 **「批量编辑 (文本)」** 可以一次性复制或替换全部规则，方便在不同机器或环境之间快速迁移。
