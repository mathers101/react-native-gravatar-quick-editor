import { QuickEditorError } from '../errors';
import { parseQuickEditorOptions } from '../options';

const oauth = {
  clientId: 'client-id',
  redirectUri: 'https://example.com/redirect-url',
};

describe('parseQuickEditorOptions', () => {
  it('defaults an omitted scope to the avatar picker', () => {
    const parsed = parseQuickEditorOptions({
      email: ' User@Example.com ',
      oauth,
    });

    expect(parsed.native).toMatchObject({
      email: 'User@Example.com',
      scope: 'avatars',
      avatarContentLayout: 'horizontal',
      aboutFields: [],
      initialPage: 'avatars',
      colorScheme: 'system',
      clientId: 'client-id',
      redirectUri: 'https://example.com/redirect-url',
      authToken: null,
      apiKey: null,
    });
  });

  it('maps avatars and about to the combined native scope', () => {
    const parsed = parseQuickEditorOptions({
      email: 'user@example.com',
      scope: ['about', 'avatars'],
      avatarContentLayout: 'vertical',
      aboutFields: ['display_name', 'about_me'],
      initialPage: 'about',
      colorScheme: 'dark',
      authToken: 'token',
      apiKey: 'api-key',
    });

    expect(parsed.native.scope).toBe('avatars_and_about');
    expect(parsed.native.avatarContentLayout).toBe('vertical');
    expect(parsed.native.aboutFields).toEqual(['display_name', 'about_me']);
    expect(parsed.native.initialPage).toBe('about');
    expect(parsed.native.colorScheme).toBe('dark');
    expect(parsed.native.authToken).toBe('token');
    expect(parsed.native.apiKey).toBe('api-key');
    expect(parsed.native.clientId).toBeNull();
  });

  it('lets open(email) override the constructor email', () => {
    const parsed = parseQuickEditorOptions(
      { email: 'first@example.com', oauth },
      'second@example.com'
    );
    expect(parsed.native.email).toBe('second@example.com');
  });

  it('rejects web scopes the mobile SDKs do not implement', () => {
    expect(() =>
      parseQuickEditorOptions({
        email: 'user@example.com',
        scope: ['avatars', 'links', 'privacy'],
        oauth,
      })
    ).toThrow(QuickEditorError);

    try {
      parseQuickEditorOptions({
        email: 'user@example.com',
        scope: ['wallet'],
        oauth,
      });
    } catch (error) {
      expect(error).toBeInstanceOf(QuickEditorError);
      expect((error as QuickEditorError).code).toBe('unsupported_scope');
    }
  });

  it('rejects a web locale because the native editors have no locale parameter', () => {
    expect(() =>
      parseQuickEditorOptions({
        email: 'user@example.com',
        locale: 'en',
        oauth,
      })
    ).toThrow(
      expect.objectContaining({
        code: 'unsupported_option',
      })
    );
  });

  it('requires an email', () => {
    expect(() => parseQuickEditorOptions({ oauth })).toThrow(
      expect.objectContaining({ code: 'missing_email' })
    );
  });

  it('requires oauth or an access token', () => {
    expect(() =>
      parseQuickEditorOptions({ email: 'user@example.com' })
    ).toThrow(expect.objectContaining({ code: 'missing_auth' }));
  });

  it('rejects a non-https redirect URL', () => {
    expect(() =>
      parseQuickEditorOptions({
        email: 'user@example.com',
        oauth: {
          clientId: 'client-id',
          redirectUri: 'myapp://oauth',
        },
      })
    ).toThrow(expect.objectContaining({ code: 'invalid_redirect_uri' }));
  });

  it('rejects initialPage unless both native scopes are requested', () => {
    expect(() =>
      parseQuickEditorOptions({
        email: 'user@example.com',
        scope: ['avatars'],
        initialPage: 'about',
        oauth,
      })
    ).toThrow(
      expect.objectContaining({ code: 'initial_page_requires_both_scopes' })
    );
  });

  it('rejects an about field the SDKs do not define', () => {
    expect(() =>
      parseQuickEditorOptions({
        email: 'user@example.com',
        scope: ['about'],
        aboutFields: ['display_name', 'not_a_field' as 'display_name'],
        oauth,
      })
    ).toThrow(expect.objectContaining({ code: 'invalid_about_field' }));
  });
});
