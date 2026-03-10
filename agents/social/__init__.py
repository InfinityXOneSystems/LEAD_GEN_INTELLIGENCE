"""agents.social — social media automation agent package."""

from .social_agent import SocialAgent, extract_social_profiles, score_social_presence

__all__ = ["SocialAgent", "extract_social_profiles", "score_social_presence"]
"""agents/social/__init__.py"""
from .social_media_agent import SocialMediaAgent

__all__ = ["SocialMediaAgent"]
