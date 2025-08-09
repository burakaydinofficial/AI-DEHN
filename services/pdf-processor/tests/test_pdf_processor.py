"""Tests for PDF processor service."""
import pytest
from main import PDFProcessor


def test_decode_font_flags():
    """Test font flags decoding."""
    flags = 16  # Bold flag
    result = PDFProcessor.decode_font_flags(flags)
    assert result["bold"] is True
    assert result["italic"] is False


def test_color_to_hex():
    """Test color conversion."""
    # Black color
    assert PDFProcessor.color_to_hex(0) == "#000000"

    # White color (assuming RGB)
    white = (255 << 16) | (255 << 8) | 255
    assert PDFProcessor.color_to_hex(white) == "#ffffff"
