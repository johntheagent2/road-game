/*
 * Fairfield Road - default game configuration (edit freely).
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
    { q: { vi: "Thủ đô của Việt Nam là gì?", en: "What is the capital of Vietnam?" },
      a: { vi: "Hà Nội", en: "Hanoi" } },
    { q: { vi: "Một tuần có bao nhiêu ngày?", en: "How many days are in a week?" },
      choices: ["5", "6", "7", "8"], answer: 2, a: "7" },
    { q: { vi: "Hành tinh nào gần Mặt Trời nhất?", en: "Which planet is closest to the Sun?" },
      a: { vi: "Sao Thủy", en: "Mercury" } },
    { q: { vi: "2 + 2 × 3 = ?", en: "2 + 2 × 3 = ?" },
      choices: ["8", "12", "10", "6"], answer: 0, a: "8", timeLimit: 20 },
    { q: { vi: "Con vật nào được gọi là 'chúa tể rừng xanh'?", en: "Which animal is called the 'king of the jungle'?" },
      a: { vi: "Sư tử (hoặc hổ)", en: "The lion (or tiger)" } },
    { q: { vi: "Nước sôi ở bao nhiêu độ C (ở mực nước biển)?", en: "At what temperature (°C) does water boil at sea level?" },
      choices: ["90", "100", "110", "120"], answer: 1, a: "100" },
    { q: { vi: "Đại dương lớn nhất thế giới?", en: "What is the largest ocean in the world?" },
      a: { vi: "Thái Bình Dương", en: "The Pacific Ocean" } },
    { q: { vi: "Cây xương rồng thường sống ở đâu?", en: "Where do cacti usually live?" },
      choices: [{ vi: "Sa mạc", en: "Desert" }, { vi: "Bắc Cực", en: "Arctic" },
                { vi: "Đại dương", en: "Ocean" }, { vi: "Đầm lầy", en: "Swamp" }], answer: 0,
      a: { vi: "Sa mạc", en: "Desert" } },
    { q: { vi: "Kể tên 3 phương tiện giao thông đường bộ.", en: "Name 3 kinds of road vehicles." },
      a: { vi: "Ví dụ: ô tô, xe máy, xe buýt, xe đạp…", en: "e.g. car, motorbike, bus, bicycle…" } },
    { q: { vi: "Đèn giao thông màu nào báo hiệu phải dừng lại?", en: "Which traffic-light colour means stop?" },
      choices: [{ vi: "Xanh", en: "Green" }, { vi: "Vàng", en: "Yellow" }, { vi: "Đỏ", en: "Red" }],
      answer: 2, a: { vi: "Đỏ", en: "Red" } },
    { q: { vi: "Một năm có bao nhiêu tháng?", en: "How many months are in a year?" },
      a: { vi: "12", en: "12" } },
    { q: { vi: "Ai là tác giả của truyện 'Dế Mèn phiêu lưu ký'?", en: "Who wrote 'Diary of a Cricket' (Dế Mèn phiêu lưu ký)?" },
      a: { vi: "Tô Hoài", en: "Tô Hoài" } },
    { q: { vi: "Hình tam giác có mấy cạnh?", en: "How many sides does a triangle have?" },
      choices: ["2", "3", "4", "5"], answer: 1, a: "3" },
    { q: { vi: "Vali dùng để làm gì khi đi du lịch?", en: "What is a suitcase used for when travelling?" },
      a: { vi: "Đựng hành lý, quần áo, đồ dùng cá nhân", en: "Carrying luggage, clothes and personal items" } }
  ],

  tiebreakQuestions: [
    { q: { vi: "Mặt Trời mọc ở hướng nào?", en: "In which direction does the Sun rise?" },
      a: { vi: "Hướng Đông", en: "East" } },
    { q: { vi: "10 × 10 = ?", en: "10 × 10 = ?" },
      choices: ["20", "100", "1000", "110"], answer: 1, a: "100" },
    { q: { vi: "Con vật nào kêu 'meo meo'?", en: "Which animal says 'meow'?" },
      a: { vi: "Con mèo", en: "The cat" } },
    { q: { vi: "Màu nào có trong cầu vồng: đỏ, đen hay trắng?", en: "Which colour is in a rainbow: red, black or white?" },
      choices: [{ vi: "Đỏ", en: "Red" }, { vi: "Đen", en: "Black" }, { vi: "Trắng", en: "White" }],
      answer: 0, a: { vi: "Đỏ", en: "Red" } },
    { q: { vi: "Việt Nam có bao nhiêu tỉnh thành (sau sáp nhập 2025)?", en: "How many provinces/cities does Vietnam have (after the 2025 merger)?" },
      choices: ["34", "63", "58", "45"], answer: 0, a: "34" }
  ]
};
