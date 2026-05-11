import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  getUserFiles,
  getFileByFilename,
  createFile,
  updateFileSecurityStatus,
  deleteFile,
  getDb,
} from "../db";
import * as fs from "fs/promises";
import * as path from "path";

// Directory for storing uploaded files
const UPLOAD_DIR = path.join(process.cwd(), "uploads");

/**
 * Ensure upload directory exists
 */
async function ensureUploadDir() {
  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  } catch (error) {
    console.error("[Files] Failed to create upload directory:", error);
  }
}

/**
 * Check if User-Agent is from Roblox or an executor
 */
function isRobloxOrExecutor(userAgent: string): boolean {
  const robloxPatterns = [
    /roblox/i,
    /rbxcdn/i,
    /rbxgames/i,
    /krnl/i,
    /delta/i,
    /synapse/i,
    /exploit/i,
  ];
  return robloxPatterns.some((pattern) => pattern.test(userAgent));
}

/**
 * Sanitize filename to prevent path traversal and other attacks
 */
function sanitizeFilename(filename: string): string {
  // Remove any path separators
  let sanitized = filename.replace(/[\\/]/g, "");
  // Remove leading dots
  sanitized = sanitized.replace(/^\.+/, "");
  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, "");
  // Remove any remaining suspicious characters
  sanitized = sanitized.replace(/[<>:"|?*]/g, "");
  return sanitized;
}

/**
 * Get unique filename if it already exists
 */
async function getUniqueFilename(filename: string): Promise<string> {
  const existing = await getFileByFilename(filename);
  if (!existing) {
    return filename;
  }

  // Add timestamp to make it unique
  const ext = path.extname(filename);
  const name = path.basename(filename, ext);
  const timestamp = Date.now();
  return `${name}-${timestamp}${ext}`;
}

export const filesRouter = router({
  /**
   * List all files for the current user
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    try {
      const userFiles = await getUserFiles(ctx.user.id);
      return userFiles.map((f) => ({
        id: f.id,
        filename: f.filename,
        fileSize: f.fileSize,
        isSecured: f.isSecured,
        createdAt: f.createdAt,
        rawUrl: `${process.env.BASE_URL || 'https://YOUR-DOMAIN.com'}/${f.filename}`,
      }));
    } catch (error) {
      console.error("[Files] Failed to list files:", error);
      throw new Error("فشل في جلب قائمة الملفات");
    }
  }),

  /**
   * Upload a file with proper validation and sanitization
   */
  upload: protectedProcedure
    .input(
      z.object({
        filename: z.string().min(1).max(255),
        content: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        await ensureUploadDir();

        // Sanitize filename
        const sanitized = sanitizeFilename(input.filename);
        if (!sanitized) {
          throw new Error("اسم الملف غير صحيح");
        }

        // Get unique filename if needed
        const uniqueFilename = await getUniqueFilename(sanitized);

        // Decode base64 content
        const buffer = Buffer.from(input.content, "base64");

        // Validate file size (max 50MB)
        const maxSize = 50 * 1024 * 1024;
        if (buffer.length > maxSize) {
          throw new Error("حجم الملف أكبر من 50 ميجابايت");
        }

        if (buffer.length === 0) {
          throw new Error("الملف فارغ");
        }

        // Save file to disk
        const filepath = path.join(UPLOAD_DIR, uniqueFilename);
        await fs.writeFile(filepath, buffer);

        // Determine MIME type (simple detection)
        const ext = path.extname(uniqueFilename).toLowerCase();
        const mimeTypes: Record<string, string> = {
          ".lua": "text/plain",
          ".txt": "text/plain",
          ".json": "application/json",
          ".js": "application/javascript",
          ".ts": "text/typescript",
          ".py": "text/plain",
          ".pdf": "application/pdf",
          ".zip": "application/zip",
        };
        const mimeType = mimeTypes[ext] || "application/octet-stream";

        // Create database record
        await createFile({
          filename: uniqueFilename,
          filepath: filepath,
          fileSize: buffer.length,
          mimeType: mimeType,
          isSecured: 0,
          userId: ctx.user.id,
        });

        return {
          success: true,
          filename: uniqueFilename,
          rawUrl: `${process.env.BASE_URL || 'https://YOUR-DOMAIN.com'}/${uniqueFilename}`,
        };
      } catch (error) {
        console.error("[Files] Failed to upload file:", error);
        throw new Error(
          error instanceof Error ? error.message : "فشل في رفع الملف"
        );
      }
    }),

  /**
   * Toggle file security status
   */
  toggleSecurity: protectedProcedure
    .input(z.object({ fileId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const currentFile = await getUserFiles(ctx.user.id);
        const targetFile = currentFile.find((f) => f.id === input.fileId);

        if (!targetFile) {
          throw new Error("الملف غير موجود أو لا تملك صلاحية الوصول إليه");
        }

        const newSecurityStatus = !targetFile.isSecured;
        await updateFileSecurityStatus(input.fileId, newSecurityStatus);

        return {
          success: true,
          isSecured: newSecurityStatus,
        };
      } catch (error) {
        console.error("[Files] Failed to toggle security:", error);
        throw new Error(
          error instanceof Error ? error.message : "فشل في تحديث حالة التأمين"
        );
      }
    }),

  /**
   * Delete a file
   */
  delete: protectedProcedure
    .input(z.object({ fileId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const userFiles = await getUserFiles(ctx.user.id);
        const targetFile = userFiles.find((f) => f.id === input.fileId);

        if (!targetFile) {
          throw new Error("الملف غير موجود أو لا تملك صلاحية الوصول إليه");
        }

        // Delete file from disk
        try {
          const filepath = path.join(UPLOAD_DIR, targetFile.filename);
          await fs.unlink(filepath);
        } catch (error) {
          console.warn("[Files] File not found on disk:", error);
        }

        // Delete from database
        await deleteFile(input.fileId);

        return { success: true };
      } catch (error) {
        console.error("[Files] Failed to delete file:", error);
        throw new Error(
          error instanceof Error ? error.message : "فشل في حذف الملف"
        );
      }
    }),
});

/**
 * Express middleware to serve raw files with security checks
 */
export async function rawFileMiddleware(
  req: any,
  res: any,
  next: Function
) {
  // Only handle GET requests
  if (req.method !== "GET") {
    return next();
  }

  // Extract filename from URL
  const filename = req.path.substring(1);

  // Skip if filename contains path traversal attempts or is empty
  if (
    !filename ||
    filename.includes("..") ||
    filename.includes("/") ||
    filename.startsWith(".")
  ) {
    return next();
  }

  try {
    // Get file from database
    const fileRecord = await getFileByFilename(filename);

    if (!fileRecord) {
      return next();
    }

    // Check if file is secured
    if (fileRecord.isSecured === 1) {
      const userAgent = req.get("user-agent") || "";

      // If not from Roblox/Executor, deny access
      if (!isRobloxOrExecutor(userAgent)) {
        return res
          .status(403)
          .type("text/plain; charset=utf-8")
          .send("غير مسموح لك برؤية المحتوى");
      }
    }

    // Serve the file content directly (RAW)
    const filepath = fileRecord.filepath;
    const content = await fs.readFile(filepath);
    res.type(fileRecord.mimeType || "application/octet-stream");
    res.send(content);
  } catch (error) {
    console.error("[Raw File Middleware] Error:", error);
    next();
  }
}
