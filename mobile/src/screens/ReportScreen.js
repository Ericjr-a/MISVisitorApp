import React, { useContext, useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Dimensions, TextInput } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { getReports, deleteVisitor } from '../services/api';
import { BarChart, LineChart } from 'react-native-chart-kit';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

const screenWidth = Dimensions.get('window').width;

const ReportScreen = () => {
    const { userToken } = useContext(AuthContext);
    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState({ visitor: [], call: [], recentVisitors: [], recentCalls: [] });
    const [filterType, setFilterType] = useState('visitors'); // visitors, calls, both
    const [fromDate, setFromDate] = useState('2025-01-01');
    const [toDate, setToDate] = useState('2025-12-31');
    const [showFromPicker, setShowFromPicker] = useState(false);
    const [showToPicker, setShowToPicker] = useState(false);

    const onFromChange = (event, selectedDate) => {
        setShowFromPicker(false);
        if (selectedDate) {
            setFromDate(selectedDate.toISOString().split('T')[0]);
        }
    };

    const onToChange = (event, selectedDate) => {
        setShowToPicker(false);
        if (selectedDate) {
            setToDate(selectedDate.toISOString().split('T')[0]);
        }
    };

    const [chartData, setChartData] = useState({
        labels: [],
        datasets: [{ data: [] }],
        legend: [],
        data: [],
        barColors: []
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0, visible: false, value: 0 });

    useEffect(() => {
        fetchReports();
    }, [filterType]);

    const fetchReports = async () => {
        setLoading(true);
        try {
            const data = await getReports(userToken, filterType, fromDate, toDate);
            setReportData(data);
            processChartData(data);
        } catch (error) {
            Alert.alert('Error', 'Failed to fetch reports');
        } finally {
            setLoading(false);
        }
    };

    const processChartData = (data) => {
        if (filterType === 'both') {
            // Process for LineChart (Multi-line)
            const visitorMap = new Map();
            const callMap = new Map();
            const allKeys = new Set();

            (data.visitor || []).forEach(item => {
                const key = `${item.month}/${item.year}`;
                visitorMap.set(key, item.total);
                allKeys.add(key);
            });

            (data.call || []).forEach(item => {
                const key = `${item.month}/${item.year}`;
                callMap.set(key, item.total);
                allKeys.add(key);
            });

            const sortedKeys = Array.from(allKeys).sort((a, b) => {
                const [m1, y1] = a.split('/').map(Number);
                const [m2, y2] = b.split('/').map(Number);
                return y1 - y2 || m1 - m2;
            });

            const visitorValues = sortedKeys.map(key => visitorMap.get(key) || 0);
            const callValues = sortedKeys.map(key => callMap.get(key) || 0);

            if (sortedKeys.length === 0) {
                setChartData({
                    labels: ['No Data'],
                    datasets: [
                        { data: [0], color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})` }, // Blue
                        { data: [0], color: (opacity = 1) => `rgba(239, 68, 68, ${opacity})` }   // Red
                    ],
                    legend: ['Visitors', 'Calls']
                });
            } else {
                setChartData({
                    labels: sortedKeys,
                    datasets: [
                        {
                            data: visitorValues,
                            color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`, // Blue
                            strokeWidth: 2
                        },
                        {
                            data: callValues,
                            color: (opacity = 1) => `rgba(239, 68, 68, ${opacity})`, // Red
                            strokeWidth: 2
                        }
                    ],
                    legend: ['Visitors', 'Calls']
                });
            }

        } else {
            // Process for simple BarChart
            const labels = [];
            const values = [];
            const dataToMap = filterType === 'calls' ? data.call : data.visitor;

            if (dataToMap && dataToMap.length > 0) {
                dataToMap.forEach(item => {
                    const label = `${item.month}/${item.year}`;
                    labels.push(label);
                    values.push(item.total);
                });
            }

            if (labels.length === 0) {
                setChartData({
                    labels: ['No Data'],
                    datasets: [{ data: [0] }]
                });
            } else {
                setChartData({
                    labels: labels,
                    datasets: [{ data: values }]
                });
            }
        }
    };

    const handleDelete = async (id, type) => {
        Alert.alert(
            'Confirm Delete',
            'Are you sure you want to delete this record?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            if (type === 'visitor') {
                                await deleteVisitor(userToken, id);
                            } else {
                                Alert.alert('Notice', 'Delete call not fully implemented in mobile yet');
                                return;
                            }
                            Alert.alert('Success', 'Record deleted');
                            fetchReports();
                        } catch (error) {
                            Alert.alert('Error', error.message);
                        }
                    },
                },
            ]
        );
    };

    const calculateTotal = (data) => {
        return data.reduce((acc, curr) => acc + curr.total, 0);
    };

    const generatePDF = async () => {
        const htmlContent = `
            <html>
              <head>
                <style>
                  body { font-family: 'Helvetica'; padding: 20px; }
                  h1 { text-align: center; color: #333; }
                  table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                  th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                  th { background-color: #f2f2f2; }
                  .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #777; }
                </style>
              </head>
              <body>
                <h1>Visitor Report</h1>
                <p><strong>Type:</strong> ${filterType.toUpperCase()}</p>
                <p><strong>Date Range:</strong> ${fromDate} to ${toDate}</p>
                
                <h2>Summary</h2>
                <p>Total Records: ${calculateTotal(filterType === 'calls' ? reportData.call : reportData.visitor)}</p>

                <h2>Recent Activity</h2>
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Date</th>
                      <th>Purpose</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${(filterType === 'calls' ? reportData.recentCalls : reportData.recentVisitors).map(item => `
                        <tr>
                            <td>${item.name}</td>
                            <td>${new Date(item.date).toLocaleDateString()}</td>
                            <td>${item.purpose}</td>
                        </tr>
                    `).join('')}
                  </tbody>
                </table>
                <div class="footer">Generated by VisiLog Mobile App</div>
              </body>
            </html>
        `;

        try {
            const { uri } = await Print.printToFileAsync({ html: htmlContent });
            await Sharing.shareAsync(uri);
        } catch (error) {
            Alert.alert('Error', 'Failed to generate or share PDF');
            console.error(error);
        }
    };

    const renderRecentItem = ({ item, type }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.date}>{new Date(item.date).toLocaleDateString()}</Text>
            </View>
            <Text style={styles.detail}>Contact: {item.contact}</Text>
            <Text style={styles.detail}>Purpose: {item.purpose}</Text>
            <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(item.id, type)}>
                <Text style={styles.deleteText}>Delete</Text>
            </TouchableOpacity>
        </View>
    );

    const combinedRecent = [
        ...(filterType === 'visitors' || filterType === 'both' ? reportData.recentVisitors.map(i => ({ ...i, type: 'visitor' })) : []),
        ...(filterType === 'calls' || filterType === 'both' ? reportData.recentCalls.map(i => ({ ...i, type: 'call' })) : [])
    ].filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
        .sort((a, b) => new Date(b.date) - new Date(a.date));

    const isChartDataValid = () => {
        if (filterType === 'both') {
            return chartData.datasets && chartData.datasets.length === 2;
        }
        return chartData.datasets && chartData.datasets.length > 0;
    };

    return (
        <View style={styles.container}>
            <View style={styles.filterContainer}>
                <View style={styles.typeSelector}>
                    {['visitors', 'calls', 'both'].map(t => (
                        <TouchableOpacity
                            key={t}
                            style={[styles.filterButton, filterType === t && styles.activeFilter]}
                            onPress={() => setFilterType(t)}
                        >
                            <Text style={[styles.filterText, filterType === t && styles.activeFilterText]}>
                                {t.charAt(0).toUpperCase() + t.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={styles.dateContainer}>
                    <TouchableOpacity onPress={() => setShowFromPicker(true)} style={styles.dateButton}>
                        <Text style={styles.dateLabel}>From: {fromDate}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setShowToPicker(true)} style={styles.dateButton}>
                        <Text style={styles.dateLabel}>To: {toDate}</Text>
                    </TouchableOpacity>
                </View>
                {showFromPicker && (
                    <DateTimePicker
                        value={new Date(fromDate)}
                        mode="date"
                        display="default"
                        onChange={onFromChange}
                    />
                )}
                {showToPicker && (
                    <DateTimePicker
                        value={new Date(toDate)}
                        mode="date"
                        display="default"
                        onChange={onToChange}
                    />
                )}

                <View style={styles.actionButtons}>
                    <TouchableOpacity style={styles.updateButton} onPress={fetchReports}>
                        <Text style={styles.updateButtonText}>Update</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.exportButton} onPress={generatePDF}>
                        <Text style={styles.exportButtonText}>Export PDF</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.statsContainer}>
                    {(filterType === 'visitors' || filterType === 'both') && (
                        <View style={styles.statCard}>
                            <Text style={styles.statLabel}>Total Visitors</Text>
                            <Text style={styles.statValue}>{calculateTotal(reportData.visitor)}</Text>
                        </View>
                    )}
                    {(filterType === 'calls' || filterType === 'both') && (
                        <View style={styles.statCard}>
                            <Text style={styles.statLabel}>Total Calls</Text>
                            <Text style={styles.statValue}>{calculateTotal(reportData.call)}</Text>
                        </View>
                    )}
                </View>

                <View style={styles.chartContainer}>
                    <Text style={styles.sectionTitle}>Activity Overview</Text>
                    {!isChartDataValid() ? (
                        <ActivityIndicator size="large" color="#6366F1" />
                    ) : filterType === 'both' ? (
                        <LineChart
                            data={chartData}
                            width={screenWidth - 40}
                            height={220}
                            chartConfig={{
                                backgroundColor: '#ffffff',
                                backgroundGradientFrom: '#ffffff',
                                backgroundGradientTo: '#ffffff',
                                decimalPlaces: 0,
                                color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                                labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                                style: { borderRadius: 16 },
                                propsForDots: {
                                    r: "6",
                                    strokeWidth: "2",
                                    stroke: "#ffa726"
                                }
                            }}
                            bezier
                            style={{ marginVertical: 8, borderRadius: 16 }}
                            onDataPointClick={({ value, x, y }) => {
                                setTooltipPos({ x, y, visible: true, value });
                            }}
                            decorator={() => {
                                return tooltipPos.visible ? (
                                    <View>
                                        <View style={[styles.tooltip, { left: tooltipPos.x - 15, top: tooltipPos.y - 30 }]}>
                                            <Text style={styles.tooltipText}>{tooltipPos.value}</Text>
                                        </View>
                                    </View>
                                ) : null;
                            }}
                        />
                    ) : (
                        <BarChart
                            data={chartData}
                            width={screenWidth - 40}
                            height={220}
                            yAxisLabel=""
                            chartConfig={{
                                backgroundColor: '#ffffff',
                                backgroundGradientFrom: '#ffffff',
                                backgroundGradientTo: '#ffffff',
                                decimalPlaces: 0,
                                color: (opacity = 1) => {
                                    if (filterType === 'calls') return `rgba(239, 68, 68, ${opacity})`; // Red
                                    return `rgba(59, 130, 246, ${opacity})`; // Blue
                                },
                                labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                                style: { borderRadius: 16 },
                                barPercentage: 0.5,
                            }}
                            style={{ marginVertical: 8, borderRadius: 16 }}
                        />
                    )}
                </View>

                <Text style={styles.sectionTitle}>Recent Activity</Text>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search by name..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
                {loading ? (
                    <ActivityIndicator size="large" color="#6366F1" />
                ) : (
                    combinedRecent.map((item, index) => (
                        <View key={index}>
                            {renderRecentItem({ item, type: item.type })}
                        </View>
                    ))
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    filterContainer: { padding: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
    typeSelector: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 10 },
    filterButton: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, backgroundColor: '#F3F4F6' },
    activeFilter: { backgroundColor: '#6366F1' },
    filterText: { color: '#6B7280', fontWeight: '500' },
    activeFilterText: { color: '#fff' },
    dateContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10, gap: 10 },
    dateButton: { flex: 1, backgroundColor: '#fff', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#D1D5DB', alignItems: 'center' },
    dateLabel: { color: '#374151', fontSize: 14 },
    actionButtons: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
    updateButton: { flex: 1, backgroundColor: '#1F2937', padding: 10, borderRadius: 8, alignItems: 'center' },
    updateButtonText: { color: '#fff', fontWeight: 'bold' },
    exportButton: { flex: 1, backgroundColor: '#10B981', padding: 10, borderRadius: 8, alignItems: 'center' },
    exportButtonText: { color: '#fff', fontWeight: 'bold' },
    content: { padding: 15 },
    statsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    statCard: { flex: 1, backgroundColor: '#fff', padding: 15, borderRadius: 12, alignItems: 'center', marginHorizontal: 5, shadowColor: '#000', shadowOpacity: 0.05, elevation: 2 },
    statLabel: { color: '#6B7280', fontSize: 14 },
    statValue: { fontSize: 24, fontWeight: 'bold', color: '#1F2937', marginTop: 5 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#374151', marginBottom: 10, marginTop: 10 },
    chartContainer: { alignItems: 'center', marginBottom: 20, backgroundColor: '#fff', borderRadius: 12, padding: 10, shadowColor: '#000', shadowOpacity: 0.05, elevation: 2 },
    card: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.05, elevation: 2 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
    name: { fontSize: 16, fontWeight: 'bold', color: '#1F2937' },
    date: { color: '#9CA3AF', fontSize: 12 },
    detail: { color: '#6B7280', fontSize: 14, marginBottom: 2 },
    deleteButton: { alignSelf: 'flex-end', marginTop: 5 },
    deleteText: { color: '#EF4444', fontWeight: '600', fontSize: 12 },
    searchInput: { backgroundColor: '#fff', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 10 },
    tooltip: { position: 'absolute', backgroundColor: '#1F2937', padding: 5, borderRadius: 4, zIndex: 10 },
    tooltipText: { color: '#fff', fontSize: 12 },
});

export default ReportScreen;
