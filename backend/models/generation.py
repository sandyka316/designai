import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database.base import Base


class GenerationHistory(Base):
    __tablename__ = "generation_history"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )

    # Prompt & model info
    prompt: Mapped[str] = mapped_column(Text, nullable=False)
    enhanced_prompt: Mapped[str | None] = mapped_column(Text, nullable=True)  # prompt setelah di-enhance Gemini
    model_used: Mapped[str] = mapped_column(String(100), nullable=False)

    # Result
    image_url: Mapped[str | None] = mapped_column(Text, nullable=True)  # base64 data URL / storage URL
    status: Mapped[str] = mapped_column(String(20), default="success", nullable=False)
    # status: "success" | "failed"
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Perf
    generation_time_ms: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False, index=True
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="generations")  # type: ignore[name-defined]

    def __repr__(self) -> str:
        return f"<GenerationHistory id={self.id} status={self.status}>"
