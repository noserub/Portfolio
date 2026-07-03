import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

/** Mirrors Vercel `/api/send-contact-email` during `npm run dev`. */
function contactEmailDevApi(): Plugin {
  return {
    name: "contact-email-dev-api",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const pathname = req.url?.split("?")[0];
        if (pathname !== "/api/send-contact-email") return next();

        if (req.method === "OPTIONS") {
          res.writeHead(204, {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
          });
          res.end();
          return;
        }

        if (req.method !== "POST") {
          res.writeHead(405, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Method not allowed" }));
          return;
        }

        const chunks: Buffer[] = [];
        req.on("data", (chunk) => chunks.push(chunk));
        req.on("end", () => {
          void (async () => {
            try {
              const env = loadEnv(server.config.mode, server.config.root, "");
              const { handleContactEmailApiPost } = await server.ssrLoadModule(
                "/src/lib/contactEmailApi.ts",
              );
              const body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
              const result = await handleContactEmailApiPost(body, {
                resendApiKey: env.RESEND_API_KEY,
                notifyTo:
                  env.CONTACT_NOTIFY_TO ||
                  env.VITE_PUBLIC_CONTACT_EMAIL ||
                  env.VITE_SITE_OWNER_SIGNIN_EMAIL,
                fromEmail: env.CONTACT_FROM_EMAIL,
              });
              res.writeHead(result.status, {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
              });
              res.end(JSON.stringify(result.body));
            } catch (error) {
              const message = error instanceof Error ? error.message : String(error);
              res.writeHead(500, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ error: message }));
            }
          })();
        });
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), contactEmailDevApi()],
  resolve: {
    extensions: [".js", ".jsx", ".ts", ".tsx", ".json"],
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom"],
  },
  build: {
    target: "esnext",
    outDir: "dist",
    chunkSizeWarningLimit: 1500,
  },
  server: {
    port: 3000,
    open: true,
  },
});
