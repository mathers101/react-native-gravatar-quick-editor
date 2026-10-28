import { mapProfile, mapSessionResult, mapUpdate } from '../mapResult';

const profile = {
  hash: 'abc',
  display_name: 'Example',
  profile_url: 'https://gravatar.com/example',
  avatar_url: 'https://0.gravatar.com/avatar/abc',
  avatar_alt_text: 'Avatar',
  location: 'E.G.',
  description: 'About',
  job_title: 'Chief',
  company: 'EG Inc',
  verified_accounts: [
    {
      service_type: 'github',
      service_label: 'GitHub',
      service_icon: 'https://example.com/github.png',
      url: 'https://github.com/example',
      is_hidden: false,
    },
  ],
  pronunciation: 'eg-zam-pul',
  pronouns: 'they/them',
  first_name: 'Ex',
  links: [{ label: 'Site', url: 'https://example.com' }],
  payments: {
    links: [],
    crypto_wallets: [{ label: 'btc', address: 'bc1q' }],
  },
};

describe('mapUpdate', () => {
  it('maps an avatar picker signal to avatar_updated', () => {
    expect(mapUpdate({ type: 'avatar_updated' })).toEqual({
      type: 'avatar_updated',
    });
  });

  it('maps an about editor payload to profile_updated', () => {
    expect(mapUpdate({ type: 'profile_updated', profile })).toEqual({
      type: 'profile_updated',
      profile: expect.objectContaining({
        hash: 'abc',
        display_name: 'Example',
        first_name: 'Ex',
        verified_accounts: [
          expect.objectContaining({ service_type: 'github' }),
        ],
        payments: {
          links: [],
          crypto_wallets: [{ label: 'btc', address: 'bc1q' }],
        },
      }),
    });
  });
});

describe('mapProfile', () => {
  it('keeps Android-only fields when the payload includes them', () => {
    const mapped = mapProfile({
      ...profile,
      user_id: 7,
      user_login: 'example',
      section_visibility: { hidden_wallet: true },
    });

    expect(mapped.user_id).toBe(7);
    expect(mapped.user_login).toBe('example');
    expect(mapped.section_visibility).toEqual({ hidden_wallet: true });
  });

  it('omits optional fields the iOS profile model does not return', () => {
    const mapped = mapProfile(profile);
    expect(mapped.user_id).toBeUndefined();
    expect(mapped.section_visibility).toBeUndefined();
  });
});

describe('mapSessionResult', () => {
  it('reports a user dismissal without updates as cancelled', () => {
    expect(
      mapSessionResult({
        status: 'cancelled',
        dismissReason: 'finished',
        source: 'user',
        updates: [],
      })
    ).toEqual({
      status: 'cancelled',
      updates: [],
      close: { reason: 'finished', source: 'user' },
    });
  });

  it('reports a finished session that produced updates as success', () => {
    const result = mapSessionResult({
      status: 'success',
      dismissReason: 'finished',
      source: 'app',
      updates: [
        { type: 'avatar_updated' },
        { type: 'profile_updated', profile },
      ],
    });

    expect(result.status).toBe('success');
    if (result.status !== 'success') {
      throw new Error('expected success');
    }
    expect(result.updates.map((update) => update.type)).toEqual([
      'avatar_updated',
      'profile_updated',
    ]);
    expect(result.close).toEqual({ reason: 'finished', source: 'app' });
  });

  it('maps oauth and token dismissals to explicit errors', () => {
    const oauth = mapSessionResult({
      status: 'error',
      dismissReason: 'oauth_failed',
      source: 'user',
      updates: [],
      errorCode: 'oauth_failed',
    });
    expect(oauth).toMatchObject({
      status: 'error',
      error: { code: 'oauth_failed' },
      close: { reason: 'oauth_failed', source: 'user' },
    });

    const token = mapSessionResult({
      status: 'error',
      dismissReason: 'invalid_token',
      source: 'user',
      updates: [{ type: 'avatar_updated' }],
      errorCode: 'invalid_token',
      errorMessage: 'expired',
    });
    expect(token).toMatchObject({
      status: 'error',
      error: { code: 'invalid_token', message: 'expired' },
      updates: [{ type: 'avatar_updated' }],
    });
  });
});
