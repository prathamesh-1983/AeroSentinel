from datetime import datetime, timezone, timedelta
import httpx
from ..config import settings

DEMO = {
    "location": {"name": "Mumbai demonstration location", "latitude": 19.076, "longitude": 72.8777},
    "current": {
        "pm2_5": 32.4, "pm10": 61.2, "nitrogen_dioxide": 18.0,
        "sulphur_dioxide": 4.2, "ozone": 42.0, "carbon_monoxide": 220.0,
        "us_aqi": 92, "time": datetime.now(timezone.utc).isoformat()
    },
    "source": "AEROSENTINEL demonstration values",
    "data_status": "demo",
    "is_demo": True,
    "notice": "These are sample values, not live measurements."
}


async def get_current_air(latitude: float, longitude: float) -> dict:
    params = {
        "latitude": latitude,
        "longitude": longitude,
        "current": "pm10,pm2_5,nitrogen_dioxide,sulphur_dioxide,ozone,carbon_monoxide,us_aqi",
        "timezone": "auto"
    }
    try:
        async with httpx.AsyncClient(timeout=12.0) as client:
            response = await client.get(settings.open_meteo_air_url, params=params)
            response.raise_for_status()
            payload = response.json()
        current = payload.get("current")
        if not current:
            raise ValueError("Provider returned no current observations.")
        return {
            "location": {"name": "Selected coordinates", "latitude": latitude, "longitude": longitude},
            "current": current,
            "source": "Open-Meteo Air Quality API",
            "data_status": "provider_observation",
            "is_demo": False,
            "notice": "Provider-reported current data. Availability and update times vary by location."
        }
    except (httpx.HTTPError, ValueError, KeyError):
        fallback = dict(DEMO)
        fallback["location"] = {"name": "Selected coordinates (demo fallback)", "latitude": latitude, "longitude": longitude}
        fallback["current"] = dict(DEMO["current"])
        return fallback


async def get_forecast_air(latitude: float, longitude: float) -> dict:
    params = {
        "latitude": latitude,
        "longitude": longitude,
        "hourly": "pm10,pm2_5,us_aqi",
        "forecast_days": 3,
        "timezone": "auto"
    }
    try:
        async with httpx.AsyncClient(timeout=12.0) as client:
            response = await client.get(settings.open_meteo_air_url, params=params)
            response.raise_for_status()
            payload = response.json()
        hourly = payload.get("hourly", {})
        times = hourly.get("time", [])
        if not times:
            raise ValueError("Provider returned no forecast.")
        points = []
        for index, timestamp in enumerate(times[:24]):
            points.append({
                "time": timestamp,
                "pm2_5": (hourly.get("pm2_5") or [None] * len(times))[index],
                "pm10": (hourly.get("pm10") or [None] * len(times))[index],
                "us_aqi": (hourly.get("us_aqi") or [None] * len(times))[index]
            })
        return {"points": points, "source": "Open-Meteo Air Quality API", "data_status": "provider_forecast", "is_demo": False}
    except (httpx.HTTPError, ValueError, KeyError, IndexError):
        now = datetime.now(timezone.utc)
        points = []
        for hour in range(24):
            points.append({
                "time": (now.replace(minute=0, second=0, microsecond=0) + timedelta(hours=hour)).isoformat(),
                "pm2_5": round(28 + 8 * math_sine(hour), 1),
                "pm10": round(52 + 12 * math_sine(hour), 1),
                "us_aqi": round(80 + 18 * math_sine(hour))
            })
        return {"points": points, "source": "AEROSENTINEL demonstration generator", "data_status": "demo", "is_demo": True}


def math_sine(value: int) -> float:
    import math
    return math.sin(value / 4)
