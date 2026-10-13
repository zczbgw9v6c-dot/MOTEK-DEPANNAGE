import type { DB } from "./domain.ts";
export const STORAGE_KEY = "autohub-local-v1";
export function persistDB(
  db: DB,
  storage: { setItem: (key: string, value: string) => void },
) {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch {
    throw Error(
      "Sauvegarde locale impossible : espace insuffisant ou stockage bloqué. La modification a été refusée ; exportez les dossiers avant de continuer.",
    );
  }
}
