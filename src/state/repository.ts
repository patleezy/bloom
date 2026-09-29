import type { ActiveSession, BloomSnapshot, CompanionProfile, SessionRecord } from '../domain/types';

/**
 * Persistence boundary. The UI only depends on this interface.
 * v1: LocalRepository (this device only). Later: an API-backed or sync-wrapping implementation.
 * Methods are async so a network implementation can drop in without changing callers.
 */
export interface BloomRepository {
  load(): Promise<BloomSnapshot>;
  saveCompanion(companion: CompanionProfile): Promise<void>;
  saveActive(active: ActiveSession | null): Promise<void>;
  appendSession(record: SessionRecord): Promise<void>;
  /** Replace everything (used by backup import). */
  replaceAll(snapshot: BloomSnapshot): Promise<void>;
  clearAll(): Promise<void>;
}
