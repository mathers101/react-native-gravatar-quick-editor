import { QuickEditorError } from './errors';
import {
  ABOUT_FIELDS,
  NATIVE_QUICK_EDITOR_SCOPES,
  WEB_QUICK_EDITOR_SCOPES,
  type AboutField,
  type NativeOpenOptions,
  type NativeQuickEditorScope,
  type QuickEditorCoreOptions,
  type WebQuickEditorScope,
} from './types';

const WEB_SCOPE_SET = new Set<string>(WEB_QUICK_EDITOR_SCOPES);
const NATIVE_SCOPE_SET = new Set<string>(NATIVE_QUICK_EDITOR_SCOPES);
const ABOUT_FIELD_SET = new Set<string>(ABOUT_FIELDS);

export type ParsedQuickEditorOptions = {
  native: NativeOpenOptions;
};

function isWebScope(value: string): value is WebQuickEditorScope {
  return WEB_SCOPE_SET.has(value);
}

function isAboutField(value: string): value is AboutField {
  return ABOUT_FIELD_SET.has(value);
}

function assertHttpsRedirect(redirectUri: string): void {
  let parsed: URL;
  try {
    parsed = new URL(redirectUri);
  } catch {
    throw new QuickEditorError(
      'invalid_redirect_uri',
      'oauth.redirectUri must be an https URL registered on the Gravatar application.'
    );
  }

  if (parsed.protocol !== 'https:') {
    throw new QuickEditorError(
      'invalid_redirect_uri',
      'The native Quick Editors use the implicit OAuth flow and only accept https redirect URLs.'
    );
  }
}

export function parseQuickEditorOptions(
  options: QuickEditorCoreOptions,
  emailOverride?: string
): ParsedQuickEditorOptions {
  if (options.locale != null && options.locale.trim() !== '') {
    throw new QuickEditorError(
      'unsupported_option',
      'locale is a web Quick Editor option. Android 2.5.1 and iOS 3.4.0 do not document a Quick Editor locale parameter.'
    );
  }

  const email = (emailOverride ?? options.email ?? '').trim();
  if (email.length === 0) {
    throw new QuickEditorError(
      'missing_email',
      'An email address is required to open the Gravatar Quick Editor.'
    );
  }

  const requested = options.scope ?? ['avatars'];
  if (requested.length === 0) {
    throw new QuickEditorError(
      'unsupported_scope',
      'scope must include avatars, about, or both.'
    );
  }

  const unsupported = requested.filter(
    (scope) => !isWebScope(scope) || !NATIVE_SCOPE_SET.has(scope)
  );
  if (unsupported.length > 0) {
    throw new QuickEditorError(
      'unsupported_scope',
      `Native Quick Editors only implement avatars and about. Unsupported scope: ${unsupported.join(', ')}.`
    );
  }

  const nativeScopes = new Set<NativeQuickEditorScope>(
    requested.filter((scope): scope is NativeQuickEditorScope =>
      NATIVE_SCOPE_SET.has(scope)
    )
  );

  const scope: NativeOpenOptions['scope'] =
    nativeScopes.has('avatars') && nativeScopes.has('about')
      ? 'avatars_and_about'
      : nativeScopes.has('about')
        ? 'about'
        : 'avatars';

  if (options.initialPage != null && scope !== 'avatars_and_about') {
    throw new QuickEditorError(
      'initial_page_requires_both_scopes',
      'initialPage applies only when scope includes both avatars and about.'
    );
  }

  const aboutFields = [...(options.aboutFields ?? [])];
  const invalidField = aboutFields.find((field) => !isAboutField(field));
  if (invalidField != null) {
    throw new QuickEditorError(
      'invalid_about_field',
      `Unknown about field "${String(invalidField)}".`
    );
  }

  const token = options.authToken?.trim() ?? '';
  const clientId = options.oauth?.clientId.trim() ?? '';
  const redirectUri = options.oauth?.redirectUri.trim() ?? '';
  const hasToken = token.length > 0;

  if (!hasToken && clientId.length === 0 && redirectUri.length === 0) {
    throw new QuickEditorError(
      'missing_auth',
      'Pass oauth.clientId and oauth.redirectUri, or an authToken. The native Quick Editor cannot edit a profile without one of those.'
    );
  }

  if (!hasToken && (clientId.length === 0 || redirectUri.length === 0)) {
    throw new QuickEditorError(
      'missing_auth',
      'oauth.clientId and oauth.redirectUri are both required when authToken is omitted.'
    );
  }

  if (!hasToken) {
    assertHttpsRedirect(redirectUri);
  } else if (redirectUri.length > 0) {
    assertHttpsRedirect(redirectUri);
  }

  const layout = options.avatarContentLayout ?? 'horizontal';
  if (layout !== 'horizontal' && layout !== 'vertical') {
    throw new QuickEditorError(
      'unsupported_option',
      'avatarContentLayout must be horizontal or vertical.'
    );
  }

  const colorScheme = options.colorScheme ?? 'system';
  if (
    colorScheme !== 'light' &&
    colorScheme !== 'dark' &&
    colorScheme !== 'system'
  ) {
    throw new QuickEditorError(
      'unsupported_option',
      'colorScheme must be light, dark, or system.'
    );
  }

  const initialPage = options.initialPage ?? 'avatars';
  if (initialPage !== 'avatars' && initialPage !== 'about') {
    throw new QuickEditorError(
      'unsupported_option',
      'initialPage must be avatars or about.'
    );
  }

  return {
    native: {
      email,
      scope,
      avatarContentLayout: layout,
      aboutFields,
      initialPage,
      colorScheme,
      clientId: clientId.length > 0 ? clientId : null,
      redirectUri: redirectUri.length > 0 ? redirectUri : null,
      authToken: hasToken ? token : null,
      apiKey: options.apiKey?.trim() ? options.apiKey.trim() : null,
    },
  };
}
