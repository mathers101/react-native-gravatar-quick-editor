const {
  withAndroidManifest,
  withEntitlementsPlist,
  withProjectBuildGradle,
  createRunOncePlugin,
} = require('@expo/config-plugins');

const MAVEN_A8C = 'https://a8c-libs.s3.amazonaws.com/android';
const MAVEN_JITPACK = `maven {
            url "https://jitpack.io"
            content {
                includeModule("com.github.yalantis", "ucrop")
            }
        }`;

function redirectParts(redirectUri) {
  let url;
  try {
    url = new URL(redirectUri);
  } catch {
    throw new Error(
      'react-native-gravatar-quick-editor: redirectUri must be an https URL.'
    );
  }
  if (url.protocol !== 'https:') {
    throw new Error(
      'react-native-gravatar-quick-editor: the native Quick Editors only accept https redirect URLs.'
    );
  }
  return {
    host: url.host,
    path: url.pathname === '/' ? '' : url.pathname,
  };
}

function withOAuthActivity(config, redirect) {
  return withAndroidManifest(config, (mod) => {
    const application = mod.modResults.manifest.application?.[0];
    if (application == null) {
      throw new Error(
        'react-native-gravatar-quick-editor: AndroidManifest is missing <application>.'
      );
    }
    const activities = application.activity ?? [];
    const name = 'com.gravatar.quickeditor.ui.oauth.GravatarOAuthActivity';
    const data = {
      $: {
        'android:scheme': 'https',
        'android:host': redirect.host,
      },
    };
    if (redirect.path.length > 0) {
      data.$['android:pathPrefix'] = redirect.path;
    }
    const existing = activities.find(
      (activity) => activity.$?.['android:name'] === name
    );
    const intent = {
      $: { 'android:autoVerify': 'true' },
      action: [{ $: { 'android:name': 'android.intent.action.VIEW' } }],
      category: [
        { $: { 'android:name': 'android.intent.category.DEFAULT' } },
        { $: { 'android:name': 'android.intent.category.BROWSABLE' } },
      ],
      data: [data],
    };
    if (existing != null) {
      existing.$['android:exported'] = 'true';
      existing['intent-filter'] = [intent];
    } else {
      activities.push({
        '$': {
          'android:name': name,
          'android:exported': 'true',
          'tools:node': 'merge',
        },
        'intent-filter': [intent],
      });
      application.activity = activities;
    }
    return mod;
  });
}

function withAssociatedDomain(config, host) {
  return withEntitlementsPlist(config, (mod) => {
    const key = 'com.apple.developer.associated-domains';
    const current = Array.isArray(mod.modResults[key])
      ? mod.modResults[key]
      : [];
    const entry = `applinks:${host}`;
    if (!current.includes(entry)) {
      current.push(entry);
    }
    mod.modResults[key] = current;
    return mod;
  });
}

function withGravatarMaven(config) {
  return withProjectBuildGradle(config, (mod) => {
    if (mod.modResults.language !== 'groovy') {
      return mod;
    }
    let contents = mod.modResults.contents;
    if (!contents.includes(MAVEN_A8C)) {
      contents += `
allprojects {
    repositories {
        maven { url "${MAVEN_A8C}" }
        ${MAVEN_JITPACK}
    }
}
`;
    }
    mod.modResults.contents = contents;
    return mod;
  });
}

function withGravatarQuickEditor(config, props = {}) {
  if (typeof props.redirectUri !== 'string' || props.redirectUri.length === 0) {
    throw new Error(
      'react-native-gravatar-quick-editor requires a redirectUri plugin prop. Autolinking cannot register your app-specific https redirect.'
    );
  }
  const redirect = redirectParts(props.redirectUri);
  config = withOAuthActivity(config, redirect);
  config = withAssociatedDomain(config, redirect.host);
  config = withGravatarMaven(config);
  return config;
}

module.exports = createRunOncePlugin(
  withGravatarQuickEditor,
  'react-native-gravatar-quick-editor',
  '0.1.1'
);
