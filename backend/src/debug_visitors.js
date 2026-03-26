import db from "./config/db.js";

const checkVisitors = () => {
    const sql = "SELECT * FROM visitor_Log ORDER BY visitorLog_ID DESC LIMIT 5";
    db.query(sql, (err, results) => {
        if (err) {
            console.error("Error querying database:", err);
            process.exit(1);
        }
        console.log("Recent Visitor Logs:");
        console.table(results);

        const activeSql = "SELECT COUNT(*) as count FROM visitor_Log WHERE check_out_time IS NULL";
        db.query(activeSql, (err, activeResults) => {
            if (err) {
                console.error("Error querying active count:", err);
            } else {
                console.log("Active Visitors Count (check_out_time IS NULL):", activeResults[0].count);
            }
            process.exit(0);
        });
    });
};

checkVisitors();
