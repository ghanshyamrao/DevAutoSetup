import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import type { SoftwareItem } from '../lib/catalog';

const INSTALLED_IDS_KEY = 'devonboard_installed_ids';

function loadInstalledIds(): Set<string> {
  try {
    const raw = localStorage.getItem(INSTALLED_IDS_KEY);
    if (raw) {
      const arr = JSON.parse(raw) as unknown;
      if (Array.isArray(arr)) return new Set(arr.filter((x): x is string => typeof x === 'string'));
    }
  } catch {
  }
  return new Set();
}

function saveInstalledIds(ids: Set<string>) {
  try {
    localStorage.setItem(INSTALLED_IDS_KEY, JSON.stringify([...ids]));
  } catch {
  }
}

export type ActivityEntry = {
  id: string;
  type: 'sync' | 'installed' | 'queued' | 'failed';
  title: string;
  message: string;
  time: string;
};

type AppState = {
  selectedIds: Set<string>;
  queue: SoftwareItem[];
  installedIds: Set<string>;
  selectedVersions: Record<string, string>;
  activity: ActivityEntry[];
  totalSoftware: number;
  initialDataLoaded: boolean;
};

type Action =
  | { type: 'SET_TOTAL'; payload: number }
  | { type: 'TOGGLE_SELECT'; payload: SoftwareItem }
  | { type: 'SELECT_ALL'; payload: SoftwareItem[] }
  | { type: 'CLEAR_SELECTION' }
  | { type: 'SET_QUEUE'; payload: SoftwareItem[] }
  | { type: 'MARK_INSTALLED'; payload: string }
  | { type: 'SET_INSTALLED_IDS'; payload: string[] }
  | { type: 'MARK_UNINSTALLED'; payload: string }
  | { type: 'SET_SELECTED_VERSION'; payload: { wingetId: string; version: string | null } }
  | { type: 'ADD_ACTIVITY'; payload: ActivityEntry }
  | { type: 'CLEAR_QUEUE' }
  | { type: 'REMOVE_FROM_SELECTION'; payload: string[] }
  | { type: 'SET_INITIAL_DATA_LOADED'; payload: boolean };

function getInitialState(): AppState {
  return {
    selectedIds: new Set(),
    queue: [],
    installedIds: loadInstalledIds(),
    selectedVersions: {},
    activity: [],
    totalSoftware: 0,
    initialDataLoaded: false,
  };
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_TOTAL':
      return { ...state, totalSoftware: action.payload };
    case 'TOGGLE_SELECT': {
      const next = new Set(state.selectedIds);
      if (next.has(action.payload.id)) next.delete(action.payload.id);
      else next.add(action.payload.id);
      return { ...state, selectedIds: next };
    }
    case 'SELECT_ALL':
      if (state.selectedIds.size === action.payload.length) {
        return { ...state, selectedIds: new Set() };
      }
      return { ...state, selectedIds: new Set(action.payload.map((s) => s.id)) };
    case 'CLEAR_SELECTION':
      return { ...state, selectedIds: new Set() };
    case 'SET_QUEUE':
      return { ...state, queue: action.payload };
    case 'MARK_INSTALLED':
      return {
        ...state,
        installedIds: new Set([...state.installedIds, action.payload]),
      };
    case 'SET_INSTALLED_IDS':
      return { ...state, installedIds: new Set(action.payload) };
    case 'MARK_UNINSTALLED': {
      const next = new Set(state.installedIds);
      next.delete(action.payload);
      return { ...state, installedIds: next };
    }
    case 'ADD_ACTIVITY':
      return {
        ...state,
        activity: [action.payload, ...state.activity].slice(0, 50),
      };
    case 'SET_SELECTED_VERSION': {
      const next = { ...state.selectedVersions };
      if (action.payload.version == null) delete next[action.payload.wingetId];
      else next[action.payload.wingetId] = action.payload.version;
      return { ...state, selectedVersions: next };
    }
    case 'CLEAR_QUEUE':
      return { ...state, queue: [] };
    case 'REMOVE_FROM_SELECTION': {
      const toRemove = new Set(action.payload);
      const next = new Set(state.selectedIds);
      toRemove.forEach((id) => next.delete(id));
      return { ...state, selectedIds: next };
    }
    case 'SET_INITIAL_DATA_LOADED':
      return { ...state, initialDataLoaded: action.payload };
    default:
      return state;
  }
}

const AppContext = createContext<{
  state: AppState;
  toggleSelect: (item: SoftwareItem) => void;
  selectAll: (items: SoftwareItem[]) => void;
  clearSelection: () => void;
  setQueue: (items: SoftwareItem[]) => void;
  markInstalled: (id: string) => void;
  setInstalledIds: (ids: string[]) => void;
  markUninstalled: (id: string) => void;
  setSelectedVersion: (wingetId: string, version: string | null) => void;
  addActivity: (entry: Omit<ActivityEntry, 'id'>) => void;
  setTotalSoftware: (n: number) => void;
  clearQueue: () => void;
  removeFromSelection: (ids: string[]) => void;
  setInitialDataLoaded: (value: boolean) => void;
} | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, getInitialState);

  useEffect(() => {
    saveInstalledIds(state.installedIds);
  }, [state.installedIds]);

  const toggleSelect = useCallback((item: SoftwareItem) => {
    dispatch({ type: 'TOGGLE_SELECT', payload: item });
  }, []);
  const selectAll = useCallback((items: SoftwareItem[]) => {
    dispatch({ type: 'SELECT_ALL', payload: items });
  }, []);
  const clearSelection = useCallback(() => dispatch({ type: 'CLEAR_SELECTION' }), []);
  const setQueue = useCallback((items: SoftwareItem[]) => dispatch({ type: 'SET_QUEUE', payload: items }), []);
  const markInstalled = useCallback((id: string) => dispatch({ type: 'MARK_INSTALLED', payload: id }), []);
  const setInstalledIds = useCallback((ids: string[]) => dispatch({ type: 'SET_INSTALLED_IDS', payload: ids }), []);
  const markUninstalled = useCallback((id: string) => dispatch({ type: 'MARK_UNINSTALLED', payload: id }), []);
  const setSelectedVersion = useCallback((wingetId: string, version: string | null) => {
    dispatch({ type: 'SET_SELECTED_VERSION', payload: { wingetId, version } });
  }, []);
  const addActivity = useCallback((entry: Omit<ActivityEntry, 'id'>) => {
    dispatch({
      type: 'ADD_ACTIVITY',
      payload: { ...entry, id: crypto.randomUUID() },
    });
  }, []);
  const setTotalSoftware = useCallback((n: number) => dispatch({ type: 'SET_TOTAL', payload: n }), []);
  const clearQueue = useCallback(() => dispatch({ type: 'CLEAR_QUEUE' }), []);
  const removeFromSelection = useCallback((ids: string[]) => dispatch({ type: 'REMOVE_FROM_SELECTION', payload: ids }), []);
  const setInitialDataLoaded = useCallback((value: boolean) => dispatch({ type: 'SET_INITIAL_DATA_LOADED', payload: value }), []);

  return (
    <AppContext.Provider
      value={{
        state,
        toggleSelect,
        selectAll,
        clearSelection,
        setQueue,
        markInstalled,
        setInstalledIds,
        markUninstalled,
        setSelectedVersion,
        addActivity,
        setTotalSoftware,
        clearQueue,
        removeFromSelection,
        setInitialDataLoaded,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
