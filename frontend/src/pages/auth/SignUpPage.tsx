import { SignupForm } from '@/components/auth/signup-form'
import SEO from '@/components/frontend/SEO'

const SignUpPage = () => {
  return (
    <>
      <SEO
        title="Đăng Ký | MoxiMovie – Tạo Tài Khoản Xem Phim Vietsub HD"
        description="Đăng ký tài khoản mới tại MoxiMovie để quản lý danh sách phim yêu thích, xem phim Vietsub HD mượt mà và cập nhật liên tục hàng ngày."
        canonical="https://www.moximovie.click/signup"
        image="https://www.moximovie.click/og-signup.jpg"
        type="website"
      />
      <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10 absolute inset-0 z-0 bg-gradient-purple">
        <div className="w-full max-w-sm md:max-w-4xl">
          <SignupForm />
        </div>
      </div>
    </>

  )
}

export default SignUpPage