import { router, protectedProcedure, publicProcedure } from "../trpc";

export const productsRouter = router({
  all: publicProcedure.query(async ({ ctx }) => {
    const { prisma } = ctx;

    const data = await prisma.product.findMany({
      where: {
        active: true,
        prices: { some: {} },
      },
      include: {
        prices: {},
      },
    });

    if (!data) {
      throw new Error("Could not find products");
    }

    return data;
  }),
});
