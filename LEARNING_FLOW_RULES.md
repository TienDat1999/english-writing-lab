# Universal Learning Flow Rules (Quy Tắc Xuyên Suốt Hệ Thống Học & Ôn Tập)

> **Mục tiêu:** Đảm bảo trải nghiệm học tập chuẩn phương pháp phản xạ ngắt quãng (Spaced Retrieval), tránh thói quen đoán mò hoặc sửa ngay lập tức mà không tiếp thu giải thích.

---

## 1. Không Có Cơ Chế Làm Lại Tại Lúc Đang Sai (No In-Place Redo/Retry)
Khi người học thực hiện bất kỳ bài tập nào trong toàn bộ dự án (Quiz trắc nghiệm, Flashcard, Dịch câu tự luận, Viết theo Template B2, Luyện Paraphrase 3 bước):

- **Không cho phép sửa lại ngay tại chỗ:**
  - Khi người học đã nộp câu trả lời và nhận được feedback (sai chính tả, lỗi ngữ pháp, chọn sai trắc nghiệm, điểm số < 70):
  - Tuyệt đối **KHÔNG** hiển thị nút "Sửa lại", "Thử lại" hay cho phép click chọn lại phương án khác tại lúc đó.
  - Sau khi submit, các nút chọn / ô nhập liệu bị khóa (`disabled`).

- **Chỉ có một luồng duy nhất là bước tiếp:**
  - Người học đọc giải thích, đối chiếu câu chuẩn và các điểm cần sửa.
  - Nút bấm duy nhất khả dụng là **"Tiếp tục" / "Câu tiếp theo"** (hỗ trợ phím tắt `Enter`).

---

## 2. Cơ Chế Ôn Lại Theo Vòng (Round-Based Repetition)
- Bất kỳ câu hỏi nào người học làm chưa đạt:
  - `evaluation.score < 70`
  - `evaluation.meaningScore < 70`
  - `evaluation.grammarScore < 70`
  - Có lỗi ngữ pháp hoặc lỗi chính tả: `Boolean(evaluation.grammarIssues && evaluation.grammarIssues.length > 0)`
  - Chọn sai đáp án trắc nghiệm hoặc nhập sai cụm từ
- Câu hỏi đó sẽ tự động được thu thập vào danh sách lặp lại (`retryItems` hoặc đẩy về cuối danh sách câu hỏi).
- **Hết vòng thì quay lại làm lại:** Sau khi đi qua hết tất cả các câu trong vòng hiện tại, hệ thống mới mở vòng ôn tiếp theo (Round 2, 3...) chỉ gồm các câu chưa đạt, cho đến khi người học nắm vững 100%.

---

## 3. Quy Ước Code (Developer & AI Instructions)
Khi phát triển tính năng mới hoặc chỉnh sửa các màn hình luyện tập:
1. Luôn kiểm tra điều kiện lỗi đầy đủ: `score < 70 || meaningScore < 70 || grammarScore < 70 || grammarIssues.length > 0`.
2. Không truyền callback `onRetry` cho các kết quả bài tập đã submit.
3. Luôn nối các câu làm sai vào hàng đợi vòng tiếp theo thay vì reset state câu hỏi tại chỗ.
