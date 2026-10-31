"""Python CLI client for the canonical Express pipeline. Uses only stdlib.
Run npm run dev first. Example:
python3 triage.py --description "Deep waterlogging blocks the road" --location "Lake Road junction Chennai" --duration "2 days"
"""
import argparse
import base64
import json
import mimetypes
import os
import uuid
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('photo', nargs='?')
    parser.add_argument('--description', required=True)
    parser.add_argument('--location', required=True)
    parser.add_argument('--duration', default='')
    parser.add_argument('--impact', default='')
    parser.add_argument('--ward', default='')
    parser.add_argument('--lat', type=float)
    parser.add_argument('--lng', type=float)
    parser.add_argument('--occurred-at')
    parser.add_argument('--reporter-id', default='python-cli-reporter')
    parser.add_argument('--api', default=os.getenv('CIVIC_API_BASE', 'http://127.0.0.1:3000/api'))
    args = parser.parse_args()
    payload = {k: getattr(args, k) for k in ['description', 'location', 'duration', 'impact', 'ward', 'reporter_id']}
    for key in ['lat', 'lng', 'occurred_at']:
        value = getattr(args, key)
        if value is not None:
            payload[key] = value
    if args.photo:
        mime = mimetypes.guess_type(args.photo)[0]
        if mime not in ['image/jpeg', 'image/png', 'image/webp']:
            parser.error('Use JPEG, PNG or WebP')
        with open(args.photo, 'rb') as photo:
            raw = photo.read(5 * 1024 * 1024 + 1)
        if len(raw) > 5 * 1024 * 1024:
            parser.error('Photo exceeds 5 MB')
        payload['photoBase64'] = f'data:{mime};base64,' + base64.b64encode(raw).decode('ascii')
    req = Request(args.api.rstrip('/') + '/triage', data=json.dumps(payload).encode(), headers={'Content-Type': 'application/json'}, method='POST')
    try:
        with urlopen(req, timeout=45) as response:
            print(json.dumps(json.load(response), indent=2))
    except HTTPError as exc:
        raise SystemExit(f'HTTP {exc.code}: {exc.read().decode()}')
    except URLError as exc:
        raise SystemExit(f'Cannot reach Express API: {exc.reason}. Start npm run dev.')


if __name__ == '__main__':
    main()
