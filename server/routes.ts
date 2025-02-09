import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertMessageSchema } from "@shared/schema";
import { z } from "zod";
import { moderateContent } from "./services/moderation";

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  app.post("/api/messages", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const result = insertMessageSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          message: "Invalid message data",
          errors: result.error.errors 
        });
      }

      // Perform content moderation
      const moderationResult = await moderateContent(result.data.content);
      if (moderationResult.flagged) {
        return res.status(400).json({ 
          message: "Message contains inappropriate content",
          details: moderationResult.reason,
          categories: moderationResult.categories
        });
      }

      const message = await storage.createMessage(result.data);
      res.status(201).json(message);
    } catch (error) {
      console.error("Error creating message:", error);
      res.status(500).json({ message: "Failed to create message" });
    }
  });

  app.get("/api/messages", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const querySchema = z.object({
        visibility: z.enum(["admin", "domain", "public"]).optional().default("public")
      });

      const result = querySchema.safeParse(req.query);
      if (!result.success) {
        return res.status(400).json({ 
          message: "Invalid query parameters",
          errors: result.error.errors 
        });
      }

      const user = req.user!;

      if (result.data.visibility === 'admin' && !user.isAdmin) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const messages = await storage.getMessages(
        result.data.visibility,
        user.domain
      );
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}