import { SigninForm } from '@/components/auth/signin-form'
import SEO from '@/components/frontend/SEO'

const SigninPage = () => {
  return (
    <>
      <SEO
        title="Đăng Nhập | MoxiMovie – Xem Phim Vietsub HD"
        description="Đăng nhập vào MoxiMovie để quản lý tài khoản, xem phim yêu thích, tiếp tục trải nghiệm xem phim Vietsub HD mượt mà."
        canonical="https://www.moximovie.click/signin"
        image="https://www.moximovie.click/og-signin.jpg"
        type="website"
      />
      <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10 absolute inset-0 z-0 bg-gradient-purple">
        <div className="w-full max-w-sm md:max-w-4xl">
          <SigninForm />
        </div>
      </div>
    </>

  )
}

export default SigninPage