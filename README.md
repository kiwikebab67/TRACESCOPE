# TraceScope: Digital Forensics & Incident Response Platform

![TraceScope Banner](https://img.shields.io/badge/Status-Production-success?style=for-the-badge)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-000000?style=for-the-badge&logo=flask&logoColor=white)

**TraceScope** is a next-generation Digital Forensics and Incident Response (DFIR) orchestration platform. It is designed to provide security analysts and forensic investigators with a centralized, cybernetic interface capable of ingesting diverse forensic artifacts (network PCAPs, memory dumps, registry hives, mobile extraction logs) and performing rapid, automated triage.

---

## 🌟 Key Features & Modules

TraceScope is comprised of 14 distinct forensic analysis modules:
1. **Command Center Dashboard:** Dynamic Threat Score and chronological event timelines.
2. **Case Management & Isolation:** Strict chain of custody isolating evidence to specific cases.
3. **OSINT Global Threat Tracker:** Live Open-Source Intelligence mapped onto an interactive 3D WebGL Earth.
4. **Network Protocol Analyzer:** Deep packet inspection (PCAP) and connection visualization.
5. **Memory Forensics Engine:** Simulates Volatility framework extraction to analyze physical RAM dumps.
6. **USB & Registry Artifacts:** Tracks unauthorized hardware and lateral movement by parsing NTUSER.DAT.
7. **Email Phishing Investigation:** Traces initial compromise vectors via Social Engineering Constellation graphs.
8. **Mobile & Wireless Forensics:** Cryptographic IMEI validation (Luhn Algorithm) and Bluetooth MAC carving.
9. **Malware Analysis Engine:** Static and dynamic heuristic analysis to detect packed payloads.
10. **IOC (Indicator of Compromise) Scanner:** High-speed regex scanning against vast file system dumps.
11. **Threat Intelligence Feeds:** Live integration with external APIs for reputation scoring.
12. **Event Logs Forensics:** EVTX parsing to reconstruct user sessions and authentication failures.
13. **Timeline Reconstruction:** Fusion of disparate forensic artifacts into a unified chronological master timeline.
14. **Chain of Custody Tracker:** Immutable cryptographic hashing (MD5/SHA256) upon artifact ingestion.

---

## 🚀 Installation & Execution Guide

TraceScope utilizes a decoupled architecture. You must run the Python Backend and the React Frontend simultaneously.

### Prerequisites
- **Node.js** (v18+)
- **Python** (v3.8+)
- **Git**

### 1. Clone the Repository
```bash
git clone https://github.com/kiwikebab67/TRACESCOPE.git
cd TRACESCOPE
```

### 2. Backend Setup (Flask API)
```bash
cd backend

# Create a virtual environment (Optional but recommended)
python -m venv venv
venv\Scripts\activate  # On Windows

# Install dependencies
pip install -r requirements.txt

# Start the server
python app.py
```
*The backend will run on `http://127.0.0.1:5000`*

### 3. Frontend Setup (React/Vite)
Open a **new terminal window**:
```bash
cd frontend

# Install Node dependencies
npm install

# Start the Vite development server
npm run dev
```
*The frontend will run on `http://127.0.0.1:5173`*

Navigate to `http://localhost:5173` in your web browser to access the TraceScope interface.

---

## 📚 Third-Party APIs, Datasets & Dependencies

### Frontend Dependencies
- **React 18 & Vite:** Core rendering and lightning-fast compilation.
- **Tailwind CSS:** Utility-first styling framework for the cybernetic UI.
- **Framer Motion:** Physics-based animation library for radar and scanning effects.
- **react-globe.gl:** Advanced WebGL rendering for the 3D OSINT Threat Tracker.
- **Recharts:** Composable charting library for dashboard telemetry.
- **Lucide React:** Scalable vector icon system.
- **Axios:** Promise-based HTTP client for backend communication.

### Backend Dependencies
- **Flask & Flask-CORS:** Core RESTful API framework and cross-origin management.
- **Flask-SQLAlchemy:** ORM for managing the SQLite relational database.
- **python-dotenv:** Environment variable injection for secure credential management.

### Third-Party APIs
- **VirusTotal API v3:** Integrated into the Threat Intelligence module for live malware reputation scoring and file hash lookups.
- **AbuseIPDB API:** Utilized in the OSINT and Network Analyzer modules for IP reputation scoring and malicious actor identification.

### Embedded Datasets (Offline Capabilities)
- **TraceScope TAC Database:** An offline dictionary subset of Type Allocation Codes (TAC) utilized for resolving Apple, Samsung, and Google devices during cryptographic IMEI validation without relying on third-party API rate limits.

---

## 🔐 Legal & Ethical Assumptions
- **Authorization:** It is strictly assumed that the investigator utilizing TraceScope possesses proper legal authorization, warrants, or consent to ingest and analyze the provided PII, memory dumps, and forensic artifacts.
- **Data Privacy:** TraceScope defaults to local execution. Artifacts uploaded to local instances never leave the host machine unless explicitly queried against integrated external APIs (e.g., VirusTotal).

---
*Developed by TraceScope Engineering.*
