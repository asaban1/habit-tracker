from sqlalchemy import Column, Integer, Float, Date, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class DailyEntry(Base):
    __tablename__ = "daily_entries"
    __table_args__ = (
        UniqueConstraint("user_id", "entry_date", name="uq_user_entry_date"),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    entry_date = Column(Date, nullable=False)

    sleep_hours = Column(Float, nullable=True)
    sleep_quality = Column(Float, nullable=True)
    nutrition_quality = Column(Float, nullable=True)
    physical_activity = Column(Float, nullable=True)
    stress_level = Column(Float, nullable=True)
    energy_level = Column(Float, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    owner = relationship("User", back_populates="entries")