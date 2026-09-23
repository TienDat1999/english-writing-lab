import { AccessMessage } from "@/components/access-message";

export default function SecurityRequiredPage() {
  return (
    <AccessMessage
      eyebrow="Security gate"
      title="Admin production chưa được phép mở"
      description="Cần xác nhận password policy, quy trình cấp/thu hồi tài khoản và secret production, sau đó mới bật ADMIN_IDENTITY_POLICY_CONFIRMED trên deployment Admin."
    />
  );
}
