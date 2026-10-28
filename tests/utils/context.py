from .backend import Backend
from .config import Config
from .website import Website


class Context:
    """Everything the tests share: the backend and the website talking to it."""

    def __init__(self, config: Config, backend: Backend, interactive: bool):
        self.config = config
        self.backend = backend
        self.website = Website(backend.url)
        self.interactive = interactive
