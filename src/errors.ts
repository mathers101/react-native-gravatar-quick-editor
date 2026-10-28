import type { QuickEditorErrorCode } from './types';

export class QuickEditorError extends Error {
  readonly code: QuickEditorErrorCode;

  constructor(code: QuickEditorErrorCode, message: string) {
    super(message);
    this.name = 'QuickEditorError';
    this.code = code;
  }
}

const KNOWN_CODES = new Set<QuickEditorErrorCode>([
  'missing_email',
  'unsupported_scope',
  'unsupported_option',
  'invalid_about_field',
  'initial_page_requires_both_scopes',
  'missing_auth',
  'invalid_redirect_uri',
  'already_open',
  'activity_unavailable',
  'presenter_unavailable',
  'oauth_failed',
  'invalid_token',
  'native_error',
]);

export function isQuickEditorErrorCode(
  value: string
): value is QuickEditorErrorCode {
  return KNOWN_CODES.has(value as QuickEditorErrorCode);
}

export function mapNativeRejection(
  code: string | undefined,
  message: string | undefined
): QuickEditorError {
  if (code != null && isQuickEditorErrorCode(code)) {
    return new QuickEditorError(
      code,
      message ?? `Gravatar Quick Editor failed (${code}).`
    );
  }

  return new QuickEditorError(
    'native_error',
    message ?? 'Gravatar Quick Editor failed in native code.'
  );
}

export function dismissErrorMessage(
  code: 'oauth_failed' | 'invalid_token'
): string {
  if (code === 'oauth_failed') {
    return 'Gravatar OAuth failed. Check the client id, the https redirect URL, and the App Link or Universal Link setup.';
  }
  return 'The Gravatar access token is missing, invalid, or expired.';
}
