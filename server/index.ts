import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import rateLimit from "express-rate-limit";

import helmet from "helmet";
import { config } from "./config";
import session from "express-session";
import cors from "cors";



const app = express();

// ✅ Trust proxy for secure cookies
app.set("trust proxy", 1);

// ✅ Fix: Apply CORS before session
app.use(cors({
  origin: "http://localhost:5173",  // Allow only your frontend
  credentials: true,  // Allow cookies, sessions, authentication headers
  methods: "GET,POST,PUT,DELETE",
  allowedHeaders: "Content-Type,Authorization"
}));

// ✅ Fix: Apply rate limiting early
app.use(rateLimit(config.rateLimit));

// ✅ Fix: Adjust security settings for session handling
app.use(
  helmet({
    contentSecurityPolicy: false, // Disabled for development; enable in production
    crossOriginEmbedderPolicy: false, 
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
    crossOriginResourcePolicy: { policy: "cross-origin" }, 
  })
);

// ✅ Fix: Ensure session middleware is properly configured
app.use(session({
    secret: process.env.SESSION_SECRET as string,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,  // Set `true` in production with HTTPS
        httpOnly: true,
        sameSite: "lax",
    },
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ✅ Log Middleware (No Changes)
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = registerRoutes(app);

  // ✅ Error Handling (No Changes)
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    // Don't expose stack traces in production
    const error = config.environment === "development"
      ? { message, stack: err.stack }
      : { message };

    res.status(status).json(error);

    if (status >= 500) {
      console.error("[Error]", err);
    }
  });

  if (config.environment === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const PORT = Number(process.env.PORT) || 5000;
  server.listen(PORT, "0.0.0.0", () => {
    log(`serving on port ${PORT}`);
  });
})();
