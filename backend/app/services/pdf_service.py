import re

from fastapi import HTTPException
from pypdf import PdfReader


def clean_extracted_text(
    text: str,
) -> str:
    """
    Clean extracted PDF text.
    """

    # Replace multiple spaces/tabs
    text = re.sub(
        r"[ \t]+",
        " ",
        text,
    )

    # Reduce excessive new lines
    text = re.sub(
        r"\n{3,}",
        "\n\n",
        text,
    )

    return text.strip()


def extract_text_from_pdf(
    file_path: str,
) -> str:
    """
    Extract and clean text from PDF.
    """

    try:

        reader = PdfReader(
            file_path
        )

        pages_text = []

        for page in reader.pages:

            page_text = page.extract_text()

            if page_text:

                cleaned_page_text = (
                    clean_extracted_text(
                        page_text
                    )
                )

                pages_text.append(
                    cleaned_page_text
                )

        full_text = "\n\n".join(
            pages_text
        )

        return clean_extracted_text(
            full_text
        )

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=(
                "Failed to extract text "
                f"from PDF: {str(e)}"
            ),
        )