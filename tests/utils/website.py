import logging

import requests

from .config import FRONTEND_URL

LOGGER = logging.getLogger(__name__)
TIMEOUT = 60


class BackendError(Exception):
    def __init__(self, status: int, text: str):
        super().__init__(f"{status}: {text}")
        self.status = status
        self.text = text


class Client:
    """Talks to the backend like the website's JavaScript does, from https://moblin.app."""

    def __init__(self, url: str, session: str | None = None):
        self.url = url
        self.session = session

    def request(
        self, method: str, path: str, json=None, headers: dict | None = None, stream: bool = False
    ) -> requests.Response:
        headers = {"origin": FRONTEND_URL, **(headers or {})}
        if self.session is not None:
            headers["authorization"] = f"Bearer {self.session}"
        LOGGER.debug("%s %s %s", method, path, json)
        response = requests.request(
            method, f"{self.url}{path}", json=json, headers=headers, timeout=TIMEOUT, stream=stream
        )
        if not stream:
            LOGGER.debug("%s %s -> %s %s", method, path, response.status_code, response.text)
        return response

    def call(self, method: str, path: str, json=None):
        response = self.request(method, path, json)
        if not response.ok:
            raise BackendError(response.status_code, response.text)
        return response.json()

    def get(self, path: str):
        return self.call("GET", path)

    def post(self, path: str, json=None):
        return self.call("POST", path, json)


class Website(Client):
    """The public parts of the website: the home page and the streamer list."""

    def streamers(self) -> list[dict]:
        return self.get("/streamers")["streamers"]

    def twitch_live(self) -> dict:
        return self.get("/twitch/live")

    def challenge(self) -> str:
        return self.post("/streamers/live/challenge")["challenge"]

    def went_live(self, body: dict, headers: dict | None = None) -> requests.Response:
        return self.request("POST", "/streamers/live", json=body, headers=headers)
