/* Vietnamese / English strings and the language switch. */
(function (root) {
  'use strict';

  var D = {
    vi: {
      app_title: "Let's rock the road",
      btn_questions: 'Câu hỏi & ô', btn_newgame: 'Ván mới', btn_fullscreen: 'Toàn màn hình',
      setup_title: 'Thiết lập đội chơi', setup_hint: 'Từ 2 đến 6 đội. Mỗi đội chọn tên, màu và nhân vật.',
      team_name: 'Tên đội', add_team: '+ Thêm đội', remove: 'Xóa',
      shuffle_order: 'Xáo trộn thứ tự chơi', timer_on: 'Bật đồng hồ trả lời', seconds: 'giây',
      start_game: 'Bắt đầu chơi', resume_hint: 'Có ván đang chơi dở — đã tự khôi phục.',
      default_team: 'Đội {n}',
      turn_of: 'Lượt của', roll: 'Tung xúc xắc', rolling: 'Đang tung…',
      hint_roll: 'Bấm "Tung xúc xắc" (hoặc phím Space).',
      hint_tile: 'Bấm vào ô đang nhấp nháy để thực hiện (hoặc phím Enter).',
      hint_choose: 'Chọn một trong các ô đang sáng để di chuyển tới.',
      hint_question: 'Đang trả lời câu hỏi…',
      hint_tiebreak: 'Câu hỏi phụ để xác định hạng 2.',
      hint_results: 'Ván chơi đã kết thúc.',
      teams: 'Các đội', tile_n: 'ô {n}', at_start: 'Xuất phát', at_finish: 'Về đích',
      log: 'Nhật ký',
      tile_start: 'Xuất phát', tile_finish: 'Đích', tile_question: 'Câu hỏi',
      tile_rollAgain: '+1 lượt xúc xắc', tile_jump3: 'Bật nhảy 3 ô', tile_back1: 'Lùi 1 ô',
      tile_back2: 'Lùi 2 ô', tile_choose5: 'Chọn 1 trong 5 ô tiếp theo',
      tile_short_rollAgain: '+1 lượt', tile_short_jump3: 'Nhảy 3 ô', tile_short_back1: 'Lùi 1 ô',
      tile_short_back2: 'Lùi 2 ô', tile_short_choose5: 'Chọn 1/5 ô',
      question_for: 'Câu hỏi cho {name}', tiebreak_for: 'Câu hỏi phụ — {name}',
      tiebreak_intro: '{name} về đích đầu tiên! Các đội còn lại trả lời câu hỏi phụ để giành hạng 2.',
      reveal: 'Xem đáp án', answer_label: 'Đáp án', correct: 'Đúng', wrong: 'Sai',
      correct_hint: 'Đúng: giữ nguyên vị trí.', wrong_hint: 'Sai: lùi lại 1 ô.',
      time_left: 'Còn {n}s', time_up: 'Hết giờ!', no_questions: '(chưa có câu hỏi nào)',
      results_title: 'Kết quả', first_place: 'Hạng 1', second_place: 'Hạng 2', others: 'Còn lại', third_place: 'Hạng 3',
      play_again: 'Chơi lại', close: 'Đóng', rank_finished: 'Về đích', btn_sound: 'Âm thanh',
      log_start: 'Bắt đầu ván chơi. {name} đi trước.',
      log_turn: 'Đến lượt {name}.',
      log_roll: '{name} tung được {n}.',
      log_correct: '{name} trả lời đúng, giữ nguyên vị trí.',
      log_wrong: '{name} trả lời sai, lùi 1 ô.',
      log_noquestion: 'Không có câu hỏi nào trong kho — bỏ qua lượt.',
      log_rollagain: '{name} được tung xúc xắc thêm 1 lần!',
      log_rerollcap: '{name} đã được tung thêm 1 lần rồi — hết lượt.',
      log_jump3: '{name} bật nhảy 3 ô.',
      log_back: '{name} lùi {n} ô.',
      log_chain: '{name} rơi vào ô: {tile}!',
      log_choose: '{name} được chọn 1 trong 5 ô tiếp theo.',
      log_chosen: '{name} chọn đi tới ô {n}.',
      log_win: '{name} về đích đầu tiên và giành hạng 1! Các đội còn lại tiếp tục tranh hạng 2.',
      log_tb_correct: '{name} trả lời đúng câu hỏi phụ.',
      log_tb_wrong: '{name} trả lời sai câu hỏi phụ.',
      log_second: '{name} giành hạng 2.',
      ed_title: 'Quản lý câu hỏi & bố cục', ed_tab_main: 'Câu hỏi chính', ed_tab_tb: 'Câu hỏi phụ',
      ed_tab_layout: 'Bố cục ô', ed_search: 'Tìm kiếm…', ed_add: '+ Thêm câu hỏi', ed_edit: 'Sửa', ed_delete: 'Xóa',
      ed_q_vi: 'Câu hỏi (Tiếng Việt)', ed_q_en: 'Câu hỏi (English, tùy chọn)',
      ed_a_vi: 'Đáp án (Tiếng Việt)', ed_a_en: 'Đáp án (English, tùy chọn)',
      ed_choices: 'Các lựa chọn (mỗi dòng một lựa chọn; để trống nếu là câu hỏi mở)',
      ed_correct_idx: 'Số thứ tự lựa chọn đúng', ed_timelimit: 'Giới hạn thời gian (giây, tùy chọn)',
      ed_save: 'Lưu', ed_cancel: 'Hủy', ed_import: 'Nhập JSON', ed_export: 'Xuất JSON',
      ed_reset: 'Khôi phục mặc định', ed_confirm_reset: 'Khôi phục toàn bộ câu hỏi và bố cục về mặc định?',
      ed_confirm_delete: 'Xóa câu hỏi này?', ed_count: '{n} câu hỏi',
      ed_layout_note: 'Bố cục mới sẽ áp dụng cho ván chơi tiếp theo. Ô số 1–24 nằm giữa Xuất phát và Đích.',
      ed_layout_counts: 'Hiện có {q} ô câu hỏi và {f} ô chức năng (mặc định: 14 và 10).',
      ed_import_ok: 'Đã nhập thành công.', ed_import_bad: 'File JSON không hợp lệ: {msg}',
      ed_need_q: 'Cần nhập nội dung câu hỏi.', ed_bad_choice: 'Số thứ tự đáp án đúng không hợp lệ.',
      ed_open: 'Mở', ed_choice_tag: 'trắc nghiệm', ed_open_tag: 'mở',
      confirm_newgame: 'Bắt đầu ván mới? Ván hiện tại sẽ bị bỏ.'
    },
    en: {
      app_title: "Let's rock the road",
      btn_questions: 'Questions & tiles', btn_newgame: 'New game', btn_fullscreen: 'Fullscreen',
      setup_title: 'Team setup', setup_hint: '2 to 6 teams. Pick a name, colour and farmer for each.',
      team_name: 'Team name', add_team: '+ Add team', remove: 'Remove',
      shuffle_order: 'Shuffle turn order', timer_on: 'Enable answer timer', seconds: 'sec',
      start_game: 'Start game', resume_hint: 'A game in progress was restored.',
      default_team: 'Team {n}',
      turn_of: 'Turn:', roll: 'Roll dice', rolling: 'Rolling…',
      hint_roll: 'Press "Roll dice" (or the Space key).',
      hint_tile: 'Click the pulsing tile to trigger it (or press Enter).',
      hint_choose: 'Click one of the highlighted tiles to move there.',
      hint_question: 'Answering a question…',
      hint_tiebreak: 'Tie-breaker question for 2nd place.',
      hint_results: 'The game is over.',
      teams: 'Teams', tile_n: 'tile {n}', at_start: 'Start', at_finish: 'Finished',
      log: 'Log',
      tile_start: 'Start', tile_finish: 'Finish', tile_question: 'Question',
      tile_rollAgain: 'Roll again', tile_jump3: 'Jump forward 3', tile_back1: 'Back 1',
      tile_back2: 'Back 2', tile_choose5: 'Pick 1 of next 5 tiles',
      tile_short_rollAgain: 'Roll again', tile_short_jump3: 'Jump 3', tile_short_back1: 'Back 1',
      tile_short_back2: 'Back 2', tile_short_choose5: 'Pick 1 of 5',
      question_for: 'Question for {name}', tiebreak_for: 'Tie-breaker — {name}',
      tiebreak_intro: '{name} reached the finish first! The other teams answer a tie-breaker for 2nd place.',
      reveal: 'Reveal answer', answer_label: 'Answer', correct: 'Correct', wrong: 'Wrong',
      correct_hint: 'Correct: stay where you are.', wrong_hint: 'Wrong: move back 1 tile.',
      time_left: '{n}s left', time_up: "Time's up!", no_questions: '(no questions yet)',
      results_title: 'Results', first_place: '1st place', second_place: '2nd place', others: 'Others', third_place: '3rd place',
      play_again: 'Play again', close: 'Close', rank_finished: 'Finished', btn_sound: 'Sound',
      log_start: 'Game started. {name} goes first.',
      log_turn: "{name}'s turn.",
      log_roll: '{name} rolled a {n}.',
      log_correct: '{name} answered correctly and stays put.',
      log_wrong: '{name} answered wrong and moves back 1.',
      log_noquestion: 'The question bank is empty — turn skipped.',
      log_rollagain: '{name} rolls again!',
      log_rerollcap: '{name} already had the extra roll — turn over.',
      log_jump3: '{name} jumps forward 3 tiles.',
      log_back: '{name} moves back {n}.',
      log_chain: '{name} lands on: {tile}!',
      log_choose: '{name} may pick 1 of the next 5 tiles.',
      log_chosen: '{name} chose tile {n}.',
      log_win: '{name} reached the finish first and takes 1st! The others play on for 2nd.',
      log_tb_correct: '{name} answered the tie-breaker correctly.',
      log_tb_wrong: '{name} answered the tie-breaker wrong.',
      log_second: '{name} takes 2nd place.',
      ed_title: 'Questions & layout', ed_tab_main: 'Main questions', ed_tab_tb: 'Tie-breaker questions',
      ed_tab_layout: 'Tile layout', ed_search: 'Search…', ed_add: '+ Add question', ed_edit: 'Edit', ed_delete: 'Delete',
      ed_q_vi: 'Question (Vietnamese)', ed_q_en: 'Question (English, optional)',
      ed_a_vi: 'Answer (Vietnamese)', ed_a_en: 'Answer (English, optional)',
      ed_choices: 'Choices (one per line; leave empty for an open-ended question)',
      ed_correct_idx: 'Number of the correct choice', ed_timelimit: 'Time limit (seconds, optional)',
      ed_save: 'Save', ed_cancel: 'Cancel', ed_import: 'Import JSON', ed_export: 'Export JSON',
      ed_reset: 'Reset to defaults', ed_confirm_reset: 'Reset all questions and the layout to the defaults?',
      ed_confirm_delete: 'Delete this question?', ed_count: '{n} questions',
      ed_layout_note: 'A new layout applies to the next game. Tiles 1–24 sit between Start and Finish.',
      ed_layout_counts: 'Currently {q} question tiles and {f} function tiles (default: 14 and 10).',
      ed_import_ok: 'Imported successfully.', ed_import_bad: 'Invalid JSON file: {msg}',
      ed_need_q: 'Please enter the question text.', ed_bad_choice: 'The correct-choice number is invalid.',
      ed_open: 'Open', ed_choice_tag: 'multiple choice', ed_open_tag: 'open',
      confirm_newgame: 'Start a new game? The current game will be discarded.'
    }
  };

  var lang = 'vi';

  function t(key, params) {
    var s = D[lang][key];
    if (s === undefined) s = D.en[key];
    if (s === undefined) return key;
    if (params) s = s.replace(/\{(\w+)\}/g, function (m, n) { return params[n] !== undefined ? params[n] : m; });
    return s;
  }

  /** Pick the current-language text from a string or { vi, en } value. */
  function txt(v) {
    if (v == null) return '';
    if (typeof v === 'string' || typeof v === 'number') return String(v);
    return v[lang] || v.vi || v.en || '';
  }

  function applyStatic() {
    document.documentElement.lang = lang;
    document.title = t('app_title');
    [].forEach.call(document.querySelectorAll('[data-i18n]'), function (el) {
      el.textContent = t(el.getAttribute('data-i18n'));
    });
    [].forEach.call(document.querySelectorAll('[data-i18n-ph]'), function (el) {
      el.setAttribute('placeholder', t(el.getAttribute('data-i18n-ph')));
    });
  }

  root.I18N = {
    t: t, txt: txt, applyStatic: applyStatic,
    get lang() { return lang; },
    set lang(l) { if (D[l]) lang = l; }
  };
})(window);
