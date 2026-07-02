# Submission walkthrough — Byron's steps

Action guide for the account/verification steps only you can do. Everything else
(annotations, icon, listing copy, UI components) is handled in code. Do these two
setups in parallel — they don't depend on each other.

---

## A. Claude — create a Team org & open the submission portal

The Connectors Directory only accepts submissions from a **Team or Enterprise**
Claude.ai org; the portal lives in **admin settings** and only an **Owner** (or a
role with "Directory management") can submit. A personal/Pro plan can't.

1. **Create the Team plan.** Go to <https://claude.ai/settings> (or
   <https://claude.com/pricing>) → upgrade to **Team**. You become the **Owner**.
   Team has a small minimum seat count — buy the minimum; more can be added later.
   - Use a Kinnectd email so the org clearly belongs to the company.
2. **Find the submission portal.** In Claude.ai: **Settings → Admin settings**
   (visible now that you're on Team). Look for **Connectors / Directory** →
   **Submit a connector** (a.k.a. the submission portal).
3. **Start a submission** and use the values from `docs/directory-submission.md`:
   - **Connection URL:** `https://mcp.a2me.app/mcp` (Streamable HTTP)
   - **Auth:** OAuth 2.0 (the "Connect A2Me" flow is already live)
   - **Listing / Use cases / Company / Data handling:** paste the draft copy.
4. **Walk all 11 steps** (Intro → Connection → Tools → Listing → Use Cases →
   Company → Auth → Data Handling → Test & Launch → Compliance → Review) and
   accept the 7 policy acknowledgments at the end.
5. **Track status** in the submissions dashboard; escalate to
   `mcp-review@anthropic.com` if needed. No published timeline (community reports:
   ~2 weeks to a couple months).

> You don't need Team just to _test_ the connector — anyone can add
> `https://mcp.a2me.app/mcp` as a custom connector in their own Claude settings.
> Team is only required to **submit to the directory**.

---

## B. ChatGPT — identity verification in the OpenAI Platform ✅ DONE

> **Status: complete** — Byron finished OpenAI identity verification. The steps below
> are kept for reference. Next ChatGPT step is creating the app draft (after the widgets
> deploy to prod), which I'll prep.

Apps must be submitted by a **verified** individual/organization, under the exact
name you'll publish as, or the submission is auto-rejected. Do this early — it can
take time.

1. **Sign in** to the OpenAI Platform Dashboard: <https://platform.openai.com>.
   Use the org that will own the app (create/select a Kinnectd org, not a personal
   one, so the publisher name reads "A2Me" / "Kinnectd").
2. **Verify your identity / organization.** Settings → **Organization → General**
   (and/or the **Verifications** section). Complete **business (organization)**
   verification if you want the app published under the company name; individual
   verification publishes under your personal name.
   - This is an ID/business check (often via Persona). Have company details ready.
3. **Confirm publisher name.** Whatever name you verify under is what the directory
   shows — verify as **A2Me / Kinnectd LLC**, not "Byron Walker", so the listing is
   branded.
4. **Get app-publishing access.** Ensure your user has the **Owner** role or the
   `api.apps.write` permission in that org (needed to create/submit an app).
5. Stop here for now — the actual **app draft** (MCP URL, metadata, icon,
   screenshots, tool-annotation justifications) is created after the UI components
   ship. I'll prep that draft content and hand you a fill-in checklist.

Official guidelines: <https://developers.openai.com/apps-sdk/app-submission-guidelines>

---

## What I'm doing in parallel

- ✅ Tool annotations (`title`/`readOnlyHint`/`openWorldHint`) — PR #28.
- ✅ Icon (64px <5KB + 512px) — `assets/`.
- ✅ Privacy policy in README + this walkthrough + the submission checklist.
- ⏳ **ChatGPT Apps SDK UI components** — interactive family-context widgets
  (so the ChatGPT listing has something visual + social-media-worthy).
- ⏳ Promote annotations to prod so `mcp.a2me.app` advertises them before you submit.
- ⏳ Co-create screenshots with you once the UI is live.
