import { Hono } from "hono"
import { cors } from "hono/cors"

const app = new Hono()

// Public API (v1) - accessible to all origins
app.use("/api/v1/*", cors())

// Protected API (v2) - accessible only to https://mushroom.vercel.app
app.use(
  "/api/v2/*",
  cors({
    origin: ["https://mushroom.vercel.app", "http://localhost:3001"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    maxAge: 600,
    credentials: true,
  })
)

// Public API routes
app.get("/api/v1/hello", (c) => c.text("Hello from public API!"))

// Protected API routes
app.get("/api/v2/pawn", (c) =>
  c.json({
    msg: "Hello from protected API!",
  })
)

export default app
