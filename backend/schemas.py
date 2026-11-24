from pydantic import BaseModel, Field, ConfigDict


class HouseholdCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    city: str = Field(default="Mumbai", min_length=1, max_length=120)
    household_size: int = Field(default=2, ge=1, le=30)
    rooms: int = Field(default=2, ge=1, le=100)
    monthly_budget: int = Field(default=0, ge=0, le=10_000_000)
    routine: str = Field(default="", max_length=2000)


class HouseholdRead(HouseholdCreate):
    id: int
    model_config = ConfigDict(from_attributes=True)


class CadrRequest(BaseModel):
    length_m: float = Field(gt=0, le=100)
    width_m: float = Field(gt=0, le=100)
    height_m: float = Field(gt=0, le=20)
    air_changes_per_hour: float = Field(default=5, gt=0, le=30)


class RouteRequest(BaseModel):
    origin_lat: float = Field(ge=-90, le=90)
    origin_lon: float = Field(ge=-180, le=180)
    destination_lat: float = Field(ge=-90, le=90)
    destination_lon: float = Field(ge=-180, le=180)
    mode: str = Field(default="car", pattern="^(car|walking|cycling|public_transport)$")
    distance_km: float | None = Field(default=None, gt=0, le=5000)


class AskRequest(BaseModel):
    question: str = Field(min_length=3, max_length=2000)
    context: dict = Field(default_factory=dict)
