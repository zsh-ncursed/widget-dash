import { Hono } from "hono";

interface Env {
  // Cloudflare Workers environment variables
}

const app = new Hono<{ Bindings: Env }>();

export default app;
