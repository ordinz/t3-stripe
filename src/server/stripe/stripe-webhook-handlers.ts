import type { PrismaClient } from "@prisma/client";
import type Stripe from "stripe";

// retrieves a Stripe customer id for a given user if it exists or creates a new one
export const getOrCreateStripeCustomerIdForUser = async ({
  stripe,
  prisma,
  userId,
}: {
  stripe: Stripe;
  prisma: PrismaClient;
  userId: string;
}) => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user) throw new Error("User not found");

  if (user.stripeCustomerId) {
    return user.stripeCustomerId;
  }

  // create a new customer
  const customer = await stripe.customers.create({
    email: user.email ?? undefined,
    name: user.name ?? undefined,
    // use metadata to link this Stripe customer to internal user id
    metadata: {
      userId,
    },
  });

  // update with new customer id
  const updatedUser = await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      stripeCustomerId: customer.id,
    },
  });

  if (updatedUser.stripeCustomerId) {
    return updatedUser.stripeCustomerId;
  }
};

export const handleInvoicePaid = async ({
  event,
  stripe,
  prisma,
}: {
  event: Stripe.Event;
  stripe: Stripe;
  prisma: PrismaClient;
}) => {
  const invoice = event.data.object as Stripe.Invoice;
  const subscriptionId = invoice.subscription;
  const subscription = await stripe.subscriptions.retrieve(
    subscriptionId as string
  );
  const userId = subscription.metadata.userId;

  // update user with subscription data
  await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      stripeSubscriptionId: subscription.id,
      stripeSubscriptionStatus: subscription.status,
    },
  });
};

export const handlePriceDeleted = async ({
  event,
  prisma,
}: {
  event: Stripe.Event;
  prisma: PrismaClient;
}) => {
  const price = event.data.object as Stripe.Price;
  try {
    await prisma.price.delete({
      where: {
        id: price.id,
      },
    });
  } catch (error) {
    console.log("👉 price.delete error", error);
  }
};

export const handleProductDeleted = async ({
  event,
  prisma,
}: {
  event: Stripe.Event;
  prisma: PrismaClient;
}) => {
  const product = event.data.object as Stripe.Product;
  // delete a product in your database
  try {
    await prisma.product.delete({
      where: {
        id: product.id,
      },
    });
  } catch (error) {
    console.log("👉 product.delete error", error);
  }
};

export const handleProductCreatedOrUpdated = async ({
  event,
  prisma,
}: {
  event: Stripe.Event;
  prisma: PrismaClient;
}) => {
  const product = event.data.object as Stripe.Product;

  const productAttributes = {
    name: product.name,
    description: product.description ? product.description : "",
    active: product.active,
    image: product.images[0] ? product.images[0] : "",
    metadata: product.metadata,
  };

  // create or update a product in your database
  try {
    await prisma.product.upsert({
      where: {
        id: product.id,
      },
      create: {
        id: product.id,
        ...productAttributes,
      },
      update: productAttributes,
    });
  } catch (error) {
    console.log("👉 product.upsert error", error);
  }
};

export const handlePriceCreatedOrUpdated = async ({
  event,
  prisma,
}: {
  event: Stripe.Event;
  prisma: PrismaClient;
}) => {
  const price = event.data.object as Stripe.Price;

  const product = await prisma.product.findUnique({
    where: {
      id: String(price.product),
    },
  });

  if (!product) {
    console.log("👉 Product not found", price.product);
    return;
  }

  // create or update a price in your database
  try {
    await prisma.price.upsert({
      where: {
        id: price.id,
      },
      create: {
        id: price.id,
        active: price.active,
        currency: price.currency,
        interval: price.recurring?.interval || "",
        intervalCount: price.recurring?.interval_count || 0,
        trialPeriodDays: price.recurring?.trial_period_days || 0,
        metadata: price.metadata,
        nickname: price.nickname,
        productId: product.id,
        unitAmount: price.unit_amount || 0,
        type: price.type,
      },
      update: {
        active: price.active,
        currency: price.currency,
        interval: price.recurring?.interval,
        intervalCount: price.recurring?.interval_count,
        trialPeriodDays: price.recurring?.trial_period_days || 0,
        metadata: price.metadata,
        nickname: price.nickname,
        productId: product.id,
        unitAmount: price.unit_amount || 0,
        type: price.type,
      },
    });
  } catch (error) {
    console.log("👉 price.upsert error", error);
  }
};

export const handleSubscriptionCreatedOrUpdated = async ({
  event,
  prisma,
}: {
  event: Stripe.Event;
  prisma: PrismaClient;
}) => {
  const subscription = event.data.object as Stripe.Subscription;
  const userId = subscription.metadata.userId;
  const price = subscription.items.data[0]?.price;

  if (!price) {
    console.log("👉 Price not found", subscription.items.data[0]);
    return;
  }

  const productId = price?.product;
  if (!productId) {
    console.log("👉 Product not found", price);
    return;
  }

  try {
    await prisma.subscription.upsert({
      where: {
        id: subscription.id,
      },
      create: {
        id: String(subscription.id),
        userId: String(userId),
        status: subscription.status,
        productId: String(productId),
        metadata: subscription.metadata,
        priceId: price?.id,
      },
      update: {
        status: subscription.status,
        productId: String(productId),
        metadata: subscription.metadata,
        priceId: price?.id,
      },
    });
  } catch (error) {
    console.log("👉 subscription.upsert error", error);
  }

  // update user with subscription data
  await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      stripeSubscriptionId: subscription.id,
      stripeSubscriptionStatus: subscription.status,
    },
  });
};

export const handleSubscriptionCanceled = async ({
  event,
  prisma,
}: {
  event: Stripe.Event;
  prisma: PrismaClient;
}) => {
  const subscription = event.data.object as Stripe.Subscription;
  const userId = subscription.metadata.userId;

  // remove subscription data from user
  await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      stripeSubscriptionId: null,
      stripeSubscriptionStatus: null,
    },
  });
};
