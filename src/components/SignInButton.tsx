import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/router";

export const SignInButton = () => {
  const { status } = useSession();
  const { push } = useRouter();
  return (
    <button
      className="focus:shadow-outline my-5 inline-flex h-[44px] w-fit cursor-pointer items-center justify-center whitespace-nowrap rounded-md bg-[#333] px-5 py-3 text-sm text-white shadow-sm duration-150 hover:bg-black focus:outline-none disabled:cursor-not-allowed"
      onClick={() => {
        if (status === "unauthenticated") {
          signIn("github", { callbackUrl: "/dashboard" });
        } else if (status === "authenticated") {
          push("/dashboard");
        }
      }}
      disabled={status === "loading"}
    >
      {GitHubSvg}
      <span className="ml-2">Sign in with GitHub</span>
    </button>
  );
};

const GitHubSvg = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 32.58 31.77"
    height={22}
    width={22}
  >
    <g id="Layer_2" data-name="Layer 2">
      <g id="Layer_1-2" data-name="Layer 1">
        <path
          style={{
            fill: "#fff",
            fillRule: "evenodd",
          }}
          d="M16.29,0a16.29,16.29,0,0,0-5.15,31.75c.82.15,1.11-.36,1.11-.79s0-1.41,0-2.77C7.7,29.18,6.74,26,6.74,26a4.36,4.36,0,0,0-1.81-2.39c-1.47-1,.12-1,.12-1a3.43,3.43,0,0,1,2.49,1.68,3.48,3.48,0,0,0,4.74,1.36,3.46,3.46,0,0,1,1-2.18c-3.62-.41-7.42-1.81-7.42-8a6.3,6.3,0,0,1,1.67-4.37,5.94,5.94,0,0,1,.16-4.31s1.37-.44,4.48,1.67a15.41,15.41,0,0,1,8.16,0c3.11-2.11,4.47-1.67,4.47-1.67A5.91,5.91,0,0,1,25,11.07a6.3,6.3,0,0,1,1.67,4.37c0,6.26-3.81,7.63-7.44,8a3.85,3.85,0,0,1,1.11,3c0,2.18,0,3.94,0,4.47s.29.94,1.12.78A16.29,16.29,0,0,0,16.29,0Z"
        />
      </g>
    </g>
  </svg>
);
