import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  TouchableOpacity,
  ViewToken,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface OnboardingSlide {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
  title: string;
  subtitle: string;
}

const slides: OnboardingSlide[] = [
  {
    icon: 'shield-checkmark',
    iconColor: colors.primary[600],
    iconBg: colors.primary[50],
    title: 'Kefil Derdi Bitti',
    subtitle:
      'Banka guvencesi kefil yerine gecer. Artik kefil aramak, ev sahibinin kefil sormasi gerekmiyor.',
  },
  {
    icon: 'document-text',
    iconColor: '#10b981',
    iconBg: '#f0fdf4',
    title: '5 Dakikada Dijital Sozlesme',
    subtitle:
      'Noter masrafi yok, bekleme yok. TBK uyumlu dijital sozlesmeyle aninda kontrat kurun.',
  },
  {
    icon: 'business',
    iconColor: '#f59e0b',
    iconBg: '#fefce8',
    title: 'Kiraniz Guvence Altinda',
    subtitle:
      'Otomatik kira takibi, banka guvenceli odeme. Ev sahibi kiradan emin, kiraci huzurlu.',
  },
];

interface OnboardingProps {
  onComplete: () => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setCurrentIndex(viewableItems[0].index);
      }
    },
  ).current;

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;

  const isLast = currentIndex === slides.length - 1;

  const goNext = useCallback(() => {
    if (isLast) {
      onComplete();
    } else {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    }
  }, [isLast, currentIndex, onComplete]);

  const renderSlide = ({ item }: { item: OnboardingSlide }) => (
    <View style={styles.slide}>
      {/* Decorative background circle */}
      <View style={styles.bgCircle} />

      <View style={[styles.iconContainer, { backgroundColor: item.iconBg }]}>
        <Ionicons name={item.icon} size={64} color={item.iconColor} />
      </View>

      <Text style={styles.slideTitle}>{item.title}</Text>
      <Text style={styles.slideSubtitle}>{item.subtitle}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Skip button - hidden on last screen */}
      {!isLast && (
        <TouchableOpacity
          style={styles.skipButton}
          onPress={onComplete}
          activeOpacity={0.7}
        >
          <Text style={styles.skipText}>Atla</Text>
        </TouchableOpacity>
      )}

      <FlatList
        ref={flatListRef}
        data={slides}
        keyExtractor={(_, i) => String(i)}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        bounces={false}
      />

      {/* Bottom section */}
      <View style={styles.bottomSection}>
        {/* Pagination dots */}
        <View style={styles.pagination}>
          {slides.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === currentIndex && styles.dotActive,
              ]}
            />
          ))}
        </View>

        {/* CTA Button */}
        <TouchableOpacity
          style={[
            styles.ctaButton,
            isLast && styles.ctaButtonLast,
          ]}
          onPress={goNext}
          activeOpacity={0.8}
        >
          {isLast ? (
            <>
              <Text style={styles.ctaText}>Hemen Basla</Text>
              <Ionicons name="arrow-forward" size={20} color={colors.white} />
            </>
          ) : (
            <>
              <Text style={styles.ctaText}>Devam</Text>
              <Ionicons name="arrow-forward" size={20} color={colors.white} />
            </>
          )}
        </TouchableOpacity>

        <View style={styles.bottomSpacer} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  skipButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    right: 24,
    zIndex: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.gray[100],
  },
  skipText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.gray[500],
  },
  slide: {
    width: SCREEN_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: Platform.OS === 'ios' ? 120 : 100,
  },
  bgCircle: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 80 : 60,
    width: SCREEN_WIDTH * 0.7,
    height: SCREEN_WIDTH * 0.7,
    borderRadius: SCREEN_WIDTH * 0.35,
    backgroundColor: colors.gray[50],
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 42,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
  },
  slideTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.brand.dark,
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  slideSubtitle: {
    fontSize: 16,
    lineHeight: 26,
    color: colors.gray[500],
    textAlign: 'center',
    fontWeight: '500',
    paddingHorizontal: 8,
  },
  bottomSection: {
    paddingHorizontal: 40,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 32,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.gray[200],
  },
  dotActive: {
    width: 28,
    backgroundColor: colors.primary[600],
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[600],
    paddingVertical: 18,
    borderRadius: 16,
    gap: 8,
    shadowColor: colors.primary[600],
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  ctaButtonLast: {
    backgroundColor: colors.brand.dark,
    shadowColor: colors.brand.dark,
  },
  ctaText: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.white,
    letterSpacing: 0.2,
  },
  bottomSpacer: {
    height: Platform.OS === 'ios' ? 50 : 40,
  },
});
