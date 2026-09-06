import React, { useState, useEffect } from 'react';
import {
  Check,
  Copy,
  FileCode,
  Globe,
  RotateCcw,
  Save,
  Server,
  ShieldAlert,
  Zap,
} from 'lucide-react';
import yaml from 'js-yaml';

import { AppDnsConfig } from '../types';

interface DnsManagerProps {
  dnsConfig?: AppDnsConfig | string;
  onSaveDns: (dnsConfig: AppDnsConfig) => Promise<void>;
  onResetDns: () => Promise<void>;
}

const getRawText = (cfg: any): string => {
  if (!cfg) return '';
  if (typeof cfg === 'string') return cfg;
  if (typeof cfg === 'object') {
    if (typeof cfg.rawText === 'string') return cfg.rawText;
    if (cfg.singbox) return JSON.stringify(cfg.singbox, null, 2);
    return JSON.stringify(cfg, null, 2);
  }
  return '';
};

export const DnsManager: React.FC<DnsManagerProps> = ({
  dnsConfig,
  onSaveDns,
  onResetDns,
}) => {
  const [editorText, setEditorText] = useState(() => getRawText(dnsConfig));
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  const [parsedData, setParsedData] = useState<any>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  useEffect(() => {
    const raw = getRawText(dnsConfig);
    if (raw && raw !== editorText && !isSaving) {
      setEditorText(raw);
    }
  }, [dnsConfig]);

  useEffect(() => {
    try {
      const trimmed = editorText.trim();
      if (!trimmed) {
        setParsedData(null);
        setParseError(null);
        return;
      }
      if (trimmed.startsWith('{')) {
        const parsed = JSON.parse(trimmed);
        setParsedData(parsed);
        setParseError(null);
      } else {
        const parsed = yaml.load(trimmed);
        setParsedData(parsed);
        setParseError(null);
      }
    } catch (e: any) {
      setParseError(e.message || '语法解析错误');
    }
  }, [editorText]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const trimmed = editorText.trim();
      let format: 'json' | 'yaml' = 'json';
      let singboxObj: any = undefined;
      let clashObj: any = undefined;

      if (trimmed.startsWith('{')) {
        format = 'json';
        const parsed = JSON.parse(trimmed);
        if (parsed.servers || parsed.rules) {
          singboxObj = parsed;
        } else if (parsed.nameserver || parsed.fallback) {
          clashObj = parsed;
        }
      } else {
        format = 'yaml';
        const parsed = yaml.load(trimmed) as any;
        if (parsed && typeof parsed === 'object') {
          if (parsed.servers || parsed.rules) {
            singboxObj = parsed;
          } else if (parsed.nameserver || parsed.fallback || parsed.dns) {
            clashObj = parsed.dns || parsed;
          }
        }
      }

      await onSaveDns({
        rawFormat: format,
        rawText: editorText,
        singbox: singboxObj,
        clash: clashObj,
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err: any) {
      alert('保存失败: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('确定要恢复为系统默认的 DNS 配置吗？')) return;
    setIsSaving(true);
    try {
      await onResetDns();
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(editorText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const serversList = Array.isArray(parsedData?.servers)
    ? parsedData.servers
    : (Array.isArray(parsedData?.nameserver) ? parsedData.nameserver : []);

  return (
    <div className="space-y-4 max-w-7xl mx-auto h-[calc(100vh-130px)] flex flex-col min-h-0">
      {/* Top Action Bar */}
      <div className="claude-panel p-3.5 rounded-2xl flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#EFF6F4] border border-[#D1E5DF] flex items-center justify-center text-[#367A68]">
            <Globe className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#1F1E1D] flex items-center gap-2">
              <span>全局 DNS 与域名分流配置</span>
            </h2>
            <p className="text-[11px] text-[#78746D]">
              支持直接粘贴标准 JSON 或 YAML 的 DNS 配置块，系统自动转换
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold btn-claude-secondary rounded-xl"
            title="复制当前 DNS 配置"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#367A68]" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? '已复制' : '复制内容'}</span>
          </button>

          <button
            onClick={handleReset}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold btn-claude-secondary rounded-xl text-[#78746D] hover:text-[#1F1E1D]"
            title="恢复为系统预设的高性能 FakeIP + DoH 默认配置"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#CC785C]" />
            <span>恢复默认</span>
          </button>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`flex items-center gap-1.5 px-5 py-2 text-xs font-semibold rounded-xl shadow-xs transition-colors ${
              saveSuccess
                ? 'bg-[#367A68] text-white'
                : 'btn-claude-primary'
            }`}
          >
            {saveSuccess ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
            <span>{isSaving ? '保存中...' : (saveSuccess ? '已保存！' : '保存 DNS 配置')}</span>
          </button>
        </div>
      </div>

      {/* Main Split Layout: Editor & Structure Overview */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-0 h-full">
        {/* Left: Code Editor (7 cols) */}
        <div className="lg:col-span-7 claude-panel rounded-2xl flex flex-col h-full min-h-0 overflow-hidden shadow-xs">
          <div className="px-4 py-2.5 bg-[#FAF8F5] border-b border-[#E8E4DC] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-[#CC785C]" />
              <span className="text-xs font-bold text-[#1F1E1D]">DNS 配置编辑器 (JSON / YAML)</span>
            </div>
            {parseError ? (
              <span className="text-[11px] font-semibold text-[#A8483B] flex items-center gap-1">
                <ShieldAlert className="w-3 h-3" />
                {parseError}
              </span>
            ) : (
              <span className="text-[11px] font-medium text-[#367A68] flex items-center gap-1">
                <Check className="w-3 h-3" /> 语法校验通过
              </span>
            )}
          </div>

          <div className="flex-1 relative min-h-0 w-full h-full bg-white">
            <textarea
              value={editorText}
              onChange={e => setEditorText(e.target.value)}
              spellCheck={false}
              className="absolute inset-0 w-full h-full p-4 bg-white font-mono text-xs text-[#2D2B28] focus:outline-none resize-none leading-relaxed overflow-y-auto overflow-x-auto"
              placeholder="在此处直接粘贴或编辑 DNS 配置 (JSON 或 YAML)..."
            />
          </div>
        </div>

        {/* Right: Structure Overview & Multi-client Translation Info (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4 h-full min-h-0 overflow-y-auto">
          {/* Parsed Summary Card */}
          <div className="claude-panel p-4 rounded-2xl space-y-3 shrink-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#1F1E1D] flex items-center gap-2">
                <Server className="w-4 h-4 text-[#367A68]" /> 上游 DNS 服务器概览
              </span>
              <span className="text-[11px] text-[#78746D] font-mono">
                {serversList.length} 个已定义
              </span>
            </div>

            <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
              {serversList.map((srv: any, idx: number) => {
                const tag = typeof srv === 'string' ? srv : srv.tag || `server_${idx}`;
                const serverAddr = typeof srv === 'string' ? srv : `${srv.server || srv.type} (${srv.type || 'udp'})`;
                const detour = typeof srv === 'object' && srv.detour ? ` -> ${srv.detour}` : '';
                return (
                  <div key={idx} className="flex items-center justify-between p-2 bg-[#FAF8F5] border border-[#E8E4DC] rounded-xl text-xs">
                    <span className="font-semibold text-[#1F1E1D] font-mono">{tag}</span>
                    <span className="text-[#78746D] text-[11px] font-mono truncate max-w-[200px]">
                      {serverAddr}{detour}
                    </span>
                  </div>
                );
              })}
              {serversList.length === 0 && (
                <div className="p-3 text-center text-xs text-[#8C877D] bg-[#FAF8F5] rounded-xl border border-dashed border-[#E3DDD2]">
                  暂无解析出的上游 DNS 服务器
                </div>
              )}
            </div>
          </div>

          {/* Translation Mapping Architecture */}
          <div className="claude-panel p-4 rounded-2xl space-y-3 flex-1 overflow-y-auto">
            <span className="text-xs font-bold text-[#1F1E1D] flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#CC785C]" /> 三端自动映射逻辑说明
            </span>

            <div className="space-y-2 text-xs text-[#524E48] leading-relaxed">
              <div className="p-2.5 bg-[#FAF8F5] rounded-xl border border-[#E8E4DC] space-y-1">
                <div className="font-bold text-[#1F1E1D] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#367A68]"></span>
                  Sing-box (JSON)
                </div>
                <p className="text-[11px] text-[#78746D]">
                  对齐原生 <code className="text-[#CC785C]">dns.servers</code> 与 <code className="text-[#CC785C]">dns.rules</code>，国内走 alidns、海外走 fakeip、私有域名优先解析。
                </p>
              </div>

              <div className="p-2.5 bg-[#FAF8F5] rounded-xl border border-[#E8E4DC] space-y-1">
                <div className="font-bold text-[#1F1E1D] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#B85D38]"></span>
                  Mihomo / Clash (YAML)
                </div>
                <p className="text-[11px] text-[#78746D]">
                  提取上游为 <code className="text-[#CC785C]">nameserver</code>，将域名与规则集自动映射为 <code className="text-[#CC785C]">nameserver-policy</code>。
                </p>
              </div>

              <div className="p-2.5 bg-[#FAF8F5] rounded-xl border border-[#E8E4DC] space-y-1">
                <div className="font-bold text-[#1F1E1D] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#635588]"></span>
                  Loon (MCF / INI)
                </div>
                <p className="text-[11px] text-[#78746D]">
                  映射 <code className="text-[#CC785C]">dns-server</code> 与 <code className="text-[#CC785C]">doh-server</code>，并将私有域名注入 <code className="text-[#CC785C]">[Host]</code> 列表。
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
