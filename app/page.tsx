'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const username = localStorage.getItem('username');
    const role = localStorage.getItem('role');
    const expiry = localStorage.getItem('expiry');

    const now = new Date().getTime();
    const isSessionValid = expiry ? now < parseInt(expiry) : false;

    if (username && role && isSessionValid) {
      // Redirect based on role
      if (role === 'superadmin') router.push('/superadmin');
      else if (role === 'admin') router.push('/admin');
    } else {
      // Not logged in or session expired → clear storage and redirect to register
      localStorage.clear();
      router.push('/auth/login'); // or "/login" if you prefer
    }
  }, []);

  return null; // nothing to render
}
