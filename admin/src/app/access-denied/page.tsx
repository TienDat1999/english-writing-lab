import { AccessMessage } from "@/components/access-message";

export default function AccessDeniedPage() {
  return (
    <AccessMessage
      eyebrow="403 · Không có quyền"
      title="Tài khoản này chưa được cấp quyền Admin"
      description="Bạn đã đăng nhập thành công, nhưng tài khoản hiện không có role nhân sự phù hợp cho khu vực này. Liên hệ Admin hệ thống nếu đây là nhầm lẫn."
    />
  );
}
