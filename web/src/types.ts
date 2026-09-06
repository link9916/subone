export interface ProxyNode {
  id: string;
  name: string;
  type: string;
  server: string;
  port: number;
  sourceId?: string;
  sourceName?: string;
  countryCode?: string;
  countryEmoji?: string;
  network?: string;
  tls?: boolean;
}

export interface SubscriptionSource {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
  type?: 'auto' | 'base64' | 'clash' | 'singbox' | 'custom';
  lastUpdated?: string;
  nodeCount?: number;
  nodes?: ProxyNode[];
}

export interface ExtractionRule {
  id: string;
  name: string;
  enabled: boolean;
  sourceIds?: string[];
  includeRegex?: string;
  excludeRegex?: string;
  includeKeywords?: string[];
  excludeKeywords?: string[];
  targetCountries?: string[];
  renamePattern?: {
    prefix?: string;
    suffix?: string;
    replaceFrom?: string;
    replaceTo?: string;
  };
}

export interface ConfigTemplate {
  id: string;
  name: string;
  type: 'singbox' | 'mihomo' | 'loon';
  content: string;
  isDefault?: boolean;
  description?: string;
}

export interface ProxyGroupItem {
  id: string;
  name: string;
  type: 'select' | 'urltest' | 'fallback' | 'load-balance' | 'direct';
  proxies?: string[];
  use?: string[];
  filter?: string;
  tolerance?: number;
  url?: string;
  interval?: number;
  isCountryGroup?: boolean;
}


export type RuleType =
  | 'DOMAIN-SUFFIX'
  | 'DOMAIN-KEYWORD'
  | 'DOMAIN'
  | 'IP-CIDR'
  | 'GEOIP'
  | 'RULE-SET'
  | 'FINAL'
  | 'OTHER';

export interface UnifiedRuleItem {
  id: string;
  name: string;
  kind: 'local' | 'remote';
  type: RuleType;
  payload: string;
  format?: 'binary' | 'mrs' | 'yaml' | 'text';
  outbound: string;
  enabled: boolean;
  clientUrls?: {
    singbox?: string;
    mihomo?: string;
    loon?: string;
  };
}

export interface CountryPatternRule {
  id: string;
  code: string;
  name: string;
  emoji: string;
  pattern: string;
  groupName?: string;
}

export interface AppDnsConfig {
  rawFormat: 'json' | 'yaml';
  rawText: string;
  singbox?: Record<string, any>;
  clash?: Record<string, any>;
}

export interface AppConfig {
  sources: SubscriptionSource[];
  rules: ExtractionRule[];
  countryRules?: CountryPatternRule[];
  templates: ConfigTemplate[];
  proxyGroups: ProxyGroupItem[];
  rulesList: UnifiedRuleItem[];
  dnsConfig?: AppDnsConfig;
  settings: {
    token?: string;
    subToken?: string;
    adminPassword?: string;
    port?: number;
    defaultClient?: 'singbox' | 'mihomo' | 'loon';
  };
}

