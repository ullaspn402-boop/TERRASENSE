import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

conn = psycopg2.connect(os.environ["DATABASE_URL"])
cur = conn.cursor()

cur.execute('SELECT id, name, email FROM "user";')
users = cur.fetchall()
print(f"Total users in DB: {len(users)}")
for u in users:
    print(f"  User: id={u[0]}, name={u[1]}, email={u[2]}")

cur.execute('SELECT id, "userId", title, location FROM saved_reports;')
reports = cur.fetchall()
print(f"Total saved reports in DB: {len(reports)}")
for r in reports:
    print(f"  Report: id={r[0]}, userId={r[1]}, title={r[2]}, location={r[3]}")

cur.close()
conn.close()
