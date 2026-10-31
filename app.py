"""Compatibility launcher. Express owns all state and triage; no Flask service."""
import shutil
import subprocess
from pathlib import Path

if __name__ == '__main__':
    npm = shutil.which('npm')
    if not npm:
        raise SystemExit('Install Node.js 22.12+ and run npm ci, then npm run dev.')
    raise SystemExit(subprocess.call([npm, 'run', 'dev'], cwd=Path(__file__).resolve().parent))
