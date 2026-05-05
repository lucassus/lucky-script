# lark-sandbox/CLAUDE.md

This directory contains a reference grammar for Lucky Script using [Lark](https://github.com/lf1-io/lark) (Python). It serves as a lightweight sandbox for validating syntax design before implementing changes in the TypeScript pipeline.

## Files

- `lucky_script.lark` — the reference grammar
- `lucky_script_test.py` — syntax smoke tests (valid and invalid programs)

## Commands

```bash
uv run pytest .       # run tests
uv run ruff check .   # lint
uv run ruff format .  # format
make test             # alias for uv run pytest .
make lint             # alias for ruff check + format check
```

## Quality

After any change to `lucky_script.lark` or `lucky_script_test.py`, run `make test` and `make lint`. Fix all failures before moving to the TypeScript implementation.
