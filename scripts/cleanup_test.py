import psycopg2, os
from dotenv import load_dotenv

load_dotenv()
conn = psycopg2.connect(os.environ['DATABASE_URL'])
cur = conn.cursor()
cur.execute('DELETE FROM "user" WHERE email LIKE %s;', ('analyst_%@test.com',))
conn.commit()
print("Cleaned up temporary test users:", cur.rowcount)
cur.close()
conn.close()
