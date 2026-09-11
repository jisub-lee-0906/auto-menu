"""Compatibility entry point: regenerate only from the explicit curated source.

The former heuristic renames/restoration must never resurrect retired entries.
"""
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parent.parent
if __name__ == '__main__':
    subprocess.run(['node', str(ROOT / 'scripts/build_menu_catalog.mjs')], cwd=ROOT, check=True)
