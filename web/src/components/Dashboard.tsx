import React, { useState } from 'react';
import {
  Check,
  ChevronDown,
  Copy,
  ExternalLink,
  Layers,
  Link2,
  Server,
  Zap,
} from 'lucide-react';
import { AppConfig, ProxyNode } from '../types';

interface DashboardProps {
  config: AppConfig | null;
  nodes: ProxyNode[];
  onNavigateTab: (tab: 'dashboard' | 'sources' | 'nodes' | 'groups' | 'rules' | 'templates') => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ config, nodes, onNavigateTab }) => {
  const [selectedFormat, setSelectedFormat] = useState<'auto' | 'mihomo' | 'singbox' | 'loon'>('auto');
  const [copied, setCopied] = useState(false);

  const getSubUrl = (formatKey: string) => {
    const origin = window.location.origin;
    const subToken = config?.settings.subToken || 'default_token';
    
    const queryParts: string[] = [];
    if (formatKey !== 'auto') {
      queryParts.push(`target=${formatKey}`);
    }

    const queryStr = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
    return `${origin}/s/${subToken}${queryStr}`;
  };

  const currentSubUrl = getSubUrl(selectedFormat);

  const handleCopy = () => {
    navigator.clipboard.writeText(currentSubUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Group nodes by country
  const countryCounts: Record<string, { count: number; emoji: string; name: string }> = {};
  nodes.forEach(n => {
    const code = n.countryCode || 'OTHER';
    if (!countryCounts[code]) {
      countryCounts[code] = {
        count: 0,
        emoji: n.countryEmoji || '🌐',
        name: code === 'OTHER' ? '其他' : code,
      };
    }
    countryCounts[code].count++;
  });

  // Group nodes by protocol
  const protocolCounts: Record<string, number> = {};
  nodes.forEach(n => {
    const type = (n.type || 'vless').toUpperCase();
    protocolCounts[type] = (protocolCounts[type] || 0) + 1;
  });

  const localRulesCount = config?.rulesList.filter(r => r.kind === 'local').length || 0;
  const remoteRulesCount = config?.rulesList.filter(r => r.kind === 'remote').length || 0;
  const proxyGroupsCount = config?.proxyGroups.length || 0;
  const customNodesCount = config?.sources.find(s => s.type === 'custom')?.nodes?.length || 0;
  const networkSources = config?.sources.filter(s => s.type !== 'custom') || [];
  const enabledNetworkCount = networkSources.filter(s => s.enabled).length;

  const formatOptions = [
    { id: 'auto', label: '自适应 UA' },
    { id: 'mihomo', label: 'Mihomo / ShellCrash' },
    { id: 'singbox', label: 'Sing-box' },
    { id: 'loon', label: 'Loon' },
  ] as const;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pt-2 pb-12">
      {/* 1. 客户端订阅链接核心区块 (主视觉焦点、大方舒适) */}
      <div className="claude-panel p-6 sm:p-7 rounded-2xl bg-white border border-[#E3DDD2] shadow-sm space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#FAF0EC] flex items-center justify-center text-[#CC785C]">
            <Link2 className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#1F1E1D]">客户端订阅链接</h2>
            <p className="text-xs text-[#8C877D]">支持客户端 UA 自动匹配，或指定具体客户端配置格式</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
          {/* 格式选择 */}
          <div className="relative shrink-0">
            <select
              value={selectedFormat}
              onChange={e => setSelectedFormat(e.target.value as any)}
              className="appearance-none w-full sm:w-auto pl-3.5 pr-9 py-2.5 bg-[#FAF8F5] border border-[#E3DDD2] rounded-xl text-xs font-semibold text-[#1F1E1D] focus:outline-none focus:border-[#CC785C] cursor-pointer hover:border-[#CC785C]/60 transition-colors"
            >
              {formatOptions.map(opt => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-[#8C877D] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* 链接输入框 */}
          <input
            type="text"
            readOnly
            value={currentSubUrl}
            className="flex-1 min-w-0 bg-[#FAF8F5] px-4 py-2.5 rounded-xl border border-[#E3DDD2] text-xs font-mono text-[#2D2B28] select-all focus:outline-none focus:bg-white focus:border-[#CC785C] transition-colors"
          />

          {/* 操作按钮 */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCopy}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-5 py-2.5 text-xs font-semibold btn-claude-primary rounded-xl shadow-xs"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? '已复制' : '复制链接'}</span>
            </button>
            <a
              href={currentSubUrl}
              target="_blank"
              rel="noreferrer"
              className="p-2.5 text-[#69655E] hover:text-[#1F1E1D] bg-[#FAF8F5] hover:bg-white border border-[#E3DDD2] rounded-xl transition-colors shadow-2xs"
              title="在浏览器中直接预览"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>

      {/* 2. 统计与概览小卡片 (小巧、淡化、去繁就简) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {/* 板块 1: 订阅源 */}
        <div
          onClick={() => onNavigateTab('sources')}
          className="p-4 rounded-xl bg-[#FAF8F5]/60 hover:bg-white border border-[#EAE5DC] hover:border-[#D5CEC2] transition-all cursor-pointer space-y-2 group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-[#8C877D] group-hover:text-[#CC785C] transition-colors" />
              <span className="text-xs font-medium text-[#59554E]">订阅源</span>
            </div>
            <span className="text-[11px] text-[#A8A39A] group-hover:text-[#CC785C] transition-colors">
              管理 &rarr;
            </span>
          </div>

          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-semibold text-[#2D2B28] font-mono">
              {networkSources.length + (customNodesCount > 0 ? 1 : 0)}
            </span>
            <span className="text-xs text-[#8C877D]">个源</span>
          </div>

          <p className="text-[11px] text-[#8C877D] truncate">
            {networkSources.length} 机场订阅 · {customNodesCount} 独立节点
          </p>
        </div>

        {/* 板块 2: 节点池 */}
        <div
          onClick={() => onNavigateTab('nodes')}
          className="p-4 rounded-xl bg-[#FAF8F5]/60 hover:bg-white border border-[#EAE5DC] hover:border-[#D5CEC2] transition-all cursor-pointer space-y-2 group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Server className="w-3.5 h-3.5 text-[#8C877D] group-hover:text-[#CC785C] transition-colors" />
              <span className="text-xs font-medium text-[#59554E]">节点池</span>
            </div>
            <span className="text-[11px] text-[#A8A39A] group-hover:text-[#CC785C] transition-colors">
              查看 &rarr;
            </span>
          </div>

          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-semibold text-[#2D2B28] font-mono">{nodes.length}</span>
            <span className="text-xs text-[#8C877D]">个节点</span>
          </div>

          <p className="text-[11px] text-[#8C877D] truncate">
            {Object.keys(countryCounts).length} 国家地区 · {Object.keys(protocolCounts).length} 协议
          </p>
        </div>

        {/* 板块 3: 策略与分流 */}
        <div
          onClick={() => onNavigateTab('groups')}
          className="p-4 rounded-xl bg-[#FAF8F5]/60 hover:bg-white border border-[#EAE5DC] hover:border-[#D5CEC2] transition-all cursor-pointer space-y-2 group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-[#8C877D] group-hover:text-[#CC785C] transition-colors" />
              <span className="text-xs font-medium text-[#59554E]">策略与分流</span>
            </div>
            <span className="text-[11px] text-[#A8A39A] group-hover:text-[#CC785C] transition-colors">
              配置 &rarr;
            </span>
          </div>

          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-semibold text-[#2D2B28] font-mono">{proxyGroupsCount}</span>
            <span className="text-xs text-[#8C877D]">策略组 · {rulesListCount(config)} 条规则</span>
          </div>

          <p className="text-[11px] text-[#8C877D] truncate">
            {localRulesCount} 本地规则 · {remoteRulesCount} 远程规则集
          </p>
        </div>
      </div>
    </div>
  );
};

function rulesListCount(config: AppConfig | null): number {
  return config?.rulesList.length || 0;
}



