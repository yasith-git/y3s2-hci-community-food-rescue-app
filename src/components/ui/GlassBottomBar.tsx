/**
 * GlassBottomBar Component
 * Floating rounded glass navigation container for bottom tabs
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
import { GlassSurface } from './GlassSurface';
import { AnimatedPressable } from './AnimatedPressable';
import { colors } from '../../design-system/colors';
import { typography } from '../../design-system/typography';
import { spacing } from '../../design-system/spacing';
import { radius } from '../../design-system/radius';

export interface GlassBottomBarTab {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon?: keyof typeof Ionicons.glyphMap;
  badgeCount?: number;
}

export interface GlassBottomBarProps {
  tabs: GlassBottomBarTab[];
  activeKey: string;
  onTabPress: (key: string) => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export const GlassBottomBar: React.FC<GlassBottomBarProps> = ({
  tabs,
  activeKey,
  onTabPress,
  style,
  testID,
}) => {
  return (
    <View testID={testID} style={[styles.outerWrapper, style]}>
      <GlassSurface variant="navigation" style={styles.surface}>
        <View style={styles.tabBar}>
          {tabs.map((tab) => {
            const isActive = tab.key === activeKey;
            const iconName = isActive ? tab.activeIcon || tab.icon : tab.icon;
            const color = isActive ? colors.brand.primary : colors.text.muted;

            return (
              <AnimatedPressable
                key={tab.key}
                onPress={() => onTabPress(tab.key)}
                hapticType="selection"
                accessibilityRole="tab"
                accessibilityState={{ selected: isActive }}
                accessibilityLabel={tab.label}
                style={[styles.tabItem, isActive && styles.activeTabItem]}
              >
                <View style={styles.iconWrapper}>
                  <Ionicons name={iconName} size={22} color={color} />
                  {!!tab.badgeCount && tab.badgeCount > 0 && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>
                        {tab.badgeCount > 99 ? '99+' : tab.badgeCount}
                      </Text>
                    </View>
                  )}
                </View>
                <Text
                  style={[
                    typography.labelSmall,
                    styles.tabLabel,
                    { color },
                    isActive && styles.activeTabLabel,
                  ]}
                  numberOfLines={1}
                >
                  {tab.label}
                </Text>
              </AnimatedPressable>
            );
          })}
        </View>
      </GlassSurface>
    </View>
  );
};

const styles = StyleSheet.create({
  outerWrapper: {
    paddingHorizontal: spacing.screenHorizontal,
    paddingBottom: spacing.sm,
    width: '100%',
  },
  surface: {
    borderRadius: radius.pill,
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.sm,
    minHeight: 64,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  activeTabItem: {
    backgroundColor: 'rgba(35, 132, 113, 0.08)',
  },
  iconWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  tabLabel: {
    fontSize: 10,
  },
  activeTabLabel: {
    fontWeight: '700',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -10,
    backgroundColor: colors.accent.amber,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: colors.text.inverse,
    fontSize: 9,
    fontWeight: '700',
  },
});
