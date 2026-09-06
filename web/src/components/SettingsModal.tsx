import React, { useState } from 'react';
import { KeyRound, Lock, Save, X, RefreshCw, Check, ShieldAlert } from 'lucide-react';
import { AppConfig } from '../types';

interface SettingsModalProps {
  config: AppConfig;
  onClose: () => void;
  onSaveSettings: (settings: { subToken?: string; defaultClient?: 'singbox' | 'mihomo' | 'loon' }) => Promise<void>;
  onChangePassword?: (oldPass: string, newPass: string) => Promise<boolean>;
  onRegenerateSubToken?: () => Promise<string | null>;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  config,
  onClose,
  onSaveSettings,
  onChangePassword,
  onRegenerateSubToken,
}) => {
  const [subToken, setSubToken] = useState(config.settings.subToken || '');
  const [defaultClient, setDefaultClient] = useState<'singbox' | 'mihomo' | 'loon'>(config.settings.defaultClient || 'mihomo');
  const [isSaving, setIsSaving] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [tokenCopied, setTokenCopied] = useState(false);

  // Password modification state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdMsg, setPwdMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isUpdatingPwd, setIsUpdatingPwd] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSaveSettings({
        subToken: subToken.trim() || undefined,
        defaultClient,
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const handleRegenerate = async () => {
    if (!confirm('重新生成订阅 Token 后，旧的订阅链接将立即失效，所有客户端需重新导入新链接。确定继续吗？')) {
      return;
    }
    setIsRegenerating(true);
    try {
      if (onRegenerateSubToken) {
        const newToken = await onRegenerateSubToken();
        if (newToken) setSubToken(newToken);
      } else {
        const random = Array.from(crypto.getRandomValues(new Uint8Array(16)))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');
        setSubToken(random);
      }
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleCopySubToken = () => {
    navigator.clipboard.writeText(subToken);
    setTokenCopied(true);
    setTimeout(() => setTokenCopied(false), 2000);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) {
      setPwdMsg({ type: 'error', text: '新密码不能为空' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdMsg({ type: 'error', text: '两次输入的新密码不一致' });
      return;
    }

    setIsUpdatingPwd(true);
    setPwdMsg(null);
    try {
      if (onChangePassword) {
        const ok = await onChangePassword(oldPassword, newPassword);
        if (ok) {
          setPwdMsg({ type: 'success', text: '管理密码修改成功！' });
          setOldPassword('');
          setNewPassword('');
          setConfirmPassword('');
        } else {
          setPwdMsg({ type: 'error', text: '密码修改失败，请检查旧密码是否正确' });
        }
      }
    } catch (err: any) {
      setPwdMsg({ type: 'error', text: err.message || '修改密码失败' });
    } finally {
      setIsUpdatingPwd(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="claude-panel w-full max-w-lg p-6 rounded-3xl bg-white border border-[#E3DDD2] shadow-2xl space-y-6 my-8 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-[#F0ECE4]">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-[#CC785C]" />
            <h3 className="text-base font-bold text-[#1F1E1D]">全局偏好与安全设置</h3>
          </div>
          <button onClick={onClose} className="p-1 text-[#8C877D] hover:text-[#1F1E1D] rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form 1: General & Sub Token */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#4A4742] mb-1.5">
              默认客户端类型 (当 UA 未知且无参数时)
            </label>
            <select
              value={defaultClient}
              onChange={e => setDefaultClient(e.target.value as any)}
              className="w-full px-3.5 py-2.5 claude-input rounded-xl text-xs font-medium"
            >
              <option value="mihomo">Mihomo / ShellCrash (YAML)</option>
              <option value="singbox">Sing-box (JSON)</option>
              <option value="loon">Loon (MCF)</option>
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-[#4A4742]">
                私密订阅 Token (Secret Sub Token)
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopySubToken}
                  className="text-[11px] text-[#59554E] hover:text-[#1F1E1D] flex items-center gap-1"
                >
                  {tokenCopied ? <Check className="w-3 h-3 text-[#367A68]" /> : null}
                  <span>{tokenCopied ? '已复制' : '复制 Token'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleRegenerate}
                  disabled={isRegenerating}
                  className="text-[11px] text-[#CC785C] hover:underline flex items-center gap-1 font-medium disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${isRegenerating ? 'animate-spin' : ''}`} />
                  <span>🎲 重新生成</span>
                </button>
              </div>
            </div>
            <input
              type="text"
              required
              placeholder="32位随机安全字符串"
              value={subToken}
              onChange={e => setSubToken(e.target.value)}
              className="w-full px-3.5 py-2 claude-input rounded-xl text-xs font-mono select-all text-[#1F1E1D]"
            />
            <p className="text-[11px] text-[#8C877D] mt-1">
              客户端订阅格式为：<code>/s/{subToken || 'xxx'}</code>。无效或错误 Token 将静默返回 404。
            </p>
          </div>



          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold btn-claude-primary rounded-xl shadow-2xs"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? '保存中...' : '保存偏好设置'}</span>
            </button>
          </div>
        </form>

        {/* Section 2: Change Admin Password */}
        <div className="pt-4 border-t border-[#F0ECE4] space-y-3">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-[#CC785C]" />
            <h4 className="text-xs font-bold text-[#1F1E1D]">修改管理员登录密码</h4>
          </div>

          {pwdMsg && (
            <div
              className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                pwdMsg.type === 'success'
                  ? 'bg-[#EAF2EE] border border-[#D5E5DE] text-[#367A68]'
                  : 'bg-[#FDF2F0] border border-[#F2D6D3] text-[#A8483B]'
              }`}
            >
              {pwdMsg.type === 'success' ? <Check className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
              <span>{pwdMsg.text}</span>
            </div>
          )}

          <form onSubmit={handleUpdatePassword} className="space-y-3">
            {config.settings.adminPassword && (
              <div>
                <label className="block text-[11px] font-medium text-[#4A4742] mb-1">
                  原登录密码
                </label>
                <input
                  type="password"
                  placeholder="请输入当前密码"
                  value={oldPassword}
                  onChange={e => setOldPassword(e.target.value)}
                  className="w-full px-3 py-2 claude-input rounded-xl text-xs font-mono"
                />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-medium text-[#4A4742] mb-1">
                  新登录密码
                </label>
                <input
                  type="password"
                  required
                  placeholder="输入新密码"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 claude-input rounded-xl text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-[#4A4742] mb-1">
                  确认新密码
                </label>
                <input
                  type="password"
                  required
                  placeholder="再次输入新密码"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 claude-input rounded-xl text-xs font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isUpdatingPwd || !newPassword}
                className="px-3.5 py-1.5 text-xs font-medium text-[#CC785C] bg-[#FAF0EC] hover:bg-[#F3DDD3] border border-[#F3DDD3] rounded-xl transition-colors disabled:opacity-50"
              >
                {isUpdatingPwd ? '更新中...' : '更新密码'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

