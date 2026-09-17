"use client";

import React, { useEffect } from 'react';
import { MailModule } from '../../../components/modules/mail/MailModule';
import { useDemoStore } from '../../../store/demoStore';

export default function MailPage() {
  const setActiveTab = useDemoStore((state) => state.setActiveTab);

  useEffect(() => {
    setActiveTab('mail');
  }, [setActiveTab]);

  return <MailModule />;
}
