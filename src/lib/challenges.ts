export type CourseWeek = {
  week: string;
  title: string;
  goal: string;
  habits: string[];
};

export type ChallengeDefinition = {
  id: string;
  title: string;
  level: "Lv.0" | "Lv.1" | "Lv.2";
  theme: string;
  objective: string;
  whyItMatters: string;
  concepts: string[];
  prompt: string;
  signature: string;
  starterCode: string;
  visibleCases: Array<{
    inputLabel: string;
    expectedLabel: string;
  }>;
  hiddenCases: Array<{
    args: unknown[];
    expected: unknown;
  }>;
  performanceCase: {
    args: unknown[];
    maxMs: number;
    note: string;
  };
  reference: (...args: unknown[]) => unknown;
};

export const recoveryWeeks: CourseWeek[] = [
  {
    week: "1주차",
    title: "문제 공포 해제",
    goal: "배열, 문자열, 조건문을 다시 손에 익히기",
    habits: [
      "입력과 출력 한 줄 요약 적기",
      "코딩 전 예제를 손으로 따라가기",
      "시간복잡도를 한 문장으로 말하기",
    ],
  },
  {
    week: "2주차",
    title: "구현 체력 회복",
    goal: "문제 설명을 작은 규칙으로 나누는 힘 만들기",
    habits: [
      "규칙을 체크리스트로 쪼개기",
      "함수 역할을 먼저 나누기",
      "예외 케이스를 코드 전에 적기",
    ],
  },
  {
    week: "3주차",
    title: "탐색 사고 복구",
    goal: "완전탐색, BFS/DFS의 기본 감각 되살리기",
    habits: [
      "모든 경우를 어떻게 셀지 먼저 쓰기",
      "재귀와 반복 중 쉬운 쪽 택하기",
      "방문 처리 기준 명확히 적기",
    ],
  },
  {
    week: "4주차",
    title: "실전 패턴 탑재",
    goal: "정렬, 해시, 그리디, 이분탐색 패턴 인식하기",
    habits: [
      "정렬 후 처리 가능성 보기",
      "카운팅이면 해시부터 떠올리기",
      "큰 입력이면 O(N^2)부터 의심하기",
    ],
  },
];

const parityReference = (numbers: unknown) => {
  const arr = numbers as number[];
  let even = 0;
  let odd = 0;
  for (const value of arr) {
    if (value % 2 === 0) {
      even += 1;
    } else {
      odd += 1;
    }
  }
  return { even, odd };
};

const digitsReference = (text: unknown) => {
  const input = text as string;
  let result = "";
  for (const ch of input) {
    if (ch >= "0" && ch <= "9") {
      result += ch;
    }
  }
  return result.length === 0 ? "" : Number(result);
};

const parenthesesReference = (text: unknown) => {
  const input = text as string;
  const stack: string[] = [];
  for (const ch of input) {
    if (ch === "(") {
      stack.push(ch);
      continue;
    }
    if (stack.length === 0) {
      return false;
    }
    stack.pop();
  }
  return stack.length === 0;
};

const runLengthReference = (text: unknown) => {
  const input = text as string;
  if (input.length === 0) {
    return "";
  }

  let answer = "";
  let current = input[0];
  let count = 1;

  for (let i = 1; i < input.length; i += 1) {
    if (input[i] === current) {
      count += 1;
      continue;
    }
    answer += `${current}${count}`;
    current = input[i];
    count = 1;
  }

  answer += `${current}${count}`;
  return answer;
};

export const challenges: ChallengeDefinition[] = [
  {
    id: "parity-counter",
    title: "짝수/홀수 카운터",
    level: "Lv.0",
    theme: "배열 순회",
    objective: "정수 배열에서 짝수와 홀수 개수를 각각 세세요.",
    whyItMatters: "가장 기초적인 순회와 조건 분기를 몸에 다시 붙여줍니다.",
    concepts: ["for-of", "조건문", "카운팅"],
    prompt:
      "정수 배열 numbers가 주어집니다. 짝수 개수는 even, 홀수 개수는 odd로 담아 { even, odd } 객체를 반환하세요.",
    signature: "function solution(numbers)",
    starterCode: `function solution(numbers) {\n  let even = 0;\n  let odd = 0;\n\n  // 여기에 코드를 작성하세요.\n\n  return { even, odd };\n}`,
    visibleCases: [
      {
        inputLabel: "[1, 2, 3, 4, 5, 6]",
        expectedLabel: '{ even: 3, odd: 3 }',
      },
      {
        inputLabel: "[2, 4, 8, 10]",
        expectedLabel: '{ even: 4, odd: 0 }',
      },
    ],
    hiddenCases: [
      { args: [[7, 11, 13]], expected: { even: 0, odd: 3 } },
      { args: [[0, 1, 2, 3, 4]], expected: { even: 3, odd: 2 } },
      { args: [[42]], expected: { even: 1, odd: 0 } },
    ],
    performanceCase: {
      args: [Array.from({ length: 120_000 }, (_, index) => index)],
      maxMs: 30,
      note: "12만 개 숫자를 한 번 순회해도 가볍게 통과해야 합니다.",
    },
    reference: parityReference,
  },
  {
    id: "extract-digits",
    title: "문자열에서 숫자 추출",
    level: "Lv.0",
    theme: "문자열 처리",
    objective: "문자열에서 숫자만 뽑아 이어붙이세요.",
    whyItMatters: "카카오 스타일 문자열 문제에서 가장 자주 쓰는 파싱 감각을 회복합니다.",
    concepts: ["문자열 순회", "문자 판별", "누적"],
    prompt:
      "문자열 text에서 숫자 문자만 순서대로 이어붙여 반환하세요. 숫자가 하나도 없으면 빈 문자열을 반환하세요.",
    signature: "function solution(text)",
    starterCode: `function solution(text) {\n  let digits = \"\";\n\n  // 여기에 코드를 작성하세요.\n\n  return digits === \"\" ? \"\" : Number(digits);\n}`,
    visibleCases: [
      { inputLabel: '"ab12c34d"', expectedLabel: "1234" },
      { inputLabel: '"room404"', expectedLabel: "404" },
    ],
    hiddenCases: [
      { args: ["abc"], expected: "" },
      { args: ["0a0b7"], expected: 7 },
      { args: ["2026-kakao-01"], expected: 202601 },
    ],
    performanceCase: {
      args: [`${"code".repeat(25_000)}1234567890`],
      maxMs: 35,
      note: "문자열 길이가 길어져도 한 글자씩 한 번만 보면 됩니다.",
    },
    reference: digitsReference,
  },
  {
    id: "valid-parentheses",
    title: "올바른 괄호 판별",
    level: "Lv.1",
    theme: "스택 기초",
    objective: "괄호 문자열이 올바른지 true/false를 반환하세요.",
    whyItMatters: "스택은 코딩테스트 감각 회복의 핵심 관문입니다.",
    concepts: ["스택", "예외 처리", "조기 종료"],
    prompt:
      "문자열 s는 '(' 와 ')' 로만 이루어져 있습니다. 올바른 괄호 문자열이면 true, 아니면 false를 반환하세요.",
    signature: "function solution(s)",
    starterCode: `function solution(s) {\n  const stack = [];\n\n  // 여기에 코드를 작성하세요.\n\n  return stack.length === 0;\n}`,
    visibleCases: [
      { inputLabel: '"()()()"', expectedLabel: "true" },
      { inputLabel: '"())("', expectedLabel: "false" },
    ],
    hiddenCases: [
      { args: ["((()))"], expected: true },
      { args: [")(()"], expected: false },
      { args: ["(()())()"], expected: true },
    ],
    performanceCase: {
      args: [`${"(".repeat(40_000)}${")".repeat(40_000)}`],
      maxMs: 45,
      note: "8만 글자여도 push/pop만 하면 충분히 통과합니다.",
    },
    reference: parenthesesReference,
  },
  {
    id: "run-length",
    title: "연속 문자 압축 맛보기",
    level: "Lv.2",
    theme: "구현 훈련",
    objective: "연속된 같은 문자를 문자+개수 형식으로 압축하세요.",
    whyItMatters: "카카오 구현 문제에서 자주 나오는 '상태를 유지하며 순회' 패턴을 익힙니다.",
    concepts: ["상태 유지", "마지막 처리", "문자열 빌드"],
    prompt:
      "문자열 text를 왼쪽부터 읽으면서 연속된 같은 문자를 문자와 개수로 압축하세요. 예: aaabbc -> a3b2c1",
    signature: "function solution(text)",
    starterCode: `function solution(text) {\n  if (text.length === 0) {\n    return \"\";\n  }\n\n  let answer = \"\";\n\n  // 여기에 코드를 작성하세요.\n\n  return answer;\n}`,
    visibleCases: [
      { inputLabel: '"aaabbc"', expectedLabel: '"a3b2c1"' },
      { inputLabel: '"abcd"', expectedLabel: '"a1b1c1d1"' },
    ],
    hiddenCases: [
      { args: ["zzzz"], expected: "z4" },
      { args: ["aabccccaaa"], expected: "a2b1c4a3" },
      { args: [""], expected: "" },
    ],
    performanceCase: {
      args: [`${"a".repeat(20_000)}${"b".repeat(20_000)}`],
      maxMs: 50,
      note: "긴 입력에서도 한 번 순회로 끝내는 습관을 확인합니다.",
    },
    reference: runLengthReference,
  },
];
