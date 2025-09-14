import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, TextInput, Modal, } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
export default function HomeScreen() {
    const [conversations, setConversations] = useState([]);
    const [showNewChatModal, setShowNewChatModal] = useState(false);
    const [newChatTitle, setNewChatTitle] = useState('');
    useEffect(() => {
        loadConversations();
    }, []);
    const loadConversations = async () => {
        try {
            const keys = await AsyncStorage.getAllKeys();
            const conversationKeys = keys.filter(key => key.startsWith('conversation_'));
            const conversationData = await AsyncStorage.multiGet(conversationKeys);
            const loadedConversations = conversationData
                .map(([key, value]) => {
                if (value) {
                    const conv = JSON.parse(value);
                    return {
                        ...conv,
                        createdAt: new Date(conv.createdAt),
                        updatedAt: new Date(conv.updatedAt),
                    };
                }
                return null;
            })
                .filter(Boolean)
                .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
            setConversations(loadedConversations);
        }
        catch (error) {
            console.error('Error loading conversations:', error);
        }
    };
    const createNewConversation = async () => {
        if (!newChatTitle.trim()) {
            Alert.alert('Error', 'Please enter a conversation title');
            return;
        }
        const conversationId = `conversation_${Date.now()}`;
        const newConversation = {
            id: conversationId,
            title: newChatTitle.trim(),
            messages: [
                {
                    id: '1',
                    role: 'assistant',
                    content: 'Hello! I\'m your AI assistant. How can I help you today?',
                    timestamp: new Date().toISOString(),
                }
            ],
            enabledTools: ['calculator', 'weather', 'search'],
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        try {
            await AsyncStorage.setItem(conversationId, JSON.stringify(newConversation));
            setConversations(prev => [newConversation, ...prev]);
            setNewChatTitle('');
            setShowNewChatModal(false);
            // Navigate to the new conversation
            router.push(`/chat/${conversationId.replace('conversation_', '')}`);
        }
        catch (error) {
            Alert.alert('Error', 'Failed to create conversation');
        }
    };
    const deleteConversation = async (conversationId) => {
        Alert.alert('Delete Conversation', 'Are you sure you want to delete this conversation?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await AsyncStorage.removeItem(conversationId);
                        setConversations(prev => prev.filter(conv => conv.id !== conversationId));
                    }
                    catch (error) {
                        Alert.alert('Error', 'Failed to delete conversation');
                    }
                }
            }
        ]);
    };
    const getLastMessage = (conversation) => {
        if (conversation.messages.length === 0)
            return 'No messages yet';
        const lastMessage = conversation.messages[conversation.messages.length - 1];
        return lastMessage.content.length > 50
            ? lastMessage.content.substring(0, 50) + '...'
            : lastMessage.content;
    };
    const renderConversationItem = ({ item }) => (<TouchableOpacity style={styles.conversationCard} onPress={() => router.push(`/chat/${item.id.replace('conversation_', '')}`)}>
      <View style={styles.conversationHeader}>
        <View style={styles.conversationIcon}>
          <Ionicons name="chatbubble" size={24} color="#6366f1"/>
        </View>
        <View style={styles.conversationInfo}>
          <Text style={styles.conversationTitle}>{item.title}</Text>
          <Text style={styles.conversationLastMessage}>
            {getLastMessage(item)}
          </Text>
        </View>
        <TouchableOpacity style={styles.deleteButton} onPress={() => deleteConversation(item.id)}>
          <Ionicons name="trash" size={20} color="#ef4444"/>
        </TouchableOpacity>
      </View>
      
      <View style={styles.conversationMeta}>
        <View style={styles.toolsContainer}>
          <Text style={styles.toolsLabel}>Tools:</Text>
          <View style={styles.toolsList}>
            {item.enabledTools.slice(0, 3).map((tool, index) => (<View key={index} style={styles.toolTag}>
                <Text style={styles.toolText}>{tool}</Text>
              </View>))}
            {item.enabledTools.length > 3 && (<View style={styles.toolTag}>
                <Text style={styles.toolText}>+{item.enabledTools.length - 3}</Text>
              </View>)}
          </View>
        </View>
        
        <Text style={styles.timestamp}>
          {item.updatedAt.toLocaleDateString()} {item.updatedAt.toLocaleTimeString()}
        </Text>
      </View>
    </TouchableOpacity>);
    return (<View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>AI Conversations</Text>
        <TouchableOpacity style={styles.newChatButton} onPress={() => setShowNewChatModal(true)}>
          <Ionicons name="add" size={24} color="#fff"/>
        </TouchableOpacity>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{conversations.length}</Text>
          <Text style={styles.statLabel}>Conversations</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {conversations.reduce((sum, conv) => sum + conv.messages.length, 0)}
          </Text>
          <Text style={styles.statLabel}>Total Messages</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {conversations.reduce((sum, conv) => sum + conv.enabledTools.length, 0)}
          </Text>
          <Text style={styles.statLabel}>Tool Instances</Text>
        </View>
      </View>

      {conversations.length === 0 ? (<View style={styles.emptyState}>
          <Ionicons name="chatbubbles-outline" size={64} color="#cbd5e1"/>
          <Text style={styles.emptyTitle}>No Conversations Yet</Text>
          <Text style={styles.emptySubtitle}>
            Start a new conversation to begin chatting with your AI assistant
          </Text>
          <TouchableOpacity style={styles.startChatButton} onPress={() => setShowNewChatModal(true)}>
            <Ionicons name="add" size={20} color="#fff"/>
            <Text style={styles.startChatText}>Start New Chat</Text>
          </TouchableOpacity>
        </View>) : (<FlatList data={conversations} renderItem={renderConversationItem} keyExtractor={(item) => item.id} contentContainerStyle={styles.listContainer} showsVerticalScrollIndicator={false}/>)}

      <Modal visible={showNewChatModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>New Conversation</Text>
            <TouchableOpacity style={styles.closeButton} onPress={() => setShowNewChatModal(false)}>
              <Ionicons name="close" size={24} color="#6366f1"/>
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalContent}>
            <Text style={styles.inputLabel}>Conversation Title</Text>
            <TextInput style={styles.titleInput} value={newChatTitle} onChangeText={setNewChatTitle} placeholder="Enter conversation title..." maxLength={50}/>
            
            <Text style={styles.descriptionText}>
              This will create a new conversation where you can chat with your AI assistant and select which tools to use.
            </Text>
          </View>
          
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setShowNewChatModal(false)}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.createButton} onPress={createNewConversation}>
              <Text style={styles.createButtonText}>Create Chat</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>);
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    newChatButton: {
        backgroundColor: '#6366f1',
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        marginBottom: 20,
        gap: 12,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    statNumber: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#6366f1',
    },
    statLabel: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 4,
    },
    listContainer: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    conversationCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    conversationHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    conversationIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#f1f5f9',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    conversationInfo: {
        flex: 1,
    },
    conversationTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 4,
    },
    conversationLastMessage: {
        fontSize: 14,
        color: '#64748b',
        lineHeight: 20,
    },
    deleteButton: {
        padding: 8,
    },
    conversationMeta: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    toolsContainer: {
        flex: 1,
    },
    toolsLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748b',
        marginBottom: 8,
        textTransform: 'uppercase',
    },
    toolsList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    toolTag: {
        backgroundColor: '#e0e7ff',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    toolText: {
        fontSize: 11,
        color: '#6366f1',
        fontWeight: '500',
    },
    timestamp: {
        fontSize: 11,
        color: '#94a3b8',
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1e293b',
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 16,
        color: '#64748b',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 32,
    },
    startChatButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#6366f1',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 25,
    },
    startChatText: {
        marginLeft: 8,
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    modalContainer: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    closeButton: {
        padding: 8,
    },
    modalContent: {
        flex: 1,
        padding: 20,
    },
    inputLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 8,
    },
    titleInput: {
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        backgroundColor: '#fff',
        marginBottom: 16,
    },
    descriptionText: {
        fontSize: 14,
        color: '#64748b',
        lineHeight: 20,
    },
    modalFooter: {
        flexDirection: 'row',
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
        gap: 12,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#64748b',
    },
    createButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: '#6366f1',
        alignItems: 'center',
    },
    createButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
});
