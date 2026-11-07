# Hackathon rebrand + clearer layout, while keeping today's version safe

## 1. Keep the current version (do this first, before any change)
- Connect GitHub (Connectors → GitHub → Connect project). Lovable pushes the current app to a new repo, giving you this exact version as a starting point.
- In GitHub, create a tag or branch named `v1-generic` from that first commit. It stays frozen for later use, whatever we change next.
- Optional: make the rebrand in a Lovable **draft** so the main project stays generic until you accept it. For a hackathon, building straight on main is simpler because the tag already saves the old version.

## 2. Rebrand for the challenge owner (Lindström, please confirm the spelling)
- Name: "KAM Meeting." becomes "Lindström KAM Assistant". Page titles and descriptions are updated to match.
- Colours: Lindström-style deep blue as the main colour, a bright cyan/light blue accent, white/light-grey background, and a matching dark mode. Replaces the current teal + orange.
- Font: a clean, Scandinavian-style sans font (for example Inter Tight or Manrope) in place of Bricolage/Figtree.
- Logo: a simple wordmark in the header. No official logo files are used unless you supply them.
- Sample company names stay as they are unless you want them renamed.

## 3. Layout improvements from the critique
- Top bar: logo, the 3 steps, and the Default/Advanced switch.
- New **Context Bar** under it, shown on every page:
  - Large company picker with chips (industry · sites · wearers).
  - "+ Import Excel" button beside the company picker.
  - Period presets: Last 3M · Last 6M · YTD · Last 12M · a specific year · All. Presets with no data are greyed out, and periods are counted back from the latest month in the data.
  - A highlighted "Ask AI about this account" button in the accent colour.
- The small phone screen works: the bar wraps into two rows.

## Technical details
- Tokens are changed only in `src/styles.css` and the font link in `__root.tsx`.
- `year` state is generalised to `period` (preset id or year). The metrics filter becomes a month range, and the H1/H2 delta becomes first half vs second half of the selected range.
- A new `ContextBar` component takes over the selectors from `AppShell`.
- Tests are added for the period presets: Last 3M = the latest 3 months in the data, YTD = Jan through the latest month of the latest year, unavailable presets disabled.
- Memory is updated with the brand colours/name. `AGENTS.md` is updated with the period rule.
