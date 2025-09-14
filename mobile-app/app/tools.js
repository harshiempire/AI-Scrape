import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Switch, } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
export default function ToolsScreen() {
    const [tools, setTools] = useState([
        {
            id: '1',
            name: 'calculator',
            description: 'Evaluate math expressions safely',
            category: 'Math',
            enabled: true,
            usageCount: 15,
            lastUsed: new Date(),
        },
        {
            id: '2',
            name: 'calculateSum',
            description: 'Adds up numbers',
            category: 'Math',
            enabled: true,
            usageCount: 8,
            lastUsed: new Date(Date.now() - 3600000),
        },
        {
            id: '3',
            name: 'calculateProduct',
            description: 'Multiplies numbers',
            category: 'Math',
            enabled: false,
            usageCount: 5,
            lastUsed: new Date(Date.now() - 7200000),
        },
        {
            id: '4',
            name: 'calculateAverage',
            description: 'Calculates the average of numbers',
            category: 'Math',
            enabled: false,
            usageCount: 3,
            lastUsed: new Date(Date.now() - 10800000),
        },
        {
            id: '5',
            name: 'weather',
            description: 'Get current weather for a location',
            category: 'Information',
            enabled: true,
            usageCount: 12,
            lastUsed: new Date(Date.now() - 1800000),
        },
        {
            id: '6',
            name: 'search',
            description: 'Search for information on a topic',
            category: 'Information',
            enabled: false,
            usageCount: 20,
            lastUsed: new Date(Date.now() - 900000),
        },
    ]);
    const [selectedCategory, setSelectedCategory] = useState('All');
    useEffect(() => {
        loadToolStates();
    }, []);
    const loadToolStates = async () => {
        try {
            const stored = await AsyncStorage.getItem('tool_states');
            if (stored) {
                const toolStates = JSON.parse(stored);
                setTools(prev => prev.map(tool => ({
                    ...tool,
                    enabled: toolStates[tool.id] ?? tool.enabled
                })));
            }
        }
        catch (error) {
            console.error('Error loading tool states:', error);
        }
    };
    const saveToolStates = async (updatedTools) => {
        try {
            const toolStates = updatedTools.reduce((acc, tool) => {
                acc[tool.id] = tool.enabled;
                return acc;
            }, {});
            await AsyncStorage.setItem('tool_states', JSON.stringify(toolStates));
        }
        catch (error) {
            console.error('Error saving tool states:', error);
        }
    };
    const toggleTool = async (toolId) => {
        const updatedTools = tools.map(tool => tool.id === toolId ? { ...tool, enabled: !tool.enabled } : tool);
        setTools(updatedTools);
        await saveToolStates(updatedTools);
    };
    const resetAllTools = () => {
        Alert.alert('Reset All Tools', 'This will reset all tool states to their defaults. Continue?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Reset',
                onPress: async () => {
                    const resetTools = tools.map(tool => ({
                        ...tool,
                        enabled: ['calculator', 'weather', 'calculateSum'].includes(tool.name)
                    }));
                    setTools(resetTools);
                    await saveToolStates(resetTools);
                    await AsyncStorage.removeItem('tool_states');
                }
            }
        ]);
    };
    const categories = ['All', ...Array.from(new Set(tools.map(tool => tool.category)))];
    const filteredTools = tools.filter(tool => selectedCategory === 'All' || tool.category === selectedCategory);
    const handleToolPress = (tool) => {
        Alert.alert(tool.name, `${tool.description}\n\nCategory: ${tool.category}\nUsage Count: ${tool.usageCount}\nLast Used: ${tool.lastUsed?.toLocaleString()}\nStatus: ${tool.enabled ? 'Enabled' : 'Disabled'}`, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Test Tool', onPress: () => testTool(tool) },
        ]);
    };
    const testTool = (tool) => {
        Alert.alert('Test Tool', `Testing ${tool.name}...\n\nThis would normally connect to your AI Agents backend to execute the tool.`, [{ text: 'OK' }]);
    };
    const getStatusColor = (enabled) => {
        return enabled ? '#10b981' : '#6b7280';
    };
    const getStatusIcon = (enabled) => {
        return enabled ? 'checkmark-circle' : 'pause-circle';
    };
    const renderToolItem = ({ item }) => (<TouchableOpacity style={styles.toolCard} onPress={() => handleToolPress(item)}>
      <View style={styles.toolHeader}>
        <View style={styles.toolIcon}>
          <Ionicons name={item.category === 'Math' ? 'calculator' : 'search'} size={24} color="#6366f1"/>
        </View>
        <View style={styles.toolInfo}>
          <Text style={styles.toolName}>{item.name}</Text>
          <Text style={styles.toolDescription}>{item.description}</Text>
        </View>
        <View style={styles.toolControls}>
          <View style={styles.toolStatus}>
            <Ionicons name={getStatusIcon(item.enabled)} size={20} color={getStatusColor(item.enabled)}/>
          </View>
          <Switch value={item.enabled} onValueChange={() => toggleTool(item.id)} trackColor={{ false: '#e2e8f0', true: '#6366f1' }} thumbColor={item.enabled ? '#fff' : '#f4f4f4'}/>
        </View>
      </View>

      <View style={styles.toolMeta}>
        <View style={styles.toolCategory}>
          <Text style={styles.categoryText}>{item.category}</Text>
        </View>
        <View style={styles.toolStats}>
          <View style={styles.statItem}>
            <Ionicons name="stats-chart" size={14} color="#64748b"/>
            <Text style={styles.statText}>{item.usageCount}</Text>
          </View>
          {item.lastUsed && (<View style={styles.statItem}>
              <Ionicons name="time" size={14} color="#64748b"/>
              <Text style={styles.statText}>
                {item.lastUsed.toLocaleDateString()}
              </Text>
            </View>)}
        </View>
      </View>
    </TouchableOpacity>);
    const renderCategoryFilter = ({ item }) => (<TouchableOpacity style={[
            styles.categoryButton,
            selectedCategory === item && styles.categoryButtonActive
        ]} onPress={() => setSelectedCategory(item)}>
      <Text style={[
            styles.categoryButtonText,
            selectedCategory === item && styles.categoryButtonTextActive
        ]}>
        {item}
      </Text>
    </TouchableOpacity>);
    return (<View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Tool Management</Text>
        <TouchableOpacity style={styles.resetButton} onPress={resetAllTools}>
          <Ionicons name="refresh" size={24} color="#ef4444"/>
        </TouchableOpacity>
      </View>

      <View style={styles.filtersContainer}>
        <FlatList data={categories} renderItem={renderCategoryFilter} keyExtractor={(item) => item} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesList}/>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{tools.length}</Text>
          <Text style={styles.statLabel}>Total Tools</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {tools.filter(t => t.enabled).length}
          </Text>
          <Text style={styles.statLabel}>Enabled</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {tools.reduce((sum, tool) => sum + tool.usageCount, 0)}
          </Text>
          <Text style={styles.statLabel}>Total Usage</Text>
        </View>
      </View>

      <View style={styles.infoContainer}>
        <Ionicons name="information-circle" size={20} color="#6366f1"/>
        <Text style={styles.infoText}>
          Enable/disable tools to control what your AI assistant can use in conversations
        </Text>
      </View>

      <FlatList data={filteredTools} renderItem={renderToolItem} keyExtractor={(item) => item.id} contentContainerStyle={styles.toolsList} showsVerticalScrollIndicator={false}/>
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
    resetButton: {
        backgroundColor: '#fef2f2',
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    filtersContainer: {
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    categoriesList: {
        gap: 8,
    },
    categoryButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#f1f5f9',
        marginRight: 8,
    },
    categoryButtonActive: {
        backgroundColor: '#6366f1',
    },
    categoryButtonText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#64748b',
    },
    categoryButtonTextActive: {
        color: '#fff',
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
    infoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        backgroundColor: '#e0e7ff',
        marginHorizontal: 20,
        marginBottom: 20,
        borderRadius: 8,
    },
    infoText: {
        marginLeft: 8,
        fontSize: 14,
        color: '#3730a3',
        flex: 1,
    },
    toolsList: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    toolCard: {
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
    toolHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    toolIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#f1f5f9',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    toolInfo: {
        flex: 1,
    },
    toolName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 4,
    },
    toolDescription: {
        fontSize: 14,
        color: '#64748b',
        lineHeight: 20,
    },
    toolControls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    toolStatus: {
        marginLeft: 12,
    },
    toolMeta: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    toolCategory: {
        backgroundColor: '#e0e7ff',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    categoryText: {
        fontSize: 11,
        color: '#6366f1',
        fontWeight: '500',
    },
    toolStats: {
        flexDirection: 'row',
        gap: 16,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    statText: {
        fontSize: 12,
        color: '#64748b',
    },
});
