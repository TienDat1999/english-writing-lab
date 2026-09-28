# Universal Learning Flow Rules (Quy Tắc Nghiệp Vụ Xuyên Suốt Hệ Thống Học & Ôn Tập)

> **Mục tiêu cốt lõi:** Đảm bảo trải nghiệm học tập chuẩn phương pháp phản xạ ngắt quãng (Spaced Retrieval), tuyệt đối tránh thói quen đoán mò hoặc làm qua loa. Người học PHẢI nắm vững và trả lời đúng 100% tất cả các câu của bước hiện tại trước khi được phép mở khóa bước tiếp theo.

---

## 1. Không Có Cơ Chế Làm Lại Tại Chỗ (No In-Place Redo/Retry)
Khi người học thực hiện bất kỳ bài tập nào trong toàn bộ dự án (Quiz trắc nghiệm, Flashcard, Dịch câu tự luận, Viết theo Template B2, Luyện 3 Bước - Collocation / Topic Vocabulary / Paraphrase):

- **Không cho phép sửa lại ngay tại chỗ:**
  - Khi người học đã submit câu trả lời và nhận được kết quả/feedback (dù đúng hay sai, sai chính tả, lỗi ngữ pháp, chọn sai phương án, điểm số < 70):
  - Tuyệt đối **KHÔNG** hiển thị nút "Sửa lại", "Thử lại", "Viết lại" hay cho phép click chọn lại phương án khác tại lúc đó.
  - Sau khi submit, các nút chọn / ô nhập liệu bị khóa (`disabled`).

- **Chỉ có một hành động duy nhất là xem feedback và bước tiếp:**
  - Người học đọc giải thích, đối chiếu câu chuẩn và các điểm cần sửa.
  - Nút bấm duy nhất khả dụng là **"Tiếp tục" / "Câu tiếp theo"** (hỗ trợ phím tắt `Enter` hoặc `Cmd+Enter`).

---

## 2. Quy Tắc Chuyển Bước Trong Luồng Học 3 Bước (3-Step Learning Flow Rule)
Áp dụng cho tất cả các tính năng học 3 bước (Component `StepLearningSession` dùng cho **Collocation**, **Từ vựng chuyên đề**, **Paraphrase**):
- **Bước 1 (RECOGNITION):** Nhận diện nghĩa (Trắc nghiệm 4 lựa chọn).
- **Bước 2 (TRANSLATION):** Gợi nhớ chủ động (Nhìn tiếng Việt, tự gõ lại tiếng Anh).
- **Bước 3 (APPLICATION):** Ứng dụng vào câu (Tự viết câu tiếng Anh có chứa cụm từ + AI chấm điểm).

### 🔒 Điều kiện tiên quyết để chuyển Step:
1. **Trong mỗi Step:**
   - Vòng 1 bắt đầu với toàn bộ danh sách câu hỏi trong chủ đề.
   - Bất kỳ câu nào làm **SAI** $\rightarrow$ Hệ thống tự động gom vào danh sách làm lại (`retryItems`).
2. **Khi hết một vòng (Round):**
   - Nếu danh sách câu sai (`retryItems`) vẫn còn $\rightarrow$ Hệ thống tự động tạo **Vòng ôn lại tiếp theo (Round 2, Round 3...)** chỉ chứa các câu làm sai.
   - Quá trình lặp lại diễn ra liên tục cho đến khi người học **trả lời đúng 100% toàn bộ câu hỏi của Step đó** (`retryItems = []`).
3. **Chuyển Step:**
   - **CHỈ ĐƯỢC CHUYỂN BƯỚC (ví dụ Bước 1 $\rightarrow$ Bước 2, hoặc Bước 2 $\rightarrow$ Bước 3) KHI VÀ CHỈ KHI người học đã hoàn thành đúng 100% tất cả các câu trong Step hiện tại.**
   - Tuyệt đối **KHÔNG** bỏ qua câu sai để nhảy sang Step mới.
   - Khi chuyển sang Step mới, danh sách câu hỏi được khởi tạo lại đầy đủ từ đầu cho Step đó.

---

## 3. Quy Ước Code Dành Cho Developer & AI (Technical Implementation Rules)

1. **State Tracking trong Session Component:**
   - Phải luôn có cờ/state ghi nhận kết quả câu hiện tại (ví dụ `currentAnswerStatus: boolean | null`).
   - Khi người học trả lời sai, `handleAnswer(false)` hoặc `onAnswer(false)` phải cập nhật trạng thái này.
   - Khi bấm "Câu tiếp theo" (`continueAfterAnswer`), tuyệt đối **KHÔNG hardcode `isCorrect = true`**. Phải kiểm tra trạng thái thực tế:
     ```tsx
     const isCorrect = currentAnswerStatus ?? true;
     const nextRetryItems = isCorrect
       ? retryItems
       : retryItems.some((r) => r.id === item.id)
         ? retryItems
         : [...retryItems, item];
     ```
2. **Logic Chuyển Vòng & Chuyển Step:**
   ```tsx
   function moveForward(nextRetryItems: LearningItemView[]) {
     // 1. Còn câu trong vòng hiện tại -> qua câu tiếp theo
     if (currentIndex + 1 < roundItems.length) {
       setRetryItems(nextRetryItems);
       setCurrentIndex((index) => index + 1);
       return;
     }

     // 2. Hết vòng nhưng còn câu sai -> lặp lại vòng mới cho các câu sai
     if (nextRetryItems.length > 0) {
       setRoundItems(uniqueItems(nextRetryItems));
       setRetryItems([]);
       setCurrentIndex(0);
       setRound((current) => current + 1);
       return;
     }

     // 3. Đã đúng 100% câu trong Step -> mới chuyển sang Step tiếp theo
     if (stageIndex < stages.length - 1) {
       setStageIndex((index) => index + 1);
       setRoundItems(initialItems);
       setRetryItems([]);
       setCurrentIndex(0);
       setRound(1);
       return;
     }

     // 4. Hoàn thành 100% cả 3 Step
     setCompleted(true);
   }
   ```
3. **Tiêu chuẩn đánh giá câu sai đối với phần AI chấm câu (Writing / Application):**
   Một câu trả lời bị tính là CHƯA ĐẠT (phải làm lại ở vòng sau) khi:
   - `isCorrect === false`
   - hoặc `evaluation.score < 70`
   - hoặc `evaluation.meaningScore < 70`
   - hoặc `evaluation.grammarScore < 70`
   - hoặc có lỗi ngữ pháp / chính tả: `Boolean(evaluation.grammarIssues && evaluation.grammarIssues.length > 0)`
   - hoặc chưa sử dụng cụm từ bắt buộc (`usesRequiredPhrase === false`).
