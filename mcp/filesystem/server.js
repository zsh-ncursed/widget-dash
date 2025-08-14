#!/usr/bin/env node
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import glob from 'glob';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const server = new Server(
  { name: 'mcp-filesystem', version: '0.1.0' },
  { capabilities: { tools: {} } }
);

const text = (t) => ({ content: [{ type: 'text', text: String(t) }] });

server.tool(
  'fs_read_file',
  {
    description: 'Read a file from the filesystem. Works outside the project directory.',
    input_schema: {
      type: 'object',
      properties: {
        path: { type: 'string' },
        encoding: { type: 'string', enum: ['utf8', 'base64'], default: 'utf8' }
      },
      required: ['path']
    }
  },
  async ({ path: filePath, encoding = 'utf8' }) => {
    const data = await fs.readFile(filePath, { encoding });
    return text(data);
  }
);

server.tool(
  'fs_write_file',
  {
    description: 'Write content to a file. Creates parent directories if needed.',
    input_schema: {
      type: 'object',
      properties: {
        path: { type: 'string' },
        content: { type: 'string' },
        encoding: { type: 'string', enum: ['utf8', 'base64'], default: 'utf8' }
      },
      required: ['path', 'content']
    }
  },
  async ({ path: filePath, content, encoding = 'utf8' }) => {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, content, { encoding });
    return text('OK');
  }
);

server.tool(
  'fs_list_dir',
  {
    description: 'List directory contents.',
    input_schema: {
      type: 'object',
      properties: { path: { type: 'string' } },
      required: ['path']
    }
  },
  async ({ path: dirPath }) => {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const list = entries.map((e) => ({ name: e.name, type: e.isDirectory() ? 'dir' : 'file' }));
    return text(JSON.stringify(list, null, 2));
  }
);

server.tool(
  'fs_stat',
  {
    description: 'Stat a file or directory and return JSON metadata.',
    input_schema: {
      type: 'object',
      properties: { path: { type: 'string' } },
      required: ['path']
    }
  },
  async ({ path: targetPath }) => {
    const s = await fs.stat(targetPath);
    const out = {
      isFile: s.isFile(),
      isDirectory: s.isDirectory(),
      size: s.size,
      mtime: s.mtimeMs,
      mode: s.mode
    };
    return text(JSON.stringify(out, null, 2));
  }
);

server.tool(
  'fs_delete',
  {
    description: 'Delete a file or directory (recursive for directories).',
    input_schema: {
      type: 'object',
      properties: { path: { type: 'string' } },
      required: ['path']
    }
  },
  async ({ path: targetPath }) => {
    await fs.rm(targetPath, { recursive: true, force: true });
    return text('OK');
  }
);

server.tool(
  'fs_copy',
  {
    description: 'Copy a file or directory recursively.',
    input_schema: {
      type: 'object',
      properties: { src: { type: 'string' }, dest: { type: 'string' } },
      required: ['src', 'dest']
    }
  },
  async ({ src, dest }) => {
    await fs.cp(src, dest, { recursive: true });
    return text('OK');
  }
);

server.tool(
  'fs_move',
  {
    description: 'Move/rename a file or directory.',
    input_schema: {
      type: 'object',
      properties: { src: { type: 'string' }, dest: { type: 'string' } },
      required: ['src', 'dest']
    }
  },
  async ({ src, dest }) => {
    await fs.rename(src, dest);
    return text('OK');
  }
);

server.tool(
  'fs_glob',
  {
    description: 'Run a glob pattern and return matched paths. Optional cwd.',
    input_schema: {
      type: 'object',
      properties: {
        pattern: { type: 'string' },
        cwd: { type: 'string' }
      },
      required: ['pattern']
    }
  },
  async ({ pattern, cwd }) => {
    const matches = glob.sync(pattern, { cwd: cwd || undefined, dot: true, absolute: true });
    return text(JSON.stringify(matches, null, 2));
  }
);

server.tool(
  'fs_mkdir',
  {
    description: 'Create a directory, recursive by default.',
    input_schema: {
      type: 'object',
      properties: { path: { type: 'string' }, recursive: { type: 'boolean', default: true } },
      required: ['path']
    }
  },
  async ({ path: dirPath, recursive = true }) => {
    await fs.mkdir(dirPath, { recursive });
    return text('OK');
  }
);

server.tool(
  'fs_exists',
  {
    description: 'Check if a path exists. Returns true/false.',
    input_schema: {
      type: 'object',
      properties: { path: { type: 'string' } },
      required: ['path']
    }
  },
  async ({ path: targetPath }) => {
    try {
      await fs.access(targetPath);
      return text('true');
    } catch {
      return text('false');
    }
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);


