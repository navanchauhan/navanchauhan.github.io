"""Preview the built site: serves docs/ the way GitHub Pages does.

Unknown paths get 404.html, and nothing is cached so edits show on reload.
Usage: python3 serve.py [port]
"""
import http.server
import os
import sys

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "docs")


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def send_error(self, code, message=None, explain=None):
        page = os.path.join(ROOT, "404.html")
        if code != 404 or not os.path.exists(page):
            return super().send_error(code, message, explain)
        with open(page, "rb") as f:
            body = f.read()
        self.send_response(404)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        if self.command != "HEAD":
            self.wfile.write(body)


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    with http.server.ThreadingHTTPServer(("127.0.0.1", port), Handler) as server:
        print(f"Serving {ROOT} at http://127.0.0.1:{port}")
        server.serve_forever()
