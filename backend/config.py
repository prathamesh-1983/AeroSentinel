from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_env: str = "development"
    database_url: str = "sqlite:///./aerosentinel.db"
    cors_origins: str = "http://localhost:5173"
    open_meteo_air_url: str = "https://air-quality-api.open-meteo.com/v1/air-quality"
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.0-flash"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def allowed_origins(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


settings = Settings()
