import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
  Link,
} from "@tanstack/react-router";
import type { ReactNode } from "react";
import { createServerFn } from "@tanstack/react-start";
import { readFile } from "node:fs/promises";
import appCss from "~/styles/app.css?url";

const getBusinessName = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const cfg = JSON.parse(await readFile("site.json", "utf8")) as {
      businessName?: string;
    };
    return cfg.businessName?.trim() ?? "ShowUp";
  } catch {
    return "ShowUp";
  }
});

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "ShowUp — Cleaner Reliability Platform" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  notFoundComponent: () => <div className="p-8 text-center text-gray-500">Page not found</div>,
  component: RootComponent,
});

function RootComponent() {
  return (
    <RootDocument>
      <div className="min-h-dvh bg-gray-50">
        <Nav />
        <main className="pb-20">
          <Outlet />
        </main>
        <MobileNav />
      </div>
    </RootDocument>
  );
}

function Nav() {
  return (
    <nav className="hidden md:flex items-center justify-between bg-white border-b px-6 py-3 sticky top-0 z-10">
      <div className="flex items-center gap-8">
        <Link to="/" className="text-xl font-bold text-indigo-600">
          ShowUp
        </Link>
        <div className="flex gap-4 text-sm font-medium">
          <Link to="/" className="text-gray-600 hover:text-indigo-600 [&.active]:text-indigo-600">
            Dashboard
          </Link>
          <Link
            to="/jobs"
            className="text-gray-600 hover:text-indigo-600 [&.active]:text-indigo-600"
          >
            Jobs
          </Link>
          <Link
            to="/cleaners"
            className="text-gray-600 hover:text-indigo-600 [&.active]:text-indigo-600"
          >
            Cleaners
          </Link>
          <Link
            to="/points"
            className="text-gray-600 hover:text-indigo-600 [&.active]:text-indigo-600"
          >
            Points
          </Link>
          <Link
            to="/settings"
            className="text-gray-600 hover:text-indigo-600 [&.active]:text-indigo-600"
          >
            Settings
          </Link>
        </div>
      </div>
    </nav>
  );
}

function MobileNav() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around py-3 z-10">
      <Link to="/" className="flex flex-col items-center text-xs text-gray-500 [&.active]:text-indigo-600">
        <span className="text-lg">📊</span>
        <span>Dashboard</span>
      </Link>
      <Link to="/jobs" className="flex flex-col items-center text-xs text-gray-500 [&.active]:text-indigo-600">
        <span className="text-lg">📋</span>
        <span>Jobs</span>
      </Link>
      <Link to="/cleaners" className="flex flex-col items-center text-xs text-gray-500 [&.active]:text-indigo-600">
        <span className="text-lg">👥</span>
        <span>Cleaners</span>
      </Link>
      <Link to="/points" className="flex flex-col items-center text-xs text-gray-500 [&.active]:text-indigo-600">
        <span className="text-lg">⭐</span>
        <span>Points</span>
      </Link>
      <Link to="/settings" className="flex flex-col items-center text-xs text-gray-500 [&.active]:text-indigo-600">
        <span className="text-lg">⚙️</span>
        <span>Settings</span>
      </Link>
    </nav>
  );
}

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
