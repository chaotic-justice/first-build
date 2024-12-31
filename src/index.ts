import { Hono } from "hono"
import { basicAuth } from "hono/basic-auth"
import { bearerAuth } from "hono/bearer-auth"
import { cors } from "hono/cors"
import { jwt } from "hono/jwt"
import type { JwtVariables } from "hono/jwt"

type Variables = JwtVariables

const app = new Hono()

app.use("/auth/*", cors())

app.use("/api/*", cors())
app.use(
  "/api2/*",
  cors({
    origin: "https://kagi.vercel.app",
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    maxAge: 600,
    credentials: true,
  })
)
app.get("/", (c) => {
  return c.text("Hello Hono!")
})

app.all("/api/abc", (c) => {
  return c.json({ success: true })
})
app.all("/api2/abc", (c) => {
  return c.json({ success: true })
})

// app.use(
//   "/auth/*",
//   basicAuth({
//     username: "hono",
//     password: "acoolproject",
//   })
// )

// app.use("/auth/*", (c, next) => {
//   const jwtMiddleware = jwt({
//     secret: c.env.JWT_SECRET,
//   })
//   return jwtMiddleware(c, next)
// })

const token = "honoiscool"

app.use(
  "/auth/*",
  bearerAuth({
    verifyToken: async (token, c) => {
      return token === "honoiscool"
    },
  })
)
// app.use("/auth/*", bearerAuth({ token }))

app.get("/auth/page", (c) => {
  return c.text("You are authorized")
})

export default app
