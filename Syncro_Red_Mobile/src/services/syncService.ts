import NetInfo from '@react-native-community/netinfo';
import api from '@/services/apiClient';
import {
  getPendingSyncOps,
  removeSyncOp,
  incrementSyncOpIntentos,
  SyncOp,
} from '@/db/database';

export interface SyncResult {
  enviados: number;
  errores: number;
  pendientes: number;
}

export async function isOnline(): Promise<boolean> {
  const state = await NetInfo.fetch();
  return !!state.isConnected && !!state.isInternetReachable;
}

export async function syncPendingOps(): Promise<SyncResult> {
  const online = await isOnline();
  if (!online) {
    const pending = await getPendingSyncOps();
    return { enviados: 0, errores: 0, pendientes: pending.length };
  }

  const ops = await getPendingSyncOps(50);
  if (!ops.length) return { enviados: 0, errores: 0, pendientes: 0 };

  let enviados = 0;
  let errores = 0;

  const chunks = chunkArray(ops, 20);
  for (const chunk of chunks) {
    try {
      const payload = chunk.map((op: SyncOp) => ({
        tipo: op.tipo,
        timestamp_dispositivo: op.timestamp_dispositivo,
        datos: op.datos,
      }));
      const { data } = await api.post('/api/operaciones/sync/bulk/', { operaciones: payload });

      for (let i = 0; i < chunk.length; i++) {
        const result = data.resultados?.[i];
        if (result?.ok) {
          await removeSyncOp(chunk[i].id);
          enviados++;
        } else {
          await incrementSyncOpIntentos(chunk[i].id);
          errores++;
        }
      }
    } catch {
      for (const op of chunk) {
        await incrementSyncOpIntentos(op.id);
        errores++;
      }
    }
  }

  const remaining = await getPendingSyncOps();
  return { enviados, errores, pendientes: remaining.length };
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}
