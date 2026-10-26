# Rake Before Dark

Browser game: rake New England lawns onto the tarp before civil dusk. Sunset and dusk times are computed for each lawn's real location on the current date.

Lawns: Stowe, Vermont (golden hour, gentle gusts) and Jackson, New Hampshire (early snowstorm, strong gusts), and Bass Harbor, Maine (Acadia: two trees' worth of leaves, fog banks, a lighthouse beam), and Salem, Massachusetts (Halloween: trick-or-treaters jump into your piles; rake over them to shoo them), Kent, Connecticut (a fieldstone wall splits the lawn; leaves only pass through the gaps) and Newport, Rhode Island (a sea breeze blows leaves over the cliff, where they are lost), picked from a map of New England with facts about each town.

Each town is a five-day week (Monday to Friday): every day adds leaves, falling rate and wind, the sunset date advances a day, and the town's hazard escalates (deeper snow, thicker fog, more trick-or-treaters, a different stone wall layout, a stronger breeze and closer cliff). A star unlocks the next day.

The shed: every bagged leaf is banked. Spend leaves on upgrades (wider rake, bigger tarp, longer power-ups, acorn luck) and tarp and rake colors; lifetime leaves fill a compost heap with milestone unlocks; finds sit on a shelf by state.

Dale, the neighbor's kid, races you every Thursday with his own tarp and the same rake physics; lose the race and that day's stars cap at 1.

The Nor'easter (unlocked by finishing all six weeks, or Options > Playtest) is the final storm: rake the leaves it throws onto the tarp to fill bags, flick bags up to hit it 12 times. Sleet at 8 hits left, fog and lightning at 4. Beating it turns the map to winter, rolls credits, and ends on a snow day: roll three snowballs into a snowman and push it off the hill.

The Greenville moose (Maine, unlocked after three weeks) is a mid-boss: he tramples piles and charges the tarp; five thrown bags drive him off for good.

The daily lawn picks one town and weekday per date and lays the lawn out from a seed, so everyone gets the same one; it tracks a streak.

Three stars on all 30 days unlocks Stowe by moonlight (rake by the light of a lantern on your rake) and a moonlit silver rake handle.

Polish: screen shake, leaf crunch sounds, vibration on Android, and fifteen achievements shown in the shed.

Scoring: 10 points per leaf, pile multipliers (x2/x3/x5) for bagging a big pile at once, a daylight bonus for clearing early, 250 per hidden find. Stars at 50/75/90% cleared, or 3 for clearing early. Acorns give power-ups (T big tarp, R wide rake, S sun stop); pinecones shrink the rake. Difficulty (Relaxed/Standard/Hard) is in Options. Best scores per lawn and difficulty, the finds album, and an interrupted round (Continue) are saved in localStorage. The map outlines come from the us-atlas Census data, projected with d3-geo.

`rake-before-dark.html` is written as a Claude artifact page (no doctype/head; the host adds them) and is published at https://claude.ai/artifact/Rhf4L2N8WJHVrrma3C23en. It also opens directly in a browser.

## Web app

Hosted with GitHub Pages from `main` at https://ian2j.github.io/rake-before-dark/. Open it on a phone and use Add to Home Screen to install it; it then runs full-screen and offline.

After editing `rake-before-dark.html`, rebuild and commit the generated files:

```bash
python3 build.py
```

`build.py` writes `index.html` (full page with manifest, icons and service worker registration) and `sw.js` (offline cache, versioned by a hash of the page). `tools/make_icons.py` regenerates `icons/`.
