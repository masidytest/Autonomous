import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ExecRequest {
  action: "exec" | "write_file" | "read_file" | "list_files";
  project_id: string;
  // For exec
  code?: string;
  language?: string;
  command?: string;
  timeout_ms?: number;
  // For file ops
  file_path?: string;
  content?: string;
  recursive?: boolean;
}

/** Execute JavaScript/TypeScript code in a sandboxed Deno environment */
async function executeCode(
  code: string,
  language: string,
  timeoutMs: number
): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  const logs: string[] = [];
  const errors: string[] = [];

  // Create a sandboxed console that captures output
  const sandboxConsole = {
    log: (...args: unknown[]) =>
      logs.push(args.map((a) => formatValue(a)).join(" ")),
    error: (...args: unknown[]) =>
      errors.push(args.map((a) => formatValue(a)).join(" ")),
    warn: (...args: unknown[]) =>
      errors.push(args.map((a) => formatValue(a)).join(" ")),
    info: (...args: unknown[]) =>
      logs.push(args.map((a) => formatValue(a)).join(" ")),
    dir: (obj: unknown) => logs.push(formatValue(obj)),
    table: (data: unknown) => logs.push(JSON.stringify(data, null, 2)),
  };

  try {
    // Wrap code in async IIFE with sandboxed globals
    const wrappedCode = `
      const console = __sandbox_console__;
      const __result__ = (async () => {
        ${code}
      })();
      __result__;
    `;

    const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
    const fn = new AsyncFunction("__sandbox_console__", wrappedCode);

    // Execute with timeout
    const result = await Promise.race([
      fn(sandboxConsole),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Execution timed out")), timeoutMs)
      ),
    ]);

    // If the code returned a value, add it to stdout
    if (result !== undefined) {
      logs.push(formatValue(result));
    }

    return {
      exitCode: 0,
      stdout: logs.join("\n"),
      stderr: errors.join("\n"),
    };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    const errStack = err instanceof Error ? err.stack || "" : "";
    return {
      exitCode: 1,
      stdout: logs.join("\n"),
      stderr: errors.length > 0
        ? errors.join("\n") + "\n" + errMsg
        : errStack || errMsg,
    };
  }
}

/** Execute a shell command (limited — Deno.Command if available) */
async function executeCommand(
  command: string,
  projectId: string,
  timeoutMs: number
): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  try {
    // Parse the command — handle simple cases
    const parts = command.trim().split(/\s+/);
    const cmd = parts[0];
    const args = parts.slice(1);

    // Use Deno.Command for supported operations
    const process = new Deno.Command(cmd, {
      args,
      stdout: "piped",
      stderr: "piped",
    });

    const child = process.spawn();

    // Timeout handling
    const timeoutId = setTimeout(() => {
      try {
        child.kill("SIGTERM");
      } catch { /* ignore */ }
    }, timeoutMs);

    const output = await child.output();
    clearTimeout(timeoutId);

    return {
      exitCode: output.code,
      stdout: new TextDecoder().decode(output.stdout),
      stderr: new TextDecoder().decode(output.stderr),
    };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    // If Deno.Command is not available, fall back to eval for JS
    if (errMsg.includes("not a function") || errMsg.includes("not allowed")) {
      return {
        exitCode: 1,
        stdout: "",
        stderr: `Command execution not available in Edge Functions. Use code execution instead.\nError: ${errMsg}`,
      };
    }
    return {
      exitCode: 1,
      stdout: "",
      stderr: errMsg,
    };
  }
}

/** Write a file to the sandbox_files table */
async function writeFile(
  projectId: string,
  filePath: string,
  content: string
): Promise<{ success: boolean; output: string; error?: string }> {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Normalize path
  const normalizedPath = filePath.replace(/^\/workspace\/?/, "");

  // Detect language from extension
  const ext = normalizedPath.split(".").pop()?.toLowerCase() || "";
  const langMap: Record<string, string> = {
    js: "javascript", jsx: "javascript", ts: "typescript", tsx: "typescript",
    py: "python", rb: "ruby", go: "go", rs: "rust", java: "java",
    html: "html", css: "css", json: "json", md: "markdown",
    yaml: "yaml", yml: "yaml", toml: "toml", sql: "sql",
    sh: "bash", bash: "bash", zsh: "bash",
  };

  const { error } = await supabase.from("sandbox_files").upsert(
    {
      project_id: projectId,
      file_path: normalizedPath,
      content,
      language: langMap[ext] || null,
      size_bytes: new TextEncoder().encode(content).length,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "project_id,file_path" }
  );

  if (error) {
    return { success: false, output: "", error: error.message };
  }

  // Also upload to Storage bucket for binary/large file support
  try {
    const storagePath = `${projectId}/${normalizedPath}`;
    await supabase.storage
      .from("workspaces")
      .upload(storagePath, new Blob([content]), {
        upsert: true,
        contentType: "text/plain",
      });
  } catch {
    // Storage upload is best-effort — DB is the primary store
  }

  return { success: true, output: `File written: ${filePath}` };
}

/** Read a file from the sandbox_files table */
async function readFile(
  projectId: string,
  filePath: string
): Promise<{ success: boolean; output: string; error?: string }> {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const normalizedPath = filePath.replace(/^\/workspace\/?/, "");

  const { data, error } = await supabase
    .from("sandbox_files")
    .select("content")
    .eq("project_id", projectId)
    .eq("file_path", normalizedPath)
    .single();

  if (error || !data) {
    return {
      success: false,
      output: "",
      error: `File not found: ${filePath}`,
    };
  }

  return { success: true, output: data.content };
}

/** List files in the sandbox_files table */
async function listFiles(
  projectId: string,
  dirPath: string,
  recursive: boolean
): Promise<{ success: boolean; output: string; error?: string }> {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const normalizedDir = dirPath
    .replace(/^\/workspace\/?/, "")
    .replace(/\/$/, "");

  const { data, error } = await supabase
    .from("sandbox_files")
    .select("file_path")
    .eq("project_id", projectId)
    .order("file_path");

  if (error) {
    return { success: false, output: "", error: error.message };
  }

  let files = (data || []).map((f: { file_path: string }) => f.file_path);

  if (normalizedDir) {
    files = files.filter(
      (f: string) => f.startsWith(normalizedDir + "/") || f === normalizedDir
    );
  }

  if (!recursive && normalizedDir) {
    // Only show immediate children
    const prefix = normalizedDir + "/";
    const seen = new Set<string>();
    files = files
      .filter((f: string) => f.startsWith(prefix))
      .map((f: string) => {
        const relative = f.substring(prefix.length);
        const firstSlash = relative.indexOf("/");
        return firstSlash === -1 ? relative : relative.substring(0, firstSlash);
      })
      .filter((f: string) => {
        if (seen.has(f)) return false;
        seen.add(f);
        return true;
      });
  }

  return {
    success: true,
    output: files.length > 0 ? files.join("\n") : "(empty directory)",
  };
}

function formatValue(v: unknown): string {
  if (v === null) return "null";
  if (v === undefined) return "undefined";
  if (typeof v === "string") return v;
  if (typeof v === "object") {
    try {
      return JSON.stringify(v, null, 2);
    } catch {
      return String(v);
    }
  }
  return String(v);
}

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body: ExecRequest = await req.json();
    const { action, project_id } = body;

    if (!project_id) {
      return jsonResponse({ error: "project_id is required" }, 400);
    }

    switch (action) {
      case "exec": {
        if (body.command) {
          // Shell command execution
          const result = await executeCommand(
            body.command,
            project_id,
            body.timeout_ms || 300000
          );
          return jsonResponse(result);
        }
        if (body.code) {
          // Code execution in Deno sandbox
          const result = await executeCode(
            body.code,
            body.language || "javascript",
            body.timeout_ms || 30000
          );
          return jsonResponse(result);
        }
        return jsonResponse({ error: "code or command is required" }, 400);
      }

      case "write_file": {
        if (!body.file_path || body.content === undefined) {
          return jsonResponse(
            { error: "file_path and content are required" },
            400
          );
        }
        const result = await writeFile(project_id, body.file_path, body.content);
        return jsonResponse(result);
      }

      case "read_file": {
        if (!body.file_path) {
          return jsonResponse({ error: "file_path is required" }, 400);
        }
        const result = await readFile(project_id, body.file_path);
        return jsonResponse(result);
      }

      case "list_files": {
        const result = await listFiles(
          project_id,
          body.file_path || "/workspace",
          body.recursive ?? false
        );
        return jsonResponse(result);
      }

      default:
        return jsonResponse({ error: `Unknown action: ${action}` }, 400);
    }
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return jsonResponse({ error: errMsg }, 500);
  }
});
