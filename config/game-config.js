/*
 * Let's rock the road - default game configuration (edit freely).
 *
 * layout    : the 24 path tiles in order (Start and Finish are added automatically).
 *             Allowed values: "question", "rollAgain", "jump3", "back1", "back2",
 *             "choose5".
 *             Default mix = 14 question + 10 function tiles.
 * timer     : answer countdown. A question's own "timeLimit" (seconds) overrides it.
 * questions : main pool. Text fields can be a string or { vi: "...", en: "..." }.
 *             - open-ended : { q, a }                    (host presses Correct / Wrong)
 *             - choices    : { q, choices: [...], answer: <index> }  (auto-marked)
 * tiebreakQuestions : pool used after someone reaches Finish (decides 2nd place).
 */
window.GAME_CONFIG = {
  layout: [
    "question",  //  1
    "question",  //  2
    "question",  //  3
    "rollAgain", //  4
    "jump3",     //  5
    "question",  //  6
    "back1",     //  7
    "rollAgain", //  8
    "question",  //  9
    "question",  // 10
    "back2",     // 11
    "question",  // 12
    "choose5",   // 13
    "question",  // 14
    "back1",     // 15
    "jump3",     // 16
    "question",  // 17
    "question",  // 18
    "jump3",     // 19
    "question",  // 20
    "back1",     // 21
    "question",  // 22
    "question",  // 23
    "question"   // 24
  ],

  timer: { enabled: false, seconds: 30 },

  questions: [
    {"q": "Một trong những lời hứa với khách hàng của thương hiệu Fairfield là: Always make guests feel ___________", "choices": ["Welcome", "Like Family", "Cared for", "Appreciated"], "answer": 0, "a": "Welcome"},
    {"q": "Khách sạn Fairfield đầu tiên mở ở Atlanta, GA vào năm nào?", "choices": ["1983", "1987", "1979", "1990"], "answer": 1, "a": "1987"},
    {"q": "Fairfield được đặt tên theo trang trại của gia đình Marriott. Trang trại đó ở đâu?", "choices": ["Maryland", "Delaware", "Utah", "Virginia"], "answer": 3, "a": "Virginia"},
    {"q": "Một trong những lời hứa với khách hàng của Fairfield là \"Respond promptly to any ______ guests may have\"", "choices": ["Requests", "Concerns", "Needs", "Emergencies"], "answer": 2, "a": "Needs"},
    {"q": "Ai là người nói câu nổi tiếng: \"Take care of associates and they'll take care of the customers\"", "choices": ["Willard Marriott", "J.W. Marriott Jr.", "Alice Marriott", "Arne Sorenson"], "answer": 1, "a": "J.W. Marriott Jr."},
    {"q": "Marriott International được thành lập trước thương hiệu Fairfield bao nhiêu năm?", "choices": ["40 năm", "60 năm", "80 năm", "100 năm"], "answer": 1, "a": "60 năm"},
    {"q": "Marriott đã kinh doanh khách sạn ngay từ khi thành lập. Đúng hay Sai?", "choices": ["Đúng", "Sai"], "answer": 1, "a": "Sai"},
    {"q": "Ai là người đồng sáng lập Marriott cùng J. Willard Marriott?", "choices": ["Bill Marriott", "Alice Marriott", "Richard Marriott", "Arne Sorenson"], "answer": 1, "a": "Alice Marriott"},
    {"q": "Khách sạn đầu tiên của Marriott tên là gì?", "choices": ["Marriott Hotel", "Fairfield by Marriott", "Twin Bridges Marriott Motor Hotel", "Courtyard by Marriott"], "answer": 2, "a": "Twin Bridges Marriott Motor Hotel"},
    {"q": "Hãy kể tên 2 khách sạn thuộc dòng Chọn Lọc (Select) đang có mặt tại Việt Nam?", "a": "Fairfield by Marriott South Binh Duong; Courtyard by Marriott Danang Han River; Four Points by Sheraton Nha Trang; Four Points by Sheraton Da Nang"},
    {"q": "Chương trình đào tạo về dịch vụ của Fairfield by Marriott có tên là gì?", "choices": ["Brilliant Service", "Shaping Services", "Heart of Service", "Spirit to Serve"], "answer": 1, "a": "Shaping Services"},
    {"q": "Fairfield by Marriott cam kết mang đến cho khách hàng trải nghiệm như thế nào?", "choices": ["Sang trọng và xa hoa", "Đơn giản, đáng tin cậy và thân thiện", "Độc đáo và khác biệt", "Hiện đại và công nghệ cao"], "answer": 1, "a": "Đơn giản, đáng tin cậy và thân thiện"},
    {"q": "Fairfield by Marriott thuộc phân khúc thương hiệu nào của Marriott International?", "choices": ["Luxury", "Premium", "Select Service", "Extended Stay"], "answer": 2, "a": "Select Service"},
    {"q": "\"Chúng ta luôn cam kết xây dựng sự đoàn kết trong đội ngũ thông qua ______ và ______.\"", "choices": ["Hợp tác - Đổi mới", "Tôn trọng - Tin tưởng", "Ghi nhận - Khen thưởng", "Trách nhiệm - Cam kết"], "answer": 1, "a": "Tôn trọng - Tin tưởng"},
    {"q": "Đâu KHÔNG phải là một phần của Fairfield Guest Promise?", "choices": ["Làm khách cảm thấy được chào đón", "Duy trì tiêu chuẩn chất lượng cao nhất", "Phản hồi nhanh chóng nhu cầu của Khách", "Cung cấp dịch vụ xa hoa và sang trọng"], "answer": 3, "a": "Cung cấp dịch vụ xa hoa và sang trọng"}
  ],

  // empty = tie-breaks reuse the main questions
  tiebreakQuestions: []
};
