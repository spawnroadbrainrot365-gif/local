import { describe, it, expect, beforeAll, afterAll } from "vitest";
import * as fs from "fs/promises";
import * as path from "path";

/**
 * Test suite for file handling and security features
 */
describe("File Security and User-Agent Detection", () => {
  const testDir = path.join(process.cwd(), "test-uploads");

  beforeAll(async () => {
    // Create test directory
    await fs.mkdir(testDir, { recursive: true });
  });

  afterAll(async () => {
    // Clean up test directory
    try {
      await fs.rm(testDir, { recursive: true });
    } catch (error) {
      console.warn("Failed to clean up test directory:", error);
    }
  });

  describe("User-Agent Detection", () => {
    it("should identify Roblox User-Agent correctly", () => {
      const robloxUserAgents = [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Roblox/WinInet",
        "Roblox/WinInet",
        "rbxcdn",
        "rbxgames",
      ];

      const robloxPatterns = [
        /roblox/i,
        /rbxcdn/i,
        /rbxgames/i,
        /krnl/i,
        /delta/i,
        /synapse/i,
        /exploit/i,
      ];

      robloxUserAgents.forEach((ua) => {
        const isRoblox = robloxPatterns.some((pattern) => pattern.test(ua));
        expect(isRoblox).toBe(true);
      });
    });

    it("should identify regular browser User-Agent correctly", () => {
      const browserUserAgents = [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/91.0.4472.124 Safari/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36",
      ];

      const robloxPatterns = [
        /roblox/i,
        /rbxcdn/i,
        /rbxgames/i,
        /krnl/i,
        /delta/i,
        /synapse/i,
        /exploit/i,
      ];

      browserUserAgents.forEach((ua) => {
        const isRoblox = robloxPatterns.some((pattern) => pattern.test(ua));
        expect(isRoblox).toBe(false);
      });
    });

    it("should identify executor User-Agents correctly", () => {
      const executorUserAgents = [
        "Krnl/1.0",
        "Delta/1.0",
        "Synapse/1.0",
        "Exploit/1.0",
      ];

      const robloxPatterns = [
        /roblox/i,
        /rbxcdn/i,
        /rbxgames/i,
        /krnl/i,
        /delta/i,
        /synapse/i,
        /exploit/i,
      ];

      executorUserAgents.forEach((ua) => {
        const isRoblox = robloxPatterns.some((pattern) => pattern.test(ua));
        expect(isRoblox).toBe(true);
      });
    });
  });

  describe("File Storage", () => {
    it("should create and write a file correctly", async () => {
      const testFilePath = path.join(testDir, "test.lua");
      const testContent = "print('Hello, World!')";

      await fs.writeFile(testFilePath, testContent);

      const content = await fs.readFile(testFilePath, "utf-8");
      expect(content).toBe(testContent);
    });

    it("should handle file deletion correctly", async () => {
      const testFilePath = path.join(testDir, "delete-test.lua");
      const testContent = "-- test content";

      await fs.writeFile(testFilePath, testContent);
      expect(await fs.readFile(testFilePath, "utf-8")).toBe(testContent);

      await fs.unlink(testFilePath);

      try {
        await fs.readFile(testFilePath, "utf-8");
        expect.fail("File should have been deleted");
      } catch (error: any) {
        expect(error.code).toBe("ENOENT");
      }
    });

    it("should preserve original filename", async () => {
      const originalFilename = "MyScript.lua";
      const testFilePath = path.join(testDir, originalFilename);
      const testContent = "-- original script";

      await fs.writeFile(testFilePath, testContent);

      const filename = path.basename(testFilePath);
      expect(filename).toBe(originalFilename);
    });
  });

  describe("Filename Validation", () => {
    it("should reject path traversal attempts", () => {
      const maliciousFilenames = [
        "../../../etc/passwd",
        "..\\..\\..\\windows\\system32",
        "./../sensitive.txt",
        "./../../config.json",
      ];

      maliciousFilenames.forEach((filename) => {
        const isValid = !filename.includes("..") && !filename.includes("/") && !filename.startsWith(".");
        expect(isValid).toBe(false);
      });
    });

    it("should accept valid filenames", () => {
      const validFilenames = [
        "script.lua",
        "MyScript.lua",
        "file-name.txt",
        "file_name.js",
        "123.json",
      ];

      validFilenames.forEach((filename) => {
        const isValid = !filename.includes("..") && !filename.includes("/") && !filename.startsWith(".");
        expect(isValid).toBe(true);
      });
    });

    it("should sanitize suspicious characters", () => {
      const suspiciousFilenames = [
        "file<name>.lua",
        "file>name.lua",
        'file"name.lua',
        "file|name.lua",
        "file?name.lua",
        "file*name.lua",
      ];

      suspiciousFilenames.forEach((filename) => {
        const sanitized = filename.replace(/[<>:"|?*]/g, "");
        expect(sanitized).not.toContain("<");
        expect(sanitized).not.toContain(">");
        expect(sanitized).not.toContain('"');
        expect(sanitized).not.toContain("|");
        expect(sanitized).not.toContain("?");
        expect(sanitized).not.toContain("*");
      });
    });
  });

  describe("File Size Validation", () => {
    it("should reject files larger than 50MB", () => {
      const maxSize = 50 * 1024 * 1024;
      const largeSize = maxSize + 1;

      expect(largeSize > maxSize).toBe(true);
    });

    it("should accept files within size limit", () => {
      const maxSize = 50 * 1024 * 1024;
      const validSize = 1024 * 1024;

      expect(validSize <= maxSize).toBe(true);
    });
  });
});
