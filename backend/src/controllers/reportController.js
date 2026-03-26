import db from "../config/db.js";

export const getReports = (req, res) => {
    const { type, from, to } = req.query;
    const startDate = from ? `${from} 00:00:00` : '1970-01-01 00:00:00';
    const endDate = to ? `${to} 23:59:59` : '2099-12-31 23:59:59';

    const response = {
        visitor: [],
        call: [],
        recentVisitors: [],
        recentCalls: [],
        summary: {
            totalVisitors: 0,
            totalCalls: 0,
            avgDuration: 0 // Placeholder for now
        },
        charts: {
            purpose: [],
            topHosts: []
        }
    };

    const fetchVisitors = () => {
        return new Promise((resolve, reject) => {
            const sql = `
        SELECT 
          YEAR(check_in_time) as year, 
          MONTH(check_in_time) as month, 
          COUNT(*) as total 
        FROM visitor_log 
        WHERE check_in_time BETWEEN ? AND ?
        GROUP BY YEAR(check_in_time), MONTH(check_in_time)
        ORDER BY year, month
      `;
            db.query(sql, [startDate, endDate], (err, results) => {
                if (err) return reject(err);
                resolve(results);
            });
        });
    };

    const fetchCalls = () => {
        return new Promise((resolve, reject) => {
            const sql = `
        SELECT 
          YEAR(call_time) as year, 
          MONTH(call_time) as month, 
          COUNT(*) as total 
        FROM call_logs 
        WHERE call_time BETWEEN ? AND ?
        GROUP BY YEAR(call_time), MONTH(call_time)
        ORDER BY year, month
      `;
            db.query(sql, [startDate, endDate], (err, results) => {
                if (err) return reject(err);
                resolve(results);
            });
        });
    };

    const fetchRecentVisitors = () => {
        return new Promise((resolve, reject) => {
            const sql = `
        SELECT 
          v.visitorLog_ID as id,
          CONCAT(g.guest_firstname, ' ', g.guest_lastname) as name,
          v.check_in_time as date,
          v.visit_purpose as purpose,
          g.guest_phonenumber as contact
        FROM visitor_log v
        JOIN guest g ON v.guest_ID = g.guest_ID
        WHERE v.check_in_time BETWEEN ? AND ?
        ORDER BY v.check_in_time DESC
        LIMIT 5
      `;
            db.query(sql, [startDate, endDate], (err, results) => {
                if (err) return reject(err);
                resolve(results);
            });
        });
    };

    const fetchRecentCalls = () => {
        return new Promise((resolve, reject) => {
            const sql = `
        SELECT 
          call_log_ID as id,
          CONCAT(caller_firstname, ' ', caller_lastname) as name,
          call_time as date,
          purpose as purpose,
          contact as contact
        FROM call_logs
        WHERE call_time BETWEEN ? AND ?
        ORDER BY call_time DESC
        LIMIT 5
      `;
            db.query(sql, [startDate, endDate], (err, results) => {
                if (err) return reject(err);
                resolve(results);
            });
        });
    };

    // --- New Queries ---

    const fetchSummaryStats = () => {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT 
                    (SELECT COUNT(*) FROM visitor_log WHERE check_in_time BETWEEN ? AND ?) as totalVisitors,
                    (SELECT COUNT(*) FROM call_logs WHERE call_time BETWEEN ? AND ?) as totalCalls
            `;
            db.query(sql, [startDate, endDate, startDate, endDate], (err, results) => {
                if (err) return reject(err);
                resolve(results[0]);
            });
        });
    };

    const fetchPurposeBreakdown = () => {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT TRIM(visit_purpose) as label, COUNT(*) as value
                FROM visitor_log
                WHERE check_in_time BETWEEN ? AND ?
                GROUP BY TRIM(visit_purpose)
                ORDER BY value DESC
                LIMIT 5
            `;
            db.query(sql, [startDate, endDate], (err, results) => {
                if (err) return reject(err);
                resolve(results);
            });
        });
    };

    const fetchTopHosts = () => {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT 
                    CASE 
                        WHEN v.is_staff = 1 THEN s.staff_name 
                        ELSE n.nonstaff_name 
                    END as label,
                    COUNT(*) as value
                FROM visitor_log v
                LEFT JOIN staff s ON v.host_ID = s.id AND v.is_staff = 1
                LEFT JOIN nonstaff n ON v.host_ID = n.nonstaff_ID AND v.is_staff = 0
                WHERE v.check_in_time BETWEEN ? AND ?
                GROUP BY label
                ORDER BY value DESC
                LIMIT 5
            `;
            db.query(sql, [startDate, endDate], (err, results) => {
                if (err) return reject(err);
                resolve(results);
            });
        });
    };

    const promises = [];

    // Always fetch summary and charts
    promises.push(fetchSummaryStats().then(data => {
        response.summary.totalVisitors = data.totalVisitors;
        response.summary.totalCalls = data.totalCalls;
    }));
    promises.push(fetchPurposeBreakdown().then(data => response.charts.purpose = data));
    promises.push(fetchTopHosts().then(data => response.charts.topHosts = data));

    if (type === 'visitor' || type === 'visitors' || type === 'both' || !type) {
        promises.push(fetchVisitors().then(data => response.visitor = data));
        promises.push(fetchRecentVisitors().then(data => response.recentVisitors = data));
    }

    if (type === 'call' || type === 'calls' || type === 'both' || !type) {
        promises.push(fetchCalls().then(data => response.call = data));
        promises.push(fetchRecentCalls().then(data => response.recentCalls = data));
    }

    Promise.all(promises)
        .then(() => res.json(response))
        .catch(err => {
            console.error("Error fetching reports:", err);
            res.status(500).json({ message: "Database error", error: err.message });
        });
};

export const getDashboardStats = (req, res) => {
    const todayStart = new Date().toISOString().slice(0, 10) + ' 00:00:00';
    const todayEnd = new Date().toISOString().slice(0, 10) + ' 23:59:59';

    const response = {
        active_visitors_count: 0,
        calls_today_count: 0,
        recent_activities: [],
        active_visitors_list: []
    };

    const fetchActiveVisitorsCount = () => {
        return new Promise((resolve, reject) => {
            // Assuming active visitors have check_in_time but no check_out_time
            const sql = "SELECT COUNT(*) as count FROM visitor_log WHERE check_out_time IS NULL";
            db.query(sql, (err, results) => {
                if (err) return reject(err);
                resolve(results[0].count);
            });
        });
    };

    const fetchCallsTodayCount = () => {
        return new Promise((resolve, reject) => {
            const sql = "SELECT COUNT(*) as count FROM call_logs WHERE call_time BETWEEN ? AND ?";
            db.query(sql, [todayStart, todayEnd], (err, results) => {
                if (err) return reject(err);
                resolve(results[0].count);
            });
        });
    };

    const fetchActiveVisitorsList = () => {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT 
                    v.visitorLog_ID as id,
                    CONCAT(g.guest_firstname, ' ', g.guest_lastname) as name,
                    v.check_in_time as checkInTime,
                    v.visit_purpose as purpose,
                    g.guest_phonenumber as contact
                FROM visitor_Log v
                JOIN guest g ON v.guest_ID = g.guest_ID
                WHERE v.check_out_time IS NULL
                ORDER BY v.check_in_time DESC
            `;
            db.query(sql, (err, results) => {
                if (err) return reject(err);
                resolve(results);
            });
        });
    };

    const fetchRecentActivities = () => {
        return new Promise((resolve, reject) => {
            // Combine visitors (check-in & check-out) and calls, sort by date desc, limit 7
            const sql = `
                SELECT * FROM (
                    SELECT 
                        'check-in' as type,
                        v.visitorLog_ID as id,
                        CONCAT(g.guest_firstname, ' ', g.guest_lastname) as name,
                        v.check_in_time as date,
                        v.visit_purpose as purpose,
                        NULL as status_info
                    FROM visitor_Log v
                    JOIN guest g ON v.guest_ID = g.guest_ID
                    
                    UNION ALL

                    SELECT 
                        'check-out' as type,
                        v.visitorLog_ID as id,
                        CONCAT(g.guest_firstname, ' ', g.guest_lastname) as name,
                        v.check_out_time as date,
                        v.visit_purpose as purpose,
                        NULL as status_info
                    FROM visitor_Log v
                    JOIN guest g ON v.guest_ID = g.guest_ID
                    WHERE v.check_out_time IS NOT NULL
                    
                    UNION ALL
                    
                    SELECT 
                        'call' as type,
                        call_log_ID as id,
                        CONCAT(caller_firstname, ' ', caller_lastname) as name,
                        call_time as date,
                        purpose as purpose,
                        NULL as status_info
                    FROM call_logs
                ) as combined
                ORDER BY date DESC
                LIMIT 7
            `;
            db.query(sql, (err, results) => {
                if (err) return reject(err);
                resolve(results);
            });
        });
    };

    Promise.all([
        fetchActiveVisitorsCount().then(count => response.active_visitors_count = count),
        fetchCallsTodayCount().then(count => response.calls_today_count = count),
        fetchActiveVisitorsList().then(list => response.active_visitors_list = list),
        fetchRecentActivities().then(activities => response.recent_activities = activities)
    ])
        .then(() => res.json(response))
        .catch(err => {
            console.error("Error fetching dashboard stats:", err);
            res.status(500).json({ message: "Database error", error: err.message });
        });
};
export const exportReport = (req, res) => {
    const { type, from, to } = req.query;
    const startDate = from ? `${from} 00:00:00` : '1970-01-01 00:00:00';
    const endDate = to ? `${to} 23:59:59` : '2099-12-31 23:59:59';

    const fetchVisitors = () => {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT 
                    v.visitorLog_ID,
                    CONCAT(g.guest_firstname, ' ', g.guest_lastname) as name,
                    g.guest_phonenumber as contact,
                    v.visit_purpose,
                    v.check_in_time,
                    v.check_out_time,
                    CASE WHEN v.is_staff = 1 THEN s.staff_name ELSE n.nonstaff_name END as host_name
                FROM visitor_log v
                JOIN guest g ON v.guest_ID = g.guest_ID
                LEFT JOIN staff s ON v.host_ID = s.id AND v.is_staff = 1
                LEFT JOIN nonstaff n ON v.host_ID = n.nonstaff_ID AND v.is_staff = 0
                WHERE v.check_in_time BETWEEN ? AND ?
                ORDER BY v.check_in_time DESC
            `;
            db.query(sql, [startDate, endDate], (err, results) => {
                if (err) return reject(err);
                resolve(results);
            });
        });
    };

    const fetchCalls = () => {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT 
                    call_log_ID,
                    CONCAT(caller_firstname, ' ', caller_lastname) as name,
                    contact,
                    purpose,
                    call_time
                FROM call_logs
                WHERE call_time BETWEEN ? AND ?
                ORDER BY call_time DESC
            `;
            db.query(sql, [startDate, endDate], (err, results) => {
                if (err) return reject(err);
                resolve(results);
            });
        });
    };

    const promises = [];
    if (type === 'visitor' || type === 'visitors' || type === 'both' || !type) promises.push(fetchVisitors().then(data => ({ type: 'visitor', data })));
    if (type === 'call' || type === 'calls' || type === 'both' || !type) promises.push(fetchCalls().then(data => ({ type: 'call', data })));

    Promise.all(promises)
        .then(results => {
            let csvContent = "";

            results.forEach(result => {
                if (result.type === 'visitor') {
                    csvContent += "Visitor Log\n";
                    csvContent += "Name,Contact,Purpose,Host,Check In,Check Out\n";
                    result.data.forEach(row => {
                        csvContent += `"${row.name}","${row.contact}","${row.visit_purpose}","${row.host_name || ''}","${row.check_in_time}","${row.check_out_time || ''}"\n`;
                    });
                    csvContent += "\n";
                } else if (result.type === 'call') {
                    csvContent += "Call Log\n";
                    csvContent += "Name,Contact,Purpose,Date\n";
                    result.data.forEach(row => {
                        csvContent += `"${row.name}","${row.contact}","${row.purpose}","${row.call_time}"\n`;
                    });
                    csvContent += "\n";
                }
            });

            res.header('Content-Type', 'text/csv');
            res.attachment(`report_${from}_${to}.csv`);
            res.send(csvContent);
        })
        .catch(err => {
            console.error("Error exporting report:", err);
            res.status(500).json({ message: "Export failed", error: err.message });
        });
};
