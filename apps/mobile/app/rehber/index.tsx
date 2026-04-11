import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, Platform, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../../src/lib/api';
import { LoadingSpinner } from '../../src/components/ui/LoadingSpinner';
import { colors } from '../../src/theme/colors';
import { Article } from '../../src/types';

const DARK_NAVY = '#0a1628';

const AUDIENCE_LABELS: Record<string, { text: string; color: string; bg: string }> = {
  TENANT: { text: 'Kiraci', color: '#2563eb', bg: '#eff6ff' },
  LANDLORD: { text: 'Ev Sahibi', color: '#7c3aed', bg: '#f5f3ff' },
  BOTH: { text: 'Herkes Icin', color: '#059669', bg: '#ecfdf5' },
};

const CATEGORY_COLORS: Record<string, string> = {
  'Kiracinin Haklari': '#2563eb',
  'Ev Sahibinin Haklari': '#7c3aed',
  'Kira Sozlesmesi': '#0891b2',
  'Finansal Rehber': '#059669',
  'Guvenli Odeme': '#10b981',
  'Hukuki Bilgi': '#dc2626',
  'Emlak Piyasasi': '#ea580c',
  'Dijital Donusum': '#2563eb',
  'KMH Rehberi': '#0d9488',
  'Depozito ve Teminat': '#ca8a04',
  'Vergi ve Muhasebe': '#4f46e5',
  'Tasinma Rehberi': '#0284c7',
  'Sozlesme Feshi': '#be123c',
  'Yatirim ve Portfoy': '#15803d',
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function RehberScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'TENANT' | 'LANDLORD'>('ALL');

  const loadArticles = useCallback(async () => {
    try {
      const res = await api<Article[]>('/api/v1/articles');
      if (res.status === 'success' && res.data) {
        setArticles(res.data);
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    loadArticles().finally(() => setLoading(false));
  }, [loadArticles]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadArticles();
    setRefreshing(false);
  }, [loadArticles]);

  const filteredArticles = articles.filter((a) => {
    if (filter === 'ALL') return true;
    return a.audience === filter || a.audience === 'BOTH';
  });

  const renderArticle = useCallback(
    ({ item }: { item: Article }) => {
      const audience = AUDIENCE_LABELS[item.audience] || AUDIENCE_LABELS.BOTH;
      const categoryColor = CATEGORY_COLORS[item.category] || colors.gray[600];

      return (
        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push({ pathname: '/rehber/[slug]', params: { slug: item.slug } })}
          activeOpacity={0.7}
        >
          <View style={styles.cardMeta}>
            <View style={[styles.categoryBadge, { backgroundColor: categoryColor + '14' }]}>
              <Text style={[styles.categoryText, { color: categoryColor }]}>{item.category}</Text>
            </View>
            <View style={[styles.audienceBadge, { backgroundColor: audience.bg }]}>
              <Text style={[styles.audienceText, { color: audience.color }]}>{audience.text}</Text>
            </View>
          </View>
          <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
          <Text style={styles.cardSummary} numberOfLines={2}>{item.summary}</Text>
          <View style={styles.cardFooter}>
            <Ionicons name="calendar-outline" size={14} color={colors.gray[400]} />
            <Text style={styles.cardDate}>
              {item.publishedAt ? formatDate(item.publishedAt) : formatDate(item.createdAt)}
            </Text>
            <Ionicons name="chevron-forward" size={16} color={colors.gray[400]} style={{ marginLeft: 'auto' }} />
          </View>
        </TouchableOpacity>
      );
    },
    [router],
  );

  if (loading) return <LoadingSpinner />;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color="#ffffff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Ionicons name="book" size={20} color="#60a5fa" />
          <Text style={styles.headerTitle}>Rehber</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      {/* Filter Chips */}
      <View style={styles.filterRow}>
        {(['ALL', 'TENANT', 'LANDLORD'] as const).map((f) => {
          const label = f === 'ALL' ? 'Tumu' : f === 'TENANT' ? 'Kiraci' : 'Ev Sahibi';
          const active = filter === f;
          return (
            <TouchableOpacity
              key={f}
              style={[styles.filterChip, active && styles.filterChipActive]}
              onPress={() => setFilter(f)}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterText, active && styles.filterTextActive]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
        <View style={styles.articleCount}>
          <Text style={styles.articleCountText}>{filteredArticles.length} makale</Text>
        </View>
      </View>

      {/* Articles */}
      <FlatList
        data={filteredArticles}
        keyExtractor={(item) => item.id}
        renderItem={renderArticle}
        contentContainerStyle={[
          styles.listContent,
          filteredArticles.length === 0 && styles.listContentEmpty,
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.gray[500]} />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="document-text-outline" size={48} color={colors.gray[300]} />
            </View>
            <Text style={styles.emptyTitle}>Henuz makale yok</Text>
            <Text style={styles.emptySubtitle}>
              Kira, hukuk ve finans rehberleri yakinda burada olacak.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },

  // Header
  header: {
    backgroundColor: DARK_NAVY,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerCenter: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8,
  },
  headerTitle: {
    fontSize: 18, fontWeight: '700', color: '#ffffff',
  },

  // Filter
  filterRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12, gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 20, backgroundColor: colors.white,
    borderWidth: 1, borderColor: colors.gray[200],
  },
  filterChipActive: {
    backgroundColor: '#2563eb', borderColor: '#2563eb',
  },
  filterText: {
    fontSize: 13, fontWeight: '600', color: colors.gray[600],
  },
  filterTextActive: {
    color: '#ffffff',
  },
  articleCount: {
    marginLeft: 'auto',
  },
  articleCountText: {
    fontSize: 13, color: colors.gray[400], fontWeight: '500',
  },

  // List
  listContent: { paddingHorizontal: 16, paddingBottom: 32 },
  listContentEmpty: { flex: 1, justifyContent: 'center' },

  // Card
  card: {
    backgroundColor: colors.white, borderRadius: 16,
    padding: 16, marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#0a1628', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06, shadowRadius: 12,
      },
      android: { elevation: 3 },
    }),
  },
  cardMeta: {
    flexDirection: 'row', gap: 8, marginBottom: 10, flexWrap: 'wrap',
  },
  categoryBadge: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
  },
  categoryText: {
    fontSize: 11, fontWeight: '700', textTransform: 'uppercase',
  },
  audienceBadge: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
  },
  audienceText: {
    fontSize: 11, fontWeight: '600',
  },
  cardTitle: {
    fontSize: 16, fontWeight: '700', color: colors.gray[900],
    lineHeight: 22, marginBottom: 6,
  },
  cardSummary: {
    fontSize: 14, color: colors.gray[600], lineHeight: 20, marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  cardDate: {
    fontSize: 12, color: colors.gray[400],
  },

  // Empty
  emptyState: { alignItems: 'center', paddingHorizontal: 32 },
  emptyIcon: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: colors.gray[100],
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17, fontWeight: '700', color: colors.gray[700], marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15, color: colors.gray[500], textAlign: 'center', lineHeight: 22,
  },
});
