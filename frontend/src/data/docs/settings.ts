import data from "./settings.json";

export type SettingItem = {
  type: "page" | "setting" | "toggle" | "picker" | "note";
  label: string;
  page?: string;
  options?: string[];
  default?: string;
  description?: string;
};

export type SettingsSection = {
  header: string | null;
  footer: string | null;
  items: SettingItem[];
};

export type SettingsPage = {
  id: string;
  title: string;
  path: string[];
  parent: string | null;
  sections: SettingsSection[];
};

export const settings = data as { commit: string; date: string; pages: SettingsPage[] };

export const settingsPages = new Map(settings.pages.map((page) => [page.id, page]));

export const rootPage = settings.pages[0];

export function childPages(page: SettingsPage): SettingsPage[] {
  const seen = new Set<string>();
  const children: SettingsPage[] = [];
  for (const section of page.sections) {
    for (const item of section.items) {
      const child = item.page ? settingsPages.get(item.page) : undefined;
      if (child && child.parent === page.id && !seen.has(child.id)) {
        seen.add(child.id);
        children.push(child);
      }
    }
  }
  return children;
}

export function ancestors(page: SettingsPage): SettingsPage[] {
  const result: SettingsPage[] = [];
  let current = page.parent ? settingsPages.get(page.parent) : undefined;
  while (current) {
    result.unshift(current);
    current = current.parent ? settingsPages.get(current.parent) : undefined;
  }
  return result;
}

export function settingCount(page: SettingsPage): number {
  let count = 0;
  for (const section of page.sections) {
    count += section.items.filter((item) => item.type !== "note" && item.type !== "page").length;
  }
  for (const child of childPages(page)) {
    count += settingCount(child);
  }
  return count;
}
