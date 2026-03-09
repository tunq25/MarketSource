"use client"

import { Footer } from "@/components/footer";
import { FloatingHeader } from "@/components/floating-header";

export default function PrivacyPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <FloatingHeader />
      <main className="flex-1 container mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Chính sách Quyền riêng tư</h1>
        <div className="space-y-8 max-w-3xl mx-auto">
          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">1. Thông tin chúng tôi thu thập</h2>
            <p className="text-gray-600 leading-relaxed">
              Chúng tôi thu thập thông tin bạn cung cấp khi sử dụng dịch vụ, bao gồm thông tin cá nhân như tên, email, và thông tin đăng nhập. Ngoài ra, chúng tôi có thể thu thập dữ liệu về cách bạn tương tác với dịch vụ của chúng tôi, như địa chỉ IP, loại trình duyệt, và các trang bạn truy cập.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">2. Cách chúng tôi sử dụng thông tin</h2>
            <p className="text-gray-600 leading-relaxed">
              Thông tin của bạn được sử dụng để cung cấp, duy trì và cải thiện dịch vụ của chúng tôi, bao gồm cá nhân hóa trải nghiệm, hỗ trợ khách hàng, và gửi thông báo liên quan đến dịch vụ. Chúng tôi không chia sẻ thông tin cá nhân của bạn với bên thứ ba trừ khi có sự đồng ý của bạn hoặc theo yêu cầu pháp lý.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">3. Bảo mật thông tin</h2>
            <p className="text-gray-600 leading-relaxed">
              Chúng tôi áp dụng các biện pháp bảo mật phù hợp để bảo vệ thông tin cá nhân của bạn khỏi truy cập trái phép, sử dụng sai mục đích hoặc tiết lộ. Tuy nhiên, không có phương pháp truyền tải hoặc lưu trữ nào là an toàn tuyệt đối.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">4. Quyền của bạn</h2>
            <p className="text-gray-600 leading-relaxed">
              Bạn có quyền truy cập, chỉnh sửa, hoặc xóa thông tin cá nhân của mình. Bạn cũng có thể yêu cầu hạn chế xử lý dữ liệu hoặc phản đối việc sử dụng dữ liệu của bạn cho một số mục đích nhất định. Liên hệ với chúng tôi để thực hiện các quyền này.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">5. Thay đổi Chính sách</h2>
            <p className="text-gray-600 leading-relaxed">
              Chúng tôi có thể cập nhật Chính sách Quyền riêng tư này theo thời gian. Các thay đổi sẽ được đăng trên trang web của chúng tôi, và việc bạn tiếp tục sử dụng dịch vụ đồng nghĩa với việc chấp nhận các thay đổi này.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">6. Liên hệ với chúng tôi</h2>
            <p className="text-gray-600 leading-relaxed">
              Nếu bạn có câu hỏi hoặc thắc mắc về Chính sách Quyền riêng tư này, vui lòng liên hệ qua email <a href="mailto:qtussnguyen0220@gmail.com" className="text-blue-600 hover:underline">qtussnguyen0220@gmail.com</a>.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}