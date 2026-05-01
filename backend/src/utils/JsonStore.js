import fs from 'fs/promises';
import path from 'path';

/**
 * Thin wrapper around a JSON file that holds an array of records under a
 * named key (e.g. { comics: [...] }).
 *
 * Writes are atomic: data is written to a .tmp file then renamed over the
 * original so a crash mid-write never corrupts the file.
 *
 * Usage:
 *   const store = new JsonStore('/path/to/file.json', 'comics');
 *   const records = await store.readAll();
 *   await store.write(records);
 */
export class JsonStore {
  constructor(filePath, collectionKey) {
    this.filePath = filePath;
    this.collectionKey = collectionKey;
  }

  async readAll() {
    const raw = await fs.readFile(this.filePath, 'utf-8');
    const data = JSON.parse(raw);
    const records = data[this.collectionKey];
    if (!Array.isArray(records)) {
      throw new Error(`Expected "${this.collectionKey}" to be an array in ${this.filePath}`);
    }
    return records;
  }

  async write(records) {
    const tmpPath = `${this.filePath}.tmp`;
    const payload = JSON.stringify({ [this.collectionKey]: records }, null, 2);
    await fs.writeFile(tmpPath, payload, 'utf-8');
    await fs.rename(tmpPath, this.filePath);
  }

  async findById(id) {
    const records = await this.readAll();
    return records.find(r => r.id === id) ?? null;
  }

  async insert(record) {
    const records = await this.readAll();
    if (records.some(r => r.id === record.id)) {
      throw new ConflictError(`ID "${record.id}" already exists`);
    }
    records.push(record);
    await this.write(records);
    return record;
  }

  /** Full replace of a record by id. */
  async replace(id, record) {
    const records = await this.readAll();
    const idx = records.findIndex(r => r.id === id);
    if (idx === -1) throw new NotFoundError(id);
    records[idx] = { ...record, id };
    await this.write(records);
    return records[idx];
  }

  /** Merge partial fields into an existing record. */
  async patch(id, fields) {
    const records = await this.readAll();
    const idx = records.findIndex(r => r.id === id);
    if (idx === -1) throw new NotFoundError(id);
    records[idx] = { ...records[idx], ...fields, id };
    await this.write(records);
    return records[idx];
  }

  async remove(id) {
    const records = await this.readAll();
    const idx = records.findIndex(r => r.id === id);
    if (idx === -1) throw new NotFoundError(id);
    const [removed] = records.splice(idx, 1);
    await this.write(records);
    return removed;
  }
}

export class NotFoundError extends Error {
  constructor(id) {
    super(`Record "${id}" not found`);
    this.status = 404;
  }
}

export class ConflictError extends Error {
  constructor(message) {
    super(message);
    this.status = 409;
  }
}

export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.status = 400;
  }
}
