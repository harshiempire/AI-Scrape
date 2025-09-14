import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, Modal, Switch, } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from '../../services/api';
export default function ChatScreen() {
    const { id } = useLocalSearchParams();
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [currentToolCall, setCurrentToolCall] = useState(null);
    const [showToolSelector, setShowToolSelector] = useState(false);
    const [conversation, setConversation] = useState(null);
    const flatListRef = useRef(null);
    const [availableTools, setAvailableTools] = useState([]);
    const [wsConnection, setWsConnection] = useState(null);
    useEffect(() => {
        loadConversation();
        loadTools();
        connectWebSocket();
        return () => {
            if (wsConnection) {
                wsConnection.close();
            }
        };
    }, [id]);
    const loadTools = async () => {
        try {
            const tools = await apiService.getTools();
            setAvailableTools(tools.map(tool => ({
                ...tool,
                enabled: true // Default to enabled
            })));
        }
        catch (error) {
            console.error('Error loading tools:', error);
        }
    };
    const connectWebSocket = () => {
        try {
            console.log('Connecting to WebSocket...');
            const ws = new WebSocket(`ws://localhost:3000/ws/agent/default`);
            ws.onopen = () => {
                console.log('WebSocket connected');
                // Send a test message to verify connection
                ws.send(JSON.stringify({
                    type: 'ping',
                    timestamp: new Date()
                }));
            };
            ws.onerror = (error) => {
                console.error('WebSocket error:', error);
            };
            ws.onclose = () => {
                console.log('WebSocket connection closed');
                setWsConnection(null);
            };
            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    console.log('WebSocket message received:', data);
                    if (data.type === 'pong') {
                        console.log('Received pong from server - connection verified');
                    }
                    else if (data.type === 'echo') {
                        console.log('Received echo from server:', data.data);
                        // If we're getting an echo of a chat message, something is wrong
                        if (data.data.type === 'chat') {
                            console.warn('Server echoed chat message instead of processing it!');
                            // Set loading to false since the server didn't process the message
                            setIsLoading(false);
                        }
                    }
                    else if (data.type === 'connected') {
                        console.log('Connected to agent:', data.agentId);
                    }
                    else if (data.type === 'tool_start') {
                        // Build a ToolCall object
                        const toolCall = {
                            id: Date.now().toString(),
                            tool: data.data.tool || 'unknown',
                            input: data.data.input || {},
                            status: 'running',
                            timestamp: new Date(),
                        };
                        setCurrentToolCall(toolCall);
                        // Insert a chat message for tool start
                        const startMessage = {
                            id: `tool_start_${toolCall.id}`,
                            role: 'assistant',
                            content: `🔧 Starting ${toolCall.tool}...`,
                            timestamp: new Date(),
                            toolCalls: [toolCall],
                        };
                        setMessages(prev => [...prev, startMessage]);
                    }
                    else if (data.type === 'tool_end') {
                        // Update the current tool call state
                        setCurrentToolCall(prev => prev ? {
                            ...prev,
                            status: data.data.error ? 'error' : 'completed',
                            output: data.data.result || data.data.error,
                        } : null);
                        // Build a completed ToolCall object
                        const completedToolCall = {
                            id: Date.now().toString(),
                            tool: data.data.tool || 'unknown',
                            input: data.data.input || {},
                            output: data.data.result,
                            status: data.data.error ? 'error' : 'completed',
                            timestamp: new Date(),
                        };
                        // Insert a chat message for tool end
                        const endMessage = {
                            id: `tool_end_${completedToolCall.id}`,
                            role: 'assistant',
                            content: data.data.error
                                ? `❌ ${completedToolCall.tool} failed: ${data.data.error}`
                                : `✅ ${completedToolCall.tool} completed`,
                            timestamp: new Date(),
                            toolCalls: [completedToolCall],
                        };
                        setMessages(prev => [...prev, endMessage]);
                        // Clear the live tool call indicator
                        setCurrentToolCall(null);
                    }
                    else if (data.type === 'response') {
                        // Final response from the agent
                        const assistantMessage = {
                            id: Date.now().toString(),
                            role: 'assistant',
                            content: data.data.text,
                            timestamp: new Date(),
                            toolCalls: [],
                        };
                        setMessages(prev => [...prev, assistantMessage]);
                        setIsLoading(false);
                        // Update conversation
                        if (conversation) {
                            const updatedConv = {
                                ...conversation,
                                messages: [...conversation.messages, assistantMessage],
                                updatedAt: new Date(),
                            };
                            setConversation(updatedConv);
                            saveConversation(updatedConv);
                        }
                    }
                    else if (data.type === 'error') {
                        // Error from the server
                        const errorMessage = {
                            id: Date.now().toString(),
                            role: 'assistant',
                            content: `Error: ${data.error || 'Unknown error'}`,
                            timestamp: new Date(),
                        };
                        setMessages(prev => [...prev, errorMessage]);
                        setIsLoading(false);
                        // Update conversation with error message
                        if (conversation) {
                            const updatedConv = {
                                ...conversation,
                                messages: [...conversation.messages, errorMessage],
                                updatedAt: new Date(),
                            };
                            setConversation(updatedConv);
                            saveConversation(updatedConv);
                        }
                    }
                }
                catch (error) {
                    console.error('Error parsing WebSocket message:', error);
                }
            };
            setWsConnection(ws);
        }
        catch (error) {
            console.error('Error connecting WebSocket:', error);
        }
    };
    const loadConversation = async () => {
        try {
            const conversationId = `conversation_${id}`;
            const stored = await AsyncStorage.getItem(conversationId);
            if (stored) {
                const conv = JSON.parse(stored);
                conv.messages = conv.messages.map(msg => ({
                    ...msg,
                    timestamp: new Date(msg.timestamp)
                }));
                setConversation(conv);
                setMessages(conv.messages);
                // Update tool states
                setAvailableTools(prev => prev.map(tool => ({
                    ...tool,
                    enabled: conv.enabledTools.includes(tool.name)
                })));
            }
            else {
                // Create new conversation
                const newConv = {
                    id: conversationId,
                    title: 'New Conversation',
                    messages: [
                        {
                            id: '1',
                            role: 'assistant',
                            content: `Hello! I'm your AI assistant. I have access to these tools: ${availableTools.filter(t => t.enabled).map(t => t.name).join(', ')}. How can I help you today?`,
                            timestamp: new Date(),
                        }
                    ],
                    enabledTools: availableTools.filter(t => t.enabled).map(t => t.name),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                };
                setConversation(newConv);
                setMessages(newConv.messages);
                await saveConversation(newConv);
            }
        }
        catch (error) {
            console.error('Error loading conversation:', error);
        }
    };
    const saveConversation = async (conv) => {
        try {
            await AsyncStorage.setItem(conv.id, JSON.stringify(conv));
        }
        catch (error) {
            console.error('Error saving conversation:', error);
        }
    };
    // const handleSendMessage = async () => {
    //   if (!inputText.trim() || isLoading) return;
    //   const userMessage: Message = {
    //     id: Date.now().toString(),
    //     role: 'user',
    //     content: inputText.trim(),
    //     timestamp: new Date(),
    //   };
    //   const updatedMessages = [...messages, userMessage];
    //   setMessages(updatedMessages);
    //   setInputText('');
    //   setIsLoading(true);
    //   // Update conversation
    //   const updatedConv = {
    //     ...conversation!,
    //     messages: updatedMessages,
    //     updatedAt: new Date(),
    //   };
    //   setConversation(updatedConv);
    //   await saveConversation(updatedConv);
    //   // Call the real AI agent API
    //   try {
    //     const enabledToolNames = availableTools.filter(t => t.enabled).map(t => t.name);
    //     const response = await apiService.chatWithAgent('default', inputText, enabledToolNames);
    //     const assistantMessage: Message = {
    //       id: (Date.now() + 1).toString(),
    //       role: 'assistant',
    //       content: response.text,
    //       timestamp: new Date(),
    //       toolCalls: response.toolCalls || [],
    //     };
    //     const finalMessages = [...updatedMessages, assistantMessage];
    //     setMessages(finalMessages);
    //     // Update conversation
    //     const finalConv = {
    //       ...updatedConv,
    //       messages: finalMessages,
    //       updatedAt: new Date(),
    //     };
    //     setConversation(finalConv);
    //     await saveConversation(finalConv);
    //     setIsLoading(false);
    //   } catch (error) {
    //     console.error('Error calling AI agent:', error);
    //     const errorMessage: Message = {
    //       id: (Date.now() + 1).toString(),
    //       role: 'assistant',
    //       content: 'Sorry, I encountered an error while processing your request. Please try again.',
    //       timestamp: new Date(),
    //     };
    //     const finalMessages = [...updatedMessages, errorMessage];
    //     setMessages(finalMessages);
    //     // Update conversation
    //     const finalConv = {
    //       ...updatedConv,
    //       messages: finalMessages,
    //       updatedAt: new Date(),
    //     };
    //     setConversation(finalConv);
    //     await saveConversation(finalConv);
    //     setIsLoading(false);
    //   }
    // };
    const handleSendMessage = async () => {
        if (!inputText.trim() || isLoading || !wsConnection)
            return;
        const userMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: inputText.trim(),
            timestamp: new Date(),
        };
        const updatedMessages = [...messages, userMessage];
        setMessages(updatedMessages);
        setInputText('');
        setIsLoading(true);
        // Update conversation
        const updatedConv = {
            ...conversation,
            messages: updatedMessages,
            updatedAt: new Date(),
        };
        setConversation(updatedConv);
        await saveConversation(updatedConv);
        // Send message via WebSocket
        try {
            wsConnection.send(JSON.stringify({
                type: 'chat',
                message: inputText,
                enabledTools: availableTools.filter(t => t.enabled).map(t => t.name),
            }));
            // Handle WebSocket response in the WebSocket message event listener
        }
        catch (error) {
            console.error('Error sending message via WebSocket:', error);
            setIsLoading(false);
        }
    };
    const toggleTool = async (toolId) => {
        const updatedTools = availableTools.map(tool => tool.id === toolId ? { ...tool, enabled: !tool.enabled } : tool);
        setAvailableTools(updatedTools);
        // Update conversation with new enabled tools
        const enabledToolNames = updatedTools.filter(t => t.enabled).map(t => t.name);
        const updatedConv = {
            ...conversation,
            enabledTools: enabledToolNames,
            updatedAt: new Date(),
        };
        setConversation(updatedConv);
        await saveConversation(updatedConv);
    };
    const renderToolCall = (toolCall) => {
        // Map status to icon and color
        let iconName;
        let iconColor;
        let statusText;
        if (toolCall.status === 'running') {
            iconName = 'hourglass';
            iconColor = '#f59e0b';
            statusText = '(Running...)';
        }
        else if (toolCall.status === 'completed') {
            iconName = 'checkmark-circle';
            iconColor = '#10b981';
            statusText = '(Completed)';
        }
        else {
            iconName = 'close-circle';
            iconColor = '#ef4444';
            statusText = '(Error)';
        }
        return (<View key={toolCall.id} style={styles.toolCallContainer}>
        <View style={styles.toolCallHeader}>
          <Ionicons name={iconName} size={16} color={iconColor}/>
          <Text style={styles.toolCallTitle}>
            {toolCall.tool} {statusText}
          </Text>
        </View>
        
        <View style={styles.toolCallDetails}>
          <Text style={styles.toolCallLabel}>Input:</Text>
          <Text style={styles.toolCallValue}>{JSON.stringify(toolCall.input)}</Text>
          
          {toolCall.output && (<>
              <Text style={styles.toolCallLabel}>Output:</Text>
              <Text style={styles.toolCallValue}>{JSON.stringify(toolCall.output)}</Text>
            </>)}
        </View>
      </View>);
    };
    const renderMessage = ({ item }) => (<View style={[
            styles.messageContainer,
            item.role === 'user' ? styles.userMessage : styles.assistantMessage
        ]}>
      <View style={styles.messageHeader}>
        <Ionicons name={item.role === 'user' ? 'person' : 'hardware-chip'} size={16} color={item.role === 'user' ? '#6366f1' : '#10b981'}/>
        <Text style={styles.messageRole}>
          {item.role === 'user' ? 'You' : 'AI Assistant'}
        </Text>
        <Text style={styles.messageTime}>
          {item.timestamp.toLocaleTimeString()}
        </Text>
      </View>
      
      <Text style={styles.messageContent}>{item.content}</Text>
      
      {item.toolCalls && item.toolCalls.map(renderToolCall)}
    </View>);
    const renderToolItem = ({ item }) => (<View style={styles.toolItem}>
      <View style={styles.toolInfo}>
        <Text style={styles.toolName}>{item.name}</Text>
        <Text style={styles.toolDescription}>{item.description}</Text>
        <Text style={styles.toolCategory}>{item.category}</Text>
      </View>
      <Switch value={item.enabled} onValueChange={() => toggleTool(item.id)} trackColor={{ false: '#e2e8f0', true: '#6366f1' }} thumbColor={item.enabled ? '#fff' : '#f4f4f4'}/>
    </View>);
    return (<KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.chatContainer}>
        <FlatList ref={flatListRef} data={messages} renderItem={renderMessage} keyExtractor={(item) => item.id} contentContainerStyle={styles.messagesList} onContentSizeChange={() => flatListRef.current?.scrollToEnd()}/>
        
        {currentToolCall && (<View style={styles.currentToolCall}>
            <ActivityIndicator size="small" color="#f59e0b"/>
            <Text style={styles.currentToolCallText}>
              Running {currentToolCall.tool}...
            </Text>
          </View>)}
        
        {isLoading && !currentToolCall && (<View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#6366f1"/>
            <Text style={styles.loadingText}>AI is thinking...</Text>
          </View>)}
      </View>

      <View style={styles.inputContainer}>
        <TouchableOpacity style={styles.toolsButton} onPress={() => setShowToolSelector(true)}>
          <Ionicons name="construct" size={20} color="#6366f1"/>
          <Text style={styles.toolsButtonText}>
            {availableTools.filter(t => t.enabled).length} tools
          </Text>
        </TouchableOpacity>
        
        <TextInput style={styles.textInput} value={inputText} onChangeText={setInputText} placeholder="Type your message..." multiline maxLength={500}/>
        <TouchableOpacity style={[styles.sendButton, (!inputText.trim() || isLoading) && styles.sendButtonDisabled]} onPress={handleSendMessage} disabled={!inputText.trim() || isLoading}>
          <Ionicons name="send" size={20} color="#fff"/>
        </TouchableOpacity>
      </View>

      <Modal visible={showToolSelector} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Tools</Text>
            <TouchableOpacity style={styles.closeButton} onPress={() => setShowToolSelector(false)}>
              <Ionicons name="close" size={24} color="#6366f1"/>
            </TouchableOpacity>
          </View>
          
          <FlatList data={availableTools} renderItem={renderToolItem} keyExtractor={(item) => item.id} contentContainerStyle={styles.toolsList}/>
          
          <View style={styles.modalFooter}>
            <Text style={styles.enabledToolsText}>
              {availableTools.filter(t => t.enabled).length} tools enabled
            </Text>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>);
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    chatContainer: {
        flex: 1,
    },
    messagesList: {
        padding: 16,
    },
    messageContainer: {
        marginBottom: 16,
        padding: 16,
        borderRadius: 16,
        maxWidth: '85%',
    },
    userMessage: {
        backgroundColor: '#6366f1',
        alignSelf: 'flex-end',
    },
    assistantMessage: {
        backgroundColor: '#fff',
        alignSelf: 'flex-start',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    messageHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    messageRole: {
        fontSize: 12,
        fontWeight: '600',
        marginLeft: 6,
        color: '#64748b',
    },
    messageTime: {
        fontSize: 10,
        color: '#94a3b8',
        marginLeft: 'auto',
    },
    messageContent: {
        fontSize: 16,
        lineHeight: 22,
        color: '#1e293b',
    },
    toolCallContainer: {
        marginTop: 12,
        padding: 12,
        backgroundColor: '#f1f5f9',
        borderRadius: 8,
        borderLeftWidth: 3,
        borderLeftColor: '#6366f1',
    },
    toolCallHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    toolCallTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 6,
        color: '#1e293b',
    },
    toolCallDetails: {
        gap: 4,
    },
    toolCallLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748b',
        textTransform: 'uppercase',
    },
    toolCallValue: {
        fontSize: 13,
        color: '#475569',
        fontFamily: 'monospace',
    },
    currentToolCall: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#fef3c7',
        marginHorizontal: 16,
        marginBottom: 8,
        borderRadius: 8,
    },
    currentToolCallText: {
        marginLeft: 8,
        fontSize: 14,
        color: '#92400e',
        fontWeight: '500',
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#e0e7ff',
        marginHorizontal: 16,
        marginBottom: 8,
        borderRadius: 8,
    },
    loadingText: {
        marginLeft: 8,
        fontSize: 14,
        color: '#3730a3',
        fontWeight: '500',
    },
    inputContainer: {
        flexDirection: 'row',
        padding: 16,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
        alignItems: 'flex-end',
    },
    toolsButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: '#f1f5f9',
        borderRadius: 16,
        marginRight: 12,
    },
    toolsButtonText: {
        marginLeft: 6,
        fontSize: 12,
        fontWeight: '600',
        color: '#6366f1',
    },
    textInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        maxHeight: 100,
        marginRight: 12,
    },
    sendButton: {
        backgroundColor: '#6366f1',
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButtonDisabled: {
        backgroundColor: '#cbd5e1',
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
    toolsList: {
        padding: 20,
    },
    toolItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    toolInfo: {
        flex: 1,
    },
    toolName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 4,
    },
    toolDescription: {
        fontSize: 14,
        color: '#64748b',
        marginBottom: 4,
    },
    toolCategory: {
        fontSize: 12,
        color: '#6366f1',
        fontWeight: '500',
    },
    modalFooter: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
        alignItems: 'center',
    },
    enabledToolsText: {
        fontSize: 14,
        color: '#64748b',
        fontWeight: '500',
    },
});
