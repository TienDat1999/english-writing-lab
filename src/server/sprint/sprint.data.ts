import type { SprintDayPlan } from "./sprint.types";

export const sprint30DaysCurriculum: SprintDayPlan[] = [
  // ==========================================
  // TUẦN 1: XÂY MÓNG TEMPLATE & PHẢN XẠ CĂN BẢN
  // ==========================================
  {
    dayNumber: 1,
    weekNumber: 1,
    title: "Khung Thư Thân Mật & Hometown Part 1",
    focusBadge: "Writing Task 1 + Speaking Part 1",
    dailyGoal: "Viết thư 120 từ mời bạn đến thăm thành phố của mình. Ghi âm 4 câu trả lời Hometown theo công thức A.R.E.",
    vocabDrill: {
      theme: "Hometown & City Life",
      items: [
        {
          term: "bustling metropolis",
          meaningVi: "đô thị sầm uất, nhộn nhịp",
          exampleSentenceEn: "I currently reside in a bustling metropolis with modern amenities.",
          exampleSentenceVi: "Tôi hiện đang sống trong một đô thị sầm uất với đầy đủ tiện nghi hiện đại.",
        },
        {
          term: "picturesque landscapes",
          meaningVi: "phong cảnh đẹp như tranh vẽ",
          exampleSentenceEn: "My hometown is renowned for its picturesque landscapes and fresh air.",
          exampleSentenceVi: "Quê hương tôi nổi tiếng với cảnh quan đẹp như tranh vẽ và không khí trong lành.",
        },
        {
          term: "hospitable residents",
          meaningVi: "người dân hiếu khách",
          exampleSentenceEn: "The local residents are exceptionally warm and hospitable to visitors.",
          exampleSentenceVi: "Cư dân địa phương đặc biệt nồng hậu và hiếu khách với du khách.",
        },
        {
          term: "historical landmark",
          meaningVi: "di tích lịch sử nổi tiếng",
          exampleSentenceEn: "There are numerous historical landmarks scattered throughout the town.",
          exampleSentenceVi: "Có rất nhiều di tích lịch sử nằm rải rác khắp thị trấn.",
        },
      ],
    },
    writingTask: {
      taskType: "TASK_1",
      genre: "INFORMAL_LETTER",
      timeLimitMinutes: 20,
      title: "Viết thư mời bạn thân đến thăm thành phố",
      prompt: "An English-speaking friend is planning to visit your hometown next month. Write an email to invite him/her to stay with you.",
      bulletPoints: [
        "Mời bạn đến thăm và đề xuất thời gian phù hợp",
        "Gợi ý 2-3 điểm tham quan nổi tiếng hoặc hoạt động trải nghiệm",
        "Hướng dẫn phương tiện di chuyển và chuẩn bị hành lý",
      ],
      suggestedScaffold: [
        "Dear Alex, / It was wonderful to hear from you after such a long time.",
        "I am writing this letter to invite you to stay at my place when you visit my city.",
        "First and foremost, you definitely should not miss...",
        "I am looking forward to seeing you soon. / Best wishes,",
      ],
    },
    speakingTask: {
      part: 1,
      topic: "Hometown & Living",
      prepTimeSeconds: 0,
      speakTimeSeconds: 100,
      questionsOrCueCard: [
        "Where is your hometown located?",
        "What do you like most about living in your city?",
        "Has your hometown changed much over the past few years?",
        "Do you prefer living in a big city or in the countryside?",
      ],
      goldenTips: "Áp dụng công thức A.R.E: Trả lời trực tiếp (Answer) + Nêu lý do (Reason) + Đưa ví dụ hoặc chi tiết (Example). Mỗi câu nói từ 20-25 giây.",
      rescuePhrases: [
        "Well, to be quite honest, speaking from my personal standpoint...",
        "What I mean by this is that...",
      ],
    },
    auditChecklist: [
      "Task 1 đã đạt tối thiểu 120-140 từ chưa?",
      "Đã trả lời đủ 3 bullet points trong đề chưa?",
      "Speaking Part 1 có bị trả lời mỗi chữ 'Yes'/'No' không?",
      "Mỗi câu trả lời nói đã đạt 3-4 câu hoàn chỉnh chưa?",
    ],
  },
  {
    dayNumber: 2,
    weekNumber: 1,
    title: "Kỹ Thuật Giải Quyết 3 Gợi Ý & Hobbies & Leisure",
    focusBadge: "Chia đoạn Bullet Points + B2 Adjectives",
    dailyGoal: "Viết thư kể về kỳ nghỉ hè gần nhất, chia mỗi bullet point thành 1 đoạn nhỏ 2-3 câu. Học 5 tính từ B2 về sở thích.",
    vocabDrill: {
      theme: "Hobbies & Leisure Activities",
      items: [
        {
          term: "unwind",
          meaningVi: "thư giãn, xả hơi sau giờ làm việc/học tập căng thẳng",
          exampleSentenceEn: "Listening to classical music helps me unwind after an exhausting day.",
          exampleSentenceVi: "Nghe nhạc cổ điển giúp tôi thư giãn sau một ngày kiệt sức.",
        },
        {
          term: "broaden my horizons",
          meaningVi: "mở rộng tầm hiểu biết và thế giới quan",
          exampleSentenceEn: "Traveling extensively enables individuals to broaden their horizons.",
          exampleSentenceVi: "Đi du lịch nhiều nơi cho phép mỗi người mở rộng tầm mắt.",
        },
        {
          term: "exhilarating",
          meaningVi: "phấn khích, hào hứng tột độ",
          exampleSentenceEn: "Scuba diving was truly an exhilarating experience that I will never forget.",
          exampleSentenceVi: "Lặn biển thực sự là một trải nghiệm phấn khích tột độ mà tôi sẽ không bao giờ quên.",
        },
        {
          term: "recharge my batteries",
          meaningVi: "nạp lại năng lượng",
          exampleSentenceEn: "A weekend getaway is the perfect remedy to recharge my batteries.",
          exampleSentenceVi: "Một chuyến đi nghỉ cuối tuần là phương thuốc hoàn hảo để nạp lại năng lượng.",
        },
      ],
    },
    writingTask: {
      taskType: "TASK_1",
      genre: "INFORMAL_LETTER",
      timeLimitMinutes: 20,
      title: "Viết thư kể về kỳ nghỉ hè gần nhất",
      prompt: "Write an email to an old friend telling him/her about your recent summer vacation.",
      bulletPoints: [
        "Nơi bạn đã đến và bạn đi cùng ai",
        "Hoạt động đáng nhớ nhất mà bạn đã trải nghiệm",
        "Cảm xúc sau chuyến đi và lời rủ rê cho kỳ nghỉ tiếp theo",
      ],
      suggestedScaffold: [
        "Regarding my summer trip, I decided to spend a week in Da Nang with my family.",
        "The highlight of the journey was without a doubt...",
        "All in all, the vacation was truly therapeutic. We really should plan a trip together soon!",
      ],
    },
    speakingTask: {
      part: 1,
      topic: "Hobbies & Leisure",
      prepTimeSeconds: 0,
      speakTimeSeconds: 100,
      questionsOrCueCard: [
        "What do you usually do in your leisure time?",
        "Do you prefer indoor or outdoor activities?",
        "How has your hobby changed since you were a child?",
        "Why is it essential for people to have a hobby?",
      ],
      goldenTips: "Lồng ghép các tính từ B2 (unwind, exhilarating, broaden horizons) vào câu trả lời để giám khảo chấm thẳng B2.",
      rescuePhrases: [
        "That is an intriguing question that I haven't pondered much before...",
        "A classic illustration of this would be...",
      ],
    },
    auditChecklist: [
      "Mỗi bullet point trong bài viết đã tách thành 1 đoạn nhỏ 2-3 câu chưa?",
      "Đã sử dụng được ít nhất 2 tính từ B2 mới học chưa?",
      "Ghi âm Speaking có bị dead air quá 3 giây không?",
    ],
  },
  {
    dayNumber: 3,
    weekNumber: 1,
    title: "Khung Thư Cảm Ơn, Xin Lỗi & Work / Studies",
    focusBadge: "Thư Cảm Ơn / Xin Lỗi + A.R.E Fluency",
    dailyGoal: "Viết thư cảm ơn tiệc sinh nhật và xin lỗi vì để quên đồ. Trả lời mượt mà câu hỏi: 'Why did you choose your major?'",
    vocabDrill: {
      theme: "Work & Academic Studies",
      items: [
        {
          term: "career prospects",
          meaningVi: "triển vọng nghề nghiệp tương lai",
          exampleSentenceEn: "This program offers exceptionally lucrative career prospects for graduates.",
          exampleSentenceVi: "Chương trình học này mang lại triển vọng nghề nghiệp rất hứa hẹn cho sinh viên tốt nghiệp.",
        },
        {
          term: "lucrative income",
          meaningVi: "mức thu nhập cao, hấp dẫn",
          exampleSentenceEn: "Many youngsters pursue IT with the ambition of earning a lucrative income.",
          exampleSentenceVi: "Nhiều bạn trẻ theo đuổi ngành CNTT với mong muốn có mức thu nhập hấp dẫn.",
        },
        {
          term: "climb the career ladder",
          meaningVi: "thăng tiến trong nấc thang sự nghiệp",
          exampleSentenceEn: "Continuous self-improvement is imperative to climb the career ladder.",
          exampleSentenceVi: "Liên tục trau dồi bản thân là điều bắt buộc để thăng tiến trong sự nghiệp.",
        },
      ],
    },
    writingTask: {
      taskType: "TASK_1",
      genre: "INFORMAL_LETTER",
      timeLimitMinutes: 20,
      title: "Thư cảm ơn bạn thân và xin lỗi vì để quên đồ",
      prompt: "You recently stayed at your friend's house for their birthday party. Write an email to thank them and apologize for leaving an item behind.",
      bulletPoints: [
        "Cảm ơn vì bữa tiệc sinh nhật ấm cúng và sự tiếp đón chu đáo",
        "Xin lỗi vì sự bất cẩn làm thất lạc món đồ và miêu tả món đồ đó",
        "Đề xuất cách lấy lại món đồ thuận tiện nhất",
      ],
      suggestedScaffold: [
        "I am writing this email to express my heartfelt gratitude for...",
        "However, I must sincerely apologize for my carelessness, as I inadvertently left behind...",
        "Could you please check if it is still there? I can drop by your house this weekend to pick it up.",
      ],
    },
    speakingTask: {
      part: 1,
      topic: "Work & Studies",
      prepTimeSeconds: 0,
      speakTimeSeconds: 100,
      questionsOrCueCard: [
        "Are you currently a student or are you working?",
        "Why did you choose your current major or career path?",
        "What is the most demanding aspect of your study or job?",
        "Do you intend to continue in this field in the long run?",
      ],
      goldenTips: "Khi trả lời 'Why did you choose your major?', nhớ dùng câu phức: 'The primary reason why I opted for... is that...' kết hợp A.R.E.",
      rescuePhrases: [
        "To be frank, I was drawn to this domain primarily because...",
        "Looking ahead, I definitely aspire to...",
      ],
    },
    auditChecklist: [
      "Thư có dùng cấu trúc cảm ơn: 'express my heartfelt gratitude' chưa?",
      "Cấu trúc xin lỗi: 'sincerely apologize for my carelessness' đã đúng chưa?",
      "Bài nói câu hỏi Major có đủ 3 thành phần A.R.E chưa?",
    ],
  },
  {
    dayNumber: 4,
    weekNumber: 1,
    title: "Khung Thư Trang Trọng (Formal Letter) & Daily Routine",
    focusBadge: "Formal Style + S-V Agreement",
    dailyGoal: "Viết thư gửi ban giám hiệu xin phép hoãn thi. Khắc phục triệt để lỗi thiếu âm đuôi '-s/-es' khi nói về thói quen.",
    vocabDrill: {
      theme: "Formal Register & Academic Terms",
      items: [
        {
          term: "grant permission",
          meaningVi: "cho phép, cấp phép chính thức",
          exampleSentenceEn: "I hope the academic board will kindly grant permission for my absence.",
          exampleSentenceVi: "Tôi hy vọng ban giám hiệu sẽ vui lòng cấp phép cho sự vắng mặt của tôi.",
        },
        {
          term: "unforeseen circumstance",
          meaningVi: "tình huống bất khả kháng, không lường trước được",
          exampleSentenceEn: "Due to unforeseen family circumstances, I cannot attend the exam.",
          exampleSentenceVi: "Vì hoàn cảnh gia đình bất khả kháng, tôi không thể tham dự kỳ thi.",
        },
        {
          term: "remain fully dedicated",
          meaningVi: "luôn luôn tận tụy, cam kết học tập",
          exampleSentenceEn: "I remain fully dedicated to completing all outstanding course requirements.",
          exampleSentenceVi: "Tôi cam kết hoàn thành đầy đủ các yêu cầu môn học còn lại.",
        },
      ],
    },
    writingTask: {
      taskType: "TASK_1",
      genre: "FORMAL_LETTER",
      timeLimitMinutes: 20,
      title: "Thư trang trọng xin phép hoãn thi",
      prompt: "Write a formal letter to your university's Head of Department to request postponing your final examination.",
      bulletPoints: [
        "Nêu rõ thông tin sinh viên, môn thi và ngày thi dự kiến",
        "Trình bày lý do bất khả kháng kèm giấy tờ minh chứng",
        "Đề xuất tham gia đợt thi bù hoặc phương án thay thế",
      ],
      suggestedScaffold: [
        "Dear Mr. Robinson / Dear Sir or Madam,",
        "I am writing this letter to formally request a postponement of my upcoming examination in [Subject].",
        "Regrettably, due to unforeseen medical conditions, I have been advised to...",
        "I would be exceedingly grateful if you could consider my request. / Yours sincerely,",
      ],
    },
    speakingTask: {
      part: 1,
      topic: "Daily Routine & Habits",
      prepTimeSeconds: 0,
      speakTimeSeconds: 100,
      questionsOrCueCard: [
        "What is your typical morning routine like?",
        "Do you tend to be an early bird or a night owl?",
        "How do you usually maintain a healthy work-life balance?",
        "If you could modify one habit in your daily routine, what would it be?",
      ],
      goldenTips: "Khắc phục triệt để lỗi nuốt âm đuôi '-s' / '-es' khi nói: 'He wakes up', 'My routine includes', 'It takes me'.",
      rescuePhrases: [
        "As a matter of fact, I consider myself more of an early bird because...",
        "To maintain optimal productivity, I always make sure to...",
      ],
    },
    auditChecklist: [
      "Thư trang trọng có bị dính viết tắt không (don't, can't)? Bắt buộc viết: 'do not, cannot'.",
      "Chào 'Dear Sir or Madam' thì cuối thư đã kết bằng 'Yours faithfully,' chưa?",
      "Nói Part 1 các động từ thói quen đã phát âm rõ đuôi -s chưa?",
    ],
  },
  {
    dayNumber: 5,
    weekNumber: 1,
    title: "Thư Khiếu Nại (Letter of Complaint) & Travel & Transport",
    focusBadge: "Complaint Letter + Speaking Part 1 Travel",
    dailyGoal: "Viết thư khiếu nại phòng khách sạn sai quảng cáo. Trả lời trôi chảy câu hỏi: 'Do you prefer traveling alone or in a group?'",
    vocabDrill: {
      theme: "Complaints & Transport",
      items: [
        {
          term: "express strong dissatisfaction",
          meaningVi: "bày tỏ sự bất bình, thất vọng sâu sắc",
          exampleSentenceEn: "I am writing to express my strong dissatisfaction with your hotel accommodation.",
          exampleSentenceVi: "Tôi viết thư này để bày tỏ sự thất vọng sâu sắc với phòng khách sạn của quý vị.",
        },
        {
          term: "substandard service",
          meaningVi: "dịch vụ dưới mức tiêu chuẩn",
          exampleSentenceEn: "The service provided was completely substandard compared to the brochure.",
          exampleSentenceVi: "Dịch vụ được cung cấp hoàn toàn dưới chuẩn so với tờ rơi quảng cáo.",
        },
        {
          term: "demand a full refund",
          meaningVi: "yêu cầu hoàn tiền toàn bộ",
          exampleSentenceEn: "Under these circumstances, I believe it is reasonable to demand a partial refund.",
          exampleSentenceVi: "Trong tình cảnh này, tôi tin rằng yêu cầu hoàn lại một phần tiền là hợp lý.",
        },
      ],
    },
    writingTask: {
      taskType: "TASK_1",
      genre: "FORMAL_LETTER",
      timeLimitMinutes: 20,
      title: "Thư khiếu nại dịch vụ phòng khách sạn",
      prompt: "You recently stayed at a hotel and were disappointed with the poor service and facilities. Write a letter of complaint to the hotel manager.",
      bulletPoints: [
        "Nêu thông tin đặt phòng và thời gian lưu trú",
        "Chỉ rõ 2 vấn đề nghiêm trọng (vệ sinh phòng kém, điều hòa hỏng)",
        "Yêu cầu giải pháp bồi thường thỏa đáng trong vòng 7 ngày",
      ],
      suggestedScaffold: [
        "Dear Hotel Manager,",
        "I am writing this letter to express my deep dissatisfaction regarding my stay at your hotel from...",
        "First of all, contrary to the description on your official website, the room was...",
        "I expect to receive a written explanation and an appropriate refund within seven days.",
      ],
    },
    speakingTask: {
      part: 1,
      topic: "Travel & Transport",
      prepTimeSeconds: 0,
      speakTimeSeconds: 100,
      questionsOrCueCard: [
        "What form of transport do you rely on most frequently?",
        "Do you prefer traveling alone or in a group?",
        "What are the major traffic issues facing your city?",
        "How do you anticipate public transportation will evolve in the future?",
      ],
      goldenTips: "Khi so sánh đi du lịch một mình vs theo nhóm, hãy dùng liên từ đối lập: 'While traveling alone offers autonomy, group travel provides a greater sense of security.'",
      rescuePhrases: [
        "From my viewpoint, both options have their own distinct merits...",
        "However, if I were compelled to select one, I would lean towards...",
      ],
    },
    auditChecklist: [
      "Văn phong thư khiếu nại đã lịch sự nhưng kiên quyết chưa?",
      "Đã có câu chốt thời hạn bồi thường chưa?",
      "Speaking có phản xạ so sánh dùng liên từ 'While/Whereas' chưa?",
    ],
  },
  {
    dayNumber: 6,
    weekNumber: 1,
    title: "Thư Hỏi Thông Tin (Inquiry Letter) & Food & Cooking",
    focusBadge: "Inquiry Letter + Pronunciation Drill",
    dailyGoal: "Viết thư hỏi thông tin học bổng tiếng Anh. Sửa phát âm 4 từ hay sai: comfortable, delicious, recipe, vegetable.",
    vocabDrill: {
      theme: "Inquiry & Culinary Arts",
      items: [
        {
          term: "enquire about",
          meaningVi: "hỏi thăm, tìm hiểu thông tin về",
          exampleSentenceEn: "I am writing to enquire about the admission prerequisites for the course.",
          exampleSentenceVi: "Tôi viết thư này để hỏi về các điều kiện nhập học của khóa học.",
        },
        {
          term: "nutritious balanced diet",
          meaningVi: "chế độ ăn uống cân bằng giàu dinh dưỡng",
          exampleSentenceEn: "Maintaining a nutritious balanced diet is paramount to long-term health.",
          exampleSentenceVi: "Duy trì chế độ ăn cân bằng dinh dưỡng là điều tối quan trọng cho sức khỏe.",
        },
        {
          term: "culinary heritage",
          meaningVi: "di sản ẩm thực truyền thống",
          exampleSentenceEn: "Vietnamese street food reflects the rich culinary heritage of the nation.",
          exampleSentenceVi: "Ẩm thực đường phố Việt Nam phản ánh di sản ẩm thực phong phú của dân tộc.",
        },
      ],
    },
    writingTask: {
      taskType: "TASK_1",
      genre: "FORMAL_LETTER",
      timeLimitMinutes: 20,
      title: "Thư hỏi chi tiết về học bổng khóa học tiếng Anh",
      prompt: "You are interested in applying for a short-term English course at an international language academy. Write an email to enquire about course details and scholarship opportunities.",
      bulletPoints: [
        "Nêu trình độ hiện tại và mục tiêu cần đạt chứng chỉ B2",
        "Hỏi về học phí, thời khóa biểu và hình thức học",
        "Hỏi về điều kiện xét tuyển học bổng bán phần/toàn phần",
      ],
      suggestedScaffold: [
        "Dear Admissions Team,",
        "I am writing to formally enquire about the upcoming intensive English training program advertised on your portal.",
        "Could you kindly furnish me with comprehensive information concerning the tuition fees and course schedules?",
        "Thank you in advance for your kind assistance. I look forward to receiving your prompt response.",
      ],
    },
    speakingTask: {
      part: 1,
      topic: "Food & Cooking",
      prepTimeSeconds: 0,
      speakTimeSeconds: 100,
      questionsOrCueCard: [
        "What kinds of food do you take pleasure in eating?",
        "Do you take pleasure in cooking for yourself or others?",
        "Do you reckon traditional cuisine is losing popularity among younger generations?",
        "What are the benefits of eating meals prepared at home?",
      ],
      goldenTips: "Luyện phát âm chuẩn xác: comfortable /ˈkʌmftəbl/ (3 âm tiết, không đọc com-pho-tây-bồ), recipe /ˈresəpi/ (3 âm tiết), vegetable /ˈvedʒtəbl/.",
      rescuePhrases: [
        "To be perfectly honest, homemade culinary delights are far superior to fast food because...",
        "What stands out to me most is...",
      ],
    },
    auditChecklist: [
      "Thư có dùng các câu hỏi gián tiếp lịch sự chưa: 'Could you kindly furnish me with...?'",
      "Đã phát âm chuẩn 4 từ: comfortable, delicious, recipe, vegetable chưa?",
    ],
  },
  {
    dayNumber: 7,
    weekNumber: 1,
    title: "Review & Test Writing Task 1 & Tổng Ôn Speaking Part 1",
    focusBadge: "Week 1 Checkpoint Test (20 Phút)",
    dailyGoal: "Hoàn thành 1 bài Task 1 đúng 18 phút (dành 2 phút soát chính tả). Phản xạ trơn tru 15 câu hỏi Speaking Part 1 không vấp.",
    vocabDrill: {
      theme: "Week 1 Core Collocation Review",
      items: [
        {
          term: "a substantial number of",
          meaningVi: "một số lượng đáng kể (thay cho 'a lot of')",
          exampleSentenceEn: "A substantial number of citizens commute via mass transit daily.",
          exampleSentenceVi: "Một lượng lớn người dân di chuyển bằng phương tiện công cộng mỗi ngày.",
        },
        {
          term: "highly beneficial",
          meaningVi: "cực kỳ có lợi (thay cho 'very good')",
          exampleSentenceEn: "Regular physical exercise is highly beneficial for mental wellbeing.",
          exampleSentenceVi: "Tập thể dục thường xuyên rất có lợi cho sức khỏe tinh thần.",
        },
        {
          term: "exert an adverse impact on",
          meaningVi: "gây tác động tiêu cực lên (thay cho 'bad for')",
          exampleSentenceEn: "Excessive screen time exerts an adverse impact on cognitive development.",
          exampleSentenceVi: "Thời gian sử dụng màn hình quá nhiều gây tác động tiêu cực lên phát triển nhận thức.",
        },
      ],
    },
    writingTask: {
      taskType: "TASK_1",
      genre: "INFORMAL_LETTER",
      timeLimitMinutes: 20,
      title: "Bài thi thử Task 1 Tuần 1: Thư gửi bạn cùng phòng",
      prompt: "You are about to move to a new apartment and need to find a flatmate. Write an email to an acquaintance who is searching for accommodation.",
      bulletPoints: [
        "Miêu tả vị trí căn hộ và các tiện nghi xung quanh",
        "Thông báo chi phí thuê nhà và các khoản phí sinh hoạt hàng tháng",
        "Đề xuất thời gian hẹn gặp trực tiếp để xem phòng",
      ],
      suggestedScaffold: [
        "Bấm giờ nghiêm ngặt đúng 18 phút viết + 2 phút soát chính tả và mạo từ.",
        "Không mở tài liệu mẫu câu để kiểm tra khả năng tự sản sinh ngôn ngữ.",
      ],
    },
    speakingTask: {
      part: 1,
      topic: "Week 1 Mock Sprint",
      prepTimeSeconds: 0,
      speakTimeSeconds: 180,
      questionsOrCueCard: [
        "Can you describe your neighborhood?",
        "What leisure activity do you find most rejuvenating?",
        "How do you typically commence your working day?",
        "Which mode of transportation is most dependable in your locality?",
        "What dish best represents your region's gastronomy?",
      ],
      goldenTips: "Tự đo dead air: Nếu bị ngắt ngứ quá 2 lần trong 1 câu ➔ Bắt buộc dùng ngay: 'Well, to be quite honest...', 'Speaking from my perspective...'",
      rescuePhrases: [
        "Let me reflect on that for a brief moment...",
        "What I mean by this is that...",
      ],
    },
    auditChecklist: [
      "Bài Task 1 viết xong trong 18-20 phút mà không cần tra từ điển hay mẫu câu chưa?",
      "Speaking Part 1 không ngắt quá 2s giữa các ý chưa?",
      "Đã đạt điều kiện hoàn thành tuần 1!",
    ],
  },

  // ==========================================
  // TUẦN 2: MÔ HÌNH LUẬN PEEL & ĐỘT PHÁ SPEAKING PART 2
  // ==========================================
  {
    dayNumber: 8,
    weekNumber: 2,
    title: "Cấu Trúc Mở Bài & Kết Bài Task 2 & Khung Nói Part 2",
    focusBadge: "Writing Task 2 + Speaking Part 2",
    dailyGoal: "Viết 5 cặp Mở bài - Kết bài Task 2. Học thuộc khung 3 bước Speaking Part 2: Khẳng định -> 2 Lý do -> Bác bỏ 2 cái kia.",
    vocabDrill: {
      theme: "Essay Introductions & Conclusions",
      items: [
        {
          term: "increasingly prevalent",
          meaningVi: "ngày càng trở nên phổ biến, thịnh hành",
          exampleSentenceEn: "Online distance education has become increasingly prevalent across the globe.",
          exampleSentenceVi: "Giáo dục từ xa trực tuyến đã trở nên ngày càng phổ biến trên toàn cầu.",
        },
        {
          term: "spark heated debate",
          meaningVi: "làm dấy lên cuộc tranh luận sôi nổi",
          exampleSentenceEn: "The widespread use of AI in classrooms has sparked heated debate among scholars.",
          exampleSentenceVi: "Việc sử dụng rộng rãi AI trong lớp học đã dấy lên tranh luận sôi nổi giữa các học giả.",
        },
      ],
    },
    writingTask: {
      taskType: "TASK_2",
      genre: "PEEL_ESSAY",
      timeLimitMinutes: 20,
      title: "Luyện viết Mở bài & Kết bài cho 5 chủ đề giáo dục và công nghệ",
      prompt: "Luyện viết 5 cặp Mở bài (Paraphrase + Thesis) và Kết bài (Restate + Recommendation) cho các đề bài về: 1) Học trực tuyến, 2) Sử dụng điện thoại trong lớp, 3) AI trong giáo dục, 4) Học ngoại ngữ từ nhỏ, 5) Đi làm thêm khi còn đi học.",
      suggestedScaffold: [
        "Mở bài: Nowadays, [TOPIC] is becoming increasingly prevalent. While some argue that..., I firmly believe that...",
        "Kết bài: In conclusion, although [OPPOSITE VIEW], I am convinced that [MY VIEW] because [REASON 1] and [REASON 2]. Therefore, it is advisable that...",
      ],
    },
    speakingTask: {
      part: 2,
      topic: "Speaking Part 2 Solution Discussion",
      prepTimeSeconds: 60,
      speakTimeSeconds: 120,
      questionsOrCueCard: [
        "Tình huống: Một người bạn của bạn chuẩn bị tổ chức sinh nhật. Có 3 gợi ý quà tặng: Một cuốn sách chuyên ngành, Một chiếc đồng hồ thông minh, Một chuyến dã ngoại ngắn ngày. Bạn chọn phương án nào và tại sao?",
      ],
      goldenTips: "Bắt buộc nói câu mở màn: 'Given the three available options, I would definitely opt for [Option] for the following reasons.' Sau đó nêu 2 ưu điểm của sách và CHỈ RÕ nhược điểm của đồng hồ (đắt) và chuyến đi (khó thu xếp thời gian).",
      rescuePhrases: [
        "Regarding the remaining options, they appear far less viable because...",
        "In stark contrast, my chosen option guarantees that...",
      ],
    },
    auditChecklist: [
      "Mở bài Task 2 đã có câu luận đề (Thesis statement) nêu rõ lập trường chưa?",
      "Kết bài có đưa ra được khuyến nghị (Recommendation) không?",
      "Speaking Part 2 có câu loại trừ 2 phương án đối thủ chưa?",
    ],
  },
  {
    dayNumber: 9,
    weekNumber: 2,
    title: "Thân Bài PEEL 1: Point & Explain & Du Lịch / Địa Điểm",
    focusBadge: "PEEL Point & Explain + Rebuttal Speaking",
    dailyGoal: "Viết 1 đoạn thân bài bàn về lợi ích của E-learning. Thực hành Part 2: Chọn đi biển, bác bỏ leo núi (nguy hiểm) và phố cổ (đông).",
    vocabDrill: {
      theme: "Reasoning & Explanation",
      items: [
        {
          term: "is attributable to",
          meaningVi: "có thể quy cho, bắt nguồn từ nguyên nhân",
          exampleSentenceEn: "The high academic achievement is largely attributable to interactive pedagogical methods.",
          exampleSentenceVi: "Thành tích học tập cao phần lớn bắt nguồn từ các phương pháp giảng dạy tương tác.",
        },
        {
          term: "facilitate self-paced learning",
          meaningVi: "tạo điều kiện cho việc học theo nhịp độ cá nhân",
          exampleSentenceEn: "Digital educational repositories facilitate self-paced learning for busy individuals.",
          exampleSentenceVi: "Kho học liệu số tạo điều kiện cho người bận rộn học theo tốc độ riêng.",
        },
      ],
    },
    writingTask: {
      taskType: "TASK_2",
      genre: "PEEL_ESSAY",
      timeLimitMinutes: 20,
      title: "Viết đoạn thân bài 1 theo mô hình PEEL (Point & Explain)",
      prompt: "Write Body Paragraph 1 (approx 90-110 words) discussing the core advantages of online education for university students.",
      suggestedScaffold: [
        "Point (Câu chủ đề): First and foremost, online education offers remarkable convenience and flexibility.",
        "Explain 1 (Giải thích): This is primarily attributable to the fact that learners are not geographically constrained to physical lecture halls.",
        "Explain 2 (Hậu quả tích cực): As a direct consequence, working adults can seamlessly balance their occupational responsibilities with academic pursuits.",
      ],
    },
    speakingTask: {
      part: 2,
      topic: "Weekend Getaway Location",
      prepTimeSeconds: 60,
      speakTimeSeconds: 120,
      questionsOrCueCard: [
        "Situation: Your friend group wants to organize a weekend getaway to destress after final exams. There are three suggestions: Going to the beach, Mountain trekking, Visiting an ancient town. Which do you think is the best choice and why?",
      ],
      goldenTips: "Bấm giờ 60s nháp: Ghi thật nhanh 2 ưu điểm của biển (relaxing, fresh seafood) và 2 nhược điểm của đối thủ (trekking is perilous/exhausting; ancient town is overcrowded).",
      rescuePhrases: [
        "On the one hand, going to the beach provides an ideal atmosphere to unwind...",
        "On the contrary, mountain trekking might be fraught with hazards for amateurs...",
      ],
    },
    auditChecklist: [
      "Đoạn thân bài có câu chủ đề (Topic sentence) rõ ràng ở đầu đoạn chưa?",
      "Có liên từ giải thích: 'This is primarily because / attributable to' chưa?",
      "Speaking Part 2 nói đủ 1 phút 45 giây đến 2 phút chưa?",
    ],
  },
  {
    dayNumber: 10,
    weekNumber: 2,
    title: "Thân Bài PEEL 2: Example & Link & Chọn Quà Tặng",
    focusBadge: "PEEL Example & Link + Full Essay Assembly",
    dailyGoal: "Ghép hoàn chỉnh 1 bài luận 4 đoạn chủ đề mạng xã hội. Nói Part 2: Chọn sách (tiết kiệm, hữu ích), loại 2 phương án kia.",
    vocabDrill: {
      theme: "Exemplification & Cohesion",
      items: [
        {
          term: "a classic illustration of this is",
          meaningVi: "một minh chứng điển hình cho điều này là",
          exampleSentenceEn: "A classic illustration of this is the excessive addiction to short-form video algorithms.",
          exampleSentenceVi: "Một minh chứng điển hình cho điều này là việc nghiện các thuật toán video ngắn.",
        },
        {
          term: "consequently",
          meaningVi: "hệ quả tất yếu là, do đó",
          exampleSentenceEn: "Consequently, interpersonal face-to-face communication has deteriorated significantly.",
          exampleSentenceVi: "Hệ quả là, giao tiếp trực tiếp mặt đối mặt đã bị suy giảm đáng kể.",
        },
      ],
    },
    writingTask: {
      taskType: "TASK_2",
      genre: "PEEL_ESSAY",
      timeLimitMinutes: 40,
      title: "Bài luận hoàn chỉnh: Tác động của mạng xã hội đến giới trẻ",
      prompt: "Some people believe that social media has revolutionized communication for the better, while others think it has detrimental impacts on youth. Discuss both sides and give your opinion.",
      suggestedScaffold: [
        "Mở bài: Paraphrase + Nêu quan điểm cá nhân.",
        "Thân bài 1: Lợi ích của mạng xã hội (kết nối toàn cầu, tiếp cận kiến thức tức thì).",
        "Thân bài 2: Bất lợi nghiêm trọng (nghiện điện thoại, so sánh xã hội gây trầm cảm).",
        "Kết bài: Tóm tắt 2 mặt + Khuyến nghị cân bằng sử dụng.",
      ],
    },
    speakingTask: {
      part: 2,
      topic: "Gift Selection",
      prepTimeSeconds: 60,
      speakTimeSeconds: 120,
      questionsOrCueCard: [
        "Situation: You want to celebrate your teacher's retirement. Three gift ideas are considered: A pen engraved with their name, A bouquet of flowers, A gift voucher for a bookstore. Which option would you recommend?",
      ],
      goldenTips: "Chọn bút khắc tên vì tính lưu niệm vĩnh viễn (lasting souvenir) và sự trang trọng. Bác bỏ hoa (tàn sau vài ngày) và voucher (thiếu sự gắn kết tình cảm cá nhân).",
      rescuePhrases: [
        "While a bouquet of flowers appears visually charming, it tends to wither rapidly...",
        "An engraved pen, by contrast, serves as a poignant reminder of our appreciation...",
      ],
    },
    auditChecklist: [
      "Bài luận có đủ 4 đoạn: Mở bài - Thân bài 1 - Thân bài 2 - Kết bài?",
      "Số từ đạt trong khoảng 250 - 280 từ chưa?",
      "Speaking Part 2 có dùng các từ liên kết đối lập: 'By contrast', 'In comparison'?",
    ],
  },
  {
    dayNumber: 11,
    weekNumber: 2,
    title: "Dạng Luận Opinion (Agree or Disagree) & Học Tập & Kỹ Năng",
    focusBadge: "Opinion Essay + Summer Skill Part 2",
    dailyGoal: "Lập dàn ý 2 luận điểm mạnh cho đề: 'Học sinh nên mặc đồng phục'. Ghi âm Part 2 bấm chuẩn 1 phút nháp và 2 phút nói liên tục.",
    vocabDrill: {
      theme: "Opinion Stance & School Life",
      items: [
        {
          term: "foster a sense of equality",
          meaningVi: "thúc đẩy cảm giác bình đẳng giữa học sinh",
          exampleSentenceEn: "School uniforms foster a sense of equality among pupils irrespective of family wealth.",
          exampleSentenceVi: "Đồng phục học sinh thúc đẩy cảm giác bình đẳng bất kể hoàn cảnh giàu nghèo.",
        },
        {
          term: "eliminate peer pressure",
          meaningVi: "xóa bỏ áp lực từ bạn bè đồng trang lứa",
          exampleSentenceEn: "Standardized attire helps eliminate peer pressure concerning expensive fashion brands.",
          exampleSentenceVi: "Trang phục chuẩn hóa giúp xóa bỏ áp lực đua đòi theo các nhãn hiệu thời trang đắt tiền.",
        },
      ],
    },
    writingTask: {
      taskType: "TASK_2",
      genre: "OPINION",
      timeLimitMinutes: 40,
      title: "Dạng Opinion: Đồng phục học đường có nên bắt buộc?",
      prompt: "All high school students should be required to wear school uniforms. To what extent do you agree or disagree with this statement?",
      suggestedScaffold: [
        "Chiến lược B2: Đồng ý hoàn toàn (100% Agree) để tối ưu thời gian viết và tính nhất quán.",
        "Thân bài 1: Thúc đẩy sự bình đẳng và giảm bớt gánh nặng tài chính cho phụ huynh.",
        "Thân bài 2: Nâng cao kỷ luật trường học và tạo sự an toàn, dễ nhận diện học sinh.",
      ],
    },
    speakingTask: {
      part: 2,
      topic: "Summer Skill Acquisition",
      prepTimeSeconds: 60,
      speakTimeSeconds: 120,
      questionsOrCueCard: [
        "Situation: A student wants to enroll in a summer course to enhance practical life skills. Three options are proposed: A foreign language course, Swimming lessons, Cooking classes. Which should they choose and why?",
      ],
      goldenTips: "Chọn bơi lội (kỹ năng sinh tồn sống còn phòng chống đuối nước + tăng cường thể lực). Bác bỏ ngoại ngữ (học quanh năm ở trường được) và nấu ăn (tự học trên YouTube được).",
      rescuePhrases: [
        "Swimming is not merely a recreational sport, but an indispensable survival skill...",
        "With regards to cooking or language acquisition, both can readily be acquired autonomously via internet tutorials...",
      ],
    },
    auditChecklist: [
      "Luận điểm có nghiêng hẳn về một phía (đồng ý hoàn toàn) không?",
      "Cả 2 thân bài có tập trung chứng minh cho quan điểm đó không?",
      "Speaking Part 2 có giải thích được tại sao 2 kỹ năng kia 'học sau được'?",
    ],
  },
  {
    dayNumber: 12,
    weekNumber: 2,
    title: "Dạng Luận Discussion (Both Views) & Công Việc & Nghề Nghiệp",
    focusBadge: "Discussion Essay + Career Choice Part 2",
    dailyGoal: "Viết bài luận 250 từ: Làm việc tại nhà (WFH) vs tại văn phòng. Luyện phản xạ so sánh Speaking Part 2.",
    vocabDrill: {
      theme: "Workplace & Occupational Dynamics",
      items: [
        {
          term: "strike a balance between",
          meaningVi: "đạt được sự cân bằng hài hòa giữa",
          exampleSentenceEn: "Telecommuting allows professionals to strike a balance between work and family life.",
          exampleSentenceVi: "Làm việc từ xa cho phép các chuyên gia cân bằng giữa công việc và gia đình.",
        },
        {
          term: "in-person collaboration",
          meaningVi: "sự hợp tác trực tiếp mặt đối mặt",
          exampleSentenceEn: "Physical office environments facilitate spontaneous in-person collaboration.",
          exampleSentenceVi: "Môi trường văn phòng trực tiếp tạo điều kiện cho sự hợp tác mặt đối mặt ngẫu hứng.",
        },
      ],
    },
    writingTask: {
      taskType: "TASK_2",
      genre: "DISCUSSION",
      timeLimitMinutes: 40,
      title: "Dạng Discussion: Làm việc tại nhà (WFH) hay tại văn phòng?",
      prompt: "Some people prefer working from home, while others believe that working in a traditional office is more effective. Discuss both views and give your opinion.",
      suggestedScaffold: [
        "Thân bài 1: Phân tích mặt mạnh của WFH (tiết kiệm thời gian di chuyển, linh hoạt giờ giấc).",
        "Thân bài 2: Phân tích tính ưu việt của văn phòng (tính kỷ luật, bảo mật dữ liệu, văn hóa đồng đội).",
        "Opinion: Mô hình làm việc kết hợp (Hybrid model) là giải pháp lý tưởng nhất.",
      ],
    },
    speakingTask: {
      part: 2,
      topic: "Career Pathway",
      prepTimeSeconds: 60,
      speakTimeSeconds: 120,
      questionsOrCueCard: [
        "Situation: A university graduate is contemplating three employment options: Working for a large multinational corporation, Starting their own startup, Working as a freelancer. What would you recommend?",
      ],
      goldenTips: "Chọn tập đoàn lớn (ổn định, đào tạo bài bản, bảo hiểm đầy đủ). Bác bỏ startup (tỷ lệ phá sản 90%) và freelancer (thu nhập bấp bênh, thiếu kỷ luật).",
      rescuePhrases: [
        "While freelancing confers flexibility, it suffers from severe financial volatility...",
        "A large enterprise, on the contrary, provides comprehensive mentorship and job security...",
      ],
    },
    auditChecklist: [
      "Bài thảo luận đã phân tích công bằng cả 2 mặt trước khi chốt quan điểm chưa?",
      "Speaking Part 2 có dùng cấu trúc 'While A provides..., it lacks B' chưa?",
    ],
  },
  {
    dayNumber: 13,
    weekNumber: 2,
    title: "Kỹ Thuật Viết Câu Phức Ăn Điểm B2 & Hoạt Động Tập Thể",
    focusBadge: "Complex Sentence Master + Impromptu Speaking",
    dailyGoal: "Nâng cấp 5 câu đơn thành câu phức cao cấp (If loại 2, Although, In spite of). Ghi âm Part 2 không nhìn kịch bản.",
    vocabDrill: {
      theme: "B2 Advanced Connectors",
      items: [
        {
          term: "notwithstanding the fact that",
          meaningVi: "mặc dù thực tế là (dạng nâng cấp của although)",
          exampleSentenceEn: "Notwithstanding the fact that remote work is convenient, it can induce isolation.",
          exampleSentenceVi: "Mặc dù làm việc từ xa rất tiện lợi, nó có thể gây ra cảm giác cô lập.",
        },
        {
          term: "were individuals to",
          meaningVi: "nếu như mọi người (đảo ngữ điều kiện loại 2)",
          exampleSentenceEn: "Were individuals to exercise daily, lifestyle diseases would diminish.",
          exampleSentenceVi: "Nếu mọi người tập thể dục hàng ngày, các căn bệnh lối sống sẽ giảm bớt.",
        },
      ],
    },
    writingTask: {
      taskType: "TASK_2",
      genre: "PEEL_ESSAY",
      timeLimitMinutes: 30,
      title: "Thực hành nâng cấp câu đơn thành câu phức ăn điểm B2",
      prompt: "Viết lại 5 câu đơn sau thành các cấu trúc phức B2: 1) Nhiều người dùng điện thoại vì nó tiện. 2) Ô tô gây ô nhiễm nhưng mọi người vẫn mua. 3) Nếu chính phủ đầu tư công viên, người dân sẽ khỏe hơn. 4) Sinh viên học chăm để có việc tốt. 5) Du lịch phát triển nhưng môi trường bị hủy hoại.",
      suggestedScaffold: [
        "Cấu trúc nhượng bộ: In spite of / Despite the fact that [S+V], [Main clause].",
        "Câu điều kiện loại 2: If the municipal government were to allocate funds to..., public health would improve substantially.",
      ],
    },
    speakingTask: {
      part: 2,
      topic: "Class Bonding Activity",
      prepTimeSeconds: 60,
      speakTimeSeconds: 120,
      questionsOrCueCard: [
        "Situation: Your class committee wants to organize an end-of-term bonding activity. Three options are proposed: Having a picnic in the park, Going to the cinema together, Having a dinner party at a restaurant. Which option would be most cohesive?",
      ],
      goldenTips: "Nói hoàn toàn không nhìn kịch bản giấy. Chọn dã ngoại ngoài công viên vì có không gian chơi team building và trò chuyện tự do. Bác bỏ xem phim (tối thui, không ai nói chuyện) và ăn nhà hàng (ồn ào, đắt).",
      rescuePhrases: [
        "A cinema trip is utterly unsuitable for fostering camaraderie because attendees must remain silent throughout...",
        "A restaurant dinner, while pleasant, tends to be cost-prohibitive for students...",
      ],
    },
    auditChecklist: [
      "Bài viết đã xuất hiện ít nhất 2 câu phức chuẩn chỉnh chưa?",
      "Bài nói Part 2 đã tự tin nói trôi chảy mà không cần liếc kịch bản giấy?",
    ],
  },
  {
    dayNumber: 14,
    weekNumber: 2,
    title: "Mock Test Writing Task 2 & Tổng Ôn Speaking Part 2",
    focusBadge: "Week 2 Checkpoint Test (40 Phút)",
    dailyGoal: "Viết 1 bài luận Task 2 hoàn chỉnh trong đúng 40 phút. Bốc 2 tình huống Speaking Part 2 bất ngờ và xử lý trôi chảy.",
    vocabDrill: {
      theme: "Week 2 Synthesis & Academic Precision",
      items: [
        {
          term: "tackle this pressing issue",
          meaningVi: "giải quyết vấn đề cấp bách này (thay cho solve the problem)",
          exampleSentenceEn: "Urgent measures must be taken to tackle this pressing environmental issue.",
          exampleSentenceVi: "Cần phải có các biện pháp khẩn cấp để giải quyết vấn đề môi trường cấp bách này.",
        },
        {
          term: "play a pivotal role in",
          meaningVi: "đóng vai trò nòng cốt trong (thay cho very important)",
          exampleSentenceEn: "Education plays a pivotal role in mitigating generational poverty.",
          exampleSentenceVi: "Giáo dục đóng vai trò nòng cốt trong việc giảm nghèo qua nhiều thế hệ.",
        },
      ],
    },
    writingTask: {
      taskType: "TASK_2",
      genre: "PEEL_ESSAY",
      timeLimitMinutes: 40,
      title: "Bài thi thử Task 2 Tuần 2: Tác động của tự động hóa",
      prompt: "Robots and artificial intelligence are expected to replace many human jobs in the coming decades. Do you think this is a positive or negative development?",
      suggestedScaffold: [
        "Bấm giờ 40 phút nghiêm ngặt.",
        "Mục tiêu độ dài: 250 - 275 từ.",
        "Đảm bảo có ít nhất 2 câu phức và 3 cụm từ học thuật B2.",
      ],
    },
    speakingTask: {
      part: 2,
      topic: "Impromptu Solution Handling",
      prepTimeSeconds: 60,
      speakTimeSeconds: 120,
      questionsOrCueCard: [
        "Situation: A local community wants to encourage physical exercise among senior citizens. Three ideas are considered: Building an outdoor gym in the park, Organizing free morning yoga classes, Distributing bicycles. Which do you believe is most practical?",
      ],
      goldenTips: "Chọn lớp yoga sáng miễn phí (nhẹ nhàng, an toàn cho khớp xương người già, có người hướng dẫn). Bác bỏ xe đạp (nguy hiểm té ngã) và phòng gym ngoài trời (thiết bị nặng dễ chấn thương).",
      rescuePhrases: [
        "Taking into account the physiological vulnerability of the elderly...",
        "Bicycles present a considerable risk of severe fractures or traffic accidents...",
      ],
    },
    auditChecklist: [
      "Độ dài bài luận Task 2 có đạt 250 - 280 từ không?",
      "Speaking Part 2 có đủ 3 bước: Khẳng định lựa chọn -> Nêu 2 ưu điểm -> Bác bỏ 2 cái còn lại?",
      "Đã sẵn sàng cho giai đoạn Tuần 3!",
    ],
  },

  // ==========================================
  // TUẦN 3: LUẬN CHỦ ĐỀ KHÓ & THUYẾT TRÌNH MINDMAP PART 3
  // ==========================================
  {
    dayNumber: 15,
    weekNumber: 3,
    title: "Dạng Luận Pros & Cons & Khung Nói Mindmap Part 3",
    focusBadge: "Writing Task 2 + Speaking Part 3",
    dailyGoal: "Viết mở bài + dàn ý đề tài Du lịch đại chúng (Mass tourism). Luyện mẫu câu chuyển nhánh trong sơ đồ tư duy Part 3.",
    vocabDrill: {
      theme: "Tourism & Mindmap Transitions",
      items: [
        {
          term: "mass tourism",
          meaningVi: "du lịch đại chúng ồ ạt",
          exampleSentenceEn: "Unregulated mass tourism has inflicted severe degradation on coastal ecosystems.",
          exampleSentenceVi: "Du lịch đại chúng không được kiểm soát đã tàn phá nghiêm trọng các hệ sinh thái ven biển.",
        },
        {
          term: "moving on to the first aspect",
          meaningVi: "chuyển sang khía cạnh đầu tiên (mẫu câu ăn điểm Part 3)",
          exampleSentenceEn: "Moving on to the first aspect indicated in the mindmap, which is economic prosperity...",
          exampleSentenceVi: "Chuyển sang khía cạnh đầu tiên được thể hiện trên sơ đồ tư duy, đó là sự thịnh vượng kinh tế...",
        },
      ],
    },
    writingTask: {
      taskType: "TASK_2",
      genre: "PROS_CONS",
      timeLimitMinutes: 40,
      title: "Dạng Pros & Cons: Lợi ích và tác hại của Du lịch đại chúng",
      prompt: "In many countries, tourism is flourishing. However, some argue that it damages local culture and the natural environment. Do the advantages of tourism outweigh the disadvantages?",
      suggestedScaffold: [
        "Mở bài: Paraphrase + Khẳng định mặt lợi vượt trội hơn nếu được quản lý bền vững.",
        "Thân bài 1: Tác hại (ô nhiễm rác thải, thương mại hóa văn hóa).",
        "Thân bài 2: Lợi ích vượt trội (tạo việc làm, phát triển hạ tầng, quảng bá di sản).",
        "Kết bài: Tóm tắt và khuyến nghị du lịch sinh thái.",
      ],
    },
    speakingTask: {
      part: 3,
      topic: "Benefits of Reading Books",
      prepTimeSeconds: 60,
      speakTimeSeconds: 180,
      questionsOrCueCard: [
        "Mindmap: Reading books offers various merits.",
        "Branch 1: Vocabulary expansion",
        "Branch 2: Stress relief",
        "Branch 3: Critical thinking enhancement",
        "Branch 4: [Your own ideas]",
      ],
      goldenTips: "Lần lượt nói mở đầu tổng quan, sau đó dùng từ nối chuyển từng nhánh: 'First and foremost, regarding vocabulary expansion...', 'Moving on to the second aspect...'.",
      rescuePhrases: [
        "In light of this, it is undeniable that...",
        "Consequently, avid readers tend to possess superior analytical faculties...",
      ],
    },
    auditChecklist: [
      "Dạng bài Do advantages outweigh disadvantages đã khẳng định bên nào nặng hơn chưa?",
      "Speaking Part 3 đã đi qua đủ 3 nhánh có sẵn trên màn hình chưa?",
    ],
  },
  {
    dayNumber: 16,
    weekNumber: 3,
    title: "Từ Vựng Môi Trường & Kỹ Thuật Thêm 'Own Idea' Part 3",
    focusBadge: "Environmental Vocab + Part 3 Own Idea",
    dailyGoal: "Viết bài luận 250 từ về việc cấm xe máy tại đô thị lớn. Thực hành Part 3 thêm ý riêng thứ 4 để không bị chặn ở B1.",
    vocabDrill: {
      theme: "Environment & Green Transport",
      items: [
        {
          term: "carbon footprint",
          meaningVi: "dấu chân carbon, lượng khí thải nhà kính",
          exampleSentenceEn: "Transitioning to electric vehicles significantly curtails one's carbon footprint.",
          exampleSentenceVi: "Chuyển sang xe điện giúp cắt giảm đáng kể dấu chân carbon của mỗi người.",
        },
        {
          term: "traffic congestion",
          meaningVi: "tình trạng tắc nghẽn giao thông",
          exampleSentenceEn: "Traffic congestion during rush hours inflicts billions in economic losses annually.",
          exampleSentenceVi: "Ùn tắc giao thông vào giờ cao điểm gây thiệt hại kinh tế hàng tỷ đồng mỗi năm.",
        },
        {
          term: "exhaust fumes",
          meaningVi: "khí thải độc hại từ động cơ xe cộ",
          exampleSentenceEn: "Toxic exhaust fumes from fossil-fuel engines severely pollute urban air.",
          exampleSentenceVi: "Khí thải độc hại từ động cơ nhiên liệu hóa thạch làm ô nhiễm nặng không khí đô thị.",
        },
      ],
    },
    writingTask: {
      taskType: "TASK_2",
      genre: "OPINION",
      timeLimitMinutes: 40,
      title: "Luận môi trường: Đề xuất cấm xe máy tại các đô thị lớn",
      prompt: "To reduce air pollution and traffic congestion, some governments propose banning motorbikes in major city centers. Do you agree or disagree?",
      suggestedScaffold: [
        "Quan điểm: Không đồng ý cấm hoàn toàn mà nên phát triển xe buýt/tàu điện trước khi cấm.",
        "Thân bài 1: Thừa nhận khí thải xe máy gây ô nhiễm nhưng xe máy là sinh kế của hàng triệu người.",
        "Thân bài 2: Hệ thống giao thông công cộng hiện tại chưa đủ sức gánh vác nhu cầu đi lại.",
      ],
    },
    speakingTask: {
      part: 3,
      topic: "Benefits of Reading Books (With Own Idea)",
      prepTimeSeconds: 60,
      speakTimeSeconds: 200,
      questionsOrCueCard: [
        "Mindmap: Reading books offers various merits.",
        "Branch 1: Vocabulary expansion",
        "Branch 2: Stress relief",
        "Branch 3: Critical thinking enhancement",
        "Branch 4: [Your own ideas] ➔ Gợi ý: Cultivating empathy (Nuôi dưỡng sự thấu cảm)",
      ],
      goldenTips: "Bắt buộc dùng câu thần chú B2: 'In addition to the aforementioned points, from my perspective, cultivating empathy is also worth mentioning because reading diverse stories allows us to understand different perspectives.'",
      rescuePhrases: [
        "In addition to the aforementioned points, from my perspective, [Own Idea] is also worth mentioning because...",
        "This is particularly evident in...",
      ],
    },
    auditChecklist: [
      "Bài luận có sử dụng ít nhất 3 từ vựng môi trường: carbon footprint, exhaust fumes, traffic congestion?",
      "Speaking Part 3 ĐÃ BẮT BUỘC CÓ câu mở đầu nhánh Own Idea chưa?",
    ],
  },
  {
    dayNumber: 17,
    weekNumber: 3,
    title: "Dạng Luận Problem & Solution & Giáo Dục & Giới Trẻ",
    focusBadge: "Problem-Solution + Youth Volunteer Part 3",
    dailyGoal: "Viết bài luận về béo phì ở trẻ em hoặc nghiện game. Nói Part 3 chủ đề Hoạt động tình nguyện đủ 3 nhánh + 1 Own Idea.",
    vocabDrill: {
      theme: "Problems & Policy Solutions",
      items: [
        {
          term: "alleviate this predicament",
          meaningVi: "giảm bớt tình trạng khó khăn/nguy nan này",
          exampleSentenceEn: "Comprehensive educational reforms are urgently required to alleviate this predicament.",
          exampleSentenceVi: "Cần cải cách giáo dục toàn diện ngay lập tức để giảm bớt tình trạng nan giải này.",
        },
        {
          term: "sedentary lifestyle",
          meaningVi: "lối sống lười vận động, ngồi nhiều",
          exampleSentenceEn: "Prolonged screen immersion encourages an unhealthy sedentary lifestyle among children.",
          exampleSentenceVi: "Việc dán mắt vào màn hình quá lâu khuyến khích lối sống lười vận động ở trẻ.",
        },
      ],
    },
    writingTask: {
      taskType: "TASK_2",
      genre: "PROBLEM_SOLUTION",
      timeLimitMinutes: 40,
      title: "Dạng Problem & Solution: Nạn nghiện game online ở giới trẻ",
      prompt: "An increasing number of young individuals spend countless hours playing video games. What are the principal causes of this trend, and what constructive measures can be adopted to resolve it?",
      suggestedScaffold: [
        "Thân bài 1 (Causes): Game được thiết kế gây nghiện cao + Sự thiếu hụt các sân chơi thể thao thực tế.",
        "Thân bài 2 (Solutions): Phụ huynh giám sát thời gian sử dụng thiết bị + Nhà trường tổ chức hoạt động ngoại khóa.",
      ],
    },
    speakingTask: {
      part: 3,
      topic: "Why Young People Should Volunteer",
      prepTimeSeconds: 60,
      speakTimeSeconds: 200,
      questionsOrCueCard: [
        "Mindmap: Merits of Youth Volunteering.",
        "Branch 1: Soft skills development (Communication, Leadership)",
        "Branch 2: Expanding interpersonal social network",
        "Branch 3: Enhancing future career resume (CV)",
        "Branch 4: [Your own ideas] ➔ Gợi ý: Heightening civic responsibility (Nâng cao trách nhiệm công dân)",
      ],
      goldenTips: "Nói rõ ràng từng nhánh, dùng ví dụ cụ thể cho mỗi nhánh: Ví dụ lãnh đạo nhóm tình nguyện giúp cải thiện kỹ năng giải quyết xung đột.",
      rescuePhrases: [
        "Furthermore, engaging in community outreach expands one's interpersonal horizons...",
        "Last but not least, from my own standpoint...",
      ],
    },
    auditChecklist: [
      "Thân bài 1 đã nêu rõ 2 nguyên nhân gốc rễ chưa?",
      "Thân bài 2 đã tương ứng giải quyết triệt để 2 nguyên nhân đó chưa?",
      "Speaking Part 3 nói trơn tru không bị ngắt giữa chừng?",
    ],
  },
  {
    dayNumber: 18,
    weekNumber: 3,
    title: "Từ Vựng Công Nghệ, AI & Xử Lý Câu Hỏi Phụ (Follow-up)",
    focusBadge: "AI Vocab + Follow-up Strategy Part 3",
    dailyGoal: "Viết bài luận: Liệu AI có thay thế giáo viên? Luyện kỹ thuật 'kéo dài thời gian suy nghĩ' khi gặp câu hỏi phụ hóc búa.",
    vocabDrill: {
      theme: "Artificial Intelligence & Automation",
      items: [
        {
          term: "artificial intelligence",
          meaningVi: "trí tuệ nhân tạo",
          exampleSentenceEn: "Artificial intelligence has demonstrated astonishing progress in automating repetitive tasks.",
          exampleSentenceVi: "Trí tuệ nhân tạo đã thể hiện tiến bộ đáng kinh ngạc trong việc tự động hóa tác vụ lặp lại.",
        },
        {
          term: "digital literacy",
          meaningVi: "năng lực số, hiểu biết về công nghệ số",
          exampleSentenceEn: "Cultivating digital literacy is paramount in modern workforce readiness.",
          exampleSentenceVi: "Trau dồi năng lực số là điều tối quan trọng trong việc sẵn sàng làm việc.",
        },
        {
          term: "irreplaceable emotional rapport",
          meaningVi: "mối liên kết cảm xúc không thể thay thế",
          exampleSentenceEn: "Human educators supply irreplaceable emotional rapport that algorithms cannot replicate.",
          exampleSentenceVi: "Giáo viên cung cấp sự gắn kết cảm xúc không thể thay thế mà thuật toán không thể sao chép.",
        },
      ],
    },
    writingTask: {
      taskType: "TASK_2",
      genre: "OPINION",
      timeLimitMinutes: 40,
      title: "Luận Công nghệ: Liệu AI có thể thay thế giáo viên trong tương lai?",
      prompt: "With the rapid advancement of artificial intelligence, some predict that AI will completely replace human teachers in schools. Do you agree or disagree?",
      suggestedScaffold: [
        "Quan điểm: Hoàn toàn phản đối việc AI thay thế giáo viên.",
        "Thân bài 1: AI có thể cung cấp kiến thức và chấm bài nhanh, nhưng không có trí tuệ cảm xúc (EQ).",
        "Thân bài 2: Giáo viên đóng vai trò truyền cảm hứng, rèn luyện nhân cách và hỗ trợ tâm lý cho học sinh.",
      ],
    },
    speakingTask: {
      part: 3,
      topic: "Follow-up Questions on Technology",
      prepTimeSeconds: 10,
      speakTimeSeconds: 120,
      questionsOrCueCard: [
        "Follow-up 1: Should primary school children be prohibited from using smartphones in class?",
        "Follow-up 2: What dangers might emerge if humanity relies excessively on automated algorithms?",
      ],
      goldenTips: "Kỹ thuật câu giờ 3-5s khi máy tính hỏi câu phụ: 'Well, that is undeniably a multifaceted issue that warrants meticulous consideration. Speaking from my perspective...'",
      rescuePhrases: [
        "Well, that is undeniably a multifaceted issue that warrants meticulous consideration...",
        "To put it in another way, excessive dependence might erode critical cognitive capabilities...",
      ],
    },
    auditChecklist: [
      "Bài viết có cụm từ ăn điểm: 'irreplaceable emotional rapport' chưa?",
      "Câu hỏi phụ Speaking đã dùng câu mở đầu kéo dài thời gian suy nghĩ chưa?",
    ],
  },
  {
    dayNumber: 19,
    weekNumber: 3,
    title: "Nâng Cấp Collocations Cho Writing & Sức Khỏe & Đời Sống",
    focusBadge: "Collocations Upgrade + Mental Health Part 3",
    dailyGoal: "Rà soát lại bài viết ngày 16 & 17, thay ít nhất 6 từ đơn bằng collocations. Thuyết trình Part 3 đúng 3 phút 30 giây.",
    vocabDrill: {
      theme: "Mental Health & Wellbeing",
      items: [
        {
          term: "psychological distress",
          meaningVi: "sự căng thẳng, bất ổn tâm lý",
          exampleSentenceEn: "Intense corporate deadlines often induce acute psychological distress in employees.",
          exampleSentenceVi: "Thời hạn công việc gấp gáp thường gây ra căng thẳng tâm lý cấp tính cho nhân viên.",
        },
        {
          term: "strike an optimal balance",
          meaningVi: "đạt được sự cân bằng tối ưu",
          exampleSentenceEn: "Workers must strive to strike an optimal balance between professional duties and self-care.",
          exampleSentenceVi: "Người lao động phải nỗ lực đạt được sự cân bằng tối ưu giữa công việc và chăm sóc bản thân.",
        },
      ],
    },
    writingTask: {
      taskType: "TASK_2",
      genre: "PEEL_ESSAY",
      timeLimitMinutes: 30,
      title: "Biên tập & Nâng cấp từ vựng từ B1 lên B2 cho bài viết cũ",
      prompt: "Lấy bài viết ngày 16 hoặc 17: Thay thế toàn bộ các từ: 'a lot of', 'good', 'bad', 'because', 'help' bằng: 'a substantial number of', 'highly beneficial', 'detrimental', 'attributable to', 'facilitate'.",
      suggestedScaffold: [
        "Kiểm tra tính học thuật: Bài viết không dùng văn nói như 'you know', 'really big', 'a lot'.",
        "Đảm bảo sự đa dạng của liên từ nối đoạn.",
      ],
    },
    speakingTask: {
      part: 3,
      topic: "Improving Mental Health for Corporate Workers",
      prepTimeSeconds: 60,
      speakTimeSeconds: 210,
      questionsOrCueCard: [
        "Mindmap: Measures to alleviate mental exhaustion in corporate workers.",
        "Branch 1: Ergonomic workplace environment",
        "Branch 2: Flexible remote working arrangements",
        "Branch 3: Professional psychological counseling services",
        "Branch 4: [Your own ideas] ➔ Gợi ý: Encouraging regular mandatory vacations",
      ],
      goldenTips: "Duy trì tốc độ nói ổn định từ đầu đến cuối, không nói quá nhanh ở phút đầu rồi đuối dần ở phút thứ 3.",
      rescuePhrases: [
        "Moving forward to the subsequent facet, which pertains to...",
        "A compelling case in point is...",
      ],
    },
    auditChecklist: [
      "Đã thay được ít nhất 6 cụm từ B1 bằng collocations B2 chưa?",
      "Bài nói Part 3 duy trì đủ 3 phút đến 3 phút 20 giây chưa?",
    ],
  },
  {
    dayNumber: 20,
    weekNumber: 3,
    title: "Chiến Thuật Quản Trị 60 Phút & Ghép Nối Speaking Cả 3 Phần",
    focusBadge: "Time Management + Full Speaking 12m",
    dailyGoal: "Thực hành lập dàn ý nhanh 2 Task trong 8 phút. Tự thi thử 1 đề Speaking trọn vẹn 3 phần liên tục 12 phút.",
    vocabDrill: {
      theme: "Time Allocation & Exam Stamina",
      items: [
        {
          term: "time allocation formula",
          meaningVi: "công thức phân bổ thời gian chuẩn",
          exampleSentenceEn: "Mastering the time allocation formula guarantees that you never run out of time.",
          exampleSentenceVi: "Nắm vững công thức phân bổ thời gian đảm bảo bạn không bao giờ bị thiếu giờ.",
        },
      ],
    },
    writingTask: {
      taskType: "TASK_2",
      genre: "PEEL_ESSAY",
      timeLimitMinutes: 40,
      title: "Luyện lập dàn ý thần tốc cho 2 đề Task 1 và Task 2",
      prompt: "Bấm giờ 8 phút: Viết dàn ý chi tiết (bullet points + luận điểm 1, 2 + ví dụ) cho 1 đề thư phàn nàn và 1 đề luận về ô nhiễm môi trường đô thị.",
      suggestedScaffold: [
        "3 phút đọc đề và gạch chân từ khóa chính.",
        "5 phút phác thảo luận điểm và dẫn chứng ra giấy nháp trước khi gõ phím.",
      ],
    },
    speakingTask: {
      part: "FULL_MOCK",
      topic: "Full Speaking Test 12 Minutes",
      prepTimeSeconds: 60,
      speakTimeSeconds: 600,
      questionsOrCueCard: [
        "Part 1: Travel & Hobbies (3 phút, 6 câu hỏi)",
        "Part 2: Solution Discussion: Gift for Boss retiring (3 phút)",
        "Part 3: Mindmap: Benefits of learning online (4 phút)",
      ],
      goldenTips: "Giả lập phòng thi thật: Bật ghi âm liên tục 12 phút không bấm nút dừng giữa chừng. Giữ khoảng cách micro cách miệng 2-3cm.",
      rescuePhrases: [
        "That covers all the facets of my presentation. I am eager to address any further inquiries.",
      ],
    },
    auditChecklist: [
      "Dàn ý hoàn thành trong đúng 8 phút?",
      "Speaking làm trọn 3 phần không ngắt ghi âm?",
      "Tổng thời lượng nói có đạt mốc 10-12 phút không?",
    ],
  },
  {
    dayNumber: 21,
    weekNumber: 3,
    title: "Thẩm Định Lỗi Sai Kinh Điển & Chỉnh Âm, Ngữ Điệu (Intonation)",
    focusBadge: "Error Auditing + Intonation Mastery",
    dailyGoal: "Chép tay lại 1 bài văn mẫu điểm cao để ngấm cách diễn đạt. Nghe lại các file ghi âm trong tuần, ghi ra sổ 5 từ phát âm sai để sửa.",
    vocabDrill: {
      theme: "Error Auditing Checkpoints",
      items: [
        {
          term: "subject-verb agreement",
          meaningVi: "sự hòa hợp giữa chủ ngữ và động từ",
          exampleSentenceEn: "Subject-verb agreement errors often prevent candidates from reaching band B2.",
          exampleSentenceVi: "Lỗi hòa hợp chủ vị thường ngăn cản thí sinh đạt mốc B2.",
        },
      ],
    },
    writingTask: {
      taskType: "TASK_2",
      genre: "PEEL_ESSAY",
      timeLimitMinutes: 30,
      title: "Chép tay và phân tích bài mẫu B2 điểm cao",
      prompt: "Chép tay một bài văn mẫu điểm cao chủ đề Công nghệ hoặc Giáo dục. Dùng bút màu gạch chân: 1) Câu chủ đề, 2) Từ nối, 3) Collocations, 4) Câu phức.",
      suggestedScaffold: [
        "Việc chép tay kích hoạt trí nhớ cơ bắp và giúp hình thành phản xạ cấu trúc câu tự nhiên.",
      ],
    },
    speakingTask: {
      part: 1,
      topic: "Intonation & Pronunciation Polish",
      prepTimeSeconds: 0,
      speakTimeSeconds: 120,
      questionsOrCueCard: [
        "Luyện ngữ điệu: Lên giọng ở cuối câu hỏi Yes/No, xuống giọng ở cuối câu trần thuật và câu hỏi Wh-.",
        "Nhấn trọng âm vào các từ khóa mang thông tin (Content words: Danh từ, Động từ, Tính từ).",
      ],
      goldenTips: "Nghe lại các bản ghi âm từ Ngày 15 đến Ngày 20. Viết ra đúng 5 từ mình phát âm sai hoặc nuốt âm để phát âm lại mỗi từ 10 lần.",
      rescuePhrases: [],
    },
    auditChecklist: [
      "Đã chép tay bài văn mẫu và phân tích cấu trúc?",
      "Đã ghi ra sổ 5 từ phát âm sai phổ biến của bản thân chưa?",
      "Hoàn thành Tuần 3 bứt phá!",
    ],
  },

  // ==========================================
  // TUẦN 4 & VỀ ĐÍCH: MOCK TEST THỜI GIAN THỰC & TINH CHỈNH
  // ==========================================
  {
    dayNumber: 22,
    weekNumber: 4,
    title: "Full Mock Test Writing Đề Số 1 & Phân Tích Đề Speaking",
    focusBadge: "Full Writing Mock Test 60m",
    dailyGoal: "Làm trọn vẹn Task 1 + Task 2 trên máy tính trong đúng 60 phút. Luyện phản xạ ghi nhanh từ khóa Speaking trong 60s nháp.",
    vocabDrill: {
      theme: "Mock Test Checklist",
      items: [
        {
          term: "rigorous adherence to time",
          meaningVi: "tuân thủ nghiêm ngặt thời gian thi",
          exampleSentenceEn: "Rigorous adherence to time guarantees calm composure under pressure.",
          exampleSentenceVi: "Tuân thủ nghiêm ngặt thời gian thi bảo đảm sự điềm tĩnh dưới áp lực.",
        },
      ],
    },
    writingTask: {
      taskType: "TASK_2",
      genre: "PEEL_ESSAY",
      timeLimitMinutes: 60,
      title: "Full Mock Test Writing Số 1 (Task 1 + Task 2)",
      prompt: "Task 1 (20p): Thư hỏi thông tin khóa học tiếng Anh (120-150 từ).\nTask 2 (40p): Có nên cho phép học sinh tự do đánh giá giáo viên? (250-280 từ).",
      suggestedScaffold: [
        "Đúng 60 phút dừng bút, không dùng từ điển, không xem lại tài liệu.",
      ],
    },
    speakingTask: {
      part: 2,
      topic: "Rapid Keyword Jotting",
      prepTimeSeconds: 60,
      speakTimeSeconds: 120,
      questionsOrCueCard: [
        "Luyện phản xạ nháp: Trong 60s, chỉ ghi 4-5 từ khóa chính + 2 từ nối, không viết cả câu dài.",
      ],
      goldenTips: "Tập nhìn từ khóa nháp để mở miệng nói thành câu ngay lập tức khi máy bắt đầu ghi âm.",
      rescuePhrases: [],
    },
    auditChecklist: [
      "Task 1 >= 130 từ? Task 2 >= 260 từ?",
      "Có câu nào bị lặp từ 'because', 'very', 'good' quá nhiều lần không?",
    ],
  },
  {
    dayNumber: 23,
    weekNumber: 4,
    title: "Chữa Lỗi Chi Tiết Bài Test 1 & Full Mock Speaking 1",
    focusBadge: "Clean Version Writing + Full Speaking 12m",
    dailyGoal: "Viết lại bản sạch (clean version) bài Test 1. Làm trọn bộ Speaking 12 phút liên tục không bấm dừng.",
    vocabDrill: {
      theme: "Self-Correction & Polish",
      items: [
        {
          term: "impeccable fluency",
          meaningVi: "độ trôi chảy hoàn hảo, không tì vết",
          exampleSentenceEn: "Maintaining steady pacing creates the impression of impeccable fluency.",
          exampleSentenceVi: "Duy trì tốc độ đều đặn tạo ấn tượng về sự lưu loát hoàn hảo.",
        },
      ],
    },
    writingTask: {
      taskType: "TASK_2",
      genre: "PEEL_ESSAY",
      timeLimitMinutes: 40,
      title: "Chữa lỗi & Hoàn thiện bản Clean Version cho Đề Test 1",
      prompt: "Gõ lại bài viết ngày hôm qua: Sửa triệt để các lỗi sai mạo từ, chia động từ, và thay thế ít nhất 4 từ đơn bằng cụm collocations nâng cao.",
      suggestedScaffold: [
        "Bản Clean Version là bài mẫu chuẩn của chính bạn để ôn lại trước ngày thi.",
      ],
    },
    speakingTask: {
      part: "FULL_MOCK",
      topic: "Full Mock Test Speaking Đề 1",
      prepTimeSeconds: 60,
      speakTimeSeconds: 600,
      questionsOrCueCard: [
        "Part 1: Sports & Daily Routine (6 câu)",
        "Part 2: Situation: Selecting a vehicle for college student (Bicycle, Motorbike, Public Bus)",
        "Part 3: Mindmap: Benefits of learning a foreign language",
      ],
      goldenTips: "Kiểm tra thời gian Part 2: Đảm bảo nói tối thiểu 1 phút 40 giây đến 1 phút 55 giây.",
      rescuePhrases: [],
    },
    auditChecklist: [
      "Đã có bản viết lại sạch đẹp (clean version) của bài Test 1?",
      "Speaking Part 2 có nói đủ tối thiểu 1 phút 40 giây?",
    ],
  },
  {
    dayNumber: 24,
    weekNumber: 4,
    title: "Full Mock Test Writing Đề Số 2 & Luyện Kỹ Năng Ứng Biến",
    focusBadge: "Mock Test Writing 60m + Paraphrase Improvisation",
    dailyGoal: "Bấm giờ 60 phút làm Đề Test 2. Luyện kỹ năng ứng biến đoán nghĩa ngữ cảnh khi gặp từ mới trong đề Speaking.",
    vocabDrill: {
      theme: "Contextual Improvisation",
      items: [
        {
          term: "cultural preservation",
          meaningVi: "bảo tồn di sản văn hóa truyền thống",
          exampleSentenceEn: "Cultural preservation must go hand in hand with economic modernization.",
          exampleSentenceVi: "Bảo tồn văn hóa phải song hành cùng hiện đại hóa kinh tế.",
        },
      ],
    },
    writingTask: {
      taskType: "TASK_2",
      genre: "PEEL_ESSAY",
      timeLimitMinutes: 60,
      title: "Full Mock Test Writing Đề 2: Bảo tồn văn hóa vs Phát triển kinh tế",
      prompt: "Some argue that preserving historical buildings is a waste of money, and governments should invest in modern housing instead. Discuss both views and give your opinion.",
      suggestedScaffold: [
        "Dành đúng 5 phút cuối rà soát chính tả và mạo từ.",
      ],
    },
    speakingTask: {
      part: 2,
      topic: "Improvisation & Paraphrasing Skills",
      prepTimeSeconds: 60,
      speakTimeSeconds: 120,
      questionsOrCueCard: [
        "Tập cách nói vòng (Paraphrase) khi quên một từ cụ thể: Ví dụ quên từ 'veterinarian' thì nói 'a doctor specializing in treating animals'.",
      ],
      goldenTips: "Tuyệt đối không dừng lại ngập ngừng quá 3s để tìm từ. Hãy giải thích bằng từ đơn giản hơn.",
      rescuePhrases: [
        "What I mean by this is...",
        "To express it in layman's terms...",
      ],
    },
    auditChecklist: [
      "Bài viết đã rà soát lỗi chính tả trong 5 phút cuối chưa?",
      "Khi quên từ vựng trong bài nói có biết cách diễn đạt vòng không?",
    ],
  },
  {
    dayNumber: 25,
    weekNumber: 4,
    title: "Chữa Lỗi Chi Tiết Bài Test 2 & Full Mock Speaking 2 (Giả Lập Tiếng Ồn)",
    focusBadge: "Noise Simulation Speaking Test",
    dailyGoal: "Tự chấm điểm bài viết theo bảng rubric chuẩn B2. Thi Speaking có bật âm thanh giả lập tiếng ồn phòng thi.",
    vocabDrill: {
      theme: "Focus & Stamina Under Noise",
      items: [
        {
          term: "unwavering concentration",
          meaningVi: "sự tập trung cao độ, không bị phân tâm",
          exampleSentenceEn: "Maintaining unwavering concentration despite ambient room noise is key.",
          exampleSentenceVi: "Duy trì sự tập trung cao độ bất chấp tiếng ồn xung quanh là chìa khóa.",
        },
      ],
    },
    writingTask: {
      taskType: "TASK_2",
      genre: "PEEL_ESSAY",
      timeLimitMinutes: 40,
      title: "Chữa lỗi & Cải thiện Cohesion & Coherence cho Bài Test 2",
      prompt: "Rà soát tính liên kết đoạn: Các câu đã chuyển tiếp mượt mà chưa? Có dùng từ nối linh hoạt thay vì lặp từ không?",
      suggestedScaffold: [
        "Kiểm tra lại 4 tiêu chí: Task Fulfillment, Coherence, Vocabulary, Grammar.",
      ],
    },
    speakingTask: {
      part: "FULL_MOCK",
      topic: "Speaking Test Under Background Noise Simulation",
      prepTimeSeconds: 60,
      speakTimeSeconds: 600,
      questionsOrCueCard: [
        "Bật video YouTube tiếng ồn phòng thi hoặc tiếng người nói rì rầm ở mức vừa phải.",
        "Đeo tai nghe sát tai, điều chỉnh micro ngang mép miệng, nói với âm lượng tự tin, to rõ và đều đặn.",
      ],
      goldenTips: "Mắt chỉ nhìn chằm chằm vào màn hình, không quay sang nhìn xung quanh khi người khác nói to.",
      rescuePhrases: [],
    },
    auditChecklist: [
      "Đã tự chấm bài viết theo đúng 4 tiêu chí rubric VSTEP B2 chưa?",
      "Âm lượng giọng nói khi ghi âm có to, rõ ràng và dứt khoát không?",
    ],
  },
  {
    dayNumber: 26,
    weekNumber: 4,
    title: "Full Mock Test Writing Đề Số 3 & Full Mock Speaking Đề 3",
    focusBadge: "Tổng Duyệt Phong Độ Thi Thật",
    dailyGoal: "Bài tổng duyệt quan trọng nhất để xác định điểm rơi phong độ. Ghi lại toàn bộ những điểm còn ngập ngừng để khắc phục.",
    vocabDrill: {
      theme: "Peak Performance Readiness",
      items: [
        {
          term: "peak cognitive performance",
          meaningVi: "điểm rơi phong độ trí tuệ cao nhất",
          exampleSentenceEn: "Adequate rest is vital to ensure peak cognitive performance on exam day.",
          exampleSentenceVi: "Nghỉ ngơi đầy đủ là thiết yếu để bảo đảm phong độ trí tuệ tốt nhất vào ngày thi.",
        },
      ],
    },
    writingTask: {
      taskType: "TASK_2",
      genre: "PEEL_ESSAY",
      timeLimitMinutes: 60,
      title: "Full Mock Test Writing Đề 3: Đề thi thật gần đây",
      prompt: "Task 1: Thư phàn nàn dịch vụ giao hàng chậm trễ và hàng bị hư hỏng.\nTask 2: Trẻ em ngày nay chịu quá nhiều áp lực học tập từ phụ huynh và trường học. Phân tích nguyên nhân và giải pháp.",
      suggestedScaffold: [
        "Hoàn thành trọn vẹn cả 2 bài trong đúng 60 phút.",
      ],
    },
    speakingTask: {
      part: "FULL_MOCK",
      topic: "Full Mock Test Speaking Đề 3 (Thời Gian Thực)",
      prepTimeSeconds: 60,
      speakTimeSeconds: 600,
      questionsOrCueCard: [
        "Bốc ngẫu nhiên trọn bộ 3 phần thi nói dưới áp lực thời gian thực của máy tính.",
      ],
      goldenTips: "Ghi âm lại toàn bộ. Đếm xem có bao nhiêu lần bị ngập ngừng quá 2 giây.",
      rescuePhrases: [],
    },
    auditChecklist: [
      "Đây là bài tổng duyệt quan trọng nhất!",
      "Writing cả 2 bài đã đạt độ dài chuẩn chưa?",
      "Speaking có phạm lỗi dead air không?",
    ],
  },
  {
    dayNumber: 27,
    weekNumber: 4,
    title: "Rà Soát & Cố Định Khung Viết Cuối Cùng & Ôn Cụm Từ 'Cứu Nguy'",
    focusBadge: "Locking Core Templates",
    dailyGoal: "Chép tay lại bộ khung mở bài, kết bài và các liên từ chuyển đoạn ruột. Không nạp thêm tài liệu mới gây nhiễu loạn.",
    vocabDrill: {
      theme: "Rescue Phrases Mastery",
      items: [
        {
          term: "that is an intriguing question",
          meaningVi: "đó là một câu hỏi rất thú vị (câu giờ suy nghĩ)",
          exampleSentenceEn: "Well, that is an intriguing question that I haven't pondered much before.",
          exampleSentenceVi: "Đó là một câu hỏi rất thú vị mà tôi chưa từng suy ngẫm nhiều trước đây.",
        },
        {
          term: "a classic illustration of this would be",
          meaningVi: "một minh chứng kinh điển cho điều này sẽ là",
          exampleSentenceEn: "A classic illustration of this would be the rapid proliferation of smart devices.",
          exampleSentenceVi: "Một minh chứng kinh điển cho điều này sẽ là sự bùng nổ của các thiết bị thông minh.",
        },
      ],
    },
    writingTask: {
      taskType: "TASK_1",
      genre: "FORMAL_LETTER",
      timeLimitMinutes: 30,
      title: "Chép tay lại toàn bộ bộ khung 'ruột' Mở - Thân - Kết",
      prompt: "Chép tay lại: 1) Khung thư Formal & Informal, 2) Khung luận Opinion & Discussion & Pros/Cons, 3) Danh sách 8 liên từ chuyển đoạn yêu thích.",
      suggestedScaffold: [
        "Đảm bảo khung bài đã ăn sâu vào tiềm thức, đặt bút xuống là viết ra ngay.",
      ],
    },
    speakingTask: {
      part: 1,
      topic: "Rescue Phrase Drills",
      prepTimeSeconds: 0,
      speakTimeSeconds: 120,
      questionsOrCueCard: [
        "Luyện phản xạ bật ngay câu cứu nguy khi bị nghẽn ý:",
        "1. 'Well, to be quite honest, that's an intriguing question...'",
        "2. 'Let me reflect on that for a brief moment...'",
        "3. 'What I mean by this is that...'",
      ],
      goldenTips: "Luyện nói đi nói lại 3 câu này với ngữ điệu tự nhiên, mượt mà như người bản xứ câu giờ.",
      rescuePhrases: [],
    },
    auditChecklist: [
      "Bộ khung viết đã thuộc làu không cần suy nghĩ?",
      "Các câu cứu nguy Speaking đã thành phản xạ vô điều kiện?",
    ],
  },
  {
    dayNumber: 28,
    weekNumber: 4,
    title: "Tập Gõ Phím Nhanh (Typing Practice) & Nói Thì Thầm",
    focusBadge: "Typing Speed & Voice Preservation",
    dailyGoal: "Gõ lại 1 bài Task 1 và 1 bài Task 2 trên Notepad để quen phím. Nói thì thầm để duy trì cơ miệng và giữ giọng.",
    vocabDrill: {
      theme: "Physical Stamina & Voice Care",
      items: [
        {
          term: "muscle memory",
          meaningVi: "trí nhớ cơ bắp (tay gõ phím nhanh, cơ miệng dẻo)",
          exampleSentenceEn: "Typing practice builds muscle memory on standard computer keyboards.",
          exampleSentenceVi: "Luyện gõ phím xây dựng trí nhớ cơ bắp trên bàn phím máy tính chuẩn.",
        },
      ],
    },
    writingTask: {
      taskType: "TASK_2",
      genre: "PEEL_ESSAY",
      timeLimitMinutes: 30,
      title: "Luyện tốc độ gõ phím trên máy tính (Typing Practice)",
      prompt: "Mở trình soạn thảo, gõ lại bài luận 260 từ ngày 26. Đo thời gian gõ: Đạt tối thiểu 30-35 từ/phút để không bị thiếu giờ trong phòng thi.",
      suggestedScaffold: [
        "Luyện gõ đúng phím, không nhìn bàn phím quá nhiều.",
      ],
    },
    speakingTask: {
      part: 2,
      topic: "Whisper Speaking & Mouth Movement",
      prepTimeSeconds: 0,
      speakTimeSeconds: 120,
      questionsOrCueCard: [
        "Chọn 2 chủ đề Part 1 & Part 2, nói thì thầm với khẩu hình mở to để duy trì cảm giác âm thanh và cơ miệng.",
      ],
      goldenTips: "Uống đủ nước ấm, tránh uống nước đá lạnh hoặc nói quá to gây khản giọng trước ngày thi.",
      rescuePhrases: [],
    },
    auditChecklist: [
      "Tốc độ gõ phím có đạt trên 30 từ/phút không?",
      "Cổ họng khỏe khoắn, không bị đau rát hay khản giọng?",
    ],
  },
  {
    dayNumber: 29,
    weekNumber: 4,
    title: "Thư Giãn Đầu Óc & Giữ Tâm Lý Vững Vàng",
    focusBadge: "Mental Relaxation & Review",
    dailyGoal: "Chỉ đọc lướt lại các bài mẫu điểm cao và ghi chú trong tháng. Nhẩm lại quy trình xử lý từng phần thi.",
    vocabDrill: {
      theme: "Confidence & Serenity",
      items: [
        {
          term: "composed state of mind",
          meaningVi: "trạng thái tâm trí điềm tĩnh, vững vàng",
          exampleSentenceEn: "Entering the testing room with a composed state of mind guarantees optimal recall.",
          exampleSentenceVi: "Bước vào phòng thi với tâm trí điềm tĩnh bảo đảm khả năng gợi nhớ tối ưu.",
        },
      ],
    },
    writingTask: {
      taskType: "TASK_1",
      genre: "INFORMAL_LETTER",
      timeLimitMinutes: 20,
      title: "Đọc lướt và thư giãn (Light Reading)",
      prompt: "Không viết bài mới! Chỉ mở lại 3 bài viết điểm cao nhất của bạn trong 4 tuần qua để ngắm lại cách hành văn tự nhiên.",
      suggestedScaffold: [
        "Tin tưởng vào quá trình khổ luyện 28 ngày qua của bạn.",
      ],
    },
    speakingTask: {
      part: 1,
      topic: "Mental Rehearsal",
      prepTimeSeconds: 0,
      speakTimeSeconds: 60,
      questionsOrCueCard: [
        "Nhẩm trong đầu: Hít sâu ➔ Đọc đề ➔ Ghi nháp từ khóa ➔ Bắt nhịp tự tin ➔ Không sợ tiếng ồn xung quanh.",
      ],
      goldenTips: "Tâm lý tự tin quyết định 30% điểm số Speaking. Hãy mỉm cười khi nói để giọng ấm và tự nhiên hơn.",
      rescuePhrases: [],
    },
    auditChecklist: [
      "Không học nhồi nhét tài liệu mới hôm nay!",
      "Tâm lý thoải mái, tự tin vào công thức đã luyện?",
    ],
  },
  {
    dayNumber: 30,
    weekNumber: 4,
    title: "Tự Tin Khẳng Định Bản Thân & Sẵn Sàng Chinh Phục B2!",
    focusBadge: "Victory Day & Exam Readiness",
    dailyGoal: "Chuẩn bị đầy đủ giấy tờ tùy thân (CCCD), bút chì, thẻ dự thi. Ngủ sớm trước 22h, tự tin bước vào phòng thi và lấy chứng chỉ B2!",
    vocabDrill: {
      theme: "Victory Mindset",
      items: [
        {
          term: "clinch the certificate",
          meaningVi: "nắm chắc, giành lấy chứng chỉ trong tay",
          exampleSentenceEn: "You are thoroughly equipped to clinch the B2 certificate with high honors.",
          exampleSentenceVi: "Bạn đã được trang bị đầy đủ để giành chắc chứng chỉ B2 với điểm số cao.",
        },
      ],
    },
    writingTask: {
      taskType: "TASK_2",
      genre: "PEEL_ESSAY",
      timeLimitMinutes: 10,
      title: "Kiểm tra hành trang cuối cùng",
      prompt: "Nhẩm lại 4 nguyên tắc: 1) Đủ 120-150 từ cho thư, 2) Đủ 250-280 từ cho luận, 3) Có câu phức, 4) Dành 2-3 phút cuối soát mạo từ và chính tả.",
      suggestedScaffold: [
        "Bạn đã hoàn thành 100% lộ trình 30 ngày!",
      ],
    },
    speakingTask: {
      part: "FULL_MOCK",
      topic: "Final Affirmation",
      prepTimeSeconds: 0,
      speakTimeSeconds: 60,
      questionsOrCueCard: [
        "Quy tắc vàng: RÕ RÀNG - ĐÚNG NGỮ PHÁP - ĐỦ Ý - ĐÚNG FORM = CẦM CHẮC B2!",
      ],
      goldenTips: "Ngủ sớm trước 22h. Chúc mừng bạn đã hoàn thành chặng đường bứt phá ngoạn mục!",
      rescuePhrases: [],
    },
    auditChecklist: [
      "CCCD / Thẻ dự thi đã sẵn sàng?",
      "Ngủ trước 22h đêm nay?",
      "Sẵn sàng bứt phá VSTEP B2!",
    ],
  },
];
