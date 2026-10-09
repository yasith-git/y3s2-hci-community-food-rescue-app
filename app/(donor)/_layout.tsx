/**
 * Donor Bottom Navigation Tabs Layout
 * Uses shared GlassBottomBar across Home, Donations, Impact, and Profile
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Slot, useRouter, usePathname } from 'expo-router';
import { GlassBottomBar } from '../../src/components/ui';

export default function DonorLayout() {
  const router = useRouter();
  const pathname = usePathname();

  const getActiveKey = () => {
    if (pathname.includes('/donations')) return 'donations';
    if (pathname.includes('/impact')) return 'impact';
    if (pathname.includes('/profile')) return 'profile';
    return 'home';
  };

  const handleTabPress = (key: string) => {
    switch (key) {
      case 'home':
        router.replace('/(donor)');
        break;
      case 'donations':
        router.replace('/(donor)/donations');
        break;
      case 'impact':
        router.replace('/(donor)/impact');
        break;
      case 'profile':
        router.replace('/(donor)/profile');
        break;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Slot />
      </View>
      <GlassBottomBar
        tabs={[
          { key: 'home', label: 'Home', icon: 'home-outline', activeIcon: 'home' },
          { key: 'donations', label: 'Donations', icon: 'cube-outline', activeIcon: 'cube' },
          { key: 'impact', label: 'Impact', icon: 'leaf-outline', activeIcon: 'leaf' },
          { key: 'profile', label: 'Profile', icon: 'person-outline', activeIcon: 'person' },
        ]}
        activeKey={getActiveKey()}
        onTabPress={handleTabPress}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});
