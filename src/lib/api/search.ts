import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import type { SearchHit, SearchQuery, SearchSummary } from "@/types/search";

export function startSearch(query: SearchQuery): Promise<SearchSummary> {
  return invoke<SearchSummary>("start_search", { query });
}

export function onSearchHits(
  handler: (hits: SearchHit[]) => void,
): Promise<UnlistenFn> {
  return listen<SearchHit[]>("search-hits", (event) => handler(event.payload));
}
