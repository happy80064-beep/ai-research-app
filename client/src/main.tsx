import { trpc } from "@/lib/trpc";
import { UNAUTHED_ERR_MSG } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import { getLoginUrl } from "./const";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;

  const isUnauthorized = error.message === UNAUTHED_ERR_MSG;

  if (!isUnauthorized) return;

  window.location.href = getLoginUrl();
};

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Query Error]", error);
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Mutation Error]", error);
  }
});

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: `${window.location.origin}/api/trpc`,
      transformer: superjson,
      fetch(input, init) {
        const language = localStorage.getItem("language") || "zh";
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include",
          headers: {
            ...(init?.headers || {}),
            "Accept-Language": language,
          },
        });
      },
    }),
  ],
});

// 健壮的应用渲染，处理浏览器扩展干扰
function renderApp() {
  const rootElement = document.getElementById("root");

  if (!rootElement) {
    console.error("Root element not found");
    return;
  }

  // 清除可能由浏览器扩展插入的内容
  while (rootElement.firstChild) {
    rootElement.removeChild(rootElement.firstChild);
  }

  // 创建新的 root
  const root = createRoot(rootElement);

  root.render(
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </trpc.Provider>
  );
}

// 等待 DOM 完全加载
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", renderApp);
} else {
  renderApp();
}

// 处理浏览器扩展导致的错误
window.addEventListener("error", (event) => {
  // 忽略浏览器扩展引起的错误
  if (event.filename?.includes("chrome-extension") ||
      event.filename?.includes("moz-extension") ||
      event.message?.includes("insertBefore")) {
    console.warn("Browser extension error suppressed:", event.message);
    event.preventDefault();
  }
});

// 处理未处理的 Promise 拒绝
window.addEventListener("unhandledrejection", (event) => {
  // 忽略浏览器扩展引起的错误
  if (event.reason?.message?.includes("insertBefore") ||
      event.reason?.stack?.includes("chrome-extension")) {
    console.warn("Browser extension promise rejection suppressed:", event.reason);
    event.preventDefault();
  }
});
