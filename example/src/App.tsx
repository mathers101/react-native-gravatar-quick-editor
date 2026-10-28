import { useState } from 'react';
import {
  Button,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  openQuickEditor,
  QuickEditorError,
  type QuickEditorSessionResult,
} from 'react-native-gravatar-quick-editor';

export default function App() {
  const [email, setEmail] = useState('');
  const [clientId, setClientId] = useState('');
  const [redirectUri, setRedirectUri] = useState(
    'https://gravatar-quick-editor.example/redirect-url'
  );
  const [apiKey, setApiKey] = useState('');
  const [authToken, setAuthToken] = useState('');
  const [status, setStatus] = useState('Idle');
  const [detail, setDetail] = useState(
    'Open the native Quick Editor after you create a Gravatar OAuth application.'
  );

  async function onOpen() {
    setStatus('Opening');
    setDetail('');
    try {
      const result = await openQuickEditor({
        email,
        scope: ['avatars', 'about'],
        oauth:
          clientId.trim().length > 0
            ? { clientId: clientId.trim(), redirectUri: redirectUri.trim() }
            : undefined,
        authToken: authToken.trim().length > 0 ? authToken.trim() : undefined,
        apiKey: apiKey.trim().length > 0 ? apiKey.trim() : undefined,
        onOpened: () => setStatus('Open'),
        onProfileUpdated: (type) => setStatus(`Updated: ${type}`),
        onClosed: (close) =>
          setStatus(`Closed (${close.reason}, ${close.source})`),
      });
      setDetail(describe(result));
    } catch (error) {
      if (error instanceof QuickEditorError) {
        setStatus(`Error: ${error.code}`);
        setDetail(error.message);
        return;
      }
      setStatus('Error');
      setDetail(error instanceof Error ? error.message : 'Unknown error');
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Gravatar Quick Editor</Text>
      <Field label="Email" value={email} onChangeText={setEmail} />
      <Field
        label="OAuth client id"
        value={clientId}
        onChangeText={setClientId}
      />
      <Field
        label="HTTPS redirect URL"
        value={redirectUri}
        onChangeText={setRedirectUri}
        autoCapitalize="none"
      />
      <Field
        label="API key (optional)"
        value={apiKey}
        onChangeText={setApiKey}
        secureTextEntry
      />
      <Field
        label="Access token (optional, skips OAuth)"
        value={authToken}
        onChangeText={setAuthToken}
        secureTextEntry
      />
      <Button
        title="Edit Gravatar"
        onPress={() => {
          onOpen().catch(() => undefined);
        }}
      />
      <Text style={styles.status}>{status}</Text>
      <Text style={styles.detail}>{detail}</Text>
    </ScrollView>
  );
}

function Field({
  label,
  value,
  onChangeText,
  secureTextEntry,
  autoCapitalize,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences';
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        autoCapitalize={autoCapitalize ?? 'none'}
        autoCorrect={false}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        style={styles.input}
        value={value}
      />
    </View>
  );
}

function describe(result: QuickEditorSessionResult): string {
  const updates = result.updates
    .map((update) =>
      update.type === 'profile_updated'
        ? `profile_updated (${update.profile.display_name})`
        : 'avatar_updated'
    )
    .join(', ');
  if (result.status === 'error') {
    return `${result.error.code}: ${result.error.message}`;
  }
  if (result.status === 'cancelled') {
    return 'Cancelled. The sheet closed without an avatar or about update.';
  }
  return updates.length > 0 ? `Saved: ${updates}` : 'Saved.';
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    paddingTop: 72,
    gap: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
  },
  field: {
    gap: 4,
  },
  label: {
    fontSize: 13,
  },
  input: {
    borderColor: '#ccc',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  status: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  detail: {
    fontSize: 14,
    lineHeight: 20,
  },
});
