from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from .config import settings
from .database import Base, engine, get_db
from .models import Household
from .schemas import HouseholdCreate, HouseholdRead, CadrRequest, RouteRequest, AskRequest
from .services.air_quality import get_current_air, get_forecast_air
from .services.calculations import calculate_cadr, haversine_km, compare_route
from .services.ai_advisor import ask_gemini

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AEROSENTINEL API",
    description="Urban air intelligence and family resilience decision-support API.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Content-Type", "Authorization"],
)


@app.get("/api/v1/health")
def health():
    return {"status": "ok", "application": "AEROSENTINEL", "environment": settings.app_env}


@app.get("/api/v1/air/current")
async def current_air(latitude: float = 19.076, longitude: float = 72.8777):
    if not -90 <= latitude <= 90 or not -180 <= longitude <= 180:
        raise HTTPException(status_code=422, detail="Invalid latitude or longitude.")
    return await get_current_air(latitude, longitude)


@app.get("/api/v1/air/forecast")
async def forecast_air(latitude: float = 19.076, longitude: float = 72.8777):
    if not -90 <= latitude <= 90 or not -180 <= longitude <= 180:
        raise HTTPException(status_code=422, detail="Invalid latitude or longitude.")
    return await get_forecast_air(latitude, longitude)


@app.get("/api/v1/households", response_model=list[HouseholdRead])
def list_households(db: Session = Depends(get_db)):
    return db.query(Household).order_by(Household.id.desc()).all()


@app.post("/api/v1/households", response_model=HouseholdRead, status_code=201)
def create_household(payload: HouseholdCreate, db: Session = Depends(get_db)):
    household = Household(**payload.model_dump())
    db.add(household)
    db.commit()
    db.refresh(household)
    return household


@app.post("/api/v1/indoor/calculate-cadr")
def cadr(payload: CadrRequest):
    try:
        return calculate_cadr(payload.length_m, payload.width_m, payload.height_m, payload.air_changes_per_hour)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))


@app.post("/api/v1/routes/compare")
def routes(payload: RouteRequest):
    straight_distance = haversine_km(
        payload.origin_lat, payload.origin_lon,
        payload.destination_lat, payload.destination_lon
    )
    # Straight-line distance is not a navigable road distance. Apply a transparent
    # illustrative detour factor unless the caller supplies a known route distance.
    distance = payload.distance_km if payload.distance_km else straight_distance * 1.25
    result = compare_route(distance, payload.mode)
    result.update({
        "distance_method": "user_supplied_route_distance" if payload.distance_km else "straight_line_distance_x_1.25_estimate",
        "origin": [payload.origin_lat, payload.origin_lon],
        "destination": [payload.destination_lat, payload.destination_lon],
        "warning": "Not turn-by-turn navigation. No live traffic or street-level pollution data is included."
    })
    return result


@app.post("/api/v1/ai/ask")
async def ai_ask(payload: AskRequest):
    return await ask_gemini(payload.question, payload.context)


@app.get("/api/v1/alerts")
async def alerts(latitude: float = 19.076, longitude: float = 72.8777):
    data = await get_current_air(latitude, longitude)
    current = data.get("current", {})
    pm25 = current.get("pm2_5")
    aqi = current.get("us_aqi")
    alerts_list = []
    if isinstance(pm25, (int, float)) and pm25 >= 35:
        alerts_list.append({"level": "elevated", "title": "Elevated PM2.5", "detail": "PM2.5 is at or above the application's configurable 35 µg/m³ screening threshold."})
    if isinstance(aqi, (int, float)) and aqi >= 101:
        alerts_list.append({"level": "warning", "title": "US AQI above 100", "detail": "The provider-reported US AQI is above 100. This is not a CPCB AQI classification."})
    return {"alerts": alerts_list, "data_status": data.get("data_status"), "source": data.get("source")}
