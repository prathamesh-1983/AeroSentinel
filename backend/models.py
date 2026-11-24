from datetime import datetime, timezone
from sqlalchemy import Column, DateTime, Integer, String, Text
from .database import Base


class Household(Base):
    __tablename__ = "households"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    city = Column(String(120), nullable=False, default="Mumbai")
    household_size = Column(Integer, nullable=False, default=2)
    rooms = Column(Integer, nullable=False, default=2)
    monthly_budget = Column(Integer, nullable=False, default=0)
    routine = Column(Text, nullable=False, default="")


class ActionLog(Base):
    __tablename__ = "action_logs"

    id = Column(Integer, primary_key=True, index=True)
    category = Column(String(50), nullable=False)
    description = Column(Text, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
