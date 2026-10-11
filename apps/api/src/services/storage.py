import hashlib
import os
import shutil
from pathlib import Path
from typing import BinaryIO, Tuple
import uuid

UPLOAD_DIR = Path("storage_vault")


class LocalStorageService:
    """Safe, tenant-isolated file storage engine with cryptographic integrity."""

    def __init__(self, base_dir: Path = UPLOAD_DIR):
        self.base_dir = base_dir
        self.base_dir.mkdir(parents=True, exist_ok=True)

    async def save_file(
        self,
        org_id: uuid.UUID,
        doc_id: uuid.UUID,
        version_num: int,
        filename: str,
        file_stream: BinaryIO,
    ) -> Tuple[str, int, str]:
        """Saves file to tenant-isolated disk location and computes SHA-256 hash.
        
        Returns:
            Tuple[storage_path, file_size_bytes, sha256_hash]
        """
        dest_dir = self.base_dir / str(org_id) / str(doc_id) / f"v{version_num}"
        dest_dir.mkdir(parents=True, exist_ok=True)

        safe_filename = Path(filename).name  # Prevent directory traversal attacks
        dest_path = dest_dir / safe_filename

        sha256 = hashlib.sha256()
        total_size = 0

        with open(dest_path, "wb") as f_out:
            while chunk := file_stream.read(1024 * 64):  # 64KB chunks
                f_out.write(chunk)
                sha256.update(chunk)
                total_size += len(chunk)

        return str(dest_path), total_size, sha256.hexdigest()

    def get_file_path(self, storage_path: str) -> Path:
        p = Path(storage_path)
        if not p.exists():
            raise FileNotFoundError(f"Stored file not found at {storage_path}")
        return p


storage_service = LocalStorageService()
