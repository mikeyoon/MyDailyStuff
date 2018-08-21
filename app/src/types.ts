import { RootStore } from './stores/root.store';

export interface BaseProps {
  store: RootStore;
}

export interface SearchResult {
  date: Date;
  entries: ReadonlyArray<string>;
}
