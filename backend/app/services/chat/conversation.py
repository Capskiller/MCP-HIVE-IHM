"""Conversation history management."""

import asyncio
import logging
from collections import OrderedDict
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from app.config import settings

logger = logging.getLogger(__name__)


class ConversationManager:
    """In-memory conversation history storage.

    For production, replace with Redis or database.
    """

    def __init__(self):
        """Initialize conversation manager."""
        self._conversations: Dict[str, Dict[str, Any]] = OrderedDict()
        self._lock = asyncio.Lock()

    def get_messages(self, conversation_id: str) -> List[Dict[str, Any]]:
        """Get conversation history as list of messages.

        Args:
            conversation_id: Conversation identifier.

        Returns:
            List of messages.
        """
        if conversation_id not in self._conversations:
            return []

        conv = self._conversations[conversation_id]
        conv["last_accessed"] = datetime.now()
        return list(conv["messages"])

    def add_message(
        self,
        conversation_id: str,
        role: str,
        content: str,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> None:
        """Add a message to conversation.

        Args:
            conversation_id: Conversation identifier.
            role: Message role (user, assistant, system, tool).
            content: Message content.
            metadata: Optional metadata (tokens, tools, etc.).
        """
        if conversation_id not in self._conversations:
            self._conversations[conversation_id] = {
                "messages": [],
                "created_at": datetime.now(),
                "last_accessed": datetime.now(),
            }

        message = {
            "role": role,
            "content": content,
            "timestamp": datetime.now().isoformat(),
        }
        if metadata:
            message["metadata"] = metadata

        self._conversations[conversation_id]["messages"].append(message)
        self._conversations[conversation_id]["last_accessed"] = datetime.now()

        # Trim to max history
        messages = self._conversations[conversation_id]["messages"]
        max_messages = settings.conversation.max_history_messages
        if len(messages) > max_messages:
            self._conversations[conversation_id]["messages"] = messages[-max_messages:]

    def get_history(self, conversation_id: str) -> Optional[Dict[str, Any]]:
        """Get full conversation for API response.

        Args:
            conversation_id: Conversation identifier.

        Returns:
            Conversation dict or None if not found.
        """
        if conversation_id not in self._conversations:
            return None

        conv = self._conversations[conversation_id]
        return {
            "conversation_id": conversation_id,
            "messages": conv["messages"],
            "created_at": conv["created_at"].isoformat(),
            "last_accessed": conv["last_accessed"].isoformat(),
        }

    def delete(self, conversation_id: str) -> bool:
        """Delete a conversation.

        Args:
            conversation_id: Conversation identifier.

        Returns:
            True if deleted.
        """
        if conversation_id in self._conversations:
            del self._conversations[conversation_id]
            logger.info(f"Deleted conversation: {conversation_id}")
            return True
        return False

    def list_conversations(self) -> List[Dict[str, Any]]:
        """List all conversations.

        Returns:
            List of conversation summaries.
        """
        result = []
        for conv_id, conv in self._conversations.items():
            messages = conv["messages"]
            first_user_msg = next(
                (m["content"][:50] for m in messages if m["role"] == "user"),
                "New conversation",
            )
            result.append({
                "conversation_id": conv_id,
                "title": first_user_msg,
                "message_count": len(messages),
                "created_at": conv["created_at"].isoformat(),
                "last_accessed": conv["last_accessed"].isoformat(),
            })
        return result

    async def cleanup_expired(self) -> int:
        """Remove expired conversations.

        Returns:
            Number of conversations removed.
        """
        async with self._lock:
            ttl = timedelta(hours=settings.conversation.ttl_hours)
            now = datetime.now()
            expired = [
                cid for cid, conv in self._conversations.items()
                if now - conv["last_accessed"] > ttl
            ]
            for cid in expired:
                del self._conversations[cid]

            if expired:
                logger.info(f"Cleaned up {len(expired)} expired conversations")

            return len(expired)
