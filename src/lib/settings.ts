const KEY = 'devonboard-settings';

export type AppSettings = {
  autoStartInstall: boolean;
  clearQueueWhenDone: boolean;
  notifyOnComplete: boolean;
};

const defaults: AppSettings = {
  autoStartInstall: true,
  clearQueueWhenDone: true,
  notifyOnComplete: true,
};

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...defaults };
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    return {
      ...defaults,
      ...parsed,
      autoStartInstall: parsed.autoStartInstall !== false,
    };
  } catch {
    return { ...defaults };
  }
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(KEY, JSON.stringify(settings));
}
