# Session Subagent Cost

**Session:** `887c35ad-1eac-4e9a-ba94-282a078b6198`  
**Updated:** 20261116_223924

Subagent spawns this session: **8**

| Agent | Spawns |
|-------|--------|
| game-designer | 4 |
| art-director | 4 |

Each spawn is a fresh context window that re-reads its own inputs.
To reduce this: lower `modes.review_mode` (`/project-settings modes.review_mode=solo`)
or `modes.rigor` (`/project-settings modes.rigor=minimal`).
