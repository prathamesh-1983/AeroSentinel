from fastapi.testclient import TestClient
from app.main import app
from app.services.calculations import calculate_cadr, haversine_km, compare_route

client = TestClient(app)


def test_health():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json()["application"] == "AEROSENTINEL"


def test_cadr_calculation():
    result = calculate_cadr(5, 4, 2.5, 5)
    assert result["room_volume_m3"] == 50
    assert result["required_cadr_m3h"] == 250


def test_cadr_rejects_non_positive_values():
    try:
        calculate_cadr(0, 4, 2.5, 5)
        assert False, "Expected ValueError"
    except ValueError:
        assert True


def test_route_estimate():
    distance = haversine_km(19.076, 72.8777, 19.2, 72.9)
    assert distance > 0
    result = compare_route(distance, "cycling")
    assert result["estimated_transport_co2_kg"] == 0


def test_ai_fallback():
    response = client.post("/api/v1/ai/ask", json={"question": "How should I ventilate my room?", "context": {}})
    assert response.status_code == 200
    assert "answer" in response.json()


def test_invalid_coordinates():
    response = client.get("/api/v1/air/current?latitude=120&longitude=72")
    assert response.status_code == 422
