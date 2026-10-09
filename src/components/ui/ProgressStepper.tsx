/**
 * ProgressStepper Component
 * Multi-step visual tracker for rescue workflows, multi-step forms, and deliveries
 */

import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../design-system/colors';
import { typography } from '../../design-system/typography';
import { radius } from '../../design-system/radius';

export interface StepItem {
  key: string;
  label: string;
}

export interface ProgressStepperProps {
  steps: StepItem[];
  currentStepIndex: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export const ProgressStepper: React.FC<ProgressStepperProps> = ({
  steps,
  currentStepIndex,
  style,
  testID,
}) => {
  return (
    <View testID={testID} style={[styles.container, style]}>
      {steps.map((step, index) => {
        const isCompleted = index < currentStepIndex;
        const isCurrent = index === currentStepIndex;
        const isUpcoming = index > currentStepIndex;

        return (
          <React.Fragment key={step.key}>
            {/* Step node */}
            <View style={styles.stepColumn}>
              <View
                style={[
                  styles.circle,
                  isCompleted && styles.completedCircle,
                  isCurrent && styles.currentCircle,
                  isUpcoming && styles.upcomingCircle,
                ]}
              >
                {isCompleted ? (
                  <Ionicons name="checkmark" size={14} color={colors.text.inverse} />
                ) : (
                  <Text
                    style={[
                      typography.labelSmall,
                      styles.circleNumber,
                      isCurrent && styles.currentCircleNumber,
                      isUpcoming && styles.upcomingCircleNumber,
                    ]}
                  >
                    {index + 1}
                  </Text>
                )}
              </View>
              <Text
                style={[
                  typography.caption,
                  styles.stepLabel,
                  (isCurrent || isCompleted) && styles.activeStepLabel,
                ]}
                numberOfLines={1}
              >
                {step.label}
              </Text>
            </View>

            {/* Connecting line */}
            {index < steps.length - 1 && (
              <View
                style={[
                  styles.connector,
                  index < currentStepIndex && styles.completedConnector,
                ]}
              />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: 12,
  },
  stepColumn: {
    alignItems: 'center',
    maxWidth: 70,
  },
  circle: {
    width: 26,
    height: 26,
    borderRadius: radius.round,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  completedCircle: {
    backgroundColor: colors.brand.primary,
  },
  currentCircle: {
    backgroundColor: colors.brand[100],
    borderWidth: 2,
    borderColor: colors.brand.primary,
  },
  upcomingCircle: {
    backgroundColor: colors.surface.subtle,
    borderWidth: 1,
    borderColor: colors.surface.borderStrong,
  },
  circleNumber: {
    fontWeight: '700',
  },
  currentCircleNumber: {
    color: colors.brand.primary,
  },
  upcomingCircleNumber: {
    color: colors.text.muted,
  },
  stepLabel: {
    color: colors.text.muted,
    textAlign: 'center',
    fontSize: 11,
  },
  activeStepLabel: {
    color: colors.text.primary,
    fontWeight: '600',
  },
  connector: {
    flex: 1,
    height: 2,
    backgroundColor: colors.surface.borderStrong,
    marginHorizontal: 4,
    marginBottom: 16,
  },
  completedConnector: {
    backgroundColor: colors.brand.primary,
  },
});
