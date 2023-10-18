import { db } from "./index.js";

(async () => {
    db.serialize(() => {
        db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='patients'", (err, row) => {
            if (err) {
                console.error(err.message);
            } else if (!row) {
                db.run("CREATE TABLE patients (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, national_id TEXT UNIQUE)", (err) => {
                    if (err) {
                        console.error(err.message);
                    } else {
                        console.log("Table 'patients' created successfully");
                    }
                });
            }
        });
    });
})();

export const createNewPatient = (name, national_id, callback) => {
    db.run("INSERT INTO patients (name, national_id) VALUES (?, ?)", [name, national_id], function(err) {
        if (err) {
            console.error(err.message);
            callback(err);
        } else {
            const patient_id = this.lastID;
            callback(null, patient_id);
        }
    });
}