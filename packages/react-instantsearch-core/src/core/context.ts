import { createContext } from 'react';
import { Store } from '../core/createStore';

export type InstantSearchContext = {
  onInternalStateUpdate: (...args: any[]) => any;
  createHrefForState: (...args: any[]) => string;
  onSearchForFacetValues: (...args: any[]) => any;
  onSearchStateChange: (...args: any[]) => any;
  onSearchParameters: (...args: any[]) => any;
  // TODO: move store out of context
  store: Store;
  widgetsManager: any;
  mainTargetedIndex: string;
};

export const {
  Consumer: InstantSearchConsumer,
  Provider: InstantSearchProvider,
} = createContext<InstantSearchContext>({
  onInternalStateUpdate: () => undefined,
  createHrefForState: () => '#',
  onSearchForFacetValues: () => undefined,
  onSearchStateChange: () => undefined,
  onSearchParameters: () => undefined,
  // TODO: move store out of context
  store: {} as Store,
  widgetsManager: {},
  mainTargetedIndex: '',
});

export type IndexContext = {
  targetedIndex: string;
};

export const {
  Consumer: IndexConsumer,
  Provider: IndexProvider,
} = createContext<IndexContext>({
  targetedIndex: '',
});
