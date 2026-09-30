/**
 * LoadingOverlay Component
 * Full-screen or container-level modal glass loading state
 */

import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ActivityIndicator,
  Modal,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { GlassSurface } from './GlassSurface';
import { colors } from '../../design-system/colors';
import { typography } from '../../design-system/typography';
import { spacing } from '../../design-system/spacing';
import { radius } from '../../design-system/radius';

export interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
  style?: StyleProp<ViewStyle>;
  fullScreen?: boolean;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  visible,
  message = 'Processing...',
  style,
  fullScreen = true,
}) => {
  if (!visible) return null;

  const content = (
    <View style={styles.overlayContainer}>
      <GlassSurface variant="modal" style={[styles.dialogSurface, style]}>
        <View style={styles.innerBox}>
          <ActivityIndicator size="large" color={colors.brand.primary} />
          {message && (
            <Text style={[typography.titleMedium, styles.messageText]}>
              {message}
            </Text>
          )}
        </View>
      </GlassSurface>
    </View>
  );

  if (fullScreen) {
    return (
      <Modal transparent visible={visible} animationType="fade">
        {content}
      </Modal>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  overlayContainer: {
    ...StyleSheet.absoluteFill as any,
    backgroundColor: 'rgba(11, 61, 53, 0.30)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  dialogSurface: {
    borderRadius: radius['2xl'],
    minWidth: 200,
  },
  innerBox: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageText: {
    color: colors.text.primary,
    marginTop: spacing.md,
    textAlign: 'center',
  },
});
