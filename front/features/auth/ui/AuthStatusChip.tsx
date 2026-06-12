'use client';

import { useEffect, useState } from 'react';
import { ApiError, pingBackend } from '@/shared/lib/api';
import type { AuthState } from '../model/use-telegram-auth';

type Ping = 'idle' | 'ok' | 'down';

// Маленький дев-индикатор: пинг бэка (зелёный кружок) + статус авторизации.
// Цель — глазами понять, что фронт реально достучался до NestJS.
export function AuthStatusChip({ auth }: { auth: AuthState }) {
  const [ping, setPing] = useState<Ping>('idle');
  const [pingError, setPingError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    pingBackend()
      .then(() => {
        if (!cancelled) {
          setPing('ok');
          setPingError(null);
        }
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setPing('down');
        setPingError(
          e instanceof ApiError
            ? `${e.status} ${e.message}`
            : e instanceof Error
              ? e.message
              : 'unknown',
        );
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const pingColor =
    ping === 'ok'
      ? 'bg-emerald-400'
      : ping === 'down'
        ? 'bg-red-400'
        : 'bg-yellow-400 animate-pulse';

  const authLabel =
    auth.status === 'authenticated'
      ? auth.tokens
        ? `user #${auth.tokens.userId}`
        : 'auth ok'
      : auth.status === 'authenticating'
        ? 'auth…'
        : auth.status === 'error'
          ? 'no auth'
          : 'idle';

  const title =
    ping === 'down'
      ? `API: ${pingError ?? 'down'}`
      : auth.status === 'error'
        ? `Auth: ${auth.error ?? 'error'}`
        : `API ok • ${authLabel}`;

  return (
    <div
      title={title}
      className="flex items-center gap-1.5 rounded-full bg-surface px-2.5 py-1 text-[10px] font-medium tabular-nums text-(--text)"
      style={{ boxShadow: 'var(--shadow-button)' }}
    >
      <span className={`size-1.5 rounded-full ${pingColor}`} />
      <span>{authLabel}</span>
    </div>
  );
}
