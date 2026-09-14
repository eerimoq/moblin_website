#!/usr/bin/env python3
"""Tells the backend that made-up streamers went live, for developing the website."""

import argparse
import base64
import json
import random
import time
import urllib.request
from pathlib import Path

URL = "http://localhost:8080/streamers/live"
SNAPSHOTS = sorted(Path(__file__).parent.glob("snapshots/*.jpg"))

STREAMERS = [
    [("twitch", "sofiacycles")],
    [("kick", "iChrisIRL")],
    [("youtube", "BjornPaTur"), ("twitch", "bjorn_pa_tur")],
    [("twitch", "tokyotom")],
    [("twitch", "eerimoq"), ("kick", "eerimoq"), ("youtube", "erimo144")],
]


def snapshot():
    return random.choice(SNAPSHOTS).read_bytes()


def went_live(channels, image=None):
    channels = [{"platform": platform, "name": channel} for platform, channel in channels]
    body = {"channels": channels}
    if image is not None:
        body["image"] = base64.b64encode(image).decode()
    request = urllib.request.Request(
        URL,
        data=json.dumps(body).encode(),
        headers={"content-type": "application/json"},
    )
    urllib.request.urlopen(request)


def seed():
    for i, channels in enumerate(STREAMERS):
        went_live(channels, snapshot() if i % 2 == 0 else None)


def seed_forever(interval):
    while True:
        n = random.randint(1, 30)
        platforms = random.sample(["twitch", "kick", "youtube"], random.randint(1, 3))
        went_live(
            [(platform, f"streamer_{n}") for platform in platforms],
            snapshot() if random.random() < 0.5 else None,
        )
        print(f"streamer_{n} went live on", " ".join(platforms), flush=True)
        time.sleep(interval)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--forever",
        metavar="INTERVAL",
        type=float,
        help="keep posting random streamers, one every INTERVAL seconds",
    )
    args = parser.parse_args()
    if args.forever is None:
        seed()
    else:
        seed_forever(args.forever)


if __name__ == "__main__":
    main()
