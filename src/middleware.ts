import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const host = request.headers.get("host") || "";
  const { pathname } = request.nextUrl;

  // 1. Subdomínio de membros (membros.igrejadoalto.com ou membros.localhost)
  if (host.startsWith("membros.")) {
    if (pathname === "/") {
      return NextResponse.rewrite(new URL("/membros", request.url));
    }
  }

  // 2. Subdomínio de bem-vindo (bemvindo.igrejadoalto.com ou bemvindo.localhost)
  // Também mantém compatibilidade caso acessem bemvindos.
  if (host.startsWith("bemvindo.") || host.startsWith("bemvindos.")) {
    if (pathname === "/") {
      return NextResponse.rewrite(new URL("/bem-vindo", request.url));
    }
    if (pathname.startsWith("/bem-vindos")) {
      const target = pathname.replace(/^\/bem-vindos/, "/bem-vindo");
      return NextResponse.rewrite(new URL(target, request.url));
    }
    if (!pathname.startsWith("/bem-vindo")) {
      return NextResponse.rewrite(new URL(`/bem-vindo${pathname}`, request.url));
    }
  }

  // 3. Redirecionamento amigável de /bem-vindos para /bem-vindo na navegação direta
  if (pathname.startsWith("/bem-vindos")) {
    const target = pathname.replace(/^\/bem-vindos/, "/bem-vindo");
    return NextResponse.rewrite(new URL(target, request.url));
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
