import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Check,
  ChevronDown,
  Copy,
  ExternalLink,
  Layers,
  Server,
  Zap,
  Plus,
  Edit2,
  Trash2,
  QrCode,
  Eye,
  RefreshCw,
  SlidersHorizontal,
  Filter,
  CheckSquare,
  Square,
  X,
  Radio,
  FileCode,
  Tag,
  Search,
} from 'lucide-react';
import QRCode from 'qrcode';
import {
  AppConfig,
  ProxyNode,
  SubscriptionProfile,
  ConfigTemplate,
} from '../types';
import { apiFetch, API_BASE } from '../api';

interface DashboardProps {
  config: AppConfig | null;
  nodes: ProxyNode[];
  onNavigateTab: (tab: 'dashboard' | 'sources' | 'nodes' | 'groups' | 'rules' | 'templates') => void;
  onRefreshConfig: () => Promise<void>;
}

export const Dashboard: React.FC<DashboardProps> = ({
  config,
  nodes,
  onNavigateTab,
  onRefreshConfig,
}) => {
  const profiles = config?.profiles || [];
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Profile Edit Modal state
  const [editingProfile, setEditingProfile] = useState<SubscriptionProfile | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [activeDrawerTab, setActiveDrawerTab] = useState<'basic' | 'nodes' | 'groups' | 'rules'>('basic');
  const [loading, setLoading] = useState(false);

  // QR Modal state
  const [qrModalData, setQrModalData] = useState<{ title: string; url: string } | null>(null);
  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Preview Drawer state
  const [previewData, setPreviewData] = useState<{
    profile: SubscriptionProfile;
    profileName: string;
    clientType: 'singbox' | 'mihomo' | 'loon';
    content: string;
    nodeCount: number;
  } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Dropdown state for format selection
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('.format-dropdown-container')) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Render QR Code onto canvas
  useEffect(() => {
    if (qrModalData && qrCanvasRef.current) {
      QRCode.toCanvas(qrCanvasRef.current, qrModalData.url, {
        width: 220,
        margin: 2,
        color: {
          dark: '#1F1E1D',
          light: '#FFFFFF',
        },
      });
    }
  }, [qrModalData]);

  // Copy helper
  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(key);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getSubUrl = (token: string, target?: string) => {
    const origin = window.location.origin;
    if (!target || target === 'auto') {
      return `${origin}/s/${token}`;
    }
    return `${origin}/s/${token}/${target}`;
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    const defaultProf: SubscriptionProfile = {
      id: '',
      name: '',
      token: '',
      enabled: true,
      description: '',
      nodeFilter: {
        mode: 'all',
        selectedNodeIds: [],
        countryCodes: [],
        sourceIds: [],
        includeKeywords: [],
        excludeKeywords: [],
      },
      selectedGroupIds: (config?.proxyGroups || []).map(g => g.id),
      selectedRuleIds: (config?.rulesList || []).map(r => r.id),
      templates: {},
    };
    setEditingProfile(defaultProf);
    setIsCreating(true);
    setActiveDrawerTab('basic'); // 基本信息与模版排在最前面！
  };

  // Open Edit Modal
  const handleOpenEdit = (prof: SubscriptionProfile) => {
    const cloned: SubscriptionProfile = JSON.parse(JSON.stringify(prof));
    if (!cloned.nodeFilter) {
      cloned.nodeFilter = { mode: 'all', selectedNodeIds: [] };
    }
    if (!Array.isArray(cloned.nodeFilter.selectedNodeIds)) {
      cloned.nodeFilter.selectedNodeIds = [];
    }
    if (!Array.isArray(cloned.selectedGroupIds)) {
      cloned.selectedGroupIds = (config?.proxyGroups || []).map(g => g.id);
    }
    if (!Array.isArray(cloned.selectedRuleIds)) {
      cloned.selectedRuleIds = (config?.rulesList || []).map(r => r.id);
    }
    setEditingProfile(cloned);
    setIsCreating(false);
    setActiveDrawerTab('basic'); // 基本信息与模版排在最前面！
  };

  // Save Profile with apiFetch (auto Bearer token)
  const handleSaveProfile = async () => {
    if (!editingProfile || !editingProfile.name.trim()) {
      alert('请输入订阅名称');
      return;
    }

    setLoading(true);
    try {
      if (isCreating) {
        const res = await apiFetch(`${API_BASE}/profiles`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editingProfile),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message || '创建失败');
      } else {
        const res = await apiFetch(`${API_BASE}/profiles/${editingProfile.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editingProfile),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message || '更新失败');
      }

      await onRefreshConfig();
      setEditingProfile(null);
    } catch (err: any) {
      alert(err.message || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  // Delete Profile
  const handleDeleteProfile = async (id: string, name: string) => {
    if (profiles.length <= 1) {
      alert('请至少保留一个订阅配置');
      return;
    }
    if (!confirm(`确定要删除订阅「${name}」吗？`)) return;

    try {
      const res = await apiFetch(`${API_BASE}/profiles/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || '删除失败');
      await onRefreshConfig();
    } catch (err: any) {
      alert(err.message || '删除失败');
    }
  };

  // Refresh Token
  const handleRefreshToken = async (id: string, name: string) => {
    if (!confirm(`重置订阅「${name}」的 Token 将导致原有订阅链接失效，确定重新生成吗？`)) return;

    try {
      const res = await apiFetch(`${API_BASE}/profiles/${id}/refresh-token`, { method: 'POST' });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || '重置失败');
      await onRefreshConfig();
    } catch (err: any) {
      alert(err.message || '重置失败');
    }
  };

  // Preview Config
  const handlePreviewProfile = async (prof: SubscriptionProfile, clientType: 'singbox' | 'mihomo' | 'loon' = 'singbox') => {
    setPreviewLoading(true);
    setPreviewData({ profile: prof, profileName: prof.name, clientType, content: '正在生成配置...', nodeCount: 0 });

    try {
      const res = await apiFetch(`${API_BASE}/generate/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId: prof.id,
          profile: prof,
          customType: clientType,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPreviewData({
          profile: prof,
          profileName: prof.name,
          clientType,
          content: data.data,
          nodeCount: data.nodeCount || 0,
        });
      } else {
        setPreviewData({
          profile: prof,
          profileName: prof.name,
          clientType,
          content: `生成失败: ${data.message}`,
          nodeCount: 0,
        });
      }
    } catch (err: any) {
      setPreviewData({
        profile: prof,
        profileName: prof.name,
        clientType,
        content: `请求失败: ${err.message || err}`,
        nodeCount: 0,
      });
    } finally {
      setPreviewLoading(false);
    }
  };

  // Country counts in all nodes
  const availableCountries = useMemo(() => {
    const map = new Map<string, { code: string; name: string; emoji: string; count: number }>();
    nodes.forEach(n => {
      if (n.countryCode) {
        const code = n.countryCode.toUpperCase();
        const cur = map.get(code) || { code, name: code, emoji: n.countryEmoji || '🌐', count: 0 };
        cur.count++;
        map.set(code, cur);
      }
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [nodes]);

  // Node count calculator for single profile
  const getProfileNodeCount = (prof: SubscriptionProfile): number => {
    const filter = prof.nodeFilter || { mode: 'all' };
    if (filter.mode === 'manual') {
      return (filter.selectedNodeIds || []).length;
    }

    let list = nodes;
    if (filter.sourceIds && filter.sourceIds.length > 0) {
      const set = new Set(filter.sourceIds);
      list = list.filter(n => set.has(n.sourceId || 'custom'));
    }
    if (filter.countryCodes && filter.countryCodes.length > 0) {
      const set = new Set(filter.countryCodes.map(c => c.toUpperCase()));
      list = list.filter(n => n.countryCode && set.has(n.countryCode.toUpperCase()));
    }
    if (filter.includeKeywords && filter.includeKeywords.length > 0) {
      list = list.filter(n => filter.includeKeywords!.some(kw => n.name.toLowerCase().includes(kw.toLowerCase())));
    }
    if (filter.excludeKeywords && filter.excludeKeywords.length > 0) {
      list = list.filter(n => !filter.excludeKeywords!.some(kw => n.name.toLowerCase().includes(kw.toLowerCase())));
    }
    if (filter.selectedNodeIds && filter.selectedNodeIds.length > 0) {
      const selSet = new Set(filter.selectedNodeIds);
      list = list.filter(n => selSet.has(n.id));
    }
    return list.length;
  };

  const customNodesCount = config?.sources.find(s => s.type === 'custom')?.nodes?.length || 0;
  const networkSources = config?.sources.filter(s => s.type !== 'custom') || [];
  const proxyGroupsCount = config?.proxyGroups.length || 0;
  const rulesCount = config?.rulesList.length || 0;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pt-2 pb-16">
      {/* 1. 顶部小巧概览指标横条 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div
          onClick={() => onNavigateTab('sources')}
          className="p-3.5 rounded-xl bg-white border border-[#E3DDD2] hover:border-[#CC785C]/50 transition-all cursor-pointer shadow-2xs group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#8C877D] font-medium">订阅源</span>
            <Layers className="w-3.5 h-3.5 text-[#8C877D] group-hover:text-[#CC785C]" />
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-lg font-bold font-mono text-[#1F1E1D]">
              {networkSources.length + (customNodesCount > 0 ? 1 : 0)}
            </span>
            <span className="text-[11px] text-[#8C877D]">个源</span>
          </div>
        </div>

        <div
          onClick={() => onNavigateTab('nodes')}
          className="p-3.5 rounded-xl bg-white border border-[#E3DDD2] hover:border-[#CC785C]/50 transition-all cursor-pointer shadow-2xs group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#8C877D] font-medium">节点池</span>
            <Server className="w-3.5 h-3.5 text-[#8C877D] group-hover:text-[#CC785C]" />
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-lg font-bold font-mono text-[#1F1E1D]">{nodes.length}</span>
            <span className="text-[11px] text-[#8C877D]">个节点</span>
          </div>
        </div>

        <div
          onClick={() => onNavigateTab('groups')}
          className="p-3.5 rounded-xl bg-white border border-[#E3DDD2] hover:border-[#CC785C]/50 transition-all cursor-pointer shadow-2xs group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#8C877D] font-medium">策略组</span>
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#8C877D] group-hover:text-[#CC785C]" />
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-lg font-bold font-mono text-[#1F1E1D]">{proxyGroupsCount}</span>
            <span className="text-[11px] text-[#8C877D]">个策略组</span>
          </div>
        </div>

        <div
          onClick={() => onNavigateTab('rules')}
          className="p-3.5 rounded-xl bg-white border border-[#E3DDD2] hover:border-[#CC785C]/50 transition-all cursor-pointer shadow-2xs group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#8C877D] font-medium">分流规则</span>
            <Filter className="w-3.5 h-3.5 text-[#8C877D] group-hover:text-[#CC785C]" />
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-lg font-bold font-mono text-[#1F1E1D]">{rulesCount}</span>
            <span className="text-[11px] text-[#8C877D]">条规则</span>
          </div>
        </div>
      </div>

      {/* 2. 核心主体：我的订阅列表 (一条条优雅的横向长卡片) */}
      <div className="space-y-3.5">
        {/* 标题栏与新增按钮 */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-[#1F1E1D]">订阅配置 (Profiles)</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#EFEAE2] text-[#69655E] font-medium">
              共 {profiles.length} 个订阅
            </span>
          </div>

          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#CC785C] hover:bg-[#B8684E] text-white text-xs font-semibold rounded-xl transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>新增订阅</span>
          </button>
        </div>

        {/* 长卡片列表 */}
        <div className="space-y-3">
          {profiles.map(prof => {
            const count = getProfileNodeCount(prof);
            const autoUrl = getSubUrl(prof.token, 'auto');
            const mihomoUrl = getSubUrl(prof.token, 'mihomo');
            const singboxUrl = getSubUrl(prof.token, 'singbox');
            const loonUrl = getSubUrl(prof.token, 'loon');
            const groupCount = (prof.selectedGroupIds && prof.selectedGroupIds.length > 0)
              ? prof.selectedGroupIds.length
              : proxyGroupsCount;
            const ruleCount = (prof.selectedRuleIds && prof.selectedRuleIds.length > 0)
              ? prof.selectedRuleIds.length
              : rulesCount;

            return (
              <div
                key={prof.id}
                className={`rounded-2xl border transition-all duration-200 bg-white p-4 sm:p-5 shadow-xs flex flex-col gap-3.5 ${
                  prof.enabled
                    ? 'border-[#E3DDD2] hover:border-[#CC785C]/60 hover:shadow-sm'
                    : 'border-[#ECE7DE] opacity-75 bg-[#FAF8F5]'
                }`}
              >
                {/* 顶部行：名称、标签、统计徽章、操作按钮 */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="text-sm font-bold text-[#1F1E1D]">{prof.name}</span>
                    {!prof.enabled && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-[#EFEAE2] text-[#8C877D]">
                        已停用
                      </span>
                    )}
                    {prof.description && (
                      <span className="text-xs text-[#8C877D] hidden md:inline border-l border-[#E8E4DC] pl-2.5">
                        {prof.description}
                      </span>
                    )}
                  </div>

                  {/* 右侧工具栏 */}
                  <div className="flex items-center gap-1.5 self-end sm:self-auto">
                    <button
                      onClick={() => handlePreviewProfile(prof)}
                      className="p-1.5 text-[#69655E] hover:text-[#1F1E1D] hover:bg-[#FAF8F5] rounded-lg transition-colors cursor-pointer"
                      title="预览输出配置"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setQrModalData({ title: prof.name, url: autoUrl })}
                      className="p-1.5 text-[#69655E] hover:text-[#1F1E1D] hover:bg-[#FAF8F5] rounded-lg transition-colors cursor-pointer"
                      title="扫码导入"
                    >
                      <QrCode className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleOpenEdit(prof)}
                      className="p-1.5 text-[#69655E] hover:text-[#1F1E1D] hover:bg-[#FAF8F5] rounded-lg transition-colors cursor-pointer"
                      title="编辑订阅配置"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleRefreshToken(prof.id, prof.name)}
                      className="p-1.5 text-[#8C877D] hover:text-[#CC785C] hover:bg-[#FAF8F5] rounded-lg transition-colors cursor-pointer"
                      title="重新生成独立 Token"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteProfile(prof.id, prof.name)}
                      className="p-1.5 text-[#8C877D] hover:text-[#A8483B] hover:bg-[#FDF2F0] rounded-lg transition-colors cursor-pointer"
                      title="删除此订阅"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* 中间行：指标特性 */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.8 rounded-lg bg-[#FAF8F5] border border-[#ECE7DE] text-[#3D3A37] font-medium">
                    <Radio className="w-3 h-3 text-[#CC785C]" />
                    <span>{count} 节点</span>
                    {prof.nodeFilter?.selectedNodeIds && prof.nodeFilter.selectedNodeIds.length > 0 && (
                      <span className="text-[10px] text-[#8C877D]">(已勾选)</span>
                    )}
                  </span>

                  <span className="inline-flex items-center gap-1 px-2.5 py-0.8 rounded-lg bg-[#FAF8F5] border border-[#ECE7DE] text-[#3D3A37] font-medium">
                    <SlidersHorizontal className="w-3 h-3 text-[#5A7A6F]" />
                    <span>{groupCount} 策略组</span>
                  </span>

                  <span className="inline-flex items-center gap-1 px-2.5 py-0.8 rounded-lg bg-[#FAF8F5] border border-[#ECE7DE] text-[#3D3A37] font-medium">
                    <Filter className="w-3 h-3 text-[#8A7558]" />
                    <span>{ruleCount} 条分流</span>
                  </span>

                  {prof.templates?.mihomo && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#FAF8F5] text-[11px] text-[#69655E]">
                      Mihomo定制模版
                    </span>
                  )}
                  {prof.templates?.singbox && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#FAF8F5] text-[11px] text-[#69655E]">
                      Singbox定制模版
                    </span>
                  )}
                </div>

                {/* 底部行：订阅链接与下拉组合复制 */}
                <div className="pt-2 border-t border-[#ECE7DE]/80 flex items-center justify-between gap-3">
                  <div className="flex-1 flex items-center gap-2 min-w-0">
                    <input
                      type="text"
                      readOnly
                      value={autoUrl}
                      className="flex-1 min-w-0 bg-[#FAF8F5] px-3.5 py-1.5 rounded-xl border border-[#E3DDD2] text-xs font-mono text-[#2D2B28] select-all focus:outline-none"
                    />

                    {/* 组合下拉复制按钮 */}
                    <div className="relative inline-flex items-center rounded-xl bg-[#FAF0EC] border border-[#CC785C]/30 text-[#CC785C] shrink-0 format-dropdown-container">
                      <button
                        onClick={() => handleCopy(autoUrl, `auto-${prof.id}`)}
                        className="px-3 py-1.5 hover:bg-[#CC785C] hover:text-white rounded-l-xl text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer"
                        title="复制通用订阅链接（客户端自动识别，无UA时默认Sing-box）"
                      >
                        {copiedId === `auto-${prof.id}` ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedId === `auto-${prof.id}` ? '已复制' : '复制通用链接'}</span>
                      </button>

                      <div className="w-[1px] h-4 bg-[#CC785C]/30" />

                      <button
                        onClick={() => setOpenDropdownId(openDropdownId === prof.id ? null : prof.id)}
                        className="px-1.5 py-1.5 hover:bg-[#CC785C] hover:text-white rounded-r-xl transition-colors cursor-pointer"
                        title="指定客户端链接"
                      >
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-150 ${openDropdownId === prof.id ? 'rotate-180' : ''}`} />
                      </button>

                      {/* 气泡下拉菜单 */}
                      {openDropdownId === prof.id && (
                        <div className="absolute right-0 bottom-full mb-1.5 w-44 bg-white rounded-xl shadow-lg border border-[#E3DDD2] py-1 z-30 text-xs">
                          <div className="px-3 py-1 text-[10px] font-bold text-[#8C877D] border-b border-[#ECE7DE]">
                            指定客户端专用链接
                          </div>
                          <button
                            onClick={() => {
                              handleCopy(singboxUrl, `singbox-${prof.id}`);
                              setOpenDropdownId(null);
                            }}
                            className="w-full text-left px-3 py-1.5 hover:bg-[#FAF8F5] text-[#1F1E1D] flex items-center justify-between cursor-pointer"
                          >
                            <span>Sing-box (JSON)</span>
                            {copiedId === `singbox-${prof.id}` && <Check className="w-3 h-3 text-[#5A7A6F]" />}
                          </button>
                          <button
                            onClick={() => {
                              handleCopy(mihomoUrl, `mihomo-${prof.id}`);
                              setOpenDropdownId(null);
                            }}
                            className="w-full text-left px-3 py-1.5 hover:bg-[#FAF8F5] text-[#1F1E1D] flex items-center justify-between cursor-pointer"
                          >
                            <span>Mihomo (YAML)</span>
                            {copiedId === `mihomo-${prof.id}` && <Check className="w-3 h-3 text-[#5A7A6F]" />}
                          </button>
                          <button
                            onClick={() => {
                              handleCopy(loonUrl, `loon-${prof.id}`);
                              setOpenDropdownId(null);
                            }}
                            className="w-full text-left px-3 py-1.5 hover:bg-[#FAF8F5] text-[#1F1E1D] flex items-center justify-between cursor-pointer"
                          >
                            <span>Loon (Conf)</span>
                            {copiedId === `loon-${prof.id}` && <Check className="w-3 h-3 text-[#5A7A6F]" />}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ================= EDIT / CREATE MODAL ================= */}
      {editingProfile && (
        <ProfileEditModal
          profile={editingProfile}
          isCreating={isCreating}
          config={config}
          nodes={nodes}
          availableCountries={availableCountries}
          activeTab={activeDrawerTab}
          setActiveTab={setActiveDrawerTab}
          onClose={() => setEditingProfile(null)}
          onSave={handleSaveProfile}
          onChangeProfile={setEditingProfile}
          loading={loading}
        />
      )}

      {/* ================= QR CODE MODAL ================= */}
      {qrModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-[#E3DDD2] p-6 max-w-sm w-full shadow-xl space-y-4 text-center">
            <div className="flex items-center justify-between border-b border-[#ECE7DE] pb-3">
              <h3 className="text-sm font-bold text-[#1F1E1D]">扫码导入：{qrModalData.title}</h3>
              <button
                onClick={() => setQrModalData(null)}
                className="text-[#8C877D] hover:text-[#1F1E1D] p-1 rounded-lg hover:bg-[#FAF8F5] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex justify-center p-3 bg-[#FAF8F5] rounded-xl border border-[#ECE7DE]">
              <canvas ref={qrCanvasRef} />
            </div>

            <p className="text-xs text-[#8C877D]">
              支持 Shadowrocket、Loon、Sing-box、Clash 等客户端相机直接扫码导入
            </p>

            <button
              onClick={() => handleCopy(qrModalData.url, 'qr-url')}
              className="w-full py-2 bg-[#FAF8F5] hover:bg-[#EFEAE2] border border-[#E8E4DC] text-xs font-semibold text-[#1F1E1D] rounded-xl transition-colors cursor-pointer"
            >
              {copiedId === 'qr-url' ? '已复制链接' : '复制订阅链接'}
            </button>
          </div>
        </div>
      )}

      {/* ================= PREVIEW DRAWER ================= */}
      {previewData && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs">
          <div className="bg-white w-full max-w-3xl h-full shadow-2xl flex flex-col border-l border-[#E3DDD2]">
            <div className="p-4 sm:p-5 border-b border-[#E3DDD2] flex items-center justify-between bg-[#FAF8F5]">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#FAF0EC] flex items-center justify-center text-[#CC785C]">
                  <FileCode className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#1F1E1D]">
                    配置预览：{previewData.profileName}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[11px] text-[#8C877D]">切换渲染客户端:</span>
                    <div className="inline-flex rounded-lg border border-[#E3DDD2] p-0.5 bg-white text-xs">
                      {(['singbox', 'mihomo', 'loon'] as const).map(type => (
                        <button
                          key={type}
                          onClick={() => handlePreviewProfile(previewData.profile, type)}
                          className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                            previewData.clientType === type
                              ? 'bg-[#CC785C] text-white font-semibold'
                              : 'text-[#69655E] hover:text-[#1F1E1D]'
                          }`}
                        >
                          {type === 'singbox' ? 'Sing-box' : type === 'mihomo' ? 'Mihomo' : 'Loon'}
                        </button>
                      ))}
                    </div>
                    {previewData.nodeCount > 0 && (
                      <span className="text-[11px] text-[#8C877D]">
                        • {previewData.nodeCount} 个节点
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopy(previewData.content, 'preview-content')}
                  className="px-3 py-1.5 bg-white border border-[#E3DDD2] hover:border-[#CC785C]/50 text-xs font-semibold text-[#1F1E1D] rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  {copiedId === 'preview-content' ? <Check className="w-3.5 h-3.5 text-[#5A7A6F]" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedId === 'preview-content' ? '已复制' : '复制配置'}
                </button>
                <button
                  onClick={() => setPreviewData(null)}
                  className="p-1.5 text-[#8C877D] hover:text-[#1F1E1D] hover:bg-[#EFEAE2] rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-4 bg-[#1E1E1E] text-[#D4D4D4] font-mono text-xs leading-relaxed">
              {previewLoading ? (
                <div className="h-full flex items-center justify-center text-[#8C877D]">
                  <RefreshCw className="w-5 h-5 animate-spin mr-2" />
                  正在生成真实配置文件...
                </div>
              ) : (
                <pre className="whitespace-pre overflow-x-auto">{previewData.content}</pre>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ================= EDIT MODAL (Tab 1 is Basic & Templates first!) ================= //

interface ProfileEditModalProps {
  profile: SubscriptionProfile;
  isCreating: boolean;
  config: AppConfig | null;
  nodes: ProxyNode[];
  availableCountries: { code: string; name: string; emoji: string; count: number }[];
  activeTab: 'basic' | 'nodes' | 'groups' | 'rules';
  setActiveTab: (tab: 'basic' | 'nodes' | 'groups' | 'rules') => void;
  onClose: () => void;
  onSave: () => void;
  onChangeProfile: React.Dispatch<React.SetStateAction<SubscriptionProfile | null>>;
  loading: boolean;
}

const ProfileEditModal: React.FC<ProfileEditModalProps> = ({
  profile,
  isCreating,
  config,
  nodes,
  availableCountries,
  activeTab,
  setActiveTab,
  onClose,
  onSave,
  onChangeProfile,
  loading,
}) => {
  const [nodeSearchText, setNodeSearchText] = useState('');
  const [filterCountry, setFilterCountry] = useState<string>('ALL');
  const [filterSource, setFilterSource] = useState<string>('ALL');

  const filter = profile.nodeFilter || { mode: 'all', selectedNodeIds: [] };
  const selectedNodeSet = useMemo(() => new Set(filter.selectedNodeIds || []), [filter.selectedNodeIds]);

  // Candidates based on search & country
  const candidateNodes = useMemo(() => {
    return nodes.filter(n => {
      if (filterSource !== 'ALL' && (n.sourceId || 'custom') !== filterSource) {
        return false;
      }
      if (filterCountry !== 'ALL' && (n.countryCode || '').toUpperCase() !== filterCountry) {
        return false;
      }
      if (nodeSearchText.trim()) {
        const query = nodeSearchText.toLowerCase();
        return n.name.toLowerCase().includes(query) || (n.server || '').toLowerCase().includes(query);
      }
      return true;
    });
  }, [nodes, filterSource, filterCountry, nodeSearchText]);

  const toggleNodeSelection = (nodeId: string) => {
    const nextSet = new Set(selectedNodeSet);
    if (nextSet.has(nodeId)) {
      nextSet.delete(nodeId);
    } else {
      nextSet.add(nodeId);
    }
    onChangeProfile(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        nodeFilter: {
          ...prev.nodeFilter,
          selectedNodeIds: Array.from(nextSet),
        },
      };
    });
  };

  const handleSelectAllCandidates = () => {
    const nextSet = new Set(selectedNodeSet);
    candidateNodes.forEach(n => nextSet.add(n.id));
    onChangeProfile(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        nodeFilter: {
          ...prev.nodeFilter,
          selectedNodeIds: Array.from(nextSet),
        },
      };
    });
  };

  const handleDeselectAllCandidates = () => {
    const nextSet = new Set(selectedNodeSet);
    candidateNodes.forEach(n => nextSet.delete(n.id));
    onChangeProfile(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        nodeFilter: {
          ...prev.nodeFilter,
          selectedNodeIds: Array.from(nextSet),
        },
      };
    });
  };

  const handleInvertCandidates = () => {
    const nextSet = new Set(selectedNodeSet);
    candidateNodes.forEach(n => {
      if (nextSet.has(n.id)) {
        nextSet.delete(n.id);
      } else {
        nextSet.add(n.id);
      }
    });
    onChangeProfile(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        nodeFilter: {
          ...prev.nodeFilter,
          selectedNodeIds: Array.from(nextSet),
        },
      };
    });
  };

  const handleClearAllSelected = () => {
    onChangeProfile(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        nodeFilter: {
          ...prev.nodeFilter,
          selectedNodeIds: [],
        },
      };
    });
  };

  // Groups Toggle
  const selectedGroupSet = useMemo(() => new Set(profile.selectedGroupIds || []), [profile.selectedGroupIds]);
  const toggleGroupSelection = (groupId: string) => {
    const nextSet = new Set(selectedGroupSet);
    if (nextSet.has(groupId)) {
      nextSet.delete(groupId);
    } else {
      nextSet.add(groupId);
    }
    onChangeProfile(prev => prev ? { ...prev, selectedGroupIds: Array.from(nextSet) } : prev);
  };

  const handleSelectAllGroups = () => {
    onChangeProfile(prev => prev ? { ...prev, selectedGroupIds: (config?.proxyGroups || []).map(g => g.id) } : prev);
  };

  const handleClearGroups = () => {
    onChangeProfile(prev => prev ? { ...prev, selectedGroupIds: [] } : prev);
  };

  // Rules Toggle
  const selectedRuleSet = useMemo(() => new Set(profile.selectedRuleIds || []), [profile.selectedRuleIds]);
  const toggleRuleSelection = (ruleId: string) => {
    const nextSet = new Set(selectedRuleSet);
    if (nextSet.has(ruleId)) {
      nextSet.delete(ruleId);
    } else {
      nextSet.add(ruleId);
    }
    onChangeProfile(prev => prev ? { ...prev, selectedRuleIds: Array.from(nextSet) } : prev);
  };

  const handleSelectAllRules = () => {
    onChangeProfile(prev => prev ? { ...prev, selectedRuleIds: (config?.rulesList || []).map(r => r.id) } : prev);
  };

  const handleClearRules = () => {
    onChangeProfile(prev => prev ? { ...prev, selectedRuleIds: [] } : prev);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-3 sm:p-6 overflow-hidden">
      <div className="bg-white w-full max-w-4xl h-[90vh] rounded-2xl border border-[#E3DDD2] shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#E8E4DC] flex items-center justify-between bg-[#FAF8F5] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#FAF0EC] flex items-center justify-center text-[#CC785C]">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#1F1E1D]">
                {isCreating ? '新建订阅 (Profile)' : `编辑订阅：${profile.name}`}
              </h2>
              <p className="text-xs text-[#8C877D]">
                先设定订阅名称与专属模版，再自由挑选节点、策略组和分流规则
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-[#8C877D] hover:text-[#1F1E1D] hover:bg-[#EFEAE2] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation: Basic first! */}
        <div className="px-6 border-b border-[#E8E4DC] flex items-center gap-2 bg-[#FAF8F5]/50 shrink-0">
          <button
            onClick={() => setActiveTab('basic')}
            className={`px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'basic'
                ? 'border-[#CC785C] text-[#CC785C]'
                : 'border-transparent text-[#69655E] hover:text-[#1F1E1D]'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            1. 基本信息与模版
          </button>
          <button
            onClick={() => setActiveTab('nodes')}
            className={`px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'nodes'
                ? 'border-[#CC785C] text-[#CC785C]'
                : 'border-transparent text-[#69655E] hover:text-[#1F1E1D]'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            2. 节点挑选 ({filter.selectedNodeIds?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('groups')}
            className={`px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'groups'
                ? 'border-[#CC785C] text-[#CC785C]'
                : 'border-transparent text-[#69655E] hover:text-[#1F1E1D]'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            3. 策略组挑选 ({profile.selectedGroupIds?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('rules')}
            className={`px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'rules'
                ? 'border-[#CC785C] text-[#CC785C]'
                : 'border-transparent text-[#69655E] hover:text-[#1F1E1D]'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            4. 分流规则挑选 ({profile.selectedRuleIds?.length || 0})
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* ================= TAB 1: BASIC & TEMPLATES (FIRST!) ================= */}
          {activeTab === 'basic' && (
            <div className="space-y-5 max-w-xl">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#1F1E1D]">订阅名称 *</label>
                <input
                  type="text"
                  placeholder="例如: 手机-轻量订阅 / 家庭TV专线"
                  value={profile.name}
                  onChange={e => onChangeProfile(prev => prev ? { ...prev, name: e.target.value } : prev)}
                  className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#E3DDD2] rounded-xl text-xs text-[#1F1E1D] focus:outline-none focus:border-[#CC785C]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#1F1E1D]">描述说明</label>
                <input
                  type="text"
                  placeholder="说明此订阅的适用设备或使用场景"
                  value={profile.description || ''}
                  onChange={e => onChangeProfile(prev => prev ? { ...prev, description: e.target.value } : prev)}
                  className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#E3DDD2] rounded-xl text-xs text-[#1F1E1D] focus:outline-none focus:border-[#CC785C]"
                />
              </div>

              {/* 专属模版选择 */}
              <div className="pt-3 border-t border-[#ECE7DE] space-y-3.5">
                <div>
                  <h4 className="text-xs font-bold text-[#1F1E1D]">专属模版绑定 (DNS在模版中直接配置)</h4>
                  <p className="text-[11px] text-[#8C877D]">
                    不同客户端渲染时将调用对应的模版骨架。DNS 等核心策略直接写在模版里即可。
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-[#69655E] font-medium">Mihomo / Clash 模版</label>
                  <select
                    value={profile.templates?.mihomo || ''}
                    onChange={e => onChangeProfile(prev => prev ? {
                      ...prev,
                      templates: { ...(prev.templates || {}), mihomo: e.target.value || undefined }
                    } : prev)}
                    className="w-full px-3.5 py-2 bg-[#FAF8F5] border border-[#E3DDD2] rounded-xl text-xs text-[#1F1E1D]"
                  >
                    <option value="">跟随系统默认模版</option>
                    {(config?.templates || []).filter(t => t.type === 'mihomo').map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name} {t.isDefault ? '(系统默认)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-[#69655E] font-medium">Sing-box 模版</label>
                  <select
                    value={profile.templates?.singbox || ''}
                    onChange={e => onChangeProfile(prev => prev ? {
                      ...prev,
                      templates: { ...(prev.templates || {}), singbox: e.target.value || undefined }
                    } : prev)}
                    className="w-full px-3.5 py-2 bg-[#FAF8F5] border border-[#E3DDD2] rounded-xl text-xs text-[#1F1E1D]"
                  >
                    <option value="">跟随系统默认模版</option>
                    {(config?.templates || []).filter(t => t.type === 'singbox').map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name} {t.isDefault ? '(系统默认)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-[#69655E] font-medium">Loon 模版</label>
                  <select
                    value={profile.templates?.loon || ''}
                    onChange={e => onChangeProfile(prev => prev ? {
                      ...prev,
                      templates: { ...(prev.templates || {}), loon: e.target.value || undefined }
                    } : prev)}
                    className="w-full px-3.5 py-2 bg-[#FAF8F5] border border-[#E3DDD2] rounded-xl text-xs text-[#1F1E1D]"
                  >
                    <option value="">跟随系统默认模版</option>
                    {(config?.templates || []).filter(t => t.type === 'loon').map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name} {t.isDefault ? '(系统默认)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 2: NODES SELECTION ================= */}
          {activeTab === 'nodes' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E8E4DC]">
                <div className="text-xs text-[#3D3A37]">
                  <span className="font-bold">节点精选模式：</span>
                  通过国家、订阅源或搜索初筛，然后在下方节点列表中按需勾选。
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-[#8C877D]">
                    已勾选 <span className="font-bold text-[#CC785C]">{filter.selectedNodeIds?.length || 0}</span> / 节点池共 {nodes.length} 个
                  </span>
                </div>
              </div>

              {/* 初筛工具栏 */}
              <div className="p-3.5 rounded-xl bg-white border border-[#E3DDD2] space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#8C877D] font-medium shrink-0">来源:</span>
                    <select
                      value={filterSource}
                      onChange={e => setFilterSource(e.target.value)}
                      className="px-2.5 py-1.5 bg-[#FAF8F5] border border-[#E3DDD2] rounded-lg text-xs font-medium text-[#1F1E1D] focus:outline-none focus:border-[#CC785C] cursor-pointer"
                    >
                      <option value="ALL">全部订阅源</option>
                      {(config?.sources || []).map(s => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.nodes?.length || 0})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex-1 min-w-[200px] relative">
                    <Search className="w-3.5 h-3.5 text-[#8C877D] absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="搜索节点名称、服务器地址..."
                      value={nodeSearchText}
                      onChange={e => setNodeSearchText(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-[#FAF8F5] border border-[#E3DDD2] rounded-lg text-xs text-[#1F1E1D] focus:outline-none focus:border-[#CC785C]"
                    />
                  </div>
                </div>

                {/* 国家快速选择胶囊条 */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-[#ECE7DE]">
                  <span className="text-xs text-[#8C877D] font-medium mr-1">国家/地区:</span>
                  <button
                    onClick={() => setFilterCountry('ALL')}
                    className={`px-2 py-0.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                      filterCountry === 'ALL'
                        ? 'bg-[#CC785C] text-white'
                        : 'bg-[#FAF8F5] text-[#69655E] hover:bg-[#EFEAE2]'
                    }`}
                  >
                    全部 ({nodes.length})
                  </button>
                  {availableCountries.map(c => (
                    <button
                      key={c.code}
                      onClick={() => setFilterCountry(filterCountry === c.code ? 'ALL' : c.code)}
                      className={`px-2 py-0.5 rounded-md text-xs font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                        filterCountry === c.code
                          ? 'bg-[#CC785C] text-white'
                          : 'bg-[#FAF8F5] text-[#69655E] hover:bg-[#EFEAE2]'
                      }`}
                    >
                      <span>{c.emoji}</span>
                      <span>{c.code}</span>
                      <span className="text-[10px] opacity-75">({c.count})</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 批量操作工具条 */}
              <div className="flex items-center justify-between px-1">
                <div className="text-xs text-[#69655E]">
                  当前初筛匹配: <span className="font-semibold text-[#1F1E1D]">{candidateNodes.length}</span> 个节点
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleSelectAllCandidates}
                    className="px-2.5 py-1 text-xs font-medium rounded-lg bg-[#FAF8F5] hover:bg-[#EFEAE2] border border-[#E3DDD2] text-[#1F1E1D] transition-colors cursor-pointer"
                  >
                    勾选当前初筛
                  </button>
                  <button
                    type="button"
                    onClick={handleDeselectAllCandidates}
                    className="px-2.5 py-1 text-xs font-medium rounded-lg bg-[#FAF8F5] hover:bg-[#EFEAE2] border border-[#E3DDD2] text-[#1F1E1D] transition-colors cursor-pointer"
                  >
                    取消当前初筛
                  </button>
                  <button
                    type="button"
                    onClick={handleInvertCandidates}
                    className="px-2.5 py-1 text-xs font-medium rounded-lg bg-[#FAF8F5] hover:bg-[#EFEAE2] border border-[#E3DDD2] text-[#1F1E1D] transition-colors cursor-pointer"
                  >
                    反选
                  </button>
                  <button
                    type="button"
                    onClick={handleClearAllSelected}
                    className="px-2.5 py-1 text-xs font-medium rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 transition-colors cursor-pointer ml-1"
                  >
                    清空已勾选
                  </button>
                </div>
              </div>

              {/* 节点网格展示区 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pr-1">
                {candidateNodes.map(node => {
                  const isChecked = selectedNodeSet.has(node.id);
                  return (
                    <div
                      key={node.id}
                      onClick={() => toggleNodeSelection(node.id)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2.5 select-none ${
                        isChecked
                          ? 'border-[#CC785C] bg-[#FAF0EC]/60 shadow-2xs'
                          : 'border-[#ECE7DE] bg-white hover:border-[#CC785C]/40 hover:bg-[#FAF8F5]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="shrink-0 text-[#CC785C]">
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 fill-[#FAF0EC]" />
                          ) : (
                            <Square className="w-4 h-4 text-[#C4BEB3]" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm shrink-0">{node.countryEmoji || '🌐'}</span>
                            <span className="text-xs font-medium text-[#1F1E1D] truncate">
                              {node.name}
                            </span>
                          </div>
                          <div className="text-[10px] text-[#8C877D] truncate mt-0.5">
                            {node.sourceName || '独立节点'} • {node.server}:{node.port}
                          </div>
                        </div>
                      </div>

                      <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-[#FAF8F5] border border-[#ECE7DE] text-[#69655E] shrink-0">
                        {node.type}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ================= TAB 3: PROXY GROUPS ================= */}
          {activeTab === 'groups' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E8E4DC]">
                <div className="text-xs text-[#3D3A37]">
                  <span className="font-bold">策略组挑选：</span>
                  勾选此订阅要启用的策略组。如果留空或全部勾选，将默认输出所有全局策略组。
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleSelectAllGroups}
                    className="px-2.5 py-1 text-xs font-medium rounded-lg bg-white hover:bg-[#EFEAE2] border border-[#E3DDD2] text-[#1F1E1D] cursor-pointer"
                  >
                    全选
                  </button>
                  <button
                    type="button"
                    onClick={handleClearGroups}
                    className="px-2.5 py-1 text-xs font-medium rounded-lg bg-white hover:bg-[#EFEAE2] border border-[#E3DDD2] text-[#1F1E1D] cursor-pointer"
                  >
                    清空
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pr-1">
                {(config?.proxyGroups || []).map(group => {
                  const isChecked = selectedGroupSet.has(group.id);
                  return (
                    <div
                      key={group.id}
                      onClick={() => toggleGroupSelection(group.id)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2.5 select-none ${
                        isChecked
                          ? 'border-[#CC785C] bg-[#FAF0EC]/60 shadow-2xs'
                          : 'border-[#ECE7DE] bg-white hover:border-[#CC785C]/40 hover:bg-[#FAF8F5]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="shrink-0 text-[#CC785C]">
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 fill-[#FAF0EC]" />
                          ) : (
                            <Square className="w-4 h-4 text-[#C4BEB3]" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-[#1F1E1D] truncate">
                            {group.name}
                          </div>
                          <div className="text-[10px] text-[#8C877D] mt-0.5">
                            类型: {group.type} {group.filter && `• 匹配: ${group.filter}`}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ================= TAB 4: ROUTING RULES ================= */}
          {activeTab === 'rules' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E8E4DC]">
                <div className="text-xs text-[#3D3A37]">
                  <span className="font-bold">分流规则挑选：</span>
                  勾选此订阅要启用的分流规则。
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleSelectAllRules}
                    className="px-2.5 py-1 text-xs font-medium rounded-lg bg-white hover:bg-[#EFEAE2] border border-[#E3DDD2] text-[#1F1E1D] cursor-pointer"
                  >
                    全选
                  </button>
                  <button
                    type="button"
                    onClick={handleClearRules}
                    className="px-2.5 py-1 text-xs font-medium rounded-lg bg-white hover:bg-[#EFEAE2] border border-[#E3DDD2] text-[#1F1E1D] cursor-pointer"
                  >
                    清空
                  </button>
                </div>
              </div>

              {/* 容错说明卡片 */}
              <div className="p-3 rounded-xl bg-[#FAF0EC]/70 border border-[#CC785C]/30 text-xs text-[#3D3A37] flex items-center gap-2">
                <span className="text-[#CC785C] font-bold">💡 智能容错保护：</span>
                <span>
                  若某些分流规则指向的策略组（如 YouTube/Google）在本订阅中未勾选，系统生成配置时会自动回退到默认节点选择组，确保客户端永远不会因找不到策略组而报错。
                </span>
              </div>

              <div className="space-y-2 pr-1">
                {(config?.rulesList || []).map(rule => {
                  const isChecked = selectedRuleSet.has(rule.id);
                  const isBuiltinTarget = rule.outbound.toUpperCase() === 'REJECT' || rule.outbound.toUpperCase() === 'DIRECT' || rule.outbound === '🎯 本地直连';
                  const isTargetGroupEnabled = isBuiltinTarget || selectedGroupSet.size === 0 || selectedGroupSet.has(`grp-${rule.outbound}`) || (config?.proxyGroups || []).some(g => g.name === rule.outbound && selectedGroupSet.has(g.id));

                  return (
                    <div
                      key={rule.id}
                      onClick={() => toggleRuleSelection(rule.id)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 select-none ${
                        isChecked
                          ? 'border-[#CC785C] bg-[#FAF0EC]/60 shadow-2xs'
                          : 'border-[#ECE7DE] bg-white hover:border-[#CC785C]/40 hover:bg-[#FAF8F5]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="shrink-0 text-[#CC785C]">
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 fill-[#FAF0EC]" />
                          ) : (
                            <Square className="w-4 h-4 text-[#C4BEB3]" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-[#1F1E1D] truncate">
                              {rule.name}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#EFEAE2] text-[#69655E]">
                              {rule.type}
                            </span>
                          </div>
                          <div className="text-[10px] text-[#8C877D] truncate mt-0.5 flex items-center gap-1.5">
                            <span>指向: <span className="font-semibold text-[#CC785C]">{rule.outbound}</span></span>
                            <span>• {rule.payload}</span>
                            {!isTargetGroupEnabled && (
                              <span className="text-[10px] text-amber-600 font-medium">
                                (目标组未选，将自动回退)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-[#E8E4DC] flex items-center justify-between bg-[#FAF8F5] shrink-0">
          <div className="text-xs text-[#8C877D]">
            已选 {filter.selectedNodeIds?.length || 0} 个节点 • {profile.selectedGroupIds?.length || 0} 个策略组 • {profile.selectedRuleIds?.length || 0} 条规则
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-[#E3DDD2] hover:bg-[#EFEAE2] text-[#69655E] transition-colors cursor-pointer"
            >
              取消
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={onSave}
              className="px-5 py-2 text-xs font-semibold rounded-xl bg-[#CC785C] hover:bg-[#B8684E] text-white transition-all shadow-sm cursor-pointer disabled:opacity-50"
            >
              {loading ? '正在保存...' : isCreating ? '创建订阅' : '保存修改'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
