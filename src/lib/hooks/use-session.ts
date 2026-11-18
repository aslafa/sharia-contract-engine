"use client";

import * as React from "react";

/**
 * Client-side session hook for Customer Management UI.
 * Reads the signed session via `/api/auth/session` so permission gating
 * (customers:view / create / edit) reflects the server-issued claims.
 * Server remains the single source of truth — the API re-checks every call.
 */

export interface SessionUser {
  userId: string;
  email: string;
  fullName: string;
  isSuperAdmin: boolean;
  organizationId: string;
  organizationName: string;
  organizationCode: string;
  role: string;
  roleName: string;
  permissions: string[];
}

interface UseSessionResult {
  user: SessionUser | null;
  loading: boolean;
  authenticated: boolean;
  /** UI-level permission check against session claims. */
  can: (permission: string) => boolean;
}

export function useSession(): UseSessionResult {
  const [user, setUser] = React.useState<SessionUser | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [authenticated, setAuthenticated] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return;
        if (json?.success && json?.data?.user) {
          setUser(json.data.user as SessionUser);
          setAuthenticated(true);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const can = React.useCallback(
    (permission: string): boolean => {
      if (!user) return false;
      if (user.isSuperAdmin) return true;
      return Array.isArray(user.permissions) && user.permissions.includes(permission);
    },
    [user]
  );

  return { user, loading, authenticated, can };
}
