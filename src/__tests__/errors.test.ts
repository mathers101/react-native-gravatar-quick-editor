import {
  QuickEditorError,
  isQuickEditorErrorCode,
  mapNativeRejection,
} from '../errors';

describe('error mapping', () => {
  it('preserves documented native rejection codes', () => {
    const error = mapNativeRejection(
      'activity_unavailable',
      'No foreground activity.'
    );
    expect(error).toBeInstanceOf(QuickEditorError);
    expect(error.code).toBe('activity_unavailable');
    expect(error.message).toBe('No foreground activity.');
  });

  it('maps an unknown native code to native_error', () => {
    const error = mapNativeRejection('EUNSPECIFIED', undefined);
    expect(error.code).toBe('native_error');
    expect(error.message).toContain('native code');
  });

  it('recognizes the public error codes', () => {
    expect(isQuickEditorErrorCode('oauth_failed')).toBe(true);
    expect(isQuickEditorErrorCode('invalid_token')).toBe(true);
    expect(isQuickEditorErrorCode('not_a_code')).toBe(false);
  });
});
