import type { ImportQuickLearningItemsInput } from "./learning.contract";

const letterTemplateItems = [
  // 01. Salutations & Sign-offs
  {
    topic: "01. Lời chào & Ký tên chuẩn văn phong",
    prompt: "Chào hỏi trang trọng khi chưa biết tên người nhận.",
    answer: "Dear Sir or Madam,",
    context: "Dùng cho thư trang trọng (Formal) khi không biết tên người nhận. Cuối thư bắt buộc kết bằng: Yours faithfully,",
  },
  {
    topic: "01. Lời chào & Ký tên chuẩn văn phong",
    prompt: "Chào hỏi trang trọng hoặc bán trang trọng khi đã biết họ của người nhận.",
    answer: "Dear Mr. SMITH,",
    context: "Thay SMITH bằng họ của người nhận (Mr. Brown, Ms. Davis). Cuối thư kết bằng: Yours sincerely,",
  },
  {
    topic: "01. Lời chào & Ký tên chuẩn văn phong",
    prompt: "Chào hỏi thân mật gửi bạn bè hoặc người thân.",
    answer: "Dear ALEX,",
    context: "Thay ALEX bằng tên người bạn. Cuối thư kết bằng: Best wishes, hoặc Warm regards, hoặc Take care,",
  },
  {
    topic: "01. Lời chào & Ký tên chuẩn văn phong",
    prompt: "Ký tên trang trọng khi mở đầu bằng Dear Sir or Madam.",
    answer: "Yours faithfully,",
    context: "Luôn có dấu phẩy ở cuối và xuống dòng ghi họ tên đầy đủ của Bạn.",
  },
  {
    topic: "01. Lời chào & Ký tên chuẩn văn phong",
    prompt: "Ký tên trang trọng khi mở đầu bằng Dear Mr./Ms. + Họ.",
    answer: "Yours sincerely,",
    context: "Dùng khi biết danh xưng và họ người nhận trong thư trang trọng.",
  },
  {
    topic: "01. Lời chào & Ký tên chuẩn văn phong",
    prompt: "Ký tên thân thiện và lịch sự trong thư bán trang trọng (cho đồng nghiệp, chủ nhà).",
    answer: "Warm regards,",
    context: "Văn phong ấm áp, lịch sự, rất phù hợp cho đồng nghiệp hoặc người quen.",
  },

  // 02. Reason for Writing
  {
    topic: "02. Mở đầu & Nêu mục đích viết thư",
    prompt: "Mở đầu thư trang trọng nêu mục đích bày tỏ sự không hài lòng.",
    answer: "I am writing this letter to express my strong dissatisfaction with SERVICE.",
    context: "Thay SERVICE bằng sản phẩm hoặc dịch vụ gây thất vọng (e.g. the poor customer service / the faulty laptop).",
  },
  {
    topic: "02. Mở đầu & Nêu mục đích viết thư",
    prompt: "Mở đầu thư hỏi thăm thông tin chi tiết về một dịch vụ hoặc khóa học.",
    answer: "I am writing to enquire about COURSE which I saw advertised on your website.",
    context: "Thay COURSE bằng khóa học hoặc chương trình (e.g. the B2 English course / the internship program).",
  },
  {
    topic: "02. Mở đầu & Nêu mục đích viết thư",
    prompt: "Mở đầu thư trang trọng gửi lời xin lỗi chân thành.",
    answer: "I am writing to sincerely apologise for MISTAKE.",
    context: "Thay MISTAKE bằng sự cố (e.g. the delay in submitting my assignment / missing our appointment).",
  },
  {
    topic: "02. Mở đầu & Nêu mục đích viết thư",
    prompt: "Mở đầu thư thân mật hỏi thăm và thông báo một tin vui hoặc dự định.",
    answer: "I hope this email finds you well. I am writing to let you know that NEWS.",
    context: "Thay NEWS bằng tin tức (e.g. I have just moved into a new apartment / I passed the B2 exam).",
  },

  // 03. Complaint
  {
    topic: "03. Thư phàn nàn & khiếu nại (Complaint)",
    prompt: "Nêu vấn đề đầu tiên với sản phẩm hoặc dịch vụ nhận được.",
    answer: "To begin with, the main issue is that PROBLEM.",
    context: "Nêu rõ lỗi kỹ thuật hoặc sự cố (e.g. the screen stopped working / the room was not properly cleaned).",
  },
  {
    topic: "03. Thư phàn nàn & khiếu nại (Complaint)",
    prompt: "Nhấn mạnh sự thất vọng do không đúng như quảng cáo cam kết.",
    answer: "According to your advertisement, PROMISE, but in reality, FACT.",
    context: "So sánh cam kết và thực tế (e.g. the hotel promised free breakfast, but in reality, there was none).",
  },
  {
    topic: "03. Thư phàn nàn & khiếu nại (Complaint)",
    prompt: "Bày tỏ sự bất tiện và bực bội do sự cố gây ra.",
    answer: "This unexpected problem has caused me considerable inconvenience and frustration.",
    context: "Câu B2 ghi điểm mạnh cho tiêu chí Task Fulfilment trong thư khiếu nại.",
  },
  {
    topic: "03. Thư phàn nàn & khiếu nại (Complaint)",
    prompt: "Đưa ra yêu cầu bồi thường hoặc hoàn lại toàn bộ số tiền.",
    answer: "Under these circumstances, I would be grateful if you could provide me with a full refund.",
    context: "Cấu trúc điều kiện lịch sự đòi lại tiền (full refund) hoặc đổi mới sản phẩm (a replacement).",
  },

  // 04. Inquiry & Request
  {
    topic: "04. Thư hỏi thông tin & yêu cầu (Inquiry)",
    prompt: "Lịch sự hỏi về thời gian biểu và thời lượng cụ thể.",
    answer: "First of all, could you please let me know the exact timetable and duration of the course?",
    context: "Dùng để hỏi thông tin chi tiết một cách trang trọng, lịch thiệp.",
  },
  {
    topic: "04. Thư hỏi thông tin & yêu cầu (Inquiry)",
    prompt: "Hỏi về học phí hoặc chi phí kèm theo chính sách ưu đãi.",
    answer: "I would also appreciate it if you could inform me of the total fees and available discounts.",
    context: "Cấu trúc 'I would appreciate it if you could...' là mẫu câu B2 đắt giá.",
  },
  {
    topic: "04. Thư hỏi thông tin & yêu cầu (Inquiry)",
    prompt: "Yêu cầu gửi tài liệu hoặc đơn đăng ký tham gia.",
    answer: "Would it be possible for you to send me the detailed syllabus and the application form?",
    context: "Mẫu câu yêu cầu lịch sự với 'Would it be possible for you to...'.",
  },

  // 05. Apology
  {
    topic: "05. Thư xin lỗi (Apology)",
    prompt: "Giải thích lý do khách quan không lường trước dẫn đến sai sót hoặc vắng mặt.",
    answer: "Unfortunately, an unexpected emergency arose at the last minute, which prevented me from attending.",
    context: "Nêu lý do khách quan hợp lý giải thích tại sao không thể tham dự.",
  },
  {
    topic: "05. Thư xin lỗi (Apology)",
    prompt: "Nhận thức rõ sự phiền hà đã gây ra cho đối phương và xin thứ lỗi.",
    answer: "I fully understand that this sudden absence caused you considerable inconvenience, for which I am deeply sorry.",
    context: "Thể hiện sự đồng cảm và tinh thần trách nhiệm cao.",
  },
  {
    topic: "05. Thư xin lỗi (Apology)",
    prompt: "Đưa ra phương án khắc phục hoặc sắp xếp lại thời gian thích hợp.",
    answer: "To make up for this mistake, I would be happy to reschedule our meeting at your convenience.",
    context: "Đề xuất hẹn lại lịch hoặc đền bù thiệt hại.",
  },

  // 06. Invitation
  {
    topic: "06. Thư mời (Invitation)",
    prompt: "Đưa ra lời mời nồng nhiệt tham gia một sự kiện đặc biệt.",
    answer: "I would like to warmly invite you to attend EVENT which will take place on DATE.",
    context: "Thay EVENT bằng tên sự kiện (e.g. my graduation ceremony / our annual conference).",
  },
  {
    topic: "06. Thư mời (Invitation)",
    prompt: "Nêu lý do sự có mặt của người nhận sẽ khiến sự kiện thêm trọn vẹn.",
    answer: "It would mean a great deal to me if you could come and celebrate this special occasion with us.",
    context: "Thể hiện tình cảm chân thành và tầm quan trọng của người nhận.",
  },
  {
    topic: "06. Thư mời (Invitation)",
    prompt: "Yêu cầu người nhận xác nhận khả năng tham gia trước một thời hạn.",
    answer: "Please let me know whether you can make it by DEADLINE so that I can make the necessary arrangements.",
    context: "Thay DEADLINE bằng thời hạn cụ thể (e.g. this Friday / the end of the month).",
  },

  // 07. Thank-you Letter
  {
    topic: "07. Thư cảm ơn (Thank-you Letter)",
    prompt: "Bày tỏ lòng biết ơn chân thành về sự giúp đỡ nhiệt tình hoặc lòng hiếu khách.",
    answer: "I am writing to express my heartfelt gratitude for your generous support during my stay.",
    context: "Dùng để cảm ơn gia đình chủ nhà homestay, đồng nghiệp hoặc đối tác.",
  },
  {
    topic: "07. Thư cảm ơn (Thank-you Letter)",
    prompt: "Khẳng định chuyến đi hoặc công việc không thể thành công nếu thiếu sự giúp đỡ đó.",
    answer: "Without your invaluable assistance, my project would not have been nearly as successful.",
    context: "Sử dụng cấu trúc đảo ngữ hoặc cụm 'Without...' đạt chuẩn B2/C1.",
  },
  {
    topic: "07. Thư cảm ơn (Thank-you Letter)",
    prompt: "Bày tỏ mong muốn được đón tiếp và đền đáp đối phương khi có dịp.",
    answer: "I look forward to the opportunity to return your hospitality whenever you visit my city.",
    context: "Lời hứa đón tiếp nồng hậu tạo ấn tượng giao tiếp rất tốt.",
  },

  // 08. Advice & Suggestion
  {
    topic: "08. Thư khuyên bảo & đề xuất (Advice & Suggestion)",
    prompt: "Đặt mình vào vị trí đối phương để đưa ra lời khuyên chân thành.",
    answer: "If I were in your position, I would strongly consider ACTION.",
    context: "Dùng câu điều kiện loại 2 để đưa ra lời khuyên lịch sự (e.g. taking a short intensive course).",
  },
  {
    topic: "08. Thư khuyên bảo & đề xuất (Advice & Suggestion)",
    prompt: "Giải thích lợi ích của phương án được khuyên.",
    answer: "Doing this will not only save you valuable time but also help you avoid unnecessary stress.",
    context: "Cấu trúc đảo ngữ hoặc song hành 'not only... but also...' rất ghi điểm.",
  },
  {
    topic: "08. Thư khuyên bảo & đề xuất (Advice & Suggestion)",
    prompt: "Gợi ý thêm một địa điểm hoặc hoạt động không nên bỏ lỡ.",
    answer: "Another option you might want to consider is visiting DESTINATION, which is famous for its atmosphere.",
    context: "Thay DESTINATION bằng địa danh cụ thể khi khuyên về du lịch/học tập.",
  },

  // 09. Application
  {
    topic: "09. Thư xin việc & ứng tuyển (Application)",
    prompt: "Mở đầu nêu rõ vị trí công việc muốn ứng tuyển và nguồn thông tin.",
    answer: "I am writing to apply for the position of POSITION advertised on your website on DATE.",
    context: "Thay POSITION bằng chức danh (e.g. Marketing Assistant / English Teaching Assistant).",
  },
  {
    topic: "09. Thư xin việc & ứng tuyển (Application)",
    prompt: "Tóm tắt kinh nghiệm làm việc và những kỹ năng cốt lõi đã tích lũy.",
    answer: "Over the past two years, I have gained valuable experience in SKILL, which enables me to work well under pressure.",
    context: "Thay SKILL bằng kỹ năng liên quan (e.g. event management / customer care).",
  },
  {
    topic: "09. Thư xin việc & ứng tuyển (Application)",
    prompt: "Bày tỏ mong muốn được tham dự phỏng vấn trực tiếp.",
    answer: "I would welcome the opportunity to discuss my qualifications in a personal interview at your convenience.",
    context: "Mẫu câu kết thư xin việc lịch thiệp và tự tin chuẩn mực.",
  },

  // 10. Polite Closings
  {
    topic: "10. Lời kết lịch sự (Polite Closings)",
    prompt: "Lời kết trang trọng thể hiện mong muốn nhận được hồi âm sớm.",
    answer: "I look forward to hearing from you at your earliest convenience.",
    context: "Mẫu câu kết thư trang trọng phổ biến và chuẩn mực nhất.",
  },
  {
    topic: "10. Lời kết lịch sự (Polite Closings)",
    prompt: "Lời kết sẵn sàng cung cấp thêm thông tin nếu đối phương cần.",
    answer: "Please do not hesitate to contact me if you require any further information.",
    context: "Rất phù hợp cho thư công việc, hỏi thông tin hoặc xin việc.",
  },
  {
    topic: "10. Lời kết lịch sự (Polite Closings)",
    prompt: "Lời kết thân mật chúc bạn bè và mong sớm gặp lại.",
    answer: "Write back soon and let me know how everything goes. Take care!",
    context: "Văn phong tự nhiên, ấm áp cho thư gửi bạn bè.",
  },
];

const applicationPromptByAnswer: Record<string, string> = {
  "Dear Sir or Madam,": "Kính gửi Ban Quản lý / Ông hoặc Bà (khi không rõ tên người nhận trong thư khiếu nại).",
  "Dear Mr. SMITH,": "Kính gửi ông Smith (khi đã biết họ của người nhận trong thư trang trọng).",
  "Dear ALEX,": "Alex thân mến (lời chào thân mật mở đầu thư gửi bạn).",
  "Yours faithfully,": "Kính thư (khi mở đầu bằng Dear Sir or Madam).",
  "Yours sincerely,": "Trân trọng kính thư (khi mở đầu bằng Dear Mr./Ms. Smith).",
  "Warm regards,": "Thân ái và trân trọng (lời kết lịch sự gửi đồng nghiệp).",
  "I am writing this letter to express my strong dissatisfaction with SERVICE.":
    "Tôi viết thư này để bày tỏ sự vô cùng không hài lòng với dịch vụ chăm sóc khách hàng tại chi nhánh của bạn.",
  "I am writing to enquire about COURSE which I saw advertised on your website.":
    "Tôi viết thư này để hỏi thông tin chi tiết về khóa học tiếng Anh B2 mà tôi thấy quảng cáo trên trang web của bạn.",
  "I am writing to sincerely apologise for MISTAKE.":
    "Tôi viết thư này để chân thành xin lỗi về việc tôi đã vắng mặt trong buổi họp ngày hôm qua.",
  "I hope this email finds you well. I am writing to let you know that NEWS.":
    "Tôi hy vọng bạn vẫn khỏe. Tôi viết thư này để báo cho bạn biết rằng tôi vừa mới chuyển đến một căn hộ mới.",
  "To begin with, the main issue is that PROBLEM.":
    "Đầu tiên, vấn đề chính là chiếc máy tính xách tay tôi mua bị hỏng màn hình chỉ sau hai ngày sử dụng.",
  "According to your advertisement, PROMISE, but in reality, FACT.":
    "Theo quảng cáo của bạn, bữa sáng được phục vụ miễn phí, nhưng trên thực tế, chúng tôi bị tính thêm phí.",
  "This unexpected problem has caused me considerable inconvenience and frustration.":
    "Vấn đề không mong muốn này đã gây cho tôi rất nhiều sự phiền toái và thất vọng.",
  "Under these circumstances, I would be grateful if you could provide me with a full refund.":
    "Trong hoàn cảnh này, tôi sẽ rất biết ơn nếu bạn có thể hoàn lại toàn bộ số tiền cho tôi.",
  "First of all, could you please let me know the exact timetable and duration of the course?":
    "Trước hết, bạn có thể vui lòng cho tôi biết thời khóa biểu chính xác và thời lượng của khóa học được không?",
  "I would also appreciate it if you could inform me of the total fees and available discounts.":
    "Tôi cũng sẽ rất cảm kích nếu bạn có thể thông báo cho tôi về tổng học phí và các chính sách giảm giá hiện có.",
  "Would it be possible for you to send me the detailed syllabus and the application form?":
    "Liệu bạn có thể gửi cho tôi đề cương chi tiết và mẫu đơn đăng ký được không?",
  "Unfortunately, an unexpected emergency arose at the last minute, which prevented me from attending.":
    "Thật không may, một trường hợp khẩn cấp bất ngờ đã xảy ra vào phút chót khiến tôi không thể tham dự.",
  "I fully understand that this sudden absence caused you considerable inconvenience, for which I am deeply sorry.":
    "Tôi hoàn toàn hiểu rằng sự vắng mặt đột ngột này đã gây ra nhiều bất tiện cho bạn, điều mà tôi vô cùng hối tiếc.",
  "To make up for this mistake, I would be happy to reschedule our meeting at your convenience.":
    "Để bù đắp cho sai sót này, tôi rất sẵn lòng sắp xếp lại buổi gặp vào bất kỳ thời gian nào thuận tiện cho bạn.",
  "I would like to warmly invite you to attend EVENT which will take place on DATE.":
    "Tôi muốn gửi lời mời nồng nhiệt đến bạn tham dự lễ tân gia của tôi sẽ diễn ra vào thứ Bảy tuần tới.",
  "It would mean a great deal to me if you could come and celebrate this special occasion with us.":
    "Sẽ có ý nghĩa rất lớn đối với tôi nếu bạn có thể đến và cùng chung vui dịp đặc biệt này với chúng tôi.",
  "Please let me know whether you can make it by DEADLINE so that I can make the necessary arrangements.":
    "Vui lòng cho tôi biết bạn có thể đến được hay không trước thứ Năm tuần này để tôi chuẩn bị chu đáo.",
  "I am writing to express my heartfelt gratitude for your generous support during my stay.":
    "Tôi viết thư này để bày tỏ lòng biết ơn chân thành về sự hỗ trợ hào phóng của bạn trong suốt thời gian tôi ở lại.",
  "Without your invaluable assistance, my project would not have been nearly as successful.":
    "Nếu không có sự giúp đỡ quý báu của bạn, dự án của tôi khó có thể thành công tốt đẹp như vậy.",
  "I look forward to the opportunity to return your hospitality whenever you visit my city.":
    "Tôi rất mong có cơ hội được đón tiếp bạn bất cứ khi nào bạn đến thăm thành phố của tôi.",
  "If I were in your position, I would strongly consider ACTION.":
    "Nếu tôi ở vị trí của bạn, tôi sẽ cân nhắc nghiêm túc việc tham gia một khóa học tiếng Anh chuyên sâu.",
  "Doing this will not only save you valuable time but also help you avoid unnecessary stress.":
    "Làm điều này không những giúp bạn tiết kiệm thời gian quý báu mà còn tránh được những căng thẳng không cần thiết.",
  "Another option you might want to consider is visiting DESTINATION, which is famous for its atmosphere.":
    "Một lựa chọn khác bạn có thể cân nhắc là ghé thăm viện bảo tàng thành phố, nơi rất nổi tiếng với không gian yên tĩnh.",
  "I am writing to apply for the position of POSITION advertised on your website on DATE.":
    "Tôi viết thư này để ứng tuyển vào vị trí trợ lý tiếp thị được đăng tuyển trên trang web của bạn vào thứ Hai tuần trước.",
  "Over the past two years, I have gained valuable experience in SKILL, which enables me to work well under pressure.":
    "Trong hai năm qua, tôi đã tích lũy được nhiều kinh nghiệm quý báu trong việc sáng tạo nội dung, giúp tôi làm việc tốt dưới áp lực.",
  "I would welcome the opportunity to discuss my qualifications in a personal interview at your convenience.":
    "Tôi rất mong có cơ hội được trao đổi về năng lực của mình trong một buổi phỏng vấn trực tiếp vào thời gian thuận tiện cho bạn.",
  "I look forward to hearing from you at your earliest convenience.":
    "Tôi rất mong sớm nhận được hồi âm từ bạn vào thời gian sớm nhất thuận tiện cho bạn.",
  "Please do not hesitate to contact me if you require any further information.":
    "Xin đừng ngần ngại liên hệ với tôi nếu bạn cần thêm bất kỳ thông tin nào.",
  "Write back soon and let me know how everything goes. Take care!":
    "Hãy viết thư lại sớm cho tôi và cho tôi biết mọi chuyện diễn ra thế nào nhé. Giữ gìn sức khỏe nhé!",
};

export const vstepLetterTemplatePreset = {
  quizType: "TEMPLATE",
  items: letterTemplateItems.map((item) => ({
    ...item,
    applicationPromptVi:
      applicationPromptByAnswer[item.answer] ?? "Hãy viết câu thư này bằng tiếng Anh chuẩn B2.",
  })),
} satisfies ImportQuickLearningItemsInput;
