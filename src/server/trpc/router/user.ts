import { router, protectedProcedure, publicProcedure } from "../trpc";

export const userRouter = router({
  products: publicProcedure.query(async ({ ctx }) => {
    const { session, prisma } = ctx;

    const data = await prisma.product.findMany({
      where: {
        active: true,
        prices: { some: {} },
      },
      include: {
        prices: {},
        subscriptions: session?.user?.id
          ? {
              where: {
                userId: session?.user?.id,
              },
            }
          : false,
      },
    });

    if (!data) {
      throw new Error("Could not find products");
    }

    data.forEach((product) => {
      product.subscribed = product.subscriptions?.length > 0;
    });

    return data;
  }),

  subscriptionStatus: protectedProcedure.query(async ({ ctx }) => {
    const { session, prisma } = ctx;

    if (!session.user?.id) {
      throw new Error("Not authenticated");
    }

    const data = await prisma.subscription.findFirst({
      where: {
        userId: session.user?.id,
        status: "active",
      },
    });

    if (!data || !data.status) return {};

    return {
      active: data.status === "active",
      status: data.status,
    };
  }),
});
