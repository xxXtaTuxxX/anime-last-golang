import { LoginForm } from "@/features/auth/components/login-form";

export default function LoginPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen py-12">
            <div className="mx-auto grid w-[350px] gap-6">
                <div className="grid gap-2 text-center">
                    <h1 className="text-3xl font-bold">Login</h1>
                    <p className="text-balance text-muted-foreground">
                        Enter your email below to login to your account
                    </p>
                </div>
                <LoginForm />
            </div>
        </div>
    );
}
