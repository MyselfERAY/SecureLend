import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  TouchableOpacity,
  ViewToken,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface TutorialSlide {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
  title: string;
  description: string;
}

const slides: TutorialSlide[] = [
  {
    icon: 'shield-checkmark',
    iconColor: colors.primary[600],
    iconBg: colors.primary[50],
    title: 'Kira Guvence\'ye Hosgeldiniz',
    description:
      'Kira odeme sureclerinizi guvenle yonetin. Dijital sozlesme, otomatik odeme takibi ve daha fazlasi tek platformda.',
  },
  {
    icon: 'document-text-outline',
    iconColor: '#10b981',
    iconBg: '#f0fdf4',
    title: 'Dijital Sozlesme',
    description:
      'Mulk ekleyin, kiraci davet edin ve dijital sozlesme olusturun. Her iki taraf mobil uzerinden imzalayabilir.',
  },
  {
    icon: 'card-outline',
    iconColor: '#f59e0b',
    iconBg: '#fefce8',
    title: 'Banka Guvence Hesabi ile Guvenli Odeme',
    description:
      'Banka Guvence Hesabi (KMH) basvurusu yapin. Kira odeleriniz otomatik olarak takip edilsin.',
  },
  {
    icon: 'chatbubbles-outline',
    iconColor: '#8b5cf6',
    iconBg: '#f5f3ff',
    title: 'Mesajlasma ve Destek',
    description:
      'Ev sahibi veya kiraci ile dogrudan mesajlasin. Teknik destek ekibimize ulasmak da cok kolay.',
  },
];

interface TutorialProps {
  onComplete: () => void;
}

export default function Tutorial({ onComplete }: TutorialProps) {
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

  const goNext = () => {
    if (isLast) {
      onComplete();
    } else {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    }
  };

  const renderSlide = ({ item }: { item: TutorialSlide }) => (
    <View style={styles.slide}>
      <View style={[styles.iconContainer, { backgroundColor: item.iconBg }]}>
        <Ionicons name={item.icon} size={56} color={item.iconColor} />
      </View>
      <Text style={styles.slideTitle}>{item.title}</Text>
      <Text style={styles.slideDescription}>{item.description}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.skipButton} onPress={onComplete} activeOpacity={0.7}>
        <Text style={styles.skipText}>Atla</Text>
      </TouchableOpacity>

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

      {/* Next / Baslayalim button */}
      <TouchableOpacity style={styles.nextButton} onPress={goNext} activeOpacity={0.8}>
        <Text style={styles.nextText}>{isLast ? 'Baslayalim' : 'Devam'}</Text>
        <Ionicons
          name={isLast ? 'checkmark' : 'arrow-forward'}
          size={20}
          color={colors.white}
        />
      </TouchableOpacity>

      <View style={{ height: 40 }} />
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
    top: 60,
    right: 24,
    zIndex: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  skipText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.gray[400],
  },
  slide: {
    width: SCREEN_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 100,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  slideTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.gray[900],
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  slideDescription: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.gray[500],
    textAlign: 'center',
    fontWeight: '500',
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
    width: 24,
    backgroundColor: colors.primary[600],
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[600],
    marginHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  nextText: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.white,
  },
});
