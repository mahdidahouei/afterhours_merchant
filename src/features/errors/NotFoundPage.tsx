import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/ui/Button";
import Logo from "@/assets/brand/logo-mark.svg?react";

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-color-secondary px-6 py-8 tb:px-12">
      {/* Warm radial glow anchored bottom-right, for depth. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-1/3 -right-1/4 h-[70vh] w-[70vh] rounded-full opacity-40 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(50,27,21,0.25) 0%, rgba(50,27,21,0) 70%)",
        }}
      />

      <header className="relative z-10">
        <Link to="/" aria-label="Afterhours home">
          <Logo />
        </Link>
      </header>

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center gap-6 text-center">
        <p className="font-lora text-[120px] font-bold leading-none text-color-primary tb:text-[180px]">
          404
        </p>

        <div className="flex flex-col gap-3">
          <h1 className="font-lora text-2xl font-bold text-color-primary tb:text-[32px]">
            Page not found
          </h1>
          <p className="max-w-[420px] text-base font-medium text-color-secondary-text">
            The page you're trying to reach isn't available. Let's get you back on track.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => navigate("/")}
          className="mt-2 w-[220px]"
        >
          Back to home
        </Button>
      </main>
    </div>
  );
}
