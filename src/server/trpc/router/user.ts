import { router, protectedProcedure, publicProcedure } from "../trpc";

type StripeSubscriptionStatus = "active" | "trialing" | "past_due" | "unpaid";

export const activeStripeSubscribtionStatuses: StripeSubscriptionStatus[] = [
  "active",
  "trialing",
  "past_due",
  "unpaid",
];

export const userRouter = router({
  activeSubscriptions: protectedProcedure.query(async ({ ctx }) => {
    const { session, prisma } = ctx;

    if (!session.user?.id) {
      throw new Error("Not authenticated");
    }

    const data = await prisma.subscription.findMany({
      where: {
        userId: session?.user?.id,
        status: {
          in: activeStripeSubscribtionStatuses,
        },
      },
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
        status: {
          in: activeStripeSubscribtionStatuses,
        },
      },
    });

    if (!data || !data.status) return {};

    return {
      active: data.status === "active",
      status: data.status,
    };
  }),
});
