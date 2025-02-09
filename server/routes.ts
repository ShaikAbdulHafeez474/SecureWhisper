import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertMessageSchema } from "@shared/schema";

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  app.post("/api/messages", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const result = insertMessageSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: "Invalid message data" });
    }

    // Basic profanity filter
    const profanityList = ["badword1", "badword2"];
    const hasProfanity = profanityList.some(word => 
      result.data.content.toLowerCase().includes(word)
    );
    if (hasProfanity) {
      return res.status(400).json({ message: "Message contains inappropriate content" });
    }

    const message = await storage.createMessage(result.data);
    res.status(201).json(message);
  });

  app.get("/api/messages", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { visibility } = req.query;
    const user = req.user!;

    if (visibility === 'admin' && !user.isAdmin) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const messages = await storage.getMessages(
      visibility as string,
      user.domain
    );
    res.json(messages);
  });

  const httpServer = createServer(app);
  return httpServer;
}
