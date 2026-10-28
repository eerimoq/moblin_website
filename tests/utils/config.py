import tomllib
from pathlib import Path

from xdg_base_dirs import xdg_config_home

from .utils import TEST_DIR

FRONTEND_URL = "https://moblin.app"


def find_config_toml() -> Path | None:
    paths = [TEST_DIR / "config.toml", xdg_config_home() / "moblin-website" / "tests" / "config.toml"]
    for path in paths:
        if path.exists():
            return path
    return None


class Config:
    """The test setup. Without a configuration file everything runs on this machine."""

    def __init__(self):
        self.config_toml = find_config_toml()
        if self.config_toml is None:
            self._config = {}
        else:
            self._config = tomllib.loads(self.config_toml.read_text())

    def general(self) -> dict:
        return self._config.get("general", {})

    def tester_ip_address(self) -> str:
        return self.general().get("tester-ip-address", "127.0.0.1")

    def backend_port(self) -> int:
        return self.general().get("backend-port", 8090)

    def allow_unattested(self) -> bool:
        return self.general().get("allow-unattested", True)

    def app_attest_environment(self) -> str:
        return self.general().get("app-attest-environment", "development")

    def app_id(self) -> str | None:
        return self.general().get("app-id")

    def twitch(self) -> dict | None:
        return self._config.get("twitch")
