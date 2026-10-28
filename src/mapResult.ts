import { dismissErrorMessage, QuickEditorError } from './errors';
import type {
  GravatarProfile,
  NativeSessionEvent,
  QuickEditorClose,
  QuickEditorSessionResult,
  QuickEditorUpdate,
} from './types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function expectString(value: unknown, field: string): string {
  if (typeof value !== 'string') {
    throw new QuickEditorError(
      'native_error',
      `Profile field ${field} was not a string.`
    );
  }
  return value;
}

function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function optionalNumber(value: unknown): number | undefined {
  return typeof value === 'number' ? value : undefined;
}

function optionalBoolean(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined;
}

export function mapProfile(value: unknown): GravatarProfile {
  if (!isRecord(value)) {
    throw new QuickEditorError(
      'native_error',
      'About editor result did not include a profile object.'
    );
  }

  const verified = Array.isArray(value.verified_accounts)
    ? value.verified_accounts.filter(isRecord).map((account) => ({
        service_type: expectString(account.service_type, 'service_type'),
        service_label: expectString(account.service_label, 'service_label'),
        service_icon: expectString(account.service_icon, 'service_icon'),
        url: expectString(account.url, 'url'),
        is_hidden: account.is_hidden === true,
      }))
    : [];

  const profile: GravatarProfile = {
    hash: expectString(value.hash, 'hash'),
    display_name: expectString(value.display_name, 'display_name'),
    profile_url: expectString(value.profile_url, 'profile_url'),
    avatar_url: expectString(value.avatar_url, 'avatar_url'),
    avatar_alt_text: expectString(value.avatar_alt_text, 'avatar_alt_text'),
    location: expectString(value.location, 'location'),
    description: expectString(value.description, 'description'),
    job_title: expectString(value.job_title, 'job_title'),
    company: expectString(value.company, 'company'),
    verified_accounts: verified,
    pronunciation: expectString(value.pronunciation, 'pronunciation'),
    pronouns: expectString(value.pronouns, 'pronouns'),
  };

  const userId = optionalNumber(value.user_id);
  if (userId != null) {
    profile.user_id = userId;
  }
  const userLogin = optionalString(value.user_login);
  if (userLogin != null) {
    profile.user_login = userLogin;
  }
  const timezone = optionalString(value.timezone);
  if (timezone != null) {
    profile.timezone = timezone;
  }
  if (Array.isArray(value.languages)) {
    profile.languages = value.languages.filter(isRecord).map((language) => ({
      code: expectString(language.code, 'code'),
      name: expectString(language.name, 'name'),
      is_primary: language.is_primary === true,
      order: optionalNumber(language.order) ?? 0,
    }));
  }
  const firstName = optionalString(value.first_name);
  if (firstName != null) {
    profile.first_name = firstName;
  }
  const lastName = optionalString(value.last_name);
  if (lastName != null) {
    profile.last_name = lastName;
  }
  const isOrganization = optionalBoolean(value.is_organization);
  if (isOrganization != null) {
    profile.is_organization = isOrganization;
  }
  const headerImage = optionalString(value.header_image);
  if (headerImage != null) {
    profile.header_image = headerImage;
  }
  const backgroundColor = optionalString(value.background_color);
  if (backgroundColor != null) {
    profile.background_color = backgroundColor;
  }
  if (Array.isArray(value.links)) {
    profile.links = value.links.filter(isRecord).map((link) => ({
      label: expectString(link.label, 'label'),
      url: expectString(link.url, 'url'),
    }));
  }
  if (Array.isArray(value.interests)) {
    profile.interests = value.interests.filter(isRecord).map((interest) => ({
      id: optionalNumber(interest.id) ?? 0,
      name: expectString(interest.name, 'name'),
    }));
  }
  if (isRecord(value.payments)) {
    profile.payments = {
      links: Array.isArray(value.payments.links)
        ? value.payments.links.filter(isRecord).map((link) => ({
            label: expectString(link.label, 'label'),
            url: expectString(link.url, 'url'),
          }))
        : [],
      crypto_wallets: Array.isArray(value.payments.crypto_wallets)
        ? value.payments.crypto_wallets.filter(isRecord).map((wallet) => ({
            label: expectString(wallet.label, 'label'),
            address: expectString(wallet.address, 'address'),
          }))
        : [],
    };
  }
  if (isRecord(value.contact_info)) {
    const contact = value.contact_info;
    profile.contact_info = {
      ...(optionalString(contact.home_phone) != null
        ? { home_phone: optionalString(contact.home_phone) }
        : {}),
      ...(optionalString(contact.work_phone) != null
        ? { work_phone: optionalString(contact.work_phone) }
        : {}),
      ...(optionalString(contact.cell_phone) != null
        ? { cell_phone: optionalString(contact.cell_phone) }
        : {}),
      ...(optionalString(contact.email) != null
        ? { email: optionalString(contact.email) }
        : {}),
      ...(optionalString(contact.contact_form) != null
        ? { contact_form: optionalString(contact.contact_form) }
        : {}),
      ...(optionalString(contact.calendar) != null
        ? { calendar: optionalString(contact.calendar) }
        : {}),
    };
  }
  if (Array.isArray(value.gallery)) {
    profile.gallery = value.gallery.filter(isRecord).map((image) => {
      const alt = optionalString(image.alt_text);
      return {
        url: expectString(image.url, 'url'),
        ...(alt != null ? { alt_text: alt } : {}),
      };
    });
  }
  const numberVerified = optionalNumber(value.number_verified_accounts);
  if (numberVerified != null) {
    profile.number_verified_accounts = numberVerified;
  }
  const lastEdit = optionalString(value.last_profile_edit);
  if (lastEdit != null) {
    profile.last_profile_edit = lastEdit;
  }
  const registered = optionalString(value.registration_date);
  if (registered != null) {
    profile.registration_date = registered;
  }
  if (isRecord(value.section_visibility)) {
    const section = value.section_visibility;
    profile.section_visibility = {
      ...(optionalBoolean(section.hidden_contact_info) != null
        ? { hidden_contact_info: optionalBoolean(section.hidden_contact_info) }
        : {}),
      ...(optionalBoolean(section.hidden_links) != null
        ? { hidden_links: optionalBoolean(section.hidden_links) }
        : {}),
      ...(optionalBoolean(section.hidden_interests) != null
        ? { hidden_interests: optionalBoolean(section.hidden_interests) }
        : {}),
      ...(optionalBoolean(section.hidden_wallet) != null
        ? { hidden_wallet: optionalBoolean(section.hidden_wallet) }
        : {}),
      ...(optionalBoolean(section.hidden_photos) != null
        ? { hidden_photos: optionalBoolean(section.hidden_photos) }
        : {}),
      ...(optionalBoolean(section.hidden_verified_accounts) != null
        ? {
            hidden_verified_accounts: optionalBoolean(
              section.hidden_verified_accounts
            ),
          }
        : {}),
    };
  }

  return profile;
}

export function mapUpdate(value: unknown): QuickEditorUpdate {
  if (!isRecord(value) || typeof value.type !== 'string') {
    throw new QuickEditorError(
      'native_error',
      'Quick Editor update was not an avatar or profile result.'
    );
  }

  if (value.type === 'avatar_updated') {
    return { type: 'avatar_updated' };
  }

  if (value.type === 'profile_updated') {
    return {
      type: 'profile_updated',
      profile: mapProfile(value.profile),
    };
  }

  throw new QuickEditorError(
    'native_error',
    `Unknown Quick Editor update type "${value.type}".`
  );
}

function mapClose(value: {
  dismissReason?: unknown;
  source?: unknown;
}): QuickEditorClose {
  const reason = value.dismissReason;
  if (
    reason !== 'finished' &&
    reason !== 'oauth_failed' &&
    reason !== 'invalid_token'
  ) {
    throw new QuickEditorError(
      'native_error',
      'Quick Editor dismiss reason was not finished, oauth_failed, or invalid_token.'
    );
  }

  return {
    reason,
    source: value.source === 'app' ? 'app' : 'user',
  };
}

export function mapSessionEvent(value: unknown): NativeSessionEvent {
  if (!isRecord(value) || typeof value.kind !== 'string') {
    throw new QuickEditorError(
      'native_error',
      'Quick Editor session event was malformed.'
    );
  }

  if (
    value.kind !== 'opened' &&
    value.kind !== 'update' &&
    value.kind !== 'closed'
  ) {
    throw new QuickEditorError(
      'native_error',
      `Unknown Quick Editor session event "${value.kind}".`
    );
  }

  const event: NativeSessionEvent = { kind: value.kind };
  if (
    value.updateType === 'avatar_updated' ||
    value.updateType === 'profile_updated'
  ) {
    event.updateType = value.updateType;
  }
  if (value.profile != null) {
    event.profile = mapProfile(value.profile);
  }
  if (
    value.dismissReason === 'finished' ||
    value.dismissReason === 'oauth_failed' ||
    value.dismissReason === 'invalid_token'
  ) {
    event.dismissReason = value.dismissReason;
  }
  if (value.source === 'user' || value.source === 'app') {
    event.source = value.source;
  }
  return event;
}

export function mapSessionResult(value: unknown): QuickEditorSessionResult {
  if (!isRecord(value)) {
    throw new QuickEditorError(
      'native_error',
      'Quick Editor session result was malformed.'
    );
  }

  const updates = Array.isArray(value.updates)
    ? value.updates.map(mapUpdate)
    : [];
  const close = mapClose(value);

  if (value.status === 'success') {
    return { status: 'success', updates, close };
  }

  if (value.status === 'cancelled') {
    return { status: 'cancelled', updates, close };
  }

  if (value.status === 'error') {
    const code =
      value.errorCode === 'invalid_token' || close.reason === 'invalid_token'
        ? 'invalid_token'
        : 'oauth_failed';
    const message =
      typeof value.errorMessage === 'string'
        ? value.errorMessage
        : dismissErrorMessage(code);
    return {
      status: 'error',
      updates,
      close: { ...close, reason: code },
      error: { code, message },
    };
  }

  throw new QuickEditorError(
    'native_error',
    'Quick Editor session status was not success, cancelled, or error.'
  );
}

export function parseJson(text: string, label: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new QuickEditorError('native_error', `${label} was not valid JSON.`);
  }
}
