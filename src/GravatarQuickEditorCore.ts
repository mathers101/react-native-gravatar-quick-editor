import { mapNativeRejection } from './errors';
import { mapSessionEvent, mapSessionResult, parseJson } from './mapResult';
import NativeGravatarQuickEditor from './NativeGravatarQuickEditor';
import { parseQuickEditorOptions } from './options';
import type { QuickEditorCoreOptions, QuickEditorSessionResult } from './types';

/**
 * Native counterpart of web `GravatarQuickEditorCore`.
 *
 * `open` returns a promise that settles when the native sheet closes.
 * The web method returns a boolean immediately; a rejected promise is the
 * explicit failure to open, and the resolved value is the session outcome.
 */
export class GravatarQuickEditorCore {
  private readonly options: QuickEditorCoreOptions;
  private subscription: { remove: () => void } | null = null;
  private session: Promise<QuickEditorSessionResult> | null = null;

  constructor(options: QuickEditorCoreOptions = {}) {
    this.options = options;
  }

  isOpen(): boolean {
    return NativeGravatarQuickEditor.isOpen();
  }

  open(email?: string): Promise<QuickEditorSessionResult> {
    if (this.session != null || NativeGravatarQuickEditor.isOpen()) {
      return Promise.reject(
        mapNativeRejection(
          'already_open',
          'The Gravatar Quick Editor is already open.'
        )
      );
    }

    let nativeJson: string;
    try {
      nativeJson = JSON.stringify(
        parseQuickEditorOptions(this.options, email).native
      );
    } catch (error) {
      return Promise.reject(error);
    }

    this.subscription = NativeGravatarQuickEditor.onSessionEvent((payload) => {
      this.dispatchEvent(payload);
    });

    this.session = NativeGravatarQuickEditor.open(nativeJson)
      .then((resultJson) =>
        mapSessionResult(parseJson(resultJson, 'Session result'))
      )
      .catch((error: unknown) => {
        throw normalizeOpenError(error);
      })
      .finally(() => {
        this.subscription?.remove();
        this.subscription = null;
        this.session = null;
      });

    return this.session;
  }

  /** Dismisses the sheet this module presented. No-op when nothing is open. */
  close(): void {
    if (!NativeGravatarQuickEditor.isOpen()) {
      return;
    }
    NativeGravatarQuickEditor.close();
  }

  /**
   * Android `GravatarQuickEditor.logout` and iOS `OAuthSession.deleteSession`.
   * Call this when the user logs out of the host app.
   */
  logout(email?: string): Promise<void> {
    const address = (email ?? this.options.email ?? '').trim();
    if (address.length === 0) {
      return Promise.reject(
        mapNativeRejection(
          'missing_email',
          'An email address is required to delete the stored Gravatar OAuth session.'
        )
      );
    }
    return NativeGravatarQuickEditor.logout(address);
  }

  private dispatchEvent(payload: string): void {
    let event;
    try {
      event = mapSessionEvent(parseJson(payload, 'Session event'));
    } catch {
      return;
    }

    if (event.kind === 'opened') {
      this.options.onOpened?.();
      return;
    }

    if (event.kind === 'update' && event.updateType != null) {
      if (event.updateType === 'avatar_updated') {
        this.options.onProfileUpdated?.('avatar_updated', {
          type: 'avatar_updated',
        });
      } else if (event.profile != null) {
        this.options.onProfileUpdated?.('profile_updated', {
          type: 'profile_updated',
          profile: event.profile,
        });
      }
      return;
    }

    if (
      event.kind === 'closed' &&
      event.dismissReason != null &&
      this.options.onClosed != null
    ) {
      this.options.onClosed({
        reason: event.dismissReason,
        source: event.source ?? 'user',
      });
    }
  }
}

function normalizeOpenError(error: unknown): unknown {
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof error.code === 'string'
  ) {
    const message =
      'message' in error && typeof error.message === 'string'
        ? error.message
        : undefined;
    return mapNativeRejection(error.code, message);
  }
  return error;
}

export function openQuickEditor(
  options: QuickEditorCoreOptions
): Promise<QuickEditorSessionResult> {
  return new GravatarQuickEditorCore(options).open();
}
