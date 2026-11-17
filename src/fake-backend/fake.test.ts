import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DB_KEY, loadDb, onChange, resetDb, table } from './db';
import { DEMO_CODE, DEMO_USER } from './seed';
import * as auth from './session';
import { modelApi } from './models';
import { visibleRows } from './modelAuth';
import { fakeClient, generateClient } from './data';
import { NO_RESULTS_TERM } from './queries';
import { Amplify } from './amplify';

const USER = { authMode: 'userPool' } as const;
const signIn = () => auth.signIn({ username: DEMO_USER.email, password: DEMO_USER.password });

beforeEach(async () => {
  localStorage.clear();
  resetDb();
  await auth.signOut();
});

describe('db', () => {
  it('seeds on first load and persists to localStorage', () => {
    expect(localStorage.getItem(DB_KEY)).toBeNull();
    expect(table('Nom')).toHaveLength(2);
    expect(JSON.parse(localStorage.getItem(DB_KEY) ?? '{}').tables.Nom).toHaveLength(2);
    resetDb();
    localStorage.setItem(DB_KEY, JSON.stringify({ tables: { Nom: [] } }));
    expect(loadDb().tables.Nom).toEqual([]);
  });
});

describe('session (aws-amplify/auth shim)', () => {
  it('rejects a bad password and has no user when signed out', async () => {
    await expect(auth.signIn({ username: DEMO_USER.email, password: 'x' })).rejects.toThrow();
    await expect(auth.getCurrentUser()).rejects.toThrow();
    expect((await auth.fetchAuthSession()).tokens).toBeUndefined();
  });

  it('signs the demo user in, exposing id + email + tokens; signs out', async () => {
    await signIn();
    const user = await auth.getCurrentUser();
    expect(user).toMatchObject({
      userId: DEMO_USER.sub,
      signInDetails: { loginId: DEMO_USER.email },
    });
    expect((await auth.fetchAuthSession()).tokens?.accessToken).toBeTruthy();
    await auth.signOut();
    expect(auth.currentSessionSub()).toBeNull();
  });

  it('runs sign-up → confirm → sign-in with the demo code, and refuses duplicates', async () => {
    const res = await auth.signUp({ username: 'New@X.com', password: 'pw' });
    expect(res.nextStep.signUpStep).toBe('CONFIRM_SIGN_UP');
    await expect(auth.signIn({ username: 'new@x.com', password: 'pw' })).rejects.toThrow(
      /confirmed/,
    );
    await expect(
      auth.confirmSignUp({ username: 'new@x.com', confirmationCode: '0' }),
    ).rejects.toThrow();
    await auth.confirmSignUp({ username: 'new@x.com', confirmationCode: DEMO_CODE });
    await auth.signIn({ username: 'new@x.com', password: 'pw' });
    await expect(auth.signUp({ username: 'new@x.com', password: 'pw' })).rejects.toThrow(/exists/);
  });

  it('changes, resets and deletes', async () => {
    await signIn();
    await expect(auth.updatePassword({ oldPassword: 'wrong', newPassword: 'n' })).rejects.toThrow();
    await auth.updatePassword({ oldPassword: DEMO_USER.password, newPassword: 'n2' });
    await auth.signOut();
    await auth.signIn({ username: DEMO_USER.email, password: 'n2' });
    await expect(auth.resetPassword({ username: 'nobody@x.com' })).rejects.toThrow();
    await auth.resetPassword({ username: DEMO_USER.email });
    await expect(
      auth.confirmResetPassword({
        username: DEMO_USER.email,
        confirmationCode: '0',
        newPassword: 'z',
      }),
    ).rejects.toThrow();
    await auth.confirmResetPassword({
      username: DEMO_USER.email,
      confirmationCode: DEMO_CODE,
      newPassword: 'n3',
    });
    await auth.deleteUser();
    await expect(auth.signIn({ username: DEMO_USER.email, password: 'n3' })).rejects.toThrow();
  });
});

describe('models (auth contract)', () => {
  it('visibleRows honors guest / authenticated / owner / members', () => {
    const rows = [
      { id: 'a', owner: 'me', members: ['me'] },
      { id: 'b', owner: 'you', members: ['you'] },
    ];
    expect(visibleRows(rows, 'guest', null)).toHaveLength(2);
    expect(visibleRows(rows, 'authenticated', null)).toHaveLength(0);
    expect(visibleRows(rows, 'authenticated', 'me')).toHaveLength(2);
    expect(visibleRows(rows, 'owner', 'me').map((r) => r.id)).toEqual(['a']);
    expect(visibleRows(rows, 'members', 'me').map((r) => r.id)).toEqual(['a']);
  });

  it('a guest reads an owner model as EMPTY, a userPool call without a session throws', async () => {
    expect((await fakeClient.models.Rotation.list()).data).toEqual([]);
    await expect(fakeClient.models.Rotation.list(USER)).rejects.toThrow(/No current user/);
    await signIn();
    expect((await fakeClient.models.Rotation.list(USER)).data).toHaveLength(1);
  });

  it('create / update / delete persist, stamp owner + timestamps, and emit to subscribers', async () => {
    await signIn();
    const Rotation = modelApi('Rotation', 'owner');
    const created = vi.fn();
    const deleted = vi.fn();
    const sub = Rotation.onCreate(USER).subscribe({ next: created });
    Rotation.onDelete(USER).subscribe({ next: deleted });
    const { data } = await Rotation.create({ googlePlaceId: 'p9' }, USER);
    expect(data).toMatchObject({ googlePlaceId: 'p9', owner: DEMO_USER.sub });
    expect(created).toHaveBeenCalledWith(data);
    const upd = await Rotation.update({ id: data.id, googlePlaceId: 'p10' }, USER);
    expect(upd.data?.googlePlaceId).toBe('p10');
    expect((await Rotation.get({ id: data.id }, USER)).data?.googlePlaceId).toBe('p10');
    expect((await Rotation.update({ id: 'nope' }, USER)).data).toBeNull();
    sub.unsubscribe();
    await Rotation.delete({ id: data.id }, USER);
    expect(deleted).toHaveBeenCalledTimes(1);
    expect((await Rotation.delete({ id: data.id }, USER)).data).toBeNull();
    expect((await Rotation.get({ id: data.id }, USER)).data).toBeNull();
    // Subscriptions are per model + kind.
    const off = onChange('Nom', 'create', vi.fn());
    off();
  });
});

describe('data client (aws-amplify/data shim)', () => {
  it('generateClient returns the fake, typed as whatever the caller asked for', () => {
    expect(generateClient<typeof fakeClient>()).toBe(fakeClient);
  });

  it('lists the most recently updated noms of a pairing, newest first, capped', async () => {
    await signIn();
    const { data } = await fakeClient.models.Nom.listNomByPairingIdAndUpdatedAt(
      { pairingId: 'solo' },
      { ...USER, sortDirection: 'DESC', limit: 1 },
    );
    expect(data).toHaveLength(1);
    const asc = await fakeClient.models.Nom.listNomByPairingIdAndUpdatedAt(
      { pairingId: 'solo' },
      USER,
    );
    expect(asc.data).toHaveLength(2);
    expect(
      (await fakeClient.models.Nom.listNomByPairingIdAndUpdatedAt({ pairingId: 'x' }, USER)).data,
    ).toEqual([]);
  });

  it('search returns the fixtures for any term except the no-results switch; get resolves a place', async () => {
    expect((await fakeClient.queries.searchGooglePlaces({ search: 'pizza' })).data).toHaveLength(3);
    expect((await fakeClient.queries.searchGooglePlaces({ search: NO_RESULTS_TERM })).data).toEqual(
      [],
    );
    expect((await fakeClient.queries.searchGooglePlaces({ search: null })).data).toHaveLength(3);
    const place = await fakeClient.queries.getGooglePlace({ placeId: 'seed-zingermans' });
    expect(place.data).toMatchObject({ displayName: { text: "Zingerman's Delicatessen" } });
    expect((await fakeClient.queries.getGooglePlace({ placeId: 'nope' })).data).toBeNull();
    expect((await fakeClient.queries.getGooglePlaceImage()).data).toBeNull();
  });

  it('invite → accept walks a pairing PENDING → ACTIVE with both subs', async () => {
    await signIn();
    const me = DEMO_USER.email;
    await expect(
      fakeClient.mutations.invitePartner({ inviteeEmail: me, callerEmail: me }, USER),
    ).rejects.toThrow();
    const { data } = await fakeClient.mutations.invitePartner(
      { inviteeEmail: 'Partner@x.com', callerEmail: me },
      USER,
    );
    expect(data).toMatchObject({
      status: 'PENDING',
      inviteeEmail: 'partner@x.com',
      members: [DEMO_USER.sub],
    });
    const byEmail = await fakeClient.models.Pairing.listPairingByInviteeEmail(
      { inviteeEmail: 'partner@x.com' },
      USER,
    );
    expect(byEmail.data).toHaveLength(1);
    await expect(
      fakeClient.mutations.acceptInvite({ pairingId: data!.id, callerEmail: 'other@x.com' }, USER),
    ).rejects.toThrow(/different email/);
    await expect(
      fakeClient.mutations.acceptInvite({ pairingId: 'nope', callerEmail: me }, USER),
    ).rejects.toThrow();
    const active = await fakeClient.mutations.acceptInvite(
      { pairingId: data!.id, callerEmail: 'partner@x.com' },
      USER,
    );
    expect(active.data).toMatchObject({ status: 'ACTIVE' });
    expect((active.data?.members as string[]).length).toBe(2);
    expect(
      await fakeClient.mutations.acceptInvite(
        { pairingId: data!.id, callerEmail: 'partner@x.com' },
        USER,
      ),
    ).toEqual(active);
    expect((await fakeClient.mutations.pokePartner()).data).toBe(1);
  });

  it('Amplify.configure announces the fake on <html>', () => {
    Amplify.configure({});
    expect(document.documentElement.dataset.backend).toBe('fake');
  });
});
