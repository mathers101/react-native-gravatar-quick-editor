/**
 * Web Quick Editor scope values from `@gravatar-com/quick-editor`.
 * Native SDKs only implement `avatars` and `about`.
 */
export const WEB_QUICK_EDITOR_SCOPES = [
  'about',
  'avatars',
  'verified-accounts',
  'links',
  'interests',
  'contact-info',
  'wallet',
  'photos',
  'design',
  'privacy',
] as const;

export type WebQuickEditorScope = (typeof WEB_QUICK_EDITOR_SCOPES)[number];

/** Scopes the Android 2.5.1 and iOS 3.4.0 Quick Editors actually expose. */
export const NATIVE_QUICK_EDITOR_SCOPES = ['avatars', 'about'] as const;

export type NativeQuickEditorScope =
  (typeof NATIVE_QUICK_EDITOR_SCOPES)[number];

/**
 * Web `onProfileUpdated` argument.
 * `avatar_updated` matches `AvatarPickerResult` / `QuickEditorUpdate.Avatar`.
 * `profile_updated` matches `AboutEditorResult` / `QuickEditorUpdate.AboutInfo`.
 */
export type ProfileUpdatedType = 'avatar_updated' | 'profile_updated';

export type AvatarContentLayout = 'horizontal' | 'vertical';

export type QuickEditorColorScheme = 'light' | 'dark' | 'system';

/** About fields shared by Android `AboutInputField` and iOS `AboutInfoField`. */
export const ABOUT_FIELDS = [
  'display_name',
  'about_me',
  'pronunciation',
  'pronouns',
  'location',
  'job_title',
  'company',
  'first_name',
  'last_name',
] as const;

export type AboutField = (typeof ABOUT_FIELDS)[number];

export type InitialPage = 'avatars' | 'about';

/**
 * Android `GravatarQuickEditorDismissReason`, plus iOS `onDismiss`.
 * iOS does not publish a reason, so iOS dismissals are reported as `finished`.
 */
export type QuickEditorDismissReason =
  'finished' | 'oauth_failed' | 'invalid_token';

export type QuickEditorCloseSource = 'user' | 'app';

export type QuickEditorErrorCode =
  | 'missing_email'
  | 'unsupported_scope'
  | 'unsupported_option'
  | 'invalid_about_field'
  | 'initial_page_requires_both_scopes'
  | 'missing_auth'
  | 'invalid_redirect_uri'
  | 'already_open'
  | 'activity_unavailable'
  | 'presenter_unavailable'
  | 'oauth_failed'
  | 'invalid_token'
  | 'native_error';

export type VerifiedAccount = {
  service_type: string;
  service_label: string;
  service_icon: string;
  url: string;
  is_hidden: boolean;
};

export type ProfileLink = {
  label: string;
  url: string;
};

export type ProfileInterest = {
  id: number;
  name: string;
};

export type ProfileLanguage = {
  code: string;
  name: string;
  is_primary: boolean;
  order: number;
};

export type GalleryImage = {
  url: string;
  alt_text?: string;
};

export type CryptoWalletAddress = {
  label: string;
  address: string;
};

export type ProfilePayments = {
  links: ProfileLink[];
  crypto_wallets: CryptoWalletAddress[];
};

export type ProfileContactInfo = {
  home_phone?: string;
  work_phone?: string;
  cell_phone?: string;
  email?: string;
  contact_form?: string;
  calendar?: string;
};

/** Present on the Android OpenAPI model. The iOS 3.4.0 `Profile` type does not include it. */
export type ProfileSectionVisibility = {
  hidden_contact_info?: boolean;
  hidden_links?: boolean;
  hidden_interests?: boolean;
  hidden_wallet?: boolean;
  hidden_photos?: boolean;
  hidden_verified_accounts?: boolean;
};

/**
 * Profile payload returned by the native About editor.
 * Field names follow the Gravatar OpenAPI model both SDKs generate.
 * Optional fields are omitted when the SDK does not return them.
 */
export type GravatarProfile = {
  hash: string;
  display_name: string;
  profile_url: string;
  avatar_url: string;
  avatar_alt_text: string;
  location: string;
  description: string;
  job_title: string;
  company: string;
  verified_accounts: VerifiedAccount[];
  pronunciation: string;
  pronouns: string;
  user_id?: number;
  user_login?: string;
  timezone?: string;
  languages?: ProfileLanguage[];
  first_name?: string;
  last_name?: string;
  is_organization?: boolean;
  header_image?: string;
  background_color?: string;
  links?: ProfileLink[];
  interests?: ProfileInterest[];
  payments?: ProfilePayments;
  contact_info?: ProfileContactInfo;
  gallery?: GalleryImage[];
  number_verified_accounts?: number;
  last_profile_edit?: string;
  registration_date?: string;
  section_visibility?: ProfileSectionVisibility;
};

export type AvatarUpdated = {
  type: 'avatar_updated';
};

export type ProfileUpdated = {
  type: 'profile_updated';
  profile: GravatarProfile;
};

export type QuickEditorUpdate = AvatarUpdated | ProfileUpdated;

export type QuickEditorOAuth = {
  /** WordPress.com / Gravatar application client id. */
  clientId: string;
  /**
   * Redirect URL registered on the application.
   * Both mobile SDKs require `https`. Custom URL schemes are rejected by the server.
   */
  redirectUri: string;
};

/**
 * Options aligned with web `QuickEditorCoreOptions`, plus the OAuth
 * parameters the native Quick Editors require.
 */
export type QuickEditorCoreOptions = {
  /** Email of the Gravatar account to edit. May also be passed to `open`. */
  email?: string;
  /**
   * Web scope list. Only `avatars` and `about` can be opened.
   * Any other documented web scope fails with `unsupported_scope`.
   * Omitted scope defaults to `['avatars']`, matching the native avatar picker default.
   */
  scope?: readonly WebQuickEditorScope[];
  /**
   * Web option. Neither mobile Quick Editor documents a locale parameter.
   * A non-empty value fails with `unsupported_option`.
   */
  locale?: string;
  onProfileUpdated?: (
    type: ProfileUpdatedType,
    update: QuickEditorUpdate
  ) => void;
  onOpened?: () => void;
  onClosed?: (close: QuickEditorClose) => void;
  /**
   * Let the native Quick Editor run the implicit OAuth flow.
   * Required unless `authToken` is set.
   */
  oauth?: QuickEditorOAuth;
  /**
   * Existing OAuth access token (`AuthenticationMethod.Bearer` on Android,
   * `authToken` / `token` on iOS). When set, the SDK does not start OAuth.
   */
  authToken?: string;
  /**
   * Gravatar API key passed to `Gravatar.apiKey` (Android 2.5.1) and
   * `Configuration.shared.configure(with:)` (iOS). The Quick Editor itself
   * authorizes with OAuth or `authToken`, not this key.
   */
  apiKey?: string;
  /** Avatar grid direction. Defaults to `horizontal`. */
  avatarContentLayout?: AvatarContentLayout;
  /**
   * About fields to show. Omitted or empty means every field the SDK enables
   * by default (`AboutInputField.all` / `AboutInfoField.all`).
   */
  aboutFields?: readonly AboutField[];
  /**
   * First page when both `avatars` and `about` are in scope.
   * Defaults to `avatars`.
   */
  initialPage?: InitialPage;
  /** `GravatarUiMode` on Android and `UIUserInterfaceStyle` on iOS. */
  colorScheme?: QuickEditorColorScheme;
};

export type QuickEditorClose = {
  reason: QuickEditorDismissReason;
  source: QuickEditorCloseSource;
};

export type QuickEditorSessionResult =
  | {
      status: 'success';
      updates: QuickEditorUpdate[];
      close: QuickEditorClose;
    }
  | {
      status: 'cancelled';
      updates: QuickEditorUpdate[];
      close: QuickEditorClose;
    }
  | {
      status: 'error';
      updates: QuickEditorUpdate[];
      close: QuickEditorClose;
      error: {
        code: 'oauth_failed' | 'invalid_token';
        message: string;
      };
    };

/** JSON passed across the Turbo Module boundary. */
export type NativeOpenOptions = {
  email: string;
  scope: 'avatars' | 'about' | 'avatars_and_about';
  avatarContentLayout: AvatarContentLayout;
  aboutFields: AboutField[];
  initialPage: InitialPage;
  colorScheme: QuickEditorColorScheme;
  clientId: string | null;
  redirectUri: string | null;
  authToken: string | null;
  apiKey: string | null;
};

export type NativeSessionEvent = {
  kind: 'opened' | 'update' | 'closed';
  updateType?: ProfileUpdatedType;
  profile?: GravatarProfile;
  dismissReason?: QuickEditorDismissReason;
  source?: QuickEditorCloseSource;
};

export type NativeSessionResult = {
  status: 'success' | 'cancelled' | 'error';
  dismissReason: QuickEditorDismissReason;
  source: QuickEditorCloseSource;
  updates: QuickEditorUpdate[];
  errorCode?: 'oauth_failed' | 'invalid_token';
  errorMessage?: string;
};
