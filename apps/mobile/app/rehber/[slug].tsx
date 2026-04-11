import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Platform, TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
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

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function ArticleDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      try {
        const res = await api<Article>(`/api/v1/articles/${slug}`);
        if (res.status === 'success' && res.data) {
          setArticle(res.data);
        } else {
          setError('Makale bulunamadi.');
        }
      } catch {
        setError('Makale yuklenirken hata olustu.');
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  if (loading) return <LoadingSpinner />;

  if (error || !article) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={22} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Rehber</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.errorState}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.gray[400]} />
          <Text style={styles.errorText}>{error || 'Makale bulunamadi.'}</Text>
          <TouchableOpacity style={styles.errorBtn} onPress={() => router.back()} activeOpacity={0.7}>
            <Text style={styles.errorBtnText}>Geri Don</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const audience = AUDIENCE_LABELS[article.audience] || AUDIENCE_LABELS.BOTH;
  const paragraphs = article.content.split('\n\n').filter((p) => p.trim());

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Rehber</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Meta */}
        <View style={styles.metaRow}>
          <View style={[styles.badge, { backgroundColor: '#2563eb14' }]}>
            <Text style={[styles.badgeText, { color: '#2563eb' }]}>{article.category}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: audience.bg }]}>
            <Text style={[styles.badgeText, { color: audience.color }]}>{audience.text}</Text>
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>{article.title}</Text>

        {/* Date */}
        <View style={styles.dateRow}>
          <Ionicons name="calendar-outline" size={14} color={colors.gray[400]} />
          <Text style={styles.dateText}>
            {article.publishedAt ? formatDate(article.publishedAt) : formatDate(article.createdAt)}
          </Text>
        </View>

        {/* Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryAccent} />
          <Text style={styles.summaryText}>{article.summary}</Text>
        </View>

        {/* Content */}
        <View style={styles.contentCard}>
          {paragraphs.map((p, i) => {
            // Check if it looks like a heading (short, no period at end)
            const isHeading = p.length < 80 && !p.endsWith('.') && !p.endsWith(':') && !p.includes('\n');
            // Check if it looks like a numbered list item
            const isListItem = /^\d+[\.\)]\s/.test(p);

            if (isHeading && i > 0) {
              return (
                <Text key={i} style={styles.contentHeading}>{p}</Text>
              );
            }

            if (isListItem) {
              return (
                <View key={i} style={styles.listItem}>
                  <View style={styles.listDot} />
                  <Text style={styles.contentParagraph}>{p}</Text>
                </View>
              );
            }

            return (
              <Text key={i} style={styles.contentParagraph}>{p}</Text>
            );
          })}
        </View>

        {/* Back to list */}
        <TouchableOpacity style={styles.backToList} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={18} color="#2563eb" />
          <Text style={styles.backToListText}>Tum Makaleler</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },

  // Header
  header: {
    backgroundColor: DARK_NAVY,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingBottom: 16,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: {
    flex: 1, fontSize: 18, fontWeight: '700',
    color: '#ffffff', textAlign: 'center',
  },

  // Scroll
  scrollView: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },

  // Meta
  metaRow: {
    flexDirection: 'row', gap: 8, marginBottom: 12, flexWrap: 'wrap',
  },
  badge: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
  },
  badgeText: {
    fontSize: 12, fontWeight: '600',
  },

  // Title
  title: {
    fontSize: 24, fontWeight: '800', color: colors.gray[900],
    lineHeight: 32, marginBottom: 8,
  },

  // Date
  dateRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16,
  },
  dateText: {
    fontSize: 13, color: colors.gray[400],
  },

  // Summary
  summaryCard: {
    flexDirection: 'row', backgroundColor: '#eff6ff',
    borderRadius: 12, padding: 14, marginBottom: 20,
  },
  summaryAccent: {
    width: 3, backgroundColor: '#2563eb', borderRadius: 2, marginRight: 12,
  },
  summaryText: {
    flex: 1, fontSize: 15, color: '#1e40af',
    lineHeight: 22, fontWeight: '500',
  },

  // Content
  contentCard: {
    backgroundColor: colors.white, borderRadius: 16,
    padding: 20, marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#0a1628', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06, shadowRadius: 12,
      },
      android: { elevation: 3 },
    }),
  },
  contentParagraph: {
    fontSize: 15, color: colors.gray[700],
    lineHeight: 24, marginBottom: 16,
  },
  contentHeading: {
    fontSize: 18, fontWeight: '700', color: colors.gray[900],
    marginTop: 8, marginBottom: 12,
  },
  listItem: {
    flexDirection: 'row', marginBottom: 16,
  },
  listDot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: '#2563eb', marginTop: 9, marginRight: 10,
  },

  // Back
  backToList: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8,
    paddingVertical: 14, borderRadius: 12,
    backgroundColor: '#eff6ff',
  },
  backToListText: {
    fontSize: 15, fontWeight: '600', color: '#2563eb',
  },

  // Error
  errorState: {
    flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32,
  },
  errorText: {
    fontSize: 16, color: colors.gray[600], marginTop: 12, marginBottom: 20,
  },
  errorBtn: {
    paddingHorizontal: 24, paddingVertical: 10,
    borderRadius: 12, backgroundColor: '#2563eb',
  },
  errorBtnText: {
    fontSize: 15, fontWeight: '600', color: '#ffffff',
  },
});
