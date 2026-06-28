"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Label } from "../ui/label";
import { useAuthStore } from "@/stores/useAuthStore";
import { useRouter } from "next/navigation";
import Link from "next/link";
// import { GoogleLogin } from "@react-oauth/google";
// import { jwtDecode } from "jwt-decode";
// Lấy giá trị biến môi trường (ví dụ trong Node.js/React)
const theme = process.env.NEXT_PUBLIC_ASSET_THEME || 'Default';

const signInSchema = z.object({
    username: z.string().min(3, "Tên đăng nhập phải có ít nhất 3 ký tự"),
    password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
});

type SignInFormValues = z.infer<typeof signInSchema>;

export function SigninForm({
    className,
    ...props
}: React.ComponentProps<"div">) {
    const { signIn } = useAuthStore();
    const router = useRouter();
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<SignInFormValues>({
        resolver: zodResolver(signInSchema)
    });

    const onSubmit = async (data: SignInFormValues) => {
        const { username, password } = data;
        // gọi backend để signup
        await signIn(username, password);
        router.push("/");
    }

    // Tạo đường dẫn
    const logoPath = `/${theme}/icon.png`;

    return (
        <div className={cn("flex flex-col gap-6", className)} {...props}>
            <Card className="overflow-hidden p-0 border-border">
                <CardContent className="grid p-0 md:grid-cols-2">
                    <form className="p-6 md:p-8" onSubmit={handleSubmit(onSubmit)}>
                        <div className="flex flex-col gap-6">
                            {/* header - logo */}
                            <div className="flex flex-col items-center text-center gap-2">
                                <Link href="/phimhay"
                                    className="mx-auto block w-fit text-center">
                                    <img
                                        src={logoPath}
                                        alt="logo"
                                        className="w-14"
                                    />
                                </Link>

                                <h1 className="text-2xl font-old">Chào mừng quay lại</h1>
                                <p className="text-muted-foreground text-balance">
                                    Đăng nhập vào tài khoản Moxi của bạn !
                                </p>
                            </div>

                            {/* username */}
                            <div className="flex flex-col gap-3">
                                <div className="space-y-2">
                                    <Label htmlFor="username" className="block text-sm">
                                        Tên đăng nhập
                                    </Label>
                                    <Input
                                        type="text"
                                        id="username"
                                        placeholder="moximovie"
                                        {...register("username")}
                                    />

                                    {errors.username && (
                                        <p className="text-destructive text-sm">
                                            {errors.username.message}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* password */}
                            <div className="flex flex-col gap-3">
                                <div className="space-y-2">
                                    <Label htmlFor="password" className="block text-sm">
                                        Password
                                    </Label>
                                    <Input
                                        type="password"
                                        id="password"
                                        placeholder="moximovie"
                                        {...register("password")}
                                    />

                                    {errors.password && (
                                        <p className="text-destructive text-sm">
                                            {errors.password.message}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* nút đăng nhập */}
                            <Button
                                type="submit"
                                className="w-full"
                                disabled={isSubmitting}
                            >
                                Đăng nhập
                            </Button>

                            {/* Divider */}
                            {/* <div className="flex items-center gap-3">
                                <div className="h-px flex-1 bg-border" />
                                <span className="text-xs text-muted-foreground">hoặc</span>
                                <div className="h-px flex-1 bg-border" />
                            </div> */}

                            {/* Google */}
                            {/* <div className="w-full">
                                <div className="flex justify-center rounded-[5.28px]" />
                                <GoogleLogin
                                    onSuccess={credentialResponse => {
                                        console.log(credentialResponse);
                                        // console.log(jwtDecode(credentialResponse?.credential));
                                    }}
                                    onError={() => {
                                        console.log('Login Failed');
                                    }}
                                />
                            </div> */}

                            <div className="text-center text-sm">
                                Chưa có tài khoản?{" "}
                                <Link href="/signup"
                                    className="underline underline-offset-4"
                                >
                                    Đăng ký
                                </Link>
                            </div>
                        </div>
                    </form>
                    <div className="bg-muted relative hidden md:block">
                        <img
                            src="/placeholder.png"
                            alt="Image"
                            className="absolute top-1/2 -translate-y-1/2 object-cover"
                        />
                    </div>
                </CardContent>
            </Card>
            <div className=" text-xs text-balance px-6 text-center *:[a]:hover:text-primary text-muted-foreground *:[a]:underline *:[a]:underline-offset-4">
                Bằng cách tiếp tục, bạn đồng ý với <Link href="#">Điều khoản dịch vụ</Link> và{" "}
                <Link href="#">Chính sách bảo mật</Link> của chúng tôi.
            </div>
        </div>
    )
}