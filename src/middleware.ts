import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const host = request.headers.get("host") || "";
  const { pathname } = request.nextUrl;

  // Se o host for do subdomínio de membros (membros.igrejadoalto.com ou membros.localhost)
  if (host.startsWith("membros.")) {
    // Se estiver na raiz do subdomínio de membros, reescreve internamente para /membros
    if (pathname === "/") {
      return NextResponse.rewrite(new URL("/membros", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Aplica o middleware em todas as rotas exceto arquivos estáticos e rotas de API
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
