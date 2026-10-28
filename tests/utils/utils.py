from pathlib import Path

TEST_DIR = Path(__file__).parent.parent.resolve()
REPO_DIR = TEST_DIR.parent
FILES_DIR = TEST_DIR / "files"


def manual_confirmation(message: str):
    input(f"🧑‍🔧: {message} Press ENTER to continue.")
