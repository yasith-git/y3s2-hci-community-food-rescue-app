/**
 * Active Rescue Execution Dashboard
 * Guided operations: Pickup navigation, 4-digit code verification, packaging checks, delivery to community hub, and issue reporting.
 */

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  ScreenContainer,
  GlassHeader,
  GlassButton,
  GlassCard,
  GlassBadge,
  GlassChip,
  ProgressStepper,
  Skeleton,
} from '../../src/components/ui';
import { VerificationCodeInput } from '../../src/components/rescue/VerificationCodeInput';
import { ReportIssueModal } from '../../src/components/rescue/ReportIssueModal';
import { colors } from '../../src/design-system/colors';
import { typography } from '../../src/design-system/typography';
import { spacing } from '../../src/design-system/spacing';
import { radius } from '../../src/design-system/radius';
import { haptic } from '../../src/design-system/haptics';
import { useAuth } from '../../src/contexts/AuthContext';
import { Donation } from '../../src/types/donation';
import { RescueAssignment } from '../../src/types/rescue';
import {
  subscribeToDonation,
  getDonationById,
} from '../../src/services/donations/donation.service';
import {
  subscribeToActiveRescue,
  startPickupJourney,
  verifyAndConfirmPickup,
  startDeliveryJourney,
  verifyAndConfirmDelivery,
  releaseAssignmentBeforePickup,
} from '../../src/services/rescue/rescue.service';
import { getActiveCommunityPoints } from '../../src/services/community-points/community-point.service';
import { calculateDistanceKm } from '../../src/services/location/geospatial.utils';
import { CommunityPoint } from '../../src/types/coordinator';
import { DEV_MOCK_DONATIONS } from '../../src/services/matching/dev.fixtures';

const RESCUE_STEPS = [
  { key: 'assigned', label: 'Accepted' },
  { key: 'pickup', label: 'Pickup' },
  { key: 'delivery', label: 'Delivery' },
  { key: 'done', label: 'Completed' },
];

export default function ActiveRescueScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();

  const [donation, setDonation] = useState<Donation | null>(null);
  const [assignment, setAssignment] = useState<RescueAssignment | null>(null);
  const [pickupCode, setPickupCode] = useState('');
  const [codeError, setCodeError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [issueModalVisible, setIssueModalVisible] = useState(false);

  const [hasArrivedAtPickup, setHasArrivedAtPickup] = useState(false);
  const [hasArrivedAtCenter, setHasArrivedAtCenter] = useState(false);

  const [deliveryCode, setDeliveryCode] = useState('');
  const [deliveryCodeError, setDeliveryCodeError] = useState<string | null>(null);

  // Verification Form State
  const [packagingIntact, setPackagingIntact] = useState(true);
  const [quantityConfirmed, setQuantityConfirmed] = useState(true);

  // Nearest Collection Center State
  const [nearestCenter, setNearestCenter] = useState<{ point: CommunityPoint; distanceKm: number } | null>(null);

  useEffect(() => {
    async function findNearest() {
      try {
        const points = await getActiveCommunityPoints();
        if (points.length > 0 && donation?.pickup?.latitude && donation?.pickup?.longitude) {
          let closest = points[0];
          let minDistance = calculateDistanceKm(
            donation.pickup.latitude,
            donation.pickup.longitude,
            closest.latitude,
            closest.longitude
          );
          for (const p of points) {
            const dist = calculateDistanceKm(
              donation.pickup.latitude,
              donation.pickup.longitude,
              p.latitude,
              p.longitude
            );
            if (dist < minDistance) {
              minDistance = dist;
              closest = p;
            }
          }
          setNearestCenter({ point: closest, distanceKm: minDistance });
        } else if (points.length > 0) {
          setNearestCenter({ point: points[0], distanceKm: 2.5 });
        }
      } catch (err) {
        console.warn('[ActiveRescue] Nearest center computation error:', err);
      }
    }
    findNearest();
  }, [donation?.pickup?.latitude, donation?.pickup?.longitude]);

  // Subscribe to donation and assignment updates
  useEffect(() => {
    let unsubDonation: () => void = () => {};
    let unsubAssignment: () => void = () => {};

    if (id) {
      unsubDonation = subscribeToDonation(id, (d) => {
        if (d) {
          setDonation(d);
        } else {
          const mock = DEV_MOCK_DONATIONS.find((m: Donation) => m.id === id);
          if (mock) setDonation(mock);
        }
      });
    }

    if (user?.uid) {
      unsubAssignment = subscribeToActiveRescue(user.uid, (assign) => {
        if (assign) setAssignment(assign);
      });
    }

    return () => {
      unsubDonation();
      unsubAssignment();
    };
  }, [id, user?.uid]);

  const getStepIndex = () => {
    if (!donation) return 0;
    switch (donation.status) {
      case 'VOLUNTEER_ASSIGNED':
      case 'PUBLISHED':
      case 'RESERVED':
        return 0;
      case 'PICKUP_EN_ROUTE':
        return 1;
      case 'PICKED_UP':
      case 'DELIVERY_EN_ROUTE':
        return 2;
      case 'DELIVERED':
      case 'ACKNOWLEDGED':
      case 'COMPLETED':
        return 3;
      default:
        return 0;
    }
  };

  const openMapsDirections = (address: string, lat?: number, lon?: number) => {
    haptic.selection();
    const query = lat && lon ? `${lat},${lon}` : encodeURIComponent(address);
    const primaryUrl = Platform.select({
      ios: `maps:0,0?q=${query}`,
      android: `geo:0,0?q=${query}`,
      default: `https://www.google.com/maps/search/?api=1&query=${query}`,
    });
    const fallbackUrl = `https://www.google.com/maps/search/?api=1&query=${query}`;

    Linking.openURL(primaryUrl).catch(() => {
      Linking.openURL(fallbackUrl).catch(() => {
        Alert.alert('Directions', `Destination: ${address}`);
      });
    });
  };

  const currentAssignment: RescueAssignment | null = assignment || (donation ? {
    id: 'assign-' + donation.id,
    donationId: donation.id,
    volunteerId: user?.uid || '',
    volunteerName: user?.displayName || 'Volunteer Partner',
    donorId: donation.donorId,
    communityPointId: donation.communityPointId || 'hub-default',
    communityPointName: donation.communityPointName || 'Colombo Central Community Food Hub',
    communityPointAddress: donation.communityPointAddress || 'Maradana Road, Colombo 10',
    foodName: donation.food.name,
    quantity: donation.food.quantity,
    unit: donation.food.unit,
    pickupAddress: donation.pickup.address,
    imageUrl: donation.food.imageUrl,
    quantityChecked: false,
    packagingChecked: false,
    acceptedAt: (donation as any).acceptedAt || new Date().toISOString(),
    createdAt: donation.createdAt,
    updatedAt: donation.updatedAt,
  } : null);

  const handleStartPickup = async () => {
    if (!donation || !user || !currentAssignment) return;
    setIsProcessing(true);
    haptic.selection();

    // Optimistic UI transition
    setDonation((prev) => prev ? { ...prev, status: 'PICKUP_EN_ROUTE' } : null);

    try {
      await startPickupJourney(currentAssignment.id, donation.id, user.uid);
      haptic.success();
    } catch (error: any) {
      console.warn('[StartPickup notice]:', error);
      haptic.success();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleArrivedAtPickup = () => {
    haptic.selection();
    setHasArrivedAtPickup(true);
  };

  const handleConfirmPickup = async () => {
    if (!donation || !user || !currentAssignment) return;
    if (pickupCode.length < 4) {
      haptic.warning();
      setCodeError('Please enter the 4-digit code shown by the donor.');
      return;
    }

    setIsProcessing(true);
    setCodeError(null);
    haptic.selection();

    try {
      const res = await verifyAndConfirmPickup(
        currentAssignment.id,
        donation.id,
        user.uid,
        pickupCode,
        quantityConfirmed,
        donation.food.quantity,
        packagingIntact
      );

      if (res.success) {
        haptic.success();
        setPickupCode('');
        setDonation((prev) => prev ? { ...prev, status: 'PICKED_UP' } : null);
        Alert.alert('Pickup Confirmed! 🎉', 'Food collection verified. Now proceed to deliver to the collection center.');
      } else {
        haptic.warning();
        setCodeError(res.message || 'Verification failed. Check the 4-digit code with donor.');
      }
    } catch (error: any) {
      haptic.warning();
      setCodeError(error?.message || 'Verification failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStartDelivery = async () => {
    if (!donation || !user || !currentAssignment) return;
    setIsProcessing(true);
    haptic.selection();

    setDonation((prev) => prev ? { ...prev, status: 'DELIVERY_EN_ROUTE' } : null);

    try {
      await startDeliveryJourney(currentAssignment.id, donation.id, user.uid);
      haptic.success();
    } catch (error: any) {
      console.warn('[StartDelivery notice]:', error);
      haptic.success();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleArrivedAtCenter = () => {
    haptic.selection();
    setHasArrivedAtCenter(true);
  };

  const handleConfirmDelivery = async () => {
    if (!donation || !user || !currentAssignment) return;
    if (deliveryCode.length < 4) {
      haptic.warning();
      setDeliveryCodeError('Please enter the 4-digit code shown by the Community Authority.');
      return;
    }

    setIsProcessing(true);
    setDeliveryCodeError(null);
    haptic.selection();

    try {
      const res = await verifyAndConfirmDelivery(
        currentAssignment.id,
        donation.id,
        user.uid,
        deliveryCode
      );

      if (res.success) {
        haptic.success();
        setDeliveryCode('');
        setDonation((prev) => prev ? { ...prev, status: 'COMPLETED' } : null);
        Alert.alert(
          'Rescue Completed! 🎉',
          'Handover verified successfully. Thank you for your contribution to the community!',
          [
            {
              text: 'View Activity',
              onPress: () => router.replace('/(volunteer)/activity'),
            },
          ]
        );
      } else {
        haptic.warning();
        setDeliveryCodeError(res.message || 'Verification failed. Check the 4-digit code with the Community Authority.');
      }
    } catch (error: any) {
      haptic.warning();
      setDeliveryCodeError(error?.message || 'Handover verification failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReleaseRescue = async () => {
    if (!donation || !user || !currentAssignment || isProcessing) return;

    haptic.warning();
    Alert.alert(
      'Release Rescue Mission?',
      'Are you unable to complete this rescue? The opportunity will be safely released for other volunteers.',
      [
        { text: 'Keep Rescue', style: 'cancel' },
        {
          text: 'Release Mission',
          style: 'destructive',
          onPress: async () => {
            if (isProcessing) return;
            setIsProcessing(true);
            try {
              await releaseAssignmentBeforePickup(
                currentAssignment.id,
                donation.id,
                user.uid,
                'Cannot reach donor location in time'
              );
              haptic.success();
              Alert.alert(
                'Rescue Released',
                'Rescue released. It is available to other volunteers again.',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      router.replace('/(volunteer)');
                    },
                  },
                ]
              );
            } catch (err: any) {
              setIsProcessing(false);
              haptic.warning();
              Alert.alert('Cannot Cancel', err?.message || 'Unable to release rescue.');
            }
          },
        },
      ]
    );
  };

  if (!donation) {
    return (
      <ScreenContainer scrollable={false}>
        <GlassHeader title="Active Food Rescue" onBack={() => router.back()} />
        <View style={{ padding: spacing.md, gap: 12 }}>
          <Skeleton width="100%" height={120} borderRadius={radius.lg} />
          <Skeleton width="100%" height={240} borderRadius={radius.lg} />
        </View>
      </ScreenContainer>
    );
  }

  const currentStatus = donation.status;

  const headerTitle =
    currentStatus === 'PICKUP_EN_ROUTE' && !hasArrivedAtPickup
      ? 'Heading to Pickup'
      : currentStatus === 'DELIVERY_EN_ROUTE'
      ? 'Heading to Collection Center'
      : currentStatus === 'COMPLETED' || currentStatus === 'DELIVERED' || currentStatus === 'ACKNOWLEDGED'
      ? 'Rescue Completed'
      : 'Active Food Rescue';

  return (
    <ScreenContainer scrollable={false} testID="active-rescue-screen">
      <GlassHeader
        title={headerTitle}
        subtitle={donation.food.name}
        rightAction={
          <TouchableOpacity
            onPress={() => setIssueModalVisible(true)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="warning-outline" size={22} color={colors.status.error} />
          </TouchableOpacity>
        }
      />

      {/* Visual Stepper */}
      <View style={styles.stepperBox}>
        <ProgressStepper steps={RESCUE_STEPS} currentStepIndex={getStepIndex()} />
      </View>

      <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* STATE A: VOLUNTEER_ASSIGNED -> Step 1: Go to Pickup */}
        {(currentStatus === 'VOLUNTEER_ASSIGNED' || currentStatus === 'PUBLISHED' || currentStatus === 'RESERVED') && (
          <GlassCard variant="elevated" style={styles.card}>
            <View style={styles.stageHeader}>
              <View style={styles.iconCircle}>
                <Ionicons name="bicycle" size={24} color={colors.brand.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[typography.headingSmall, styles.stageTitle]}>Step 1: Go to Pickup</Text>
                <Text style={[typography.bodySmall, styles.stageSubtitle]}>
                  Travel to the donor's location to collect the surplus food.
                </Text>
              </View>
            </View>

            <View style={styles.destinationBox}>
              <Text style={[typography.labelMedium, styles.destHeading]}>
                {donation.food.name} ({donation.food.quantity} {donation.food.unit})
              </Text>
              <Text style={[typography.bodyMedium, styles.destAddress]}>
                📍 {donation.pickup.address}
              </Text>
              {donation.pickup.pickupDeadlineAt && (
                <Text style={[typography.caption, { color: colors.status.warning, marginTop: 4, fontWeight: '600' }]}>
                  Pickup Window: {new Date(donation.pickup.pickupStartAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(donation.pickup.pickupDeadlineAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              )}
              {donation.pickup.instructions && (
                <Text style={[typography.caption, styles.destNotes]}>
                  Access Notes: "{donation.pickup.instructions}"
                </Text>
              )}
            </View>

            <View style={styles.buttonStack}>
              <GlassButton
                title="I Am On My Way"
                variant="primary"
                icon="arrow-forward"
                iconPosition="right"
                loading={isProcessing}
                onPress={handleStartPickup}
              />
              <GlassButton
                title="Open Pickup in Google Maps"
                variant="secondary"
                icon="navigate"
                onPress={() => openMapsDirections(donation.pickup.address, donation.pickup.latitude, donation.pickup.longitude)}
              />
            </View>

            <TouchableOpacity
              onPress={handleReleaseRescue}
              disabled={isProcessing}
              style={[styles.cancelBtn, isProcessing && { opacity: 0.5 }]}
            >
              <Text style={[typography.labelSmall, styles.cancelBtnText]}>
                {isProcessing ? 'Releasing mission...' : 'Unable to complete? Release mission'}
              </Text>
            </TouchableOpacity>
          </GlassCard>
        )}

        {/* STATE B: PICKUP_EN_ROUTE (Before arrival) */}
        {currentStatus === 'PICKUP_EN_ROUTE' && !hasArrivedAtPickup && (
          <GlassCard variant="elevated" style={styles.card}>
            <View style={styles.stageHeader}>
              <View style={[styles.iconCircle, { backgroundColor: colors.brand[50] }]}>
                <Ionicons name="navigate" size={24} color={colors.brand.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[typography.headingSmall, styles.stageTitle]}>Heading to Pickup</Text>
                <Text style={[typography.bodySmall, styles.stageSubtitle]}>
                  Travel to donor address and tap "I Have Arrived" upon reaching.
                </Text>
              </View>
            </View>

            <View style={styles.destinationBox}>
              <Text style={[typography.labelMedium, styles.destHeading]}>Donor Pickup Address:</Text>
              <Text style={[typography.bodyMedium, styles.destAddress]}>
                📍 {donation.pickup.address}
              </Text>
              {donation.pickup.pickupDeadlineAt && (
                <Text style={[typography.caption, { color: colors.status.warning, marginTop: 4, fontWeight: '600' }]}>
                  Pickup Window: {new Date(donation.pickup.pickupStartAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(donation.pickup.pickupDeadlineAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              )}
              {donation.pickup.instructions && (
                <Text style={[typography.caption, styles.destNotes]}>
                  "{donation.pickup.instructions}"
                </Text>
              )}
            </View>

            <View style={styles.buttonStack}>
              <GlassButton
                title="Open Pickup in Google Maps"
                variant="secondary"
                icon="navigate"
                onPress={() => openMapsDirections(donation.pickup.address, donation.pickup.latitude, donation.pickup.longitude)}
              />
              <GlassButton
                title="I Have Arrived"
                variant="primary"
                icon="location"
                onPress={handleArrivedAtPickup}
              />
            </View>

            <TouchableOpacity
              onPress={handleReleaseRescue}
              disabled={isProcessing}
              style={[styles.cancelBtn, isProcessing && { opacity: 0.5 }]}
            >
              <Text style={[typography.labelSmall, styles.cancelBtnText]}>
                {isProcessing ? 'Releasing mission...' : 'Unable to reach donor? Release mission'}
              </Text>
            </TouchableOpacity>
          </GlassCard>
        )}

        {/* STATE C: PICKUP VERIFICATION (After arrival at donor) */}
        {currentStatus === 'PICKUP_EN_ROUTE' && hasArrivedAtPickup && (
          <GlassCard variant="elevated" style={styles.card}>
            <View style={styles.stageHeader}>
              <View style={[styles.iconCircle, { backgroundColor: colors.brand[100] }]}>
                <Ionicons name="keypad" size={24} color={colors.brand.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[typography.headingSmall, styles.stageTitle]}>Step 2: Verify Handover</Text>
                <Text style={[typography.bodySmall, styles.stageSubtitle]}>
                  Ask the donor for their 4-digit verification code.
                </Text>
              </View>
            </View>

            <VerificationCodeInput
              value={pickupCode}
              onChange={setPickupCode}
              error={codeError}
              disabled={isProcessing}
            />

            {/* Inspection Checklist */}
            <View style={styles.checklistSection}>
              <Text style={[typography.labelSmall, styles.checkHeader]}>Inspection Checklist:</Text>
              <TouchableOpacity
                style={styles.checkRow}
                onPress={() => setQuantityConfirmed(!quantityConfirmed)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={quantityConfirmed ? 'checkbox' : 'square-outline'}
                  size={20}
                  color={quantityConfirmed ? colors.brand.primary : colors.text.muted}
                />
                <Text style={[typography.bodySmall, styles.checkLabel]}>
                  Confirmed quantity: {donation.food.quantity} {donation.food.unit}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.checkRow}
                onPress={() => setPackagingIntact(!packagingIntact)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={packagingIntact ? 'checkbox' : 'square-outline'}
                  size={20}
                  color={packagingIntact ? colors.brand.primary : colors.text.muted}
                />
                <Text style={[typography.bodySmall, styles.checkLabel]}>
                  Packaging condition intact & secure
                </Text>
              </TouchableOpacity>
            </View>

            <GlassButton
              title="Confirm Food Collection"
              variant="primary"
              icon="checkmark-circle"
              loading={isProcessing}
              disabled={pickupCode.length < 4 || isProcessing}
              onPress={handleConfirmPickup}
            />

            <TouchableOpacity onPress={() => setIssueModalVisible(true)} style={styles.issuePrompt}>
              <Ionicons name="alert-circle-outline" size={16} color={colors.status.error} />
              <Text style={[typography.labelSmall, styles.issuePromptText]}>
                Quantity mismatch or missing donor? Report problem
              </Text>
            </TouchableOpacity>
          </GlassCard>
        )}

        {/* STATE D: PICKED_UP -> Step 3: Deliver to Collection Center */}
        {currentStatus === 'PICKED_UP' && (
          <GlassCard variant="elevated" style={styles.card}>
            <View style={styles.stageHeader}>
              <View style={[styles.iconCircle, { backgroundColor: colors.status.successBg }]}>
                <Ionicons name="flag" size={24} color={colors.status.success} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[typography.headingSmall, styles.stageTitle]}>Step 3: Deliver to Collection Center</Text>
                <Text style={[typography.bodySmall, styles.stageSubtitle]}>
                  Pickup confirmed. Transport the rescued food to the collection center.
                </Text>
              </View>
            </View>

            <View style={styles.destinationBox}>
              <Text style={[typography.labelMedium, styles.destHeading]}>Recommended Collection Center:</Text>
              <Text style={[typography.bodyMedium, styles.destAddress]}>
                📍 {nearestCenter?.point.label || assignment?.communityPointName || 'Colombo Central Food Hub'}
              </Text>
              <Text style={[typography.bodySmall, { color: colors.brand.primary, marginTop: 2, fontWeight: '600' }]}>
                Approx. {nearestCenter ? nearestCenter.distanceKm.toFixed(1) : '2.5'} km away
              </Text>
              <Text style={[typography.caption, styles.destNotes]}>
                {nearestCenter?.point.address || assignment?.communityPointAddress || 'Maradana Road, Colombo 10'}
              </Text>
            </View>

            <View style={styles.buttonStack}>
              <GlassButton
                title="Open Center in Google Maps"
                variant="secondary"
                icon="navigate"
                onPress={() =>
                  openMapsDirections(
                    nearestCenter?.point.address || assignment?.communityPointAddress || 'Maradana Road, Colombo 10',
                    nearestCenter?.point.latitude,
                    nearestCenter?.point.longitude
                  )
                }
              />
              <GlassButton
                title="Start Delivery Journey"
                variant="primary"
                icon="arrow-forward"
                iconPosition="right"
                loading={isProcessing}
                onPress={handleStartDelivery}
              />
            </View>
          </GlassCard>
        )}

        {/* STATE E: DELIVERY_EN_ROUTE (Before arrival at collection center) */}
        {currentStatus === 'DELIVERY_EN_ROUTE' && !hasArrivedAtCenter && (
          <GlassCard variant="elevated" style={styles.card}>
            <View style={styles.stageHeader}>
              <View style={[styles.iconCircle, { backgroundColor: colors.status.warningBg || colors.brand[50] }]}>
                <Ionicons name="location" size={24} color={colors.status.warning} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[typography.headingSmall, styles.stageTitle]}>Heading to Collection Center</Text>
                <Text style={[typography.bodySmall, styles.stageSubtitle]}>
                  Travel to the community collection point and tap "I Have Arrived".
                </Text>
              </View>
            </View>

            <View style={styles.destinationBox}>
              <Text style={[typography.labelMedium, styles.destHeading]}>Target Collection Center:</Text>
              <Text style={[typography.bodyMedium, styles.destAddress]}>
                📍 {nearestCenter?.point.label || assignment?.communityPointName || 'Colombo Central Food Hub'}
              </Text>
              <Text style={[typography.caption, styles.destNotes]}>
                {nearestCenter?.point.address || assignment?.communityPointAddress || 'Maradana Road, Colombo 10'}
              </Text>
            </View>

            <View style={styles.buttonStack}>
              <GlassButton
                title="Open Center in Google Maps"
                variant="secondary"
                icon="navigate"
                onPress={() =>
                  openMapsDirections(
                    nearestCenter?.point.address || assignment?.communityPointAddress || 'Maradana Road, Colombo 10',
                    nearestCenter?.point.latitude,
                    nearestCenter?.point.longitude
                  )
                }
              />
              <GlassButton
                title="I Have Arrived at Center"
                variant="primary"
                icon="checkmark-circle-outline"
                onPress={handleArrivedAtCenter}
              />
            </View>

            <View style={[styles.destinationBox, { marginTop: spacing.md, backgroundColor: colors.brand[50] }]}>
              <Text style={[typography.bodySmall, { color: colors.brand.primary, fontWeight: '600' }]}>
                ℹ️ Next Step: Delivery Verification Code
              </Text>
              <Text style={[typography.caption, { color: colors.text.secondary, marginTop: 2 }]}>
                Upon arrival, ask the on-site Community Authority for their 4-digit Delivery Handover Code.
              </Text>
            </View>
          </GlassCard>
        )}

        {/* STATE E2: DELIVERY VERIFICATION (After arrival at collection center) */}
        {currentStatus === 'DELIVERY_EN_ROUTE' && hasArrivedAtCenter && (
          <GlassCard variant="elevated" style={styles.card}>
            <View style={styles.stageHeader}>
              <View style={[styles.iconCircle, { backgroundColor: colors.brand[100] }]}>
                <Ionicons name="keypad" size={24} color={colors.brand.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[typography.headingSmall, styles.stageTitle]}>Step 4: Verify Delivery Handover</Text>
                <Text style={[typography.bodySmall, styles.stageSubtitle]}>
                  Enter the 4-digit delivery code shown by the Community Authority.
                </Text>
              </View>
            </View>

            <VerificationCodeInput
              value={deliveryCode}
              onChange={setDeliveryCode}
              error={deliveryCodeError}
              disabled={isProcessing}
            />

            <GlassButton
              title="Confirm Food Handover"
              variant="primary"
              icon="checkmark-circle"
              loading={isProcessing}
              disabled={deliveryCode.length < 4 || isProcessing}
              onPress={handleConfirmDelivery}
            />

            <TouchableOpacity onPress={() => setIssueModalVisible(true)} style={styles.issuePrompt}>
              <Ionicons name="alert-circle-outline" size={16} color={colors.status.error} />
              <Text style={[typography.labelSmall, styles.issuePromptText]}>
                Center closed or authority unavailable? Report problem
              </Text>
            </TouchableOpacity>
          </GlassCard>
        )}

        {/* STATE F: DELIVERED (Food reached center, awaiting Authority confirmation) */}
        {currentStatus === 'DELIVERED' && (
          <GlassCard variant="elevated" style={styles.card}>
            <View style={styles.stageHeader}>
              <View style={[styles.iconCircle, { backgroundColor: colors.status.successBg }]}>
                <Ionicons name="checkmark-circle" size={32} color={colors.status.success} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[typography.headingSmall, styles.stageTitle]}>Delivery Completed</Text>
                <Text style={[typography.bodySmall, styles.stageSubtitle]}>
                  Food delivered to the collection center.
                </Text>
              </View>
            </View>

            <View style={styles.deliveryPendingBox}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <Ionicons name="time-outline" size={18} color={colors.status.warning} />
                <Text style={[typography.labelMedium, { color: colors.status.warning, fontWeight: '700' }]}>
                  Awaiting Authority Receipt
                </Text>
              </View>
              <Text style={[typography.bodySmall, { color: colors.text.secondary }]}>
                Waiting for Community Authority receipt confirmation. Your delivery has been recorded.
              </Text>
            </View>

            <GlassButton
              title="Return to Activity"
              variant="primary"
              onPress={() => router.replace('/(volunteer)/activity')}
            />
          </GlassCard>
        )}

        {/* STATE G: COMPLETED / ACKNOWLEDGED (Authority confirmed handover) */}
        {(currentStatus === 'ACKNOWLEDGED' || currentStatus === 'COMPLETED') && (
          <GlassCard variant="elevated" style={styles.card}>
            <View style={styles.stageHeader}>
              <View style={[styles.iconCircle, { backgroundColor: colors.status.successBg }]}>
                <Ionicons name="checkmark-done-circle" size={32} color={colors.status.success} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[typography.headingSmall, styles.stageTitle]}>Rescue Completed 🎉</Text>
                <Text style={[typography.bodySmall, styles.stageSubtitle]}>
                  Community Authority confirmed the food handover.
                </Text>
              </View>
            </View>

            <View style={styles.successBox}>
              <Text style={[typography.bodyMedium, { color: colors.status.success, fontWeight: '600' }]}>
                ✓ {donation.food.quantity} {donation.food.unit} rescued from waste
              </Text>
              <Text style={[typography.caption, { color: colors.text.muted, marginTop: 4 }]}>
                Official receipt acknowledgement recorded in your volunteer history.
              </Text>
            </View>

            <GlassButton
              title="Return to Discovery"
              variant="primary"
              onPress={() => router.replace('/(volunteer)')}
            />
          </GlassCard>
        )}
      </ScrollView>

      {/* Structured Problem / Issue Report Modal */}
      <ReportIssueModal
        visible={issueModalVisible}
        onClose={() => setIssueModalVisible(false)}
        donationId={donation.id}
        assignmentId={assignment?.id}
        volunteerId={user?.uid || 'volunteer-1'}
        volunteerName={user?.displayName || 'Volunteer'}
        expectedQuantity={donation.food.quantity}
        onIssueReported={() => {
          // Refresh state
        }}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  stepperBox: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing['3xl'],
  },
  card: {
    marginHorizontal: spacing.md,
    marginTop: spacing.xs,
    padding: spacing.md,
  },
  stageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.brand[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  stageTitle: {
    color: colors.text.primary,
  },
  stageSubtitle: {
    color: colors.text.muted,
  },
  destinationBox: {
    backgroundColor: colors.surface.secondary,
    padding: spacing.sm,
    borderRadius: radius.md,
    marginBottom: spacing.md,
  },
  destHeading: {
    color: colors.text.primary,
    fontWeight: '700',
  },
  destAddress: {
    color: colors.text.primary,
    fontWeight: '500',
    marginTop: 2,
  },
  destNotes: {
    color: colors.text.muted,
    fontStyle: 'italic',
    marginTop: 4,
  },
  buttonStack: {
    gap: spacing.sm,
  },
  cancelBtn: {
    alignSelf: 'center',
    marginTop: spacing.md,
    padding: spacing.xs,
  },
  cancelBtnText: {
    color: colors.status.error,
    fontWeight: '600',
  },
  checklistSection: {
    backgroundColor: colors.surface.secondary,
    padding: spacing.sm,
    borderRadius: radius.md,
    marginBottom: spacing.md,
  },
  checkHeader: {
    color: colors.text.primary,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginVertical: 4,
  },
  checkLabel: {
    color: colors.text.primary,
  },
  issuePrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: spacing.md,
  },
  issuePromptText: {
    color: colors.status.error,
    fontWeight: '600',
  },
  successBox: {
    backgroundColor: colors.status.successBg,
    padding: spacing.md,
    borderRadius: radius.md,
    marginVertical: spacing.md,
  },
  deliveryPendingBox: {
    backgroundColor: colors.status.warningBg || colors.brand[50],
    padding: spacing.md,
    borderRadius: radius.md,
    marginVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.status.warningBorder || colors.brand[100],
  },
});
