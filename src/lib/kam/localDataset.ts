import type { Dataset } from "./data";

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("kam-private-data", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("datasets");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function readLocalDataset(): Promise<Dataset | undefined> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("datasets", "readonly");
    const request = transaction.objectStore("datasets").get("imports");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => db.close();
  });
}

export async function saveLocalDataset(data: Dataset): Promise<void> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("datasets", "readwrite");
    transaction.objectStore("datasets").put(data, "imports");
    transaction.oncomplete = () => { db.close(); resolve(); };
    transaction.onerror = () => { db.close(); reject(transaction.error); };
  });
}