import { router } from "../trpc";
import { stripeRouter } from "./stripe";
import { userRouter } from "./user";
import { productsRouter } from "./products";

export const appRouter = router({
  stripe: stripeRouter,
  user: userRouter,
  products: productsRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
