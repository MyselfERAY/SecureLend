import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/lib/auth-context';
import { api } from '../../src/lib/api';
import { colors } from '../../src/theme/colors';

interface Message {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  isRead: boolean;
  createdAt: string;
}

const POLL_INTERVAL = 5000;

export default function ChatRoomScreen() {
  const { roomId, title } = useLocalSearchParams<{ roomId: string; title?: string }>();
  const { tokens, user } = useAuth();
  const router = useRouter();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadMessages = useCallback(async (cursor?: string) => {
    if (!tokens?.accessToken || !roomId) return;
    try {
      const url = cursor
        ? `/api/v1/chat/rooms/${roomId}/messages?cursor=${cursor}&limit=50`
        : `/api/v1/chat/rooms/${roomId}/messages?limit=50`;
      const res = await api<{ messages: Message[]; nextCursor: string | null }>(url, {
        token: tokens.accessToken,
      });
      if (res.status === 'success' && res.data) {
        if (cursor) {
          setMessages((prev) => [...prev, ...res.data!.messages]);
        } else {
          setMessages(res.data.messages);
        }
        setNextCursor(res.data.nextCursor);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [tokens?.accessToken, roomId]);

  // Initial load + mark read
  useEffect(() => {
    loadMessages();
    if (tokens?.accessToken && roomId) {
      api(`/api/v1/chat/rooms/${roomId}/read`, {
        method: 'POST',
        token: tokens.accessToken,
      }).catch(() => {});
    }
  }, [loadMessages, tokens?.accessToken, roomId]);

  // Polling for new messages
  useEffect(() => {
    pollRef.current = setInterval(() => {
      loadMessages();
      // Also mark as read
      if (tokens?.accessToken && roomId) {
        api(`/api/v1/chat/rooms/${roomId}/read`, {
          method: 'POST',
          token: tokens.accessToken,
        }).catch(() => {});
      }
    }, POLL_INTERVAL);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [loadMessages, tokens?.accessToken, roomId]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending || !tokens?.accessToken) return;
    setSending(true);
    setInput('');
    try {
      const res = await api<Message>(`/api/v1/chat/rooms/${roomId}/messages`, {
        method: 'POST',
        body: { content: text },
        token: tokens.accessToken,
      });
      if (res.status === 'success' && res.data) {
        setMessages((prev) => [res.data!, ...prev]);
      }
    } catch {
      setInput(text); // restore on error
    } finally {
      setSending(false);
    }
  };

  const loadMore = () => {
    if (nextCursor) loadMessages(nextCursor);
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMe = item.senderId === user?.id;
    return (
      <View style={[styles.messageBubble, isMe ? styles.myMessage : styles.otherMessage]}>
        {!isMe && <Text style={styles.senderName}>{item.senderName}</Text>}
        <Text style={[styles.messageText, isMe && styles.myMessageText]}>{item.content}</Text>
        <Text style={[styles.messageTime, isMe && styles.myMessageTime]}>
          {new Date(item.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: title || 'Sohbet',
          headerStyle: { backgroundColor: colors.brand.dark },
          headerTintColor: colors.white,
          headerTitleStyle: { fontWeight: '700', fontSize: 17 },
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={{ marginRight: 8 }}
            >
              <Ionicons name="chevron-back" size={26} color={colors.white} />
            </TouchableOpacity>
          ),
        }}
      />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary[500]} />
          </View>
        ) : messages.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={48} color={colors.gray[300]} />
            <Text style={styles.emptyText}>Henuz mesaj yok</Text>
            <Text style={styles.emptySubtext}>Bir mesaj gondererek sohbeti baslatin</Text>
          </View>
        ) : (
          <FlatList
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            inverted
            contentContainerStyle={styles.messagesList}
            onEndReached={loadMore}
            onEndReachedThreshold={0.3}
          />
        )}

        {/* Input bar */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Mesajinizi yazin..."
            placeholderTextColor={colors.gray[400]}
            multiline
            maxLength={2000}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!input.trim() || sending) && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!input.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Ionicons name="send" size={20} color={colors.white} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.gray[500],
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.gray[400],
    marginTop: 6,
    textAlign: 'center',
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  messageBubble: {
    maxWidth: '78%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 8,
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primary[600],
    borderBottomRightRadius: 4,
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: colors.white,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary[600],
    marginBottom: 3,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 21,
    color: colors.gray[800],
  },
  myMessageText: {
    color: colors.white,
  },
  messageTime: {
    fontSize: 11,
    color: colors.gray[400],
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  myMessageTime: {
    color: 'rgba(255, 255, 255, 0.6)',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderRadius: 20,
    backgroundColor: colors.gray[100],
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.gray[800],
    marginRight: 8,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary[600],
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.gray[300],
  },
});
