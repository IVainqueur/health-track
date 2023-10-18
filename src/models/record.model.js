import { db } from './index.js';

(async () => {
    db.serialize(() => {
        db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='records'", (err, row) => {
            if (err) {
                console.error(err.message);
            } else if (!row) {
                db.run("CREATE TABLE records (id INTEGER PRIMARY KEY AUTOINCREMENT, patient_id INTEGER, body_temperature REAL, heart_rate INTEGER, deduction TEXT DEFAULT 'fine', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(patient_id) REFERENCES patients(id) ON DELETE CASCADE)", (err) => {
                    if (err) {
                        console.error(err.message);
                    } else {
                        console.log("Table 'records' created successfully");
                    }
                });
            }
        });
    });
})();

export const createNewRecord = (patient_id, body_temperature, heart_rate, deduction, callback) => {
    db.run("INSERT INTO records (patient_id, body_temperature, heart_rate, deduction) VALUES (?, ?, ?, ?)", [patient_id, body_temperature, heart_rate, deduction], (err) => {
        if (err) {
            console.error(err.message);
            callback(err);
        } else {
            callback(null);
        }
    });
}