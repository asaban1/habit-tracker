from datetime import date, datetime

from pydantic import BaseModel, Field


class DailyEntryCreate(BaseModel):
    entry_date: date
    sleep_hours: float | None = Field(default=None, ge=0, le=24)
    sleep_quality: float | None = Field(default=None, ge=1, le=10)
    nutrition_quality: float | None = Field(default=None, ge=1, le=10)
    physical_activity: float | None = Field(default=None, ge=0)
    stress_level: float | None = Field(default=None, ge=1, le=10)
    energy_level: float | None = Field(default=None, ge=1, le=10)


class DailyEntryUpdate(BaseModel):
    sleep_hours: float | None = Field(default=None, ge=0, le=24)
    sleep_quality: float | None = Field(default=None, ge=1, le=10)
    nutrition_quality: float | None = Field(default=None, ge=1, le=10)
    physical_activity: float | None = Field(default=None, ge=0)
    stress_level: float | None = Field(default=None, ge=1, le=10)
    energy_level: float | None = Field(default=None, ge=1, le=10)


class DailyEntryOut(BaseModel):
    id: int
    entry_date: date
    sleep_hours: float | None
    sleep_quality: float | None
    nutrition_quality: float | None
    physical_activity: float | None
    stress_level: float | None
    energy_level: float | None
    created_at: datetime

    class Config:
        from_attributes = True