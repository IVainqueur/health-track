import sqlite3 from 'sqlite3';

const { verbose } = sqlite3;

export const db = new sqlite3.Database('db.sqlite', verbose);
