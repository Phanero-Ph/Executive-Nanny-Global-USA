import 'dotenv/config';
import mysql from 'mysql2/promise';
const url = process.env.DATABASE_URL;
if (!url?.startsWith('mysql://')) { console.error('Set DATABASE_URL to a mysql:// URL in .env first.'); process.exit(1); }
let connection;
try {
 connection = await mysql.createConnection(url);
 const [rows] = await connection.query('SELECT 1 AS connected');
 console.log(rows[0].connected === 1 ? 'MySQL connection successful.' : 'Unexpected database response.');
 const [tables] = await connection.query('SHOW TABLES');
 const names = new Set(tables.map(row => Object.values(row)[0]));
 const required = ['users','family_requests','nanny_applications','contact_messages','newsletter_subscribers','review_events','account_tokens','mail_jobs','recovery_limits','nanny_matches','membership_cycles','membership_payments','membership_reminders','stripe_billing','stripe_events','caregiver_fees','care_bookings','booking_assignments','booking_events','training_courses','training_lessons','training_enrollments','training_progress','training_certificates','training_events','caregiver_credentials','credential_events','credential_reminders','conversations','conversation_messages','conversation_reads'];
 const missing = required.filter(name => !names.has(name));
 if (missing.length) { console.error('Missing tables: ' + missing.join(', ') + '. Import the schema or run npm run db:migrate.'); process.exitCode = 1; }
 else console.log('All application tables are present.');
} catch { console.error('Unable to connect to MySQL. Check the host, database name, user permissions and password.'); process.exitCode = 1; }
finally { if (connection) await connection.end(); }
