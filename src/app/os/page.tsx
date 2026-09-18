"use client";

import React, { useEffect, useState } from 'react';
import { useDemoStore } from '../../store/demoStore';
import { DemoLogin } from '../../components/auth/DemoLogin';
import { AppShell } from '../../components/layout/AppShell';

export default function KapateOSPage() {
  const isAuthenticated = useDemoStore((state) => state.isAuthenticated);
  const checkAuth = useDemoStore((state) => state.checkAuth);
  const login = useDemoStore((state) => state.login);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    checkAuth();
    setIsClient(true);
  }, [checkAuth]);

  if (!isClient) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <DemoLogin onLoginSuccess={() => login()} />;
  }

  return <AppShell />;
}
