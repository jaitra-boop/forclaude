# Context folder

Every `*.md` file directly in this folder (except this README) is loaded by the
server and included in every **generate** and **refine** prompt. The app lists
the files it used in the Ideate panel and records them on each generated flow.

Good things to put here:

- `personas.md`: research-backed personas (richer than the persona library)
- `design-principles.md`: your team's principles and patterns to follow
- `constraints.md`: legal, accessibility or business rules
- `tech-limits.md`: what the platform/API can and can't do

Files in `examples/` are **not** loaded. Copy one up a level to use it.
