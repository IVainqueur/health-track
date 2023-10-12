import express from 'express';
import sqlite3 from 'sqlite3';
import cors from 'cors';

const { verbose } = sqlite3;

const app = express();
const port = 3000;

// enable CORS
app.use(cors());
app.use(express.json());

// create a new database object and connect to it
const db = new sqlite3.Database('db.sqlite', verbose);
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

    db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='records'", (err, row) => {
        if (err) {
            console.error(err.message);
        } else if (!row) {
            db.run("CREATE TABLE records (patient_id INTEGER, body_temperature REAL, heart_rate INTEGER, deduction TEXT DEFAULT 'fine', FOREIGN KEY(patient_id) REFERENCES patients(id) ON DELETE CASCADE)", (err) => {
                if (err) {
                    console.error(err.message);
                } else {
                    console.log("Table 'records' created successfully");
                }
            });
        }
    });
});

// create a new patient
function createNewPatient(patient_name, patient_national_id, callback) {
    db.run("INSERT INTO patients (name, national_id) VALUES (?, ?)", [patient_name, patient_national_id], function(err) {
        if (err) {
            console.error(err.message);
            callback(err);
        } else {
            const patient_id = this.lastID;
            callback(null, patient_id);
        }
    });
}

// create a new record entry
function createNewRecord(patient_id, body_temperature, heart_rate, deduction, callback) {
    db.run("INSERT INTO records (patient_id, body_temperature, heart_rate, deduction) VALUES (?, ?, ?, ?)", [patient_id, body_temperature, heart_rate, deduction], (err) => {
        if (err) {
            console.error(err.message);
            callback(err);
        } else {
            callback(null);
        }
    });
}

// create a new patient and record entry
app.post('/api/record', (req, res) => {
    const { patient_name, patient_national_id, body_temperature, heart_rate } = req.body;

    if (!req.body.patient_name || !req.body.patient_national_id || !req.body.body_temperature || !req.body.heart_rate) {
        res.status(400).json({ error: "Missing required parameters" });
        return;
    }

    let deduction = '';

    if (body_temperature > 37.5) {
        deduction = 'too hot; ';
    } else if (body_temperature < 36.5) {
        deduction = 'too cold; ';
    } 
    
    if (heart_rate > 100) {
        deduction += 'heart beating too fast; ';
    } else if (heart_rate < 60) {
        deduction = 'heart beating too slow; ';
    }
    
    db.serialize(() => {
        db.get("SELECT id FROM patients WHERE national_id = ?", [patient_national_id], (err, row) => {
            if (err) {
                console.error(err.message);
                res.status(500).json({ error: "Internal server error" });
            } else if (row) {
                const patient_id = row.id;

                createNewRecord(patient_id, body_temperature, heart_rate, deduction, (err) => {
                    if (err) {
                        res.status(500).json({ error: "Internal server error" });
                    } else {
                        res.status(201).json({ message: "Record created successfully", deduction });
                    }
                });
            } else {
                createNewPatient(patient_name, patient_national_id, (err, patient_id) => {
                    if (err) {
                        res.status(500).json({ error: "Internal server error" });
                    } else {
                        createNewRecord(patient_id, body_temperature, heart_rate, deduction, (err) => {
                            if (err) {
                                res.status(500).json({ error: "Internal server error" });
                            } else {
                                res.status(201).json({ message: "Record created successfully", deduction });
                            }
                        });
                    }
                });
            }
        });
    });
});

// get a patient's records
app.get('/api/record/:patient_id', (req, res) => {
    const patient_id = req.params.patient_id;
    db.get('SELECT * FROM patients WHERE id = ?', [patient_id], (err, patient) => {
        if (err) {
            console.error(err.message);
            res.status(500).send('Server error');
        } else if (!patient) {
            res.status(404).send('Patient not found');
        } else {
            db.all('SELECT * FROM records WHERE patient_id = ?', [patient_id], (err, records) => {
                if (err) {
                    console.error(err.message);
                    res.status(500).send('Server error');
                } else {
                    res.json({ ...patient, records });
                }
            });
        }
    });
});

// start the server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});


