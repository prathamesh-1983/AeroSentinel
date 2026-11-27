# AEROSENTINEL
## AI-Powered Urban Air Defense & Family Resilience Intelligence 

AEROSENTINEL is a full-stack environmental decision-support application built with React, TypeScript, FastAPI and SQLite/PostgreSQL-ready persistence. It combines four systems:

- **AEROINTEL** — air-quality observations, forecast trends and configurable warnings.
- **FAMILYGUARD** — household profiles and practical clean-air action plans.
- **INDOORAIR** — room-volume, CADR and ventilation guidance.
- **ECOfLOW** — route-distance and transport-emissions comparison estimates.
- **AI Advisor** — optional Gemini-powered explanations with a deterministic fallback.

> Environmental information is decision support, not medical advice. Provider forecasts, model estimates and demonstration data are labelled separately. Route exposure and emissions are estimates, not direct measurements.

## 1. Requirements

- Windows 10/11
- Python 3.10+
- Node.js 20+ and npm
- VS Code
- Internet connection for live Open-Meteo data (optional; demo fallback is built in)

## 2. Project structure

```text
AEROSENTINEL/
├── backend/
│   ├── app/
│   │   ├── services/
│   │   │   ├── air_quality.py
│   │   │   ├── calculations.py
│   │   │   └── ai_advisor.py
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   └── main.py
│   ├── tests/
│   │   └── test_api.py
│   ├── requirements.txt
│   ├── pytest.ini
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── services/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── styles.css
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
├── .gitignore
├── docker-compose.yml
└── README.md
```

## 3. Run the backend in VS Code (Windows)

Open the `AEROSENTINEL` folder in VS Code.

Open **Terminal → New Terminal**, then run:

```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
```

If PowerShell blocks activation, run this once in that terminal:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\.venv\Scripts\Activate.ps1
```

Install dependencies:

```powershell
python -m pip install --upgrade pip
pip install -r requirements.txt
```

Create your environment file:

```powershell
Copy-Item .env.example .env
```

Start FastAPI:

```powershell
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Check:
- API health: http://127.0.0.1:8000/api/v1/health
- Interactive API docs: http://127.0.0.1:8000/docs

Keep this terminal running.

## 4. Run the frontend

Open a **second VS Code terminal**:

```powershell
cd frontend
npm install
npm run dev
```

Open the URL printed by Vite, usually:

http://localhost:5173

The Vite development server proxies `/api` requests to FastAPI at port 8000.

## 5. Optional Gemini integration

The application works without Gemini. To enable the hosted Gemini API:

1. Obtain an API key from Google AI Studio.
2. Open `backend/.env`.
3. Set:

```env
GEMINI_API_KEY=your_key_here
GEMINI_MODEL=gemini-2.0-flash
```

4. Restart FastAPI.

The key stays on the backend and is never sent to the browser. If the key is absent or the provider fails, the application uses its deterministic local advisor. Use a currently supported Gemini model identifier for your account.

## 6. Data sources and interpretation

- Air quality: Open-Meteo Air Quality API.
- Forecast: Open-Meteo forecast fields where available.
- Weather: Open-Meteo Weather API can be added through the same provider pattern.
- Maps: Leaflet and OpenStreetMap tiles.
- Routing: this starter estimates route distance using coordinates; it does **not** claim to provide turn-by-turn routing or live traffic.

Open-Meteo AQI fields are provider-specific. The application displays the provider's US AQI field when available and labels it **US AQI**. It does not call this CPCB National AQI. Concentrations and AQI are different measures.

If the live provider cannot be reached, sample values are returned with `is_demo: true` and `data_status: "demo"`. Never represent those sample values as live measurements.

## 7. Indoor air calculation

Room volume = length × width × height (m³)

Simplified required CADR = room volume × target air changes per hour (m³/h)

CFM conversion = CADR (m³/h) ÷ 1.699

This is a screening estimate. Real performance depends on room layout, leakage, filter efficiency, device operation and other conditions.

## 8. Run tests

Backend:

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
pytest -q
```

Frontend production build:

```powershell
cd frontend
npm run build
```

## 9. Docker (optional)

From the project root:

```powershell
docker compose up --build
```

The compose file starts the API. Run the frontend locally in a second terminal using the steps above. For a production deployment, use managed PostgreSQL, HTTPS, a restricted CORS origin list, secret storage and persistent database backups. The starter uses SQLite by default for simple local setup; set `DATABASE_URL` to a PostgreSQL connection string (and install the matching PostgreSQL driver) to use PostgreSQL.

## 10. Before public hackathon submission

- Replace development CORS settings with the exact deployed frontend origin.
- Set a strong, private database URL and API keys in the hosting provider's secret manager.
- Do not commit `.env`, database files, logs or `node_modules`.
- Test live API availability and the clearly labelled demo fallback.
- Add screenshots from your actual running build.
- Run tests and report only results that actually passed.
- Keep the GitHub repository public if the competition requires public access.
- Check the event's repository size and video-link rules before submitting.

## Limitations

This is a functional starter application, not a certified environmental monitoring or medical device. Provider coverage and forecast availability vary by location. Household guidance is general. The route module uses straight-line coordinate distance with mode-specific assumptions and is not a navigation engine. Exposure estimates are illustrative proxies and should not be interpreted as personal inhaled dose.
