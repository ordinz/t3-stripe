import { SignInButton } from "./SignInButton";
import { useSession } from "next-auth/react";
import Img from "next/image";
import { trpc } from "../../utils/trpc";
import { useRouter } from "next/router";


export const Products = () => {
  const { data: products, isLoading } = trpc.user.products.useQuery();

  const Price = ({ price }: { price: number | undefined }): JSX.Element => {
    const n = Number(price) / 100;
    return <>${n}</>;
  };

  return (
    <div>
      <p className="text-2xl text-gray-700">Products:</p>
      <div className="mt-3 flex items-center justify-center gap-4">
        {products?.map((product) => (
          <div
            key={product.id}
            className="max-w-xs overflow-hidden rounded-lg bg-white shadow-lg dark:bg-gray-800"
          >
            <div className="px-4 py-2">
              <h1 className="text-xl font-bold uppercase text-gray-800 dark:text-white">
                {product.name}
              </h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                {product.description}
              </p>
            </div>
            <div className="space-y-8 md:flex md:items-center md:space-y-0 md:space-x-8">
              <div className="flex h-48 w-full items-center justify-center rounded bg-gray-300  sm:w-96">
                <svg
                  className="h-12 w-12 text-gray-200"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                  fill="currentColor"
                  viewBox="0 0 640 512"
                >
                  <path d="M480 80C480 35.82 515.8 0 560 0C604.2 0 640 35.82 640 80C640 124.2 604.2 160 560 160C515.8 160 480 124.2 480 80zM0 456.1C0 445.6 2.964 435.3 8.551 426.4L225.3 81.01C231.9 70.42 243.5 64 256 64C268.5 64 280.1 70.42 286.8 81.01L412.7 281.7L460.9 202.7C464.1 196.1 472.2 192 480 192C487.8 192 495 196.1 499.1 202.7L631.1 419.1C636.9 428.6 640 439.7 640 450.9C640 484.6 612.6 512 578.9 512H55.91C25.03 512 .0006 486.1 .0006 456.1L0 456.1z" />
                </svg>
              </div>
            </div>

            <div className="flex items-center justify-between bg-gray-900 px-4 py-2">
              <h1 className="text-lg font-bold text-white">
                {!isLoading && <Price price={product.prices[0]?.unitAmount} />}
              </h1>
              {!isLoading && product.subscriptions?.length > 0 && (
                <ManageBillingButton />
              )}

              <UpgradeOrSignInButton
                isLoading={isLoading}
                isSubscribed={product.subscriptions?.length > 0}
                product={product}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

interface UpgradeOrSignInButtonProps {
  isLoading: boolean;
  isSubscribed: boolean;
  product: {
    prices: {
      id: string;
      unitAmount: string;
    }[];
  };
}

export const UpgradeOrSignInButton = ({
  isLoading,
  isSubscribed,
  product,
}: UpgradeOrSignInButtonProps) => {
  const { status } = useSession();

  if (isLoading) return null;
  if (status === "unauthenticated") {
    return <SignInButton />;
  }

  if (!isLoading && !isSubscribed)
    return <UpgradeButton priceId={product.prices[0]?.id} />;
};

const ManageBillingButton = () => {
  const { mutateAsync: createBillingPortalSession } =
    trpc.stripe.createBillingPortalSession.useMutation();
  const { push } = useRouter();
  return (
    <button
      className="transform rounded bg-white px-2 py-1 text-xs font-semibold uppercase text-gray-900 transition-colors duration-300 hover:bg-gray-200 focus:bg-gray-400 focus:outline-none"
      onClick={async () => {
        const { billingPortalUrl } = await createBillingPortalSession();
        if (billingPortalUrl) {
          push(billingPortalUrl);
        }
      }}
    >
      Manage subscription and billing
    </button>
  );
};

interface UpgradeButtonProps {
  priceId: string;
}

export const UpgradeButton = ({ priceId }: UpgradeButtonProps) => {
  const { mutateAsync: createCheckoutSession } =
    trpc.stripe.createCheckoutSession.useMutation();
  const { push } = useRouter();
  return (
    <button
      className="w-fit cursor-pointer rounded-md bg-blue-500 px-5 py-2 text-lg font-semibold text-white shadow-sm duration-150 hover:bg-blue-600"
      onClick={async () => {
        const { checkoutUrl } = await createCheckoutSession({
          priceId: priceId,
        });
        if (checkoutUrl) {
          push(checkoutUrl);
        }
      }}
    >
      Upgrade account
    </button>
  );
};
