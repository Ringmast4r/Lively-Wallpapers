/**
 * A minimal ZIP writer.
 *
 * Windows has two zip tools built in and neither is usable here: PowerShell's
 * `Compress-Archive` and .NET Framework's `ZipFile.CreateFromDirectory` both
 * write entry names with backslash separators, which the ZIP spec forbids
 * (4.4.17.1: "all slashes MUST be forward slashes"). Extractors vary in how
 * forgiving they are, and a wallpaper that unpacks into files literally named
 * `js\main.js` is a wallpaper that does not run.
 *
 * Rather than add a dependency for one command, this writes the archive
 * directly. Deflate comes from `node:zlib`; the rest is header layout.
 */

import { deflateRawSync } from "node:zlib";

const LOCAL_HEADER = 0x04034b50;
const CENTRAL_HEADER = 0x02014b50;
const END_OF_CENTRAL_DIRECTORY = 0x06054b50;

/** Version 2.0 — the floor for deflate, which is all this writer emits. */
const VERSION = 20;
const METHOD_DEFLATE = 8;

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let i = 0; i < 256; i += 1) {
    let c = i;
    for (let bit = 0; bit < 8; bit += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c;
  }
  return table;
})();

function crc32(buffer) {
  let c = -1;
  for (let i = 0; i < buffer.length; i += 1) {
    c = CRC_TABLE[(c ^ buffer[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ -1) >>> 0;
}

/** MS-DOS date and time, which is what the format stores. */
function dosTimestamp(date) {
  const time =
    (date.getHours() << 11) |
    (date.getMinutes() << 5) |
    (Math.floor(date.getSeconds() / 2) & 0x1f);
  const day =
    ((date.getFullYear() - 1980) << 9) |
    ((date.getMonth() + 1) << 5) |
    date.getDate();
  return { time, day };
}

/**
 * Build a ZIP archive from `entries`, each `{ name, data, date }`.
 * `name` is used verbatim, so callers must pass forward-slash paths.
 */
export function createZip(entries) {
  const chunks = [];
  const directory = [];
  let offset = 0;

  for (const entry of entries) {
    if (entry.name.includes("\\")) {
      throw new Error(`Entry name must use forward slashes: ${entry.name}`);
    }

    const name = Buffer.from(entry.name, "utf8");
    const compressed = deflateRawSync(entry.data, { level: 9 });
    const crc = crc32(entry.data);
    const { time, day } = dosTimestamp(entry.date ?? new Date());

    const local = Buffer.alloc(30);
    local.writeUInt32LE(LOCAL_HEADER, 0);
    local.writeUInt16LE(VERSION, 4);
    local.writeUInt16LE(0, 6); // flags
    local.writeUInt16LE(METHOD_DEFLATE, 8);
    local.writeUInt16LE(time, 10);
    local.writeUInt16LE(day, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(compressed.length, 18);
    local.writeUInt32LE(entry.data.length, 22);
    local.writeUInt16LE(name.length, 26);
    local.writeUInt16LE(0, 28); // extra field length

    chunks.push(local, name, compressed);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(CENTRAL_HEADER, 0);
    central.writeUInt16LE(VERSION, 4); // version made by
    central.writeUInt16LE(VERSION, 6); // version needed
    central.writeUInt16LE(0, 8); // flags
    central.writeUInt16LE(METHOD_DEFLATE, 10);
    central.writeUInt16LE(time, 12);
    central.writeUInt16LE(day, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(compressed.length, 20);
    central.writeUInt32LE(entry.data.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt16LE(0, 30); // extra field length
    central.writeUInt16LE(0, 32); // comment length
    central.writeUInt16LE(0, 34); // disk number start
    central.writeUInt16LE(0, 36); // internal attributes
    central.writeUInt32LE(0, 38); // external attributes
    central.writeUInt32LE(offset, 42);

    directory.push(central, name);
    offset += local.length + name.length + compressed.length;
  }

  const body = Buffer.concat(chunks);
  const centralDirectory = Buffer.concat(directory);

  const end = Buffer.alloc(22);
  end.writeUInt32LE(END_OF_CENTRAL_DIRECTORY, 0);
  end.writeUInt16LE(0, 4); // this disk
  end.writeUInt16LE(0, 6); // disk with the central directory
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralDirectory.length, 12);
  end.writeUInt32LE(body.length, 16);
  end.writeUInt16LE(0, 20); // comment length

  return Buffer.concat([body, centralDirectory, end]);
}
