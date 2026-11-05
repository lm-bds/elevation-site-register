'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import {
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export default function ChangePasswordPage() {
  return (
    <React.Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="animate-pulse text-slate-400">Loading…</div>
      </div>
    }>
      <ChangePasswordContent />
    </React.Suspense>
  );
}

function ChangePasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const forceChange = searchParams.get('force') === 'true';

  const [isLoading, setIsLoading] = React.useState(false);
  const [showOldPassword, setShowOldPassword] = React.useState(false);
  const [showNewPassword, setShowNewPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  const [formData, setFormData] = React.useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // 密码策略（从后端获取）
  const [policy, setPolicy] = React.useState({
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumber: true,
    requireSpecialChar: true,
    specialChars: '!@#$%^&*()_+-=[]{}|;:,.<>?',
  });

  React.useEffect(() => {
    // 获取密码策略
    fetch('/api/auth/password-policy')
      .then(res => res.json())
      .then(data => {
        if (data.minLength) {
          setPolicy(data);
        }
      })
      .catch(console.error);
  }, []);

  // 验证密码复杂度
  const getPasswordValidation = () => {
    const password = formData.newPassword;
    return {
      length: password.length >= policy.minLength,
      uppercase: !policy.requireUppercase || /[A-Z]/.test(password),
      lowercase: !policy.requireLowercase || /[a-z]/.test(password),
      number: !policy.requireNumber || /[0-9]/.test(password),
      special: !policy.requireSpecialChar || /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password),
    };
  };

  const validation = getPasswordValidation();
  const isPasswordValid = Object.values(validation).every(Boolean);
  const passwordsMatch = formData.newPassword === formData.confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isPasswordValid) {
      toast.error('Password does not meet the required complexity.');
      return;
    }

    if (!passwordsMatch) {
      toast.error('Passwords do not match.');
      return;
    }

    if (!forceChange && !formData.oldPassword) {
      toast.error('Enter current password');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          oldPassword: formData.oldPassword,
          newPassword: formData.newPassword,
          forceChange: forceChange,
        }),
      });

      if (response.ok) {
        toast.success('Password changed. Redirecting…');
        // 使用 window.location 硬跳转确保新 cookie 完全生效
        setTimeout(() => {
          window.location.href = '/';
        }, 800);
      } else {
        const data = await response.json();
        toast.error(data.error || 'Unable to change password.');
      }
    } catch (error) {
      console.error('Change password failed:', error);
      toast.error('Password change failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <Card className="w-full max-w-md rounded-2xl shadow-xl border-slate-200/80 dark:border-slate-700">
        <CardHeader className="text-center pb-2 pt-6">
          <div className="mx-auto w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4">
            <KeyRound className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <CardTitle className="text-xl font-bold">Change password</CardTitle>
          <CardDescription className="text-sm">
            {forceChange
              ? 'Change your initial password before first use'
              : 'Set a secure new password'}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          {forceChange && (
            <div className="mb-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  For account security, change the initial password before continuing.
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Current password（非强制修改时显示） */}
            {!forceChange && (
              <div className="space-y-2">
                <Label htmlFor="oldPassword">Current password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="oldPassword"
                    type={showOldPassword ? 'text' : 'password'}
                    value={formData.oldPassword}
                    onChange={(e) => setFormData({ ...formData, oldPassword: e.target.value })}
                    placeholder="Enter current password"
                    className="pl-10 pr-10 h-10 rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPassword(!showOldPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showOldPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* New password */}
            <div className="space-y-2">
              <Label htmlFor="newPassword">New password</Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  value={formData.newPassword}
                  onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                  placeholder="请输入New password"
                  className="pl-10 pr-10 h-10 rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Password requirements */}
            {formData.newPassword && (
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className={cn('flex items-center gap-1', validation.length ? 'text-green-600' : 'text-slate-400')}>
                  {validation.length ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                  At least {policy.minLength} characters
                </div>
                {policy.requireUppercase && (
                  <div className={cn('flex items-center gap-1', validation.uppercase ? 'text-green-600' : 'text-slate-400')}>
                    {validation.uppercase ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                    Contains an uppercase letter
                  </div>
                )}
                {policy.requireLowercase && (
                  <div className={cn('flex items-center gap-1', validation.lowercase ? 'text-green-600' : 'text-slate-400')}>
                    {validation.lowercase ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                    Contains a lowercase letter
                  </div>
                )}
                {policy.requireNumber && (
                  <div className={cn('flex items-center gap-1', validation.number ? 'text-green-600' : 'text-slate-400')}>
                    {validation.number ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                    Contains a number
                  </div>
                )}
                {policy.requireSpecialChar && (
                  <div className={cn('flex items-center gap-1 col-span-2', validation.special ? 'text-green-600' : 'text-slate-400')}>
                    {validation.special ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                    Contains a special character
                  </div>
                )}
              </div>
            )}

            {/* Confirm password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="请再次输入New password"
                  className="pl-10 pr-10 h-10 rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {formData.confirmPassword && !passwordsMatch && (
                <p className="text-xs text-red-500">Passwords do not match.</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-10 rounded-lg bg-blue-600 hover:bg-blue-700"
              disabled={isLoading || !isPasswordValid || !passwordsMatch}
            >
              {isLoading ? 'Changing password…' : 'Change password'}
            </Button>
            
            {/* 禁用原因提示 */}
            {(!isPasswordValid || !passwordsMatch) && (
              <div className="mt-3 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50">
                <p className="text-xs text-red-600 dark:text-red-400 font-medium mb-1.5">Cannot save — check the following:</p>
                <ul className="text-xs text-red-600 dark:text-red-400 space-y-0.5">
                  {!isPasswordValid && (
                    <li>• Password does not meet the required complexity.（请确保所有条件打勾）</li>
                  )}
                  {!passwordsMatch && (
                    <li>• Passwords do not match.</li>
                  )}
                </ul>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
