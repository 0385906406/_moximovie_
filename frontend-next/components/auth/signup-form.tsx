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
const theme = process.env.NEXT_PUBLIC_ASSET_THEME || 'Default';

const signUpSchema = z.object({
    firstname: z.string().min(1, "Tên bắt buộc phải có"),
    lastname: z.string().min(1, "Họ bắt buộc phải có"),
    username: z.string().min(3, "Tên đăng nhập phải có ít nhất 3 ký tự"),
    email: z.email("Email không hợp lệ"),
    password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
});

type SignUpFormValues = z.infer<typeof signUpSchema>;

export function SignupForm({ className, ...props }: React.ComponentProps<"div">) {
    const { signUp } = useAuthStore();
    const router = useRouter();
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<SignUpFormValues>({
        resolver: zodResolver(signUpSchema),
    });

    const onSubmit = async (data: SignUpFormValues) => {
        const { firstname, lastname, username, email, password } = data;

        // gọi backend để signup
        await signUp(username, password, email, firstname, lastname);

        router.push("/signin");
    };

    // Tạo đường dẫn
    const logoPath = `/${theme}/icon.png`;


    return (
        <div
            className={cn("flex flex-col gap-6", className)}
            {...props}
        >
            <Card className="overflow-hidden p-0 border-border">
                <CardContent className="grid p-0 md:grid-cols-2">
                    <form
                        className="p-6 md:p-8"
                        onSubmit={handleSubmit(onSubmit)}
                    >
                        <div className="flex flex-col gap-6">
                            {/* header - logo */}
                            <div className="flex flex-col items-center text-center gap-2">
                                <Link href="/phimhay"
                                    className="mx-auto block w-fit text-center"
                                >
                                    <img
                                        src={logoPath}
                                        alt="logo"
                                        className="w-14"
                                    />
                                </Link>

                                <h1 className="text-2xl font-bold">Tạo tài khoản Moxi</h1>
                                <p className="text-muted-foreground text-balance">
                                    Chào mừng bạn! Hãy đăng ký để bắt đầu!
                                </p>
                            </div>

                            {/* họ & tên */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <Label
                                        htmlFor="lastname"
                                        className="block text-sm"
                                    >
                                        Họ
                                    </Label>
                                    <Input
                                        type="text"
                                        id="lastname"
                                        {...register("lastname")}
                                    />

                                    {errors.lastname && (
                                        <p className="text-destructive text-sm">
                                            {errors.lastname.message}
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label
                                        htmlFor="fistname"
                                        className="block text-sm"
                                    >
                                        Tên
                                    </Label>
                                    <Input
                                        type="text"
                                        id="firstname"
                                        {...register("firstname")}
                                    />
                                    {errors.firstname && (
                                        <p className="text-destructive text-sm">
                                            {errors.firstname.message}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* username */}
                            <div className="flex flex-col gap-3">
                                <Label
                                    htmlFor="username"
                                    className="block text-sm"
                                >
                                    Tên đăng nhập
                                </Label>
                                <Input
                                    type="text"
                                    id="username"
                                    placeholder="moxi"
                                    {...register("username")}
                                />
                                {errors.username && (
                                    <p className="text-destructive text-sm">
                                        {errors.username.message}
                                    </p>
                                )}
                            </div>

                            {/* email */}
                            <div className="flex flex-col gap-3">
                                <Label
                                    htmlFor="email"
                                    className="block text-sm"
                                >
                                    Email
                                </Label>
                                <Input
                                    type="email"
                                    id="email"
                                    placeholder="m@gmail.com"
                                    {...register("email")}
                                />
                                {errors.email && (
                                    <p className="text-destructive text-sm">{errors.email.message}</p>
                                )}
                            </div>

                            {/* password */}
                            <div className="flex flex-col gap-3">
                                <Label
                                    htmlFor="password"
                                    className="block text-sm"
                                >
                                    Mật khẩu
                                </Label>
                                <Input
                                    type="password"
                                    id="password"
                                    {...register("password")}
                                />
                                {errors.password && (
                                    <p className="text-destructive text-sm">
                                        {errors.password.message}
                                    </p>
                                )}
                            </div>

                            {/* nút đăng ký */}
                            <Button
                                type="submit"
                                className="w-full"
                                disabled={isSubmitting}
                            >
                                Tạo tài khoản
                            </Button>

                            {/* Divider */}
                            <div className="flex items-center gap-3">
                                <div className="h-px flex-1 bg-border" />
                                <span className="text-xs text-muted-foreground">hoặc</span>
                                <div className="h-px flex-1 bg-border" />
                            </div>

                            {/* Google */}
                            <div className="w-full">
                                <div className="flex justify-center" />
                                <button
                                    type="button"
                                    className="mt-1 w-full rounded-full border px-4 py-2 text-sm"
                                    aria-label="Đăng nhập với Google"
                                >
                                    <span className="inline-flex items-center gap-2">
                                        <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                                            <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.6 31.7 29.3 35 24 35c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 5.1 29.6 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21c10.5 0 19.5-7.6 21-18V20.5z" />
                                            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 16.6 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 5.1 29.6 3 24 3 16.3 3 9.6 7.3 6.3 14.7z" />
                                            <path fill="#4CAF50" d="M24 45c5.2 0 10-2 13.5-5.2L31.5 34C29.4 35.6 26.9 36.5 24 36.5c-5.3 0-9.7-3.3-11.3-8l-6.6 5C9.6 40.7 16.3 45 24 45z" />
                                            <path fill="#1976D2" d="M45 24c0-1.3-.1-2.6-.4-3.8H24v8h11.3c-.6 3.2-2.6 5.9-5.5 7.7l6 5C39 37.9 45 31.7 45 24z" />
                                        </svg>
                                        <span>Đăng ký bằng Google</span>
                                    </span>
                                </button>
                            </div>

                            <div className="text-center text-sm">
                                Đã có tài khoản?{" "}
                                <Link href="/signin"
                                    className="underline underline-offset-4"
                                >
                                    Đăng nhập
                                </Link>
                            </div>
                        </div>
                    </form>
                    <div className="bg-muted relative hidden md:block">
                        <img
                            src="/placeholderSignUp.png"
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
    );
}