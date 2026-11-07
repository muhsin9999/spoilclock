# Spikes and checks

Developer scripts, not part of the app. They were used to prove each PayPal step against the sandbox before
building it (`01-authorize.mjs`, `02-vault.mjs`, …), to read live state while debugging, and to click through the
live site end to end (`test-all.mjs`). Some contain absolute paths from the machine they were written on; set
`BASE`, `CHROME_PATH` and the `.env.local` values before running one.
