# 로컬 미리보기 서버(npm run serve, 화면 테스트). python3 -m http.server 와 같지만 Cache-Control: no-cache 를 보내,
# 파일을 고친 뒤 새로 고치면 브라우저가 늘 서버에 다시 묻는다(바뀌지 않았으면 304 로 캐시를 쓴다).
import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


class NoCacheHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache')
        super().end_headers()


if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 4173
    root = Path(__file__).resolve().parent.parent
    server = ThreadingHTTPServer(('127.0.0.1', port), partial(NoCacheHandler, directory=str(root)))
    print(f'Serving {root} at http://127.0.0.1:{port}/', flush=True)
    server.serve_forever()
