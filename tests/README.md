Black box system tests of the backend. They build and start the backend, then use its API
like the website and Moblin do: Moblin posts that a streamer went live and the website lists
them.

All commands below are run from the repository root.

# Prerequisites

```bash
pip install -r requirements.txt
```

# Configuration

The tests run on this machine without a configuration. For Twitch or App Attest, copy
`tests/config.example.toml` to `tests/config.toml` and modify it to match your test setup.
`tests/config.toml` is used if it exists, otherwise
`$XDG_CONFIG_HOME/moblin-website/tests/config.toml`.

Without `[twitch]` the Twitch lookups are skipped.

# Run the tests

```bash
just system-test
just system-test Streamers
just system-test --interactive
```

`--interactive` also runs the tests needing a person, like going live in a Moblin debug build
whose `MOBLIN_WEBSITE_API_URL` points at the backend under test (with `allow-unattested = false`).
