<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules
- Sample data lives in `src/data/pack.json`, pre-aggregated (month × site × product) from the reference `pack.xlsx`; all metrics are computed client-side in `src/lib/kam/metrics.ts` so excluding rows never mutates source data.
- Meeting state (account, exclusions, band overrides, attendees, priorities) lives in `KamProvider` (localStorage) so it persists across the 3 steps and Advanced mode.
- Keep the KAM context object in a separate browser-safe module from its provider so live provider updates cannot disconnect existing consumers.
- Workbook parsing uses a browser-only dynamic SheetJS import; datasets are retained in local IndexedDB and passed explicitly to metrics to isolate each browser's private data from SSR and other users.
- Imported month/site/product keys are append-only with existing records winning; previews report skipped keys so re-imports cannot double count or overwrite source data.
- The "Ask the data" assistant sends only the aggregated per-account summary from `src/lib/kam/aiContext.ts` (never raw rows) to the AI through the `/api/chat` server route; the chat session lives in memory only and is exported as .txt or a PPTX notes slide, so no cloud storage is needed.
