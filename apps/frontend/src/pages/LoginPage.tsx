import { OtpSignInCard } from "@features/auth/components/OtpSignInCard";

export function LoginPage() {
  return (
    <section className="grid min-h-screen place-items-center bg-[#f4f5f8] p-6">
      <OtpSignInCard />
    </section>
  );
}
