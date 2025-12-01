import React, { type ReactNode, useCallback, useEffect, useState } from 'react';
import { SharedErrorBoundary, Button } from './SharedErrorBoundary';
import { SplashScreen } from 'expo-router/build/exports';
import { DevSettings, LogBox, Platform, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { serializeError } from 'serialize-error';
import { reportErrorToRemote } from './report-error-to-remote';

// Lazy load expo-updates to avoid issues with TurboModules
let Updates: any = null;
const loadUpdates = async () => {
  if (Updates) return Updates;
  try {
    Updates = await import('expo-updates');
    return Updates;
  } catch (e) {
    return null;
  }
};

type ErrorBoundaryState = { hasError: boolean; error: unknown | null; sentLogs: boolean };

const DeviceErrorBoundary = ({
  sentLogs,
}: {
  sentLogs: boolean;
}) => {
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);
  const handleReload = useCallback(async () => {
    if (Platform.OS === 'web') {
      window.location.reload();
      return;
    }

    try {
      const updatesModule = await loadUpdates();
      if (updatesModule) {
        await updatesModule.reloadAsync();
      }
    } catch (error) {
      // no-op, we don't want to show an error here
    }
  }, []);
  return (
    <SharedErrorBoundary
      isOpen
      description={
        sentLogs
          ? 'It looks like an error occurred while trying to use your app. This error has been reported to the AI agent and should be visible to the AI soon. If it is not present please see create.xyz/docs for help'
          : 'It looks like an error occurred while trying to use your app. Please see create.xyz/docs for help'
      }
    >
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Button color="primary" onPress={handleReload}>
          Restart app
        </Button>
      </View>
    </SharedErrorBoundary>
  );
};

export class DeviceErrorBoundaryWrapper extends React.Component<
  {
    children: ReactNode;
  },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false, error: null, sentLogs: false };

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return { hasError: true, error, sentLogs: false };
  }
  componentDidCatch(error: unknown, errorInfo: React.ErrorInfo): void {
    this.setState({ error });
    reportErrorToRemote({ error })
      .then(({ success, error: fetchError }) => {
        this.setState({ hasError: true, sentLogs: success });
      })
      .catch((reportError) => {
        this.setState({ hasError: true, sentLogs: false });
      });
  }

  render() {
    if (this.state.hasError) {
      return <DeviceErrorBoundary sentLogs={this.state.sentLogs} />;
    }
    return this.props.children;
  }
}
