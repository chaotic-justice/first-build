import { Hono } from "hono"
import { bearerAuth } from "hono/bearer-auth"
import { logger } from "hono/logger"
import { nanoid } from "nanoid"
import { ASSETS_SUBDOMAIN, TOKEN } from "./config"
import { cors } from "hono/cors"

type Bindings = {
  MY_BUCKET: R2Bucket
  USERNAME: string
  PASSWORD: string
}

const app = new Hono<{ Bindings: Bindings }>()

export const customLogger = (message: string, ...rest: string[]) => {
  console.log(message, ...rest)
}

app.use(logger(customLogger))
app.use("/api/*", cors())
app.use(
  "/api/*",
  cors({
    origin: ["http://localhost:3000", "http://localhost:3002"],
    allowHeaders: ["X-Custom-Header", "Upgrade-Insecure-Requests"],
    allowMethods: ["POST", "GET", "OPTIONS"],
    exposeHeaders: ["Content-Length", "X-Kuma-Revision"],
    maxAge: 600,
    credentials: true,
  })
  // bearerAuth({ token: TOKEN })
)

app.notFound((c) => {
  return c.text("Not Found", 404)
})

app.get("/", (c) => {
  return c.json({
    ok: true,
  })
})

app.get("/pear", (c) => {
  return c.json({
    fishing: false,
  })
})

app.get("/api/fetch-from-r2", async (c) => {
  const { kind } = c.req.query()
  if (!kind) {
    return c.text("empty list")
  }

  try {
    if (kind === "img") {
      const listResult = await c.env.MY_BUCKET.list({
        prefix: "images/",
        delimiter: "/",
      })
      const images = listResult.objects.map((obj) => ({
        name: obj.key,
        size: obj.size,
        lastModified: obj.uploaded,
      }))
      return c.json(images)
    } else if (kind === "pdf") {
      const listResult = await c.env.MY_BUCKET.list()

      const pdfs = listResult.objects
        .filter((obj) => obj.key.toLowerCase().endsWith(".pdf"))
        .map((obj) => ({
          name: obj.key,
          size: obj.size,
          lastModified: obj.uploaded,
        }))

      return c.json(pdfs)
    } else {
      return c.json({ msg: "invalid kind" })
    }
  } catch (error) {
    console.error("Error fetching images:", error)
    return c.json({ error: "Failed to fetch images" }, 500)
  }
})

app.post("/api/v1/upload", async (c) => {
  const uniqKey = nanoid(4)
  const formData = await c.req.parseBody()
  const file = formData["file"]
  if (file instanceof File) {
    const fileBuffer = await file.arrayBuffer()
    const fullName = file.name
    const nameWithoutExt = fullName.substring(0, fullName.lastIndexOf(".")) || fullName
    const ext = fullName.split(".").pop()
    const path = `images/${nameWithoutExt}_${uniqKey}.${ext}`
    const res = await c.env.MY_BUCKET.put(path, fileBuffer)
    return c.json({
      ...res,
    })
  } else {
    return c.text("Invalid file", 400)
  }
})

export default app
