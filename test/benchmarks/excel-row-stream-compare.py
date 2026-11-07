"""Compare the uncompressed XLSX entries from the row-stream benchmark."""

import hashlib
import sys
import zipfile
from pathlib import Path


def digest(archive: zipfile.ZipFile, name: str) -> str:
    sha = hashlib.sha256()
    with archive.open(name) as entry:
        for block in iter(lambda: entry.read(1024 * 1024), b""):
            sha.update(block)
    return sha.hexdigest()


directory = Path(__file__).resolve().parent / "dist"
with zipfile.ZipFile(directory / "excel-row-stream-baseline.xlsx") as baseline, zipfile.ZipFile(
    directory / "excel-row-stream-incremental.xlsx"
) as incremental:
    if baseline.namelist() != incremental.namelist():
        sys.exit("XLSX entries differ")
    for entry_name in baseline.namelist():
        if digest(baseline, entry_name) != digest(incremental, entry_name):
            sys.exit(f"XLSX content differs: {entry_name}")
    print(f"All {len(baseline.namelist())} XLSX entries match")
