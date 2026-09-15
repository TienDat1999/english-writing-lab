import { redirect } from "next/navigation";

import { auth, signIn } from "@/auth";
import { AppBrand } from "@/components/app-brand";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default async function LoginPage() {
  const session = await auth();

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <main className="relative grid min-h-screen overflow-hidden bg-background lg:grid-cols-[1.05fr_0.95fr]">
      <section className="prep-hero prep-grid relative hidden overflow-hidden p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <AppBrand inverted />
        <div className="relative z-10 max-w-xl pb-10">
          <Badge className="mb-6 border-white/20 bg-white/10 text-white" variant="outline">IELTS Writing · Personalised</Badge>
          <h1 className="font-heading text-6xl font-extrabold leading-[1.02]">Mỗi lỗi sai hôm nay là một kỹ năng mới ngày mai.</h1>
          <p className="mt-6 text-lg leading-8 text-blue-100">Chấm bài, hiểu lỗi và ôn lại đúng mẫu câu của chính bạn trên một lộ trình duy nhất.</p>
        </div>
        <div className="absolute -bottom-32 -right-24 size-[30rem] rounded-full border-[90px] border-white/8" />
      </section>
      <section className="relative grid place-items-center px-5 py-12 sm:px-10">
      <Card className="relative z-10 w-full max-w-xl border-blue-100 bg-card shadow-[0_28px_70px_rgb(35_87_170/14%)]">
        <CardHeader className="space-y-7 px-7 pt-8 sm:px-10 sm:pt-10">
          <div className="flex items-center justify-between">
            <AppBrand />
            <Badge className="bg-blue-50 text-primary">Private beta</Badge>
          </div>
          <Separator />
          <div className="space-y-4">
            <Badge className="border-primary/20 bg-secondary text-primary" variant="outline">
              Your personal writing memory
            </Badge>
            <CardTitle className="max-w-[13ch] font-heading text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
              Tiếp tục lộ trình Writing của bạn.
            </CardTitle>
            <CardDescription className="text-base leading-7">
              Keep essays, recurring mistakes, reviews, and progress private to
              your account.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 px-7 pb-8 sm:px-10 sm:pb-10">
          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: "/dashboard" });
            }}
          >
            <Button className="h-14 w-full rounded-full text-base font-bold" size="lg" type="submit">
              <span className="grid size-7 place-items-center rounded-full bg-white font-heading font-black text-primary">
                G
              </span>
              Continue with Google
            </Button>
          </form>
          <p className="text-center text-xs leading-5 text-muted-foreground">
            We request only your basic Google profile. Essays are never visible
            to other learners.
          </p>
        </CardContent>
      </Card>
      </section>
    </main>
  );
}
