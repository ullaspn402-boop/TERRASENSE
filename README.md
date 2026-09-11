# TerraSense — AI-Powered Multi-Hazard Environmental Decision System

TerraSense is an autonomous environmental intelligence and decision support platform engineered for real-time multi-hazard telemetry analysis, hydrodynamic flood forecasting, and prioritized emergency protocol dispatch.

---

## 🌟 Key Capabilities

- **Autonomous Multi-Hazard Risk Synthesis:** Synthesizes continuous sensor feeds across 5 environmental domains:
  - Hydrodynamic Flood Hazard
  - Wet-Bulb & Ambient Heat Stress
  - Urban Air Quality (AQI, PM2.5, PM10)
  - Water Safety & Aquatic Health (WQI, Dissolved Oxygen, pH)
  - Geotechnical Soil Moisture & Slope Instability
- **Empirically Audited ML Ensemble:** Integrated scikit-learn `RandomForestClassifier` achieving **98.0% Accuracy** and **0.9949 ROC-AUC** for flash flood prediction.
- **Explainable AI (XAI) Attribution:** Transparent Shapley feature attribution deltas quantifying physical parameter contributions to elevated risk.
- **Autonomous Decision Engine:** 5-stage reasoning pipeline:
  $$\text{Telemetry} \longrightarrow \text{Multi-Hazard Risk} \longrightarrow \text{ML Ensemble} \longrightarrow \text{Decision Directive} \longrightarrow \text{Field Action Protocols}$$
- **Interactive What-If Simulation Laboratory:** Real-time boundary scenario testing with side-by-side comparative deltas and automatic decision escalation alerts.
- **Serverless PostgreSQL Audit Persistence:** Full audit report management committed to **Neon PostgreSQL** with foreign key cascade guarantees.
- **Dual-Theme Engineering Interface:** Sleek dark and light mode UI with accessible risk hierarchy indicators, Recharts data-science visualizations, and responsive mobile navigation.

---

## 🛠️ Architecture & Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend Platform** | Next.js 16 (App Router & Turbopack), React 19, TypeScript |
| **Styling & Theming** | Tailwind CSS v4, Lucide Icons, Plus Jakarta Sans, JetBrains Mono |
| **Visualizations** | Recharts (Area charts, bar attributions, dual-axis telemetry) |
| **Database & ORM** | Neon Serverless PostgreSQL, Drizzle ORM |
| **Authentication** | Better Auth with Drizzle Adapter & encrypted session tokens |
| **AI & Backend Engine** | Python 3.11, FastAPI, Uvicorn, scikit-learn, joblib, NumPy, Pandas |

---

## 🚀 Quickstart Guide

### 1. Prerequisites
- Node.js 18+ (Node 20+ recommended)
- Python 3.10+
- pnpm or npm

### 2. Environment Configuration
Create a `.env` file in the root directory:

```env
DATABASE_URL="postgresql://neondb_owner:YOUR_PASSWORD@ep-sample-host.us-east-2.aws.neon.tech/neondb?sslmode=require"
BETTER_AUTH_SECRET="your-32-byte-hex-secret"
BETTER_AUTH_URL="http://localhost:3000"
PORT=3000
FASTAPI_URL="http://127.0.0.1:8000"
NODE_ENV="development"
```

### 3. Initialize PostgreSQL Database
```bash
python scripts/init_db.py
```

### 4. Start the FastAPI ML Backend
```bash
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
```

### 5. Start the Next.js Dev Server
```bash
npm run dev
# or: pnpm dev
```

Visit **`http://localhost:3000`** in your browser.

---

## 🧪 System Verification & Auditing

To run the automated test suite verifying database foreign key cascades, ML model metrics, and backend APIs:

```bash
python tests/verify_system.py
```

---

## 📄 License
MIT License
