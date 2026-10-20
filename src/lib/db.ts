// IndexedDB — historial de traducciones.
// Base: 'que-dice-mi-mascota' v1. Almacén: 'traducciones' (keyPath 'id', índice 'creadoEn').
// Decisión de la spec 1.4: el historial vive en IndexedDB; los blobs van dentro del mismo
// registro (Chrome/Edge lo soportan). Se podan los `videoBlob` para mantener solo los últimos 10.

import type { RegistroTraduccion } from './tipos';

const DB_NAME = 'que-dice-mi-mascota';
const DB_VERSION = 1;
const STORE = 'traducciones';
const MAX_BLOBS = 10; // últimos N registros mantienen videoBlob; el resto queda sin video.

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB no disponible'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id' });
        store.createIndex('creadoEn', 'creadoEn', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('Error abriendo IndexedDB'));
  });
  return dbPromise;
}

function tx(mode: IDBTransactionMode): Promise<IDBObjectStore> {
  return openDB().then(
    (db) => db.transaction(STORE, mode).objectStore(STORE),
  );
}

function reqAsPromise<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// ---------- API pública ----------

/** Guarda un registro. Lo inserta y luego poda los videoBlob a los últimos MAX_BLOBS. */
export async function guardarTraduccion(
  registro: RegistroTraduccion,
): Promise<void> {
  const store = await tx('readwrite');
  await reqAsPromise(store.put(registro));
  await podarBlobs();
}

/** Lista todos los registros, más recientes primero. */
export async function listarTraducciones(): Promise<RegistroTraduccion[]> {
  const store = await tx('readonly');
  const idx = store.index('creadoEn');
  // openCursor en orden descendente
  const registros: RegistroTraduccion[] = await new Promise((resolve, reject) => {
    const out: RegistroTraduccion[] = [];
    const req = idx.openCursor(null, 'prev');
    req.onsuccess = () => {
      const cur = req.result;
      if (cur) {
        out.push(cur.value as RegistroTraduccion);
        cur.continue();
      } else {
        resolve(out);
      }
    };
    req.onerror = () => reject(req.error);
  });
  return registros;
}

/** Obtiene un registro por id; null si no existe. */
export async function obtenerTraduccion(
  id: string,
): Promise<RegistroTraduccion | null> {
  const store = await tx('readonly');
  const v = await reqAsPromise(store.get(id));
  return (v as RegistroTraduccion | undefined) ?? null;
}

/** Borra un registro por id. */
export async function borrarTraduccion(id: string): Promise<void> {
  const store = await tx('readwrite');
  await reqAsPromise(store.delete(id));
}

/**
 * Poda los `videoBlob` para que solo los últimos MAX_BLOBS registros los conserven.
 * Los registros más viejos se quedan con `videoBlob: null` pero conservan miniatura + diálogo.
 */
export async function podarBlobs(): Promise<void> {
  const store = await tx('readwrite');
  const idx = store.index('creadoEn');
  await new Promise<void>((resolve, reject) => {
    const req = idx.openCursor(null, 'prev');
    let posicion = 0;
    req.onsuccess = () => {
      const cur = req.result;
      if (!cur) {
        resolve();
        return;
      }
      const reg = cur.value as RegistroTraduccion;
      if (posicion >= MAX_BLOBS && reg.videoBlob) {
        const updated: RegistroTraduccion = { ...reg, videoBlob: null };
        const upd = cur.update(updated);
        upd.onsuccess = () => {
          posicion++;
          cur.continue();
        };
        upd.onerror = () => reject(upd.error);
      } else {
        posicion++;
        cur.continue();
      }
    };
    req.onerror = () => reject(req.error);
  });
}

/** Borra todo el historial (útil para "borrar todo" si se agrega). */
export async function borrarTodo(): Promise<void> {
  const store = await tx('readwrite');
  await reqAsPromise(store.clear());
}
