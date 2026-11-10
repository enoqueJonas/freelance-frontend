import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ProfileRole } from '../types';

/**
 * RN01 / V01: uma conta, dois perfis independentes, papel activo contextual.
 * A implementação ainda utiliza mockApi/localStorage; não constitui autenticação real.
 */
export const ProfileRolesPanel: React.FC = () => {
  const { user, profile, switchRole, createAdditionalProfile, error } = useAuth();
  const [creating, setCreating] = useState<ProfileRole | null>(null);
  const [busy, setBusy] = useState(false);
  const [title, setTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('');
  const [bio, setBio] = useState('');
  const [skills, setSkills] = useState('');
  const [location, setLocation] = useState('');

  if (!user || user.role === 'admin') return null;
  const roles: ProfileRole[] = user.roles ?? [user.role];
  const names: Record<ProfileRole, string> = {
    worker: 'Trabalhador',
    employer: 'Empregador'
  };

  const activate = async (role: ProfileRole) => {
    if (busy || role === user.role) return;
    setBusy(true);
    try {
      if (await switchRole(role)) setCreating(null);
    } finally {
      setBusy(false);
    }
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!creating || busy) return;
    setBusy(true);
    try {
      const success = await createAdditionalProfile(creating, {
        title, companyName, industry, bio, location,
        skills: skills.split(',').map(skill => skill.trim()).filter(Boolean)
      });
      if (success) {
        setCreating(null);
        setTitle('');
        setCompanyName('');
        setIndustry('');
        setBio('');
        setSkills('');
        setLocation('');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <section aria-label="Perfis de utilizador" className="conecta-surface p-6 mb-7">
      <h2 className="text-base font-bold text-gray-900">Os meus perfis</h2>
      <p className="text-xs text-gray-500 mt-1">
        Pode actuar como trabalhador e empregador na mesma conta, mas não nas duas partes da mesma oportunidade.
      </p>
      <div className="flex flex-wrap gap-2 mt-4">
        {(['worker', 'employer'] as ProfileRole[]).map(role => {
          const exists = roles.includes(role);
          const active = user.role === role;
          return (
            <button key={role} type="button" disabled={busy || active}
              onClick={() => exists ? activate(role) : setCreating(role)}
              aria-pressed={active}
              className={`px-4 py-2 rounded-lg border text-sm font-semibold transition-colors ${active ? 'border-secondary bg-[#E7F2ED] text-[#0B655B]' : 'border-gray-200 text-gray-700 hover:bg-gray-50'} disabled:cursor-default`}>
              {names[role]}{active ? ' · Activo' : exists ? ' · Mudar' : ' · Criar perfil'}
            </button>
          );
        })}
      </div>
      {profile && (
        <p className="mt-2 text-xs text-gray-500">
          Perfil actual: {'title' in profile ? profile.title : profile.companyName}
          {' · '}{profile.documentStatus === 'approved' ? 'Verificado' : 'Verificação pendente/não concluída'}
        </p>
      )}

      {creating && !roles.includes(creating) && (
        <form onSubmit={submit} className="mt-5 border-t border-gray-100 pt-4 space-y-3">
          <h3 className="text-sm font-bold text-gray-800">Criar perfil de {names[creating].toLowerCase()}</h3>
          {creating === 'worker' ? (
            <>
              <label className="block text-xs font-semibold text-gray-600">
                Especialidade profissional *
                <input value={title} onChange={e => setTitle(e.target.value)} required
                  className="block mt-1 w-full border border-gray-200 rounded-lg p-2 text-sm"
                  placeholder="Ex.: Desenvolvimento Web" />
              </label>
              <label className="block text-xs font-semibold text-gray-600">
                Competências (separadas por vírgulas)
                <input value={skills} onChange={e => setSkills(e.target.value)}
                  className="block mt-1 w-full border border-gray-200 rounded-lg p-2 text-sm"
                  placeholder="React, Django, PostgreSQL" />
              </label>
            </>
          ) : (
            <>
              <label className="block text-xs font-semibold text-gray-600">
                Nome da entidade (opcional para empregador individual)
                <input value={companyName} onChange={e => setCompanyName(e.target.value)}
                  className="block mt-1 w-full border border-gray-200 rounded-lg p-2 text-sm"
                  placeholder="Nome da empresa ou do contratante" />
              </label>
              <label className="block text-xs font-semibold text-gray-600">
                Área de actividade
                <input value={industry} onChange={e => setIndustry(e.target.value)}
                  className="block mt-1 w-full border border-gray-200 rounded-lg p-2 text-sm" />
              </label>
            </>
          )}
          <label className="block text-xs font-semibold text-gray-600">
            Descrição do perfil
            <textarea rows={2} value={bio} onChange={e => setBio(e.target.value)}
              className="block mt-1 w-full border border-gray-200 rounded-lg p-2 text-sm" />
          </label>
          <label className="block text-xs font-semibold text-gray-600">
            Localização (opcional)
            <input value={location} onChange={e => setLocation(e.target.value)}
              className="block mt-1 w-full border border-gray-200 rounded-lg p-2 text-sm" />
          </label>
          {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={busy}
              className="bg-primary text-white rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-60">
              {busy ? 'A guardar...' : 'Criar e activar perfil'}
            </button>
            <button type="button" onClick={() => setCreating(null)} disabled={busy}
              className="border border-gray-200 rounded-lg px-4 py-2 text-sm">Cancelar</button>
          </div>
        </form>
      )}
    </section>
  );
};
