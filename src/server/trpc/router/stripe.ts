import { env } from "../../../env/server.mjs";
import { getOrCreateStripeCustomerIdForUser } from "../../stripe/stripe-webhook-handlers";
import { router, protectedProcedure, publicProcedure } from "../trpc";
import { z } from "zod";

export const stripeRouter = router({
  products: publicProcedure.query(async ({ ctx }) => {
    const { prisma } = ctx;

    const data = await prisma.product.findMany({
      where: {
        active: true,
        prices: { some: {} },
      },
      include: {
        prices: {
          where: {
            active: true,
          },
        },
      },
    });

    if (!data) {
      throw new Error("Could not find products");
    }

    return data;
  }),

  createCheckoutSession: protectedProcedure
    .input(
      z.object({
        priceId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { stripe, session, prisma, req } = ctx;

      const customerId = await getOrCreateStripeCustomerIdForUser({
        prisma,
        stripe,
        userId: session.user?.id,
      });

      if (!customerId) {
        throw new Error("Could not create customer");
      }

      const price = await prisma.price.findUnique({
        where: { id: input?.priceId },
      });

      if (!price) {
        throw new Error("Could not find price");
      }

      const baseUrl =
        env.NODE_ENV === "development"
          ? `http://${req.headers.host}`
          : `https://${req.headers.host}`;

      const checkoutSession = await stripe.checkout.sessions.create({
        customer: customerId,
        client_reference_id: session.user?.id,
        payment_method_types: ["card"],
        mode: "subscription",
        line_items: [
          {
            price: price.id,
            quantity: 1,
          },
        ],
        success_url: `${baseUrl}/dashboard?checkoutSuccess=true`,
        cancel_url: `${baseUrl}/dashboard?checkoutCanceled=true`,
        subscription_data: {
          metadata: {
            userId: session.user?.id,
          },
        },
      });

      if (!checkoutSession) {
        throw new Error("Could not create checkout session");
      }

      return { checkoutUrl: checkoutSession.url };
    }),
  createBillingPortalSession: protectedProcedure.mutation(async ({ ctx }) => {
    const { stripe, session, prisma, req } = ctx;

    const customerId = await getOrCreateStripeCustomerIdForUser({
      prisma,
      stripe,
      userId: session.user?.id,
    });

    if (!customerId) {
      throw new Error("Could not create customer");
    }

    const baseUrl =
      env.NODE_ENV === "development"
        ? `http://${req.headers.host}`
        : `https://${req.headers.host}`;

    const stripeBillingPortalSession =
      await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${baseUrl}/dashboard`,
      });

    if (!stripeBillingPortalSession) {
      throw new Error("Could not create billing portal session");
    }

    return { billingPortalUrl: stripeBillingPortalSession.url };
  }),
});
