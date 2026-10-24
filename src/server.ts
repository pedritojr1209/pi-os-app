import http from "node:http";

export interface ListenOptions {
  host: string;
  port: number;
}

export function createServer() {
  return http.createServer((request, response) => {
    const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);
    if (url.pathname === "/health") {
      response.writeHead(200, { "content-type": "application/json" });
      response.end(JSON.stringify({ status: "ok" }));
      return;
    }
    if (url.pathname === "/") {
      response.writeHead(200, { "content-type": "text/plain; charset=utf-8" });
      response.end("pi-os-app");
      return;
    }
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    response.end("Not Found");
  });
}

export async function listen(server: http.Server, host: string, port: number): Promise<http.Server> {
  await new Promise<void>((resolve, reject) => {
    const onError = (error: Error) => reject(error);
    server.once("error", onError);
    server.listen(port, host, () => {
      server.off("error", onError);
      resolve();
    });
  });
  return server;
}
