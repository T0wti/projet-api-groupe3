'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Shield, Search } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import type { AccountStatus, UserRole, UserSearchResult } from '@/types/user';
import { banUser, reinstateUser, searchUsers, suspendUser, updateUserRole } from '@/lib/api/users';

const ROLE_LABELS: Record<UserRole, string> = {
  user: 'Utilisateur',
  moderator: 'Moderateur',
  admin: 'Administrateur',
};

const STATUS_LABELS: Record<AccountStatus, string> = {
  active: 'Actif',
  suspended: 'Suspendu',
  banned: 'Banni',
};

const statusBadgeClass: Record<AccountStatus, string> = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  suspended: 'bg-amber-50 text-amber-700 border-amber-200',
  banned: 'bg-red-50 text-red-700 border-red-200',
};

const roleBadgeClass: Record<UserRole, string> = {
  user: 'bg-slate-100 text-slate-700 border-slate-200',
  moderator: 'bg-sky-50 text-sky-700 border-sky-200',
  admin: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200',
};

const toDefaultSuspendUntil = () => {
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  return nextWeek.toISOString().slice(0, 16);
};

export default function StaffPage() {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [roleSelections, setRoleSelections] = useState<Record<string, UserRole>>({});
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [suspendUntilByUser, setSuspendUntilByUser] = useState<Record<string, string>>({});

  const isStaff = user?.role === 'admin' || user?.role === 'moderator';

  const applyUserUpdate = (updatedUser: UserSearchResult) => {
    setResults((currentResults) =>
      currentResults.map((entry) => (entry.id === updatedUser.id ? updatedUser : entry))
    );
    setRoleSelections((currentSelections) => ({
      ...currentSelections,
      [updatedUser.id]: updatedUser.role,
    }));
  };

  const loadUsers = async (searchValue: string) => {
    if (!searchValue.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    setError(null);
    setMessage(null);

    try {
      const foundUsers = await searchUsers(searchValue, { includeInactive: true });
      setResults(foundUsers);
      setRoleSelections(Object.fromEntries(foundUsers.map((entry) => [entry.id, entry.role])));
      setSuspendUntilByUser((currentMap) => {
        const nextMap = { ...currentMap };
        foundUsers.forEach((entry) => {
          if (!nextMap[entry.id]) {
            nextMap[entry.id] = toDefaultSuspendUntil();
          }
        });
        return nextMap;
      });
    } catch {
      setError('Impossible de charger les comptes.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (event: React.FormEvent) => {
    event.preventDefault();
    await loadUsers(query);
  };

  const handleRoleUpdate = async (targetUser: UserSearchResult) => {
    const nextRole = roleSelections[targetUser.id];
    if (!nextRole || nextRole === targetUser.role) {
      return;
    }

    setPendingUserId(targetUser.id);
    setError(null);
    setMessage(null);

    try {
      const updatedUser = await updateUserRole(targetUser.id, nextRole);
      applyUserUpdate({
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        role: updatedUser.role,
        status: updatedUser.status,
      });
      setMessage(`Role mis a jour pour @${updatedUser.username}.`);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Impossible de modifier le role.');
    } finally {
      setPendingUserId(null);
    }
  };

  const handleSuspend = async (targetUser: UserSearchResult) => {
    const until = suspendUntilByUser[targetUser.id];
    if (!until) {
      setError('Choisis une date de fin de suspension.');
      return;
    }

    setPendingUserId(targetUser.id);
    setError(null);
    setMessage(null);

    try {
      const updatedUser = await suspendUser(targetUser.id, new Date(until).toISOString(), reasons[targetUser.id]);
      applyUserUpdate({
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        role: updatedUser.role,
        status: updatedUser.status,
      });
      setMessage(`Compte @${updatedUser.username} suspendu.`);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Impossible de suspendre ce compte.');
    } finally {
      setPendingUserId(null);
    }
  };

  const handleBan = async (targetUser: UserSearchResult) => {
    setPendingUserId(targetUser.id);
    setError(null);
    setMessage(null);

    try {
      const updatedUser = await banUser(targetUser.id, reasons[targetUser.id]);
      applyUserUpdate({
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        role: updatedUser.role,
        status: updatedUser.status,
      });
      setMessage(`Compte @${updatedUser.username} banni.`);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Impossible de bannir ce compte.');
    } finally {
      setPendingUserId(null);
    }
  };

  const handleReinstate = async (targetUser: UserSearchResult) => {
    setPendingUserId(targetUser.id);
    setError(null);
    setMessage(null);

    try {
      const updatedUser = await reinstateUser(targetUser.id);
      applyUserUpdate({
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        role: updatedUser.role,
        status: updatedUser.status,
      });
      setMessage(`Compte @${updatedUser.username} reactive.`);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Impossible de reactiver ce compte.');
    } finally {
      setPendingUserId(null);
    }
  };

  const availableRoleOptions: UserRole[] = user?.role === 'admin'
    ? ['user', 'moderator', 'admin']
    : ['moderator'];

  if (!isStaff) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(13,148,136,0.16),_transparent_42%),linear-gradient(180deg,_#f8fafc_0%,_#eefdf8_100%)] px-4 py-12 sm:px-6">
        <section className="mx-auto max-w-3xl rounded-[2rem] border border-white/70 bg-white/85 p-10 text-center shadow-[0_30px_80px_rgba(15,23,42,0.08)] backdrop-blur">
          <Shield className="mx-auto mb-4 text-teal-600" size={36} />
          <h1 className="text-3xl font-black text-slate-900">Espace moderation</h1>
          <p className="mt-3 text-sm text-slate-600">Cette page est reservee aux moderateurs et administrateurs.</p>
          <Link href="/" className="mt-6 inline-flex rounded-full bg-teal-600 px-5 py-2 text-sm font-bold text-white hover:bg-teal-700">
            Retour a l&apos;accueil
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(13,148,136,0.16),_transparent_42%),linear-gradient(180deg,_#f8fafc_0%,_#eefdf8_100%)] px-4 py-8 sm:px-6 lg:px-10">
      <section className="mx-auto max-w-6xl rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-[0_30px_80px_rgba(15,23,42,0.08)] backdrop-blur sm:p-8">
        <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.32em] text-teal-700">Staff Console</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">Gestion des roles et sanctions</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              Les administrateurs peuvent attribuer les roles utilisateur, moderateur et administrateur. Les moderateurs peuvent uniquement promouvoir un utilisateur standard au role moderateur.
            </p>
          </div>

          <div className="rounded-2xl border border-teal-100 bg-teal-50/70 px-4 py-3 text-sm text-teal-900">
            Connecte en tant que <span className="font-bold">{ROLE_LABELS[user.role]}</span>
          </div>
        </div>

        <form onSubmit={handleSearch} className="mt-6 flex flex-col gap-3 rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-4 sm:flex-row">
          <label className="flex flex-1 items-center gap-3 rounded-full bg-white px-4 py-3 shadow-sm">
            <Search size={18} className="text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Rechercher par username"
              className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
            />
          </label>

          <Button type="submit" size="md" className="sm:min-w-44" disabled={isLoading}>
            {isLoading ? 'Recherche...' : 'Chercher un compte'}
          </Button>
        </form>

        {error && <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
        {message && <p className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p>}

        {results.length === 0 && !isLoading && !error && (
          <div className="mt-6 rounded-[1.5rem] border border-dashed border-slate-300 px-6 py-12 text-center text-sm text-slate-500">
            Lance une recherche pour afficher les comptes actifs, suspendus ou bannis.
          </div>
        )}

        <div className="mt-6 grid gap-4 2xl:grid-cols-2">
          {results.map((entry) => {
            const currentRoleSelection = roleSelections[entry.id] ?? entry.role;
            const isPending = pendingUserId === entry.id;
            const canEditRole = user.role === 'admin' || (user.role === 'moderator' && entry.role === 'user');
            const canModerate = user.role === 'admin' || entry.role === 'user';

            return (
              <article key={entry.id} className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <Link href={`/profile/${encodeURIComponent(entry.username)}`} className="block break-all text-lg font-black text-slate-900 hover:text-teal-700">
                      @{entry.username}
                    </Link>
                    <p className="mt-1 break-all text-sm text-slate-500">{entry.email}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className={`rounded-full border px-3 py-1 text-xs font-bold ${roleBadgeClass[entry.role]}`}>
                        {ROLE_LABELS[entry.role]}
                      </span>
                      <span className={`rounded-full border px-3 py-1 text-xs font-bold ${statusBadgeClass[entry.status]}`}>
                        {STATUS_LABELS[entry.status]}
                      </span>
                    </div>
                  </div>

                  <div className="max-w-full break-all text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 sm:max-w-[13rem] sm:text-right">
                    {entry.id}
                  </div>
                </div>

                <div className="mt-5 grid gap-4 border-t border-slate-100 pt-5">
                  <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
                    <label className="grid min-w-0 gap-2 text-sm font-semibold text-slate-700">
                      Role cible
                      <select
                        value={currentRoleSelection}
                        onChange={(event) => setRoleSelections((current) => ({ ...current, [entry.id]: event.target.value as UserRole }))}
                        disabled={!canEditRole || isPending}
                        className="min-w-0 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none focus:border-teal-500 disabled:cursor-not-allowed disabled:bg-slate-100"
                      >
                        {availableRoleOptions.map((roleOption) => (
                          <option key={roleOption} value={roleOption}>{ROLE_LABELS[roleOption]}</option>
                        ))}
                      </select>
                    </label>

                    <Button type="button" className="w-full xl:w-auto" onClick={() => handleRoleUpdate(entry)} disabled={!canEditRole || isPending || currentRoleSelection === entry.role}>
                      Mettre a jour le role
                    </Button>
                  </div>

                  <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                    <label className="grid min-w-0 gap-2 text-sm font-semibold text-slate-700">
                      Fin de suspension
                      <input
                        type="datetime-local"
                        value={suspendUntilByUser[entry.id] ?? ''}
                        onChange={(event) => setSuspendUntilByUser((current) => ({ ...current, [entry.id]: event.target.value }))}
                        disabled={!canModerate || isPending}
                        className="min-w-0 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-teal-500 disabled:cursor-not-allowed disabled:bg-slate-100"
                      />
                    </label>

                    <label className="grid min-w-0 gap-2 text-sm font-semibold text-slate-700">
                      Raison
                      <input
                        type="text"
                        value={reasons[entry.id] ?? ''}
                        onChange={(event) => setReasons((current) => ({ ...current, [entry.id]: event.target.value }))}
                        placeholder="Ex: spam, usurpation, propos haineux"
                        disabled={!canModerate || isPending}
                        className="min-w-0 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-teal-500 disabled:cursor-not-allowed disabled:bg-slate-100"
                      />
                    </label>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                    <Button type="button" variant="secondary" className="w-full sm:w-auto" onClick={() => handleSuspend(entry)} disabled={!canModerate || isPending}>
                      Suspendre
                    </Button>
                    <Button type="button" variant="danger" className="w-full sm:w-auto" onClick={() => handleBan(entry)} disabled={!canModerate || isPending}>
                      Bannir
                    </Button>
                    <Button type="button" variant="ghost" className="w-full sm:w-auto" onClick={() => handleReinstate(entry)} disabled={!canModerate || isPending || entry.status === 'active'}>
                      Reactiver
                    </Button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}