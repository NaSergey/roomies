---
date: "2026-06-23 21:02"
promoted: false
---

Frontend startup prefetch optimization in widgets/home/ui/HomeView.tsx. (1) Feed/cards are now prefetched immediately after auth (queryClient.prefetchQuery on feedKeys.all), in parallel with the onboarding-status request, so the SwipeDeck no longer shows a second "loading cards" spinner. (2) When MainShell mounts (deck is the default tab), profile (profileKeys.me / getMe) and matches (chatKeys.matches / getMatches) are warmed in the background so the Profile and Chat tabs open instantly. Done 2026-06-23. Related: also hardened auth (re-login on every Telegram open, purge token on 401) and made MatchList surface errors instead of masking 401 as empty.
