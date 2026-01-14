import "server-only";

import { headers } from "next/headers";
import { cache } from "react";

import { createCaller } from "~/server/api/root";
import { createTRPCContext } from "~/server/api/trpc";

/**
 * This wraps the `createTRPCContext` helper and provides the required context for the tRPC API when
 * handling a tRPC call from a React Server Component.
 */
const createContext = cache(async () => {
  const heads = new Headers(await headers());
  heads.set("x-trpc-source", "rsc");

  return createTRPCContext({
    headers: heads,
  });
});

const getServerCaller = cache(async () => {
  const ctx = await createContext();
  return createCaller(ctx);
});

export const api = new Proxy({} as ReturnType<typeof createCaller>, {
  get: (_target, prop) => {
    return new Proxy({}, {
      get: (_target2, methodProp) => {
        return async (...args: unknown[]) => {
          const caller = await getServerCaller();
          // @ts-expect-error - Dynamic proxy access
          return caller[prop][methodProp](...args);
        };
      },
    });
  },
});
