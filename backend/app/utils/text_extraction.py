"""PDF and document text extraction utilities."""

import fitz  # PyMuPDF
import re


def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract text content from a PDF file.

    Args:
        file_bytes: Raw PDF file bytes.

    Returns:
        Cleaned extracted text from all pages.
    """
    doc = fitz.open(stream=file_bytes, filetype="pdf")
    pages_text = []

    for page_num in range(len(doc)):
        page = doc.load_page(page_num)
        text = page.get_text("text")
        if text.strip():
            pages_text.append(text.strip())

    doc.close()

    full_text = "\n\n".join(pages_text)
    # Clean up excessive whitespace
    full_text = re.sub(r"\n{3,}", "\n\n", full_text)
    full_text = re.sub(r" {2,}", " ", full_text)

    return full_text.strip()


def extract_text_from_txt(file_bytes: bytes) -> str:
    """Extract text from a plain text file."""
    return file_bytes.decode("utf-8", errors="replace").strip()


def extract_text(file_bytes: bytes, filename: str) -> str:
    """Auto-detect file type and extract text.

    Supports: .pdf, .txt
    """
    lower = filename.lower()
    if lower.endswith(".pdf"):
        return extract_text_from_pdf(file_bytes)
    elif lower.endswith(".txt"):
        return extract_text_from_txt(file_bytes)
    else:
        raise ValueError(f"Unsupported file type: {filename}. Supported: .pdf, .txt")
