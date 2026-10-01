import { Access, Area, FULL_ACCESS, NO_ACCESS, Perm, withOverrides } from '../data/access';
import { AppState } from '../data/types';
import { useStore } from '../store/AppStore';

/** What the signed-in person may use. Admin can use everything; riders only have the Rider app. */
export function accessOf(state: AppState): Access {
  const s = state.session;
  if (!s) return NO_ACCESS;
  if (s.role === 'admin') return FULL_ACCESS;
  if (s.role === 'rider') return NO_ACCESS;
  const me = state.staff.find((x) => x.id === s.staffId);
  const role = state.roles.find((r) => r.id === me?.roleId);
  if (!me || !role) return NO_ACCESS;
  return withOverrides(role.access, me.overrides);
}

export function useAccess() {
  const { state } = useStore();
  const a = accessOf(state);
  return {
    isAdmin: state.session?.role === 'admin',
    access: a,
    /** May look at this area. */
    canView: (area: Area) => a.areas[area] !== 'off',
    /** May add and change things in this area. */
    canEdit: (area: Area) => a.areas[area] === 'edit',
    can: (perm: Perm) => a.perms[perm],
  };
}
