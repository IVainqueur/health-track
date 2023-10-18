import { Router } from "express";
import { createNewRecord } from "../models/record.model.js";
import { createNewPatient } from "../models/patient.model.js";
import { db } from "../models/index.js";
import { findMissing } from "../utils/index.js";

const app = Router();

app.post('/', (req, res) => {
    const { name, national_id, body_temperature, heart_rate } = req.body;

    if (!req.body.national_id || !req.body.body_temperature || !req.body.heart_rate) {
        res.status(400).json({ error: "Missing required parameters (" + findMissing({national_id, body_temperature, heart_rate}).toString() + ")" });
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
        db.get("SELECT id FROM patients WHERE national_id = ?", [national_id], (err, row) => {
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
                if(!name) {
                    res.status(400).json({ error: "Missing required parameters (name)" });
                    return;
                }
                createNewPatient(name, national_id, (err, patient_id) => {
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

app.get('/:patient_id', (req, res) => {
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

app.get('/', (req, res) => {
    db.all('SELECT * FROM patients', [], (err, patients) => {
        if (err) {
            console.error(err.message);
            res.status(500).send('Server error');
        } else {
            const promises = patients.map(patient => {
                return new Promise((resolve, reject) => {
                    db.all('SELECT * FROM records WHERE patient_id = ?', [patient.id], (err, records) => {
                        if (err) {
                            console.error(err.message);
                            reject(err);
                        } else {
                            resolve({ ...patient, records });
                        }
                    });
                });
            });

            Promise.all(promises)
                .then(results => {
                    res.json(results);
                })
                .catch(err => {
                    console.error(err.message);
                    res.status(500).send('Server error');
                });
        }
    });
});

export default app;