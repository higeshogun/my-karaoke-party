import { log } from "next-axiom";
import { z } from "zod";
import { env } from "~/env";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const partyRouter = createTRPCRouter({
  create: publicProcedure
    .input(z.object({ name: z.string().min(3) }))
    .mutation(async ({ ctx, input }) => {
      log.info("Creating party", { name: input.name });

      const party = await ctx.db.party.createWithHash(input);

      const partyKitUrl = env.PARTYKIT_URL_INTERNAL ?? env.NEXT_PUBLIC_PARTYKIT_URL;
      const url = `${partyKitUrl}/party/${party.hash}`;
      log.info("Fetching PartyKit", { url });


      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        await ctx.db.party.delete({ where: { id: party.id } });

        log.error("Failed to create party", { response: res });
        throw new Error("Failed to create party");
      }

      log.info("Party created", { party });
      return party;
    }),

  getByHash: publicProcedure
    .input(z.object({ hash: z.string() }))
    .query(({ input, ctx }) => {
      const party = ctx.db.party.findUnique({ where: { hash: input.hash } });

      return party;
    }),
});
