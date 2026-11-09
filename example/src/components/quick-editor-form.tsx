import { useState } from 'react';
import { Button, StyleSheet } from 'react-native';
import {
  openQuickEditor,
  QuickEditorError,
  type QuickEditorSessionResult,
} from 'react-native-gravatar-quick-editor';

import { ThemedText } from '@/components/themed-text';
import { ThemeToggle } from '@/components/theme-toggle';
import { TextField } from '@/components/ui/text-field';
import { Spacing } from '@/constants/theme';

const REDIRECT_URI = process.env.EXPO_PUBLIC_GRAVATAR_REDIRECT_URI ?? '';
const CLIENT_ID = process.env.EXPO_PUBLIC_GRAVATAR_CLIENT_ID ?? '';

export function QuickEditorForm() {
  const [email, setEmail] = useState('');
  const [clientId, setClientId] = useState(CLIENT_ID);
  const [redirectUri, setRedirectUri] = useState(REDIRECT_URI);
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
        scope: ['avatars'],
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
    <>
      <ThemedText style={styles.title}>Gravatar Quick Editor</ThemedText>
      <ThemeToggle />
      <TextField label="Email" onChangeText={setEmail} value={email} />
      <TextField
        label="OAuth client id"
        onChangeText={setClientId}
        value={clientId}
      />
      <TextField
        autoCapitalize="none"
        label="HTTPS redirect URL"
        onChangeText={setRedirectUri}
        value={redirectUri}
      />
      <TextField
        label="API key (optional)"
        onChangeText={setApiKey}
        secureTextEntry
        value={apiKey}
      />
      <TextField
        label="Access token (optional, skips OAuth)"
        onChangeText={setAuthToken}
        secureTextEntry
        value={authToken}
      />
      <Button
        onPress={() => {
          onOpen().catch(() => undefined);
        }}
        title="Edit Gravatar"
      />
      <ThemedText style={styles.status}>{status}</ThemedText>
      <ThemedText themeColor="textSecondary" type="small">
        {detail}
      </ThemedText>
    </>
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
  title: {
    fontSize: 22,
    fontWeight: '600',
  },
  status: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: Spacing.two,
  },
});
