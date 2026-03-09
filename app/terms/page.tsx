"use client"

import { Footer } from "@/components/footer";
import { FloatingHeader } from "@/components/floating-header";

export default function TermsPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <FloatingHeader />
      <main className="flex-1 container mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Điều khoản Dịch vụ</h1>
        <div className="space-y-8 max-w-3xl mx-auto">
          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">1. Chấp nhận Điều khoản</h2>
            <p className="text-gray-600 leading-relaxed">
              Bằng cách truy cập hoặc sử dụng dịch vụ của chúng tôi, bạn đồng ý tuân thủ các Điều khoản Dịch vụ này ("Điều khoản"). Nếu bạn không đồng ý với bất kỳ phần nào của Điều khoản, bạn không được sử dụng dịch vụ của chúng tôi.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">2. Sử dụng Dịch vụ</h2>
            <p className="text-gray-600 leading-relaxed">
              Bạn đồng ý sử dụng dịch vụ của chúng tôi chỉ cho các mục đích hợp pháp và phù hợp với các Điều khoản này. Bạn chịu trách nhiệm đối với mọi hoạt động được thực hiện dưới tài khoản của mình.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">3. Quyền Sở hữu Trí tuệ</h2>
            <p className="text-gray-600 leading-relaxed">
              Tất cả nội dung, thương hiệu và các tài sản trí tuệ khác trên nền tảng của chúng tôi đều thuộc sở hữu hoặc được cấp phép cho chúng tôi. Bạn không được sao chép, phân phối hoặc tạo ra các tác phẩm phái sinh mà không có sự cho phép rõ ràng từ chúng tôi.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">4. Giới hạn Trách nhiệm</h2>
            <p className="text-gray-600 leading-relaxed">
              Dịch vụ của chúng tôi được cung cấp "nguyên trạng" mà không có bất kỳ bảo đảm nào. Chúng tôi không chịu trách nhiệm cho bất kỳ thiệt hại nào phát sinh từ việc sử dụng hoặc không thể sử dụng dịch vụ của chúng tôi.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">5. Thay đổi Điều khoản</h2>
            <p className="text-gray-600 leading-relaxed">
              Chúng tôi có quyền sửa đổi các Điều khoản này bất kỳ lúc nào. Các thay đổi sẽ có hiệu lực ngay khi được đăng trên trang web của chúng tôi. Việc bạn tiếp tục sử dụng dịch vụ đồng nghĩa với việc chấp nhận các Điều khoản đã cập nhật.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">6. Liên hệ với Chúng tôi</h2>
            <p className="text-gray-600 leading-relaxed">
              Nếu bạn có bất kỳ câu hỏi nào về các Điều khoản này, vui lòng liên hệ với chúng tôi qua email <a href="mailto:support@example.com" className="text-blue-600 hover:underline">support@example.com</a>.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}