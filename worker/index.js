// 새벽 다섯 시 · 온라인 서버 (Cloudflare Workers + Durable Objects)
// 방 하나 = Durable Object 하나. 서버가 시계·판정·난수를 쥐고, 각자에게 관찰 가능한 정보만 보낸다.
import { createGame, applyCommand, advance, viewFor, archiveOf } from '../public/js/engine.js';

const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { 'content-type': 'application/json' } });

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (url.pathname === '/api/room' && req.method === 'POST') {
      let code = '';
      for (let i = 0; i < 5; i++) code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
      const stub = env.ROOMS.get(env.ROOMS.idFromName(code));
      await stub.fetch(`https://room/init?dev=${url.searchParams.get('dev') ? 1 : 0}`, { method: 'POST' });
      return json({ code });
    }
    const m = url.pathname.match(/^\/api\/room\/([A-Z0-9]{5})\/(ws|info)$/);
    if (m) return env.ROOMS.get(env.ROOMS.idFromName(m[1])).fetch(req);
    return env.ASSETS.fetch(req);
  },
};

export class Room {
  constructor(ctx, env) {
    this.ctx = ctx; this.env = env;
    this.s = null; this.meta = null; this.conns = new Map(); this.timer = null; this.dirty = 0;
    ctx.blockConcurrencyWhile(async () => {
      this.s = (await ctx.storage.get('s')) || null;
      this.meta = (await ctx.storage.get('meta')) || { created: false, dev: false, tokens: {} };
      // 서버가 다시 깨어났으면 접속이 모두 끊긴 상태이므로 시간은 멈춰 있어야 한다
      if (this.s && this.s.phase === 'play') { this.s.paused = true; this.s.pauseReason = 'disconnect'; }
    });
  }

  async fetch(req) {
    const url = new URL(req.url);
    if (url.pathname === '/init') {
      this.meta = { created: true, dev: url.searchParams.get('dev') === '1', tokens: {} };
      this.s = null;
      await this.ctx.storage.put('meta', this.meta);
      await this.ctx.storage.delete('s');
      return json({ ok: true });
    }
    if (url.pathname.endsWith('/info')) {
      return json({ exists: this.meta.created, taken: { ren: !!this.meta.tokens.ren, akechi: !!this.meta.tokens.akechi }, phase: this.s ? this.s.phase : 'lobby' });
    }
    if (url.pathname.endsWith('/ws')) {
      if (!this.meta.created) return new Response('no room', { status: 404 });
      if (req.headers.get('Upgrade') !== 'websocket') return new Response('expected websocket', { status: 426 });
      const role = url.searchParams.get('role');
      const token = url.searchParams.get('token') || '';
      if (role !== 'ren' && role !== 'akechi') return new Response('bad role', { status: 400 });
      let tok = this.meta.tokens[role];
      if (tok && tok !== token) return new Response('taken', { status: 403 });
      if (!tok) { tok = crypto.randomUUID(); this.meta.tokens[role] = tok; await this.ctx.storage.put('meta', this.meta); }

      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);
      server.accept();
      const old = this.conns.get(role);
      if (old) { this.conns.delete(role); try { old.ws.close(4000, 'replaced'); } catch { /* */ } }
      const conn = { ws: server, role, lastLog: 0 };
      this.conns.set(role, conn);
      server.send(JSON.stringify({ type: 'hello', role, token: tok }));
      server.addEventListener('message', (e) => this.onMessage(conn, e.data));
      server.addEventListener('close', () => this.onClose(conn));
      server.addEventListener('error', () => this.onClose(conn));
      this.onPresence();
      return new Response(null, { status: 101, webSocket: client });
    }
    return new Response('not found', { status: 404 });
  }

  onPresence() {
    const now = Date.now();
    const both = this.conns.has('ren') && this.conns.has('akechi');
    if (!this.s && both) {
      this.s = createGame((Math.random() * 1e9) | 0, now, { dev: this.meta.dev });
    }
    if (this.s && this.s.phase === 'play') {
      advance(this.s, now);
      if (both && this.s.paused && this.s.pauseReason === 'disconnect') { this.s.paused = false; this.s.pauseReason = null; this.s.lastReal = now; }
      if (!both && !this.s.paused) { this.s.paused = true; this.s.pauseReason = 'disconnect'; }
    }
    if (this.conns.size && !this.timer) this.timer = setInterval(() => this.tick(), 500);
    if (!this.conns.size && this.timer) { clearInterval(this.timer); this.timer = null; }
    this.save();
    this.pushAll();
  }

  tick() {
    if (this.s) advance(this.s, Date.now());
    this.pushAll();
    if (++this.dirty >= 10) { this.dirty = 0; this.save(); }
  }

  onMessage(conn, data) {
    let m; try { m = JSON.parse(data); } catch { return; }
    if (!this.s) return;
    if (m.type === 'cmd' && m.cmd && typeof m.cmd === 'object') {
      if (m.cmd.type === 'dev' && !this.meta.dev) return;
      const r = applyCommand(this.s, conn.role, m.cmd, Date.now());
      if (!r.ok) { try { conn.ws.send(JSON.stringify({ type: 'err', err: r.err })); } catch { /* */ } }
      if (this.s.phase === 'play' && !(this.conns.has('ren') && this.conns.has('akechi')) && !this.s.paused) { this.s.paused = true; this.s.pauseReason = 'disconnect'; }
      if (m.cmd.type !== 'typing') this.save();
      this.pushAll();
    } else if (m.type === 'restart' && this.s.phase === 'result') {
      this.s = createGame((Math.random() * 1e9) | 0, Date.now(), { dev: this.meta.dev, archive: archiveOf(this.s) });
      for (const c of this.conns.values()) { c.lastLog = 0; try { c.ws.send(JSON.stringify({ type: 'hello', role: c.role, token: this.meta.tokens[c.role] })); } catch { /* */ } }
      if (!(this.conns.has('ren') && this.conns.has('akechi'))) { this.s.paused = true; this.s.pauseReason = 'disconnect'; }
      this.save();
      this.pushAll();
    }
  }

  onClose(conn) {
    if (this.conns.get(conn.role) !== conn) return;
    this.conns.delete(conn.role);
    this.onPresence();
  }

  pushAll() {
    const present = { ren: this.conns.has('ren'), akechi: this.conns.has('akechi') };
    for (const c of this.conns.values()) {
      let msg;
      if (!this.s) msg = { type: 'lobby', present };
      else {
        const v = viewFor(this.s, c.role, c.lastLog);
        if (v.log.length) c.lastLog = v.log[v.log.length - 1].id;
        v.present = present;
        msg = { type: 'view', v };
      }
      try { c.ws.send(JSON.stringify(msg)); } catch { /* 끊긴 연결은 close에서 정리 */ }
    }
  }

  save() {
    if (this.s) this.ctx.storage.put('s', this.s);
    this.ctx.storage.put('meta', this.meta);
  }
}
