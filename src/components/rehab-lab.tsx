"use client";

import { useEffect, useMemo, useState } from "react";
import { challenges, recoveryWeeks, type ChallengeDefinition } from "@/lib/challenges";

type RunStatus = "idle" | "success" | "failure";

type RunSummary = {
  status: RunStatus;
  message: string;
  visiblePassCount: number;
  hiddenPassCount: number;
  performanceMs: number | null;
  details: string[];
};

const STORAGE_KEY = "dev-rehab-lab-progress-v1";

const serialize = (value: unknown): string => {
  if (typeof value === "string") {
    return value;
  }

  return JSON.stringify(value, Object.keys(value as object).sort());
};

const isEqual = (left: unknown, right: unknown): boolean =>
  serialize(left) === serialize(right);

const average = (values: number[]) =>
  Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);

const createRunner = (code: string) => {
  const factory = new Function(
    `"use strict"; ${code}; if (typeof solution !== "function") { throw new Error("solution 함수를 선언해야 합니다."); } return solution;`
  );

  return factory() as (...args: unknown[]) => unknown;
};

const getDefaultCodeMap = () =>
  Object.fromEntries(challenges.map((challenge) => [challenge.id, challenge.starterCode]));

export function RehabLab() {
  const [persistedState] = useState(() => {
    if (typeof window === "undefined") {
      return null;
    }

    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      return null;
    }

    try {
      return JSON.parse(saved) as {
        codeMap?: Record<string, string>;
        completedIds?: string[];
        selectedId?: string;
      };
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
      return null;
    }
  });

  const [selectedId, setSelectedId] = useState(
    persistedState?.selectedId ?? challenges[0].id
  );
  const [codeMap, setCodeMap] = useState<Record<string, string>>(
    persistedState?.codeMap
      ? { ...getDefaultCodeMap(), ...persistedState.codeMap }
      : getDefaultCodeMap
  );
  const [completedIds, setCompletedIds] = useState<string[]>(
    persistedState?.completedIds ?? []
  );
  const [lastRun, setLastRun] = useState<RunSummary>({
    status: "idle",
    message: "문제를 고른 뒤 코드를 작성하고 채점을 실행해 보세요.",
    visiblePassCount: 0,
    hiddenPassCount: 0,
    performanceMs: null,
    details: [],
  });

  const selectedChallenge =
    challenges.find((challenge) => challenge.id === selectedId) ?? challenges[0];

  useEffect(() => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ codeMap, completedIds, selectedId })
    );
  }, [codeMap, completedIds, selectedId]);

  const progressPercent = useMemo(
    () => Math.round((completedIds.length / challenges.length) * 100),
    [completedIds.length]
  );

  const handleCodeChange = (value: string) => {
    setCodeMap((current) => ({
      ...current,
      [selectedChallenge.id]: value,
    }));
  };

  const handleReset = () => {
    setCodeMap((current) => ({
      ...current,
      [selectedChallenge.id]: selectedChallenge.starterCode,
    }));
    setLastRun({
      status: "idle",
      message: "기본 코드로 되돌렸습니다. 다시 천천히 풀어보세요.",
      visiblePassCount: 0,
      hiddenPassCount: 0,
      performanceMs: null,
      details: [],
    });
  };

  const runChallenge = (challenge: ChallengeDefinition, code: string) => {
    try {
      const userSolution = createRunner(code);
      const detailLines: string[] = [];

      const visibleCases = challenge.visibleCases.map((item, index) => {
        const test = challenge.hiddenCases[index];
        const actual = userSolution(...test.args);
        const passed = isEqual(actual, test.expected);
        detailLines.push(
          `${passed ? "통과" : "실패"} | 예시 ${index + 1} | 결과 ${serialize(actual)}`
        );
        return passed;
      });

      const hiddenCases = challenge.hiddenCases.map((test, index) => {
        const actual = userSolution(...test.args);
        const passed = isEqual(actual, test.expected);
        detailLines.push(
          `${passed ? "통과" : "실패"} | 숨은 테스트 ${index + 1} | 기대값 ${serialize(
            test.expected
          )}`
        );
        return passed;
      });

      const benchTimes: number[] = [];
      for (let i = 0; i < 3; i += 1) {
        const start = performance.now();
        userSolution(...challenge.performanceCase.args);
        benchTimes.push(performance.now() - start);
      }
      const benchmark = average(benchTimes);
      const performancePassed = benchmark <= challenge.performanceCase.maxMs;
      detailLines.push(
        `${performancePassed ? "통과" : "주의"} | 성능 ${benchmark}ms / 기준 ${
          challenge.performanceCase.maxMs
        }ms`
      );

      const visiblePassCount = visibleCases.filter(Boolean).length;
      const hiddenPassCount = hiddenCases.filter(Boolean).length;
      const allPassed =
        visiblePassCount === visibleCases.length &&
        hiddenPassCount === hiddenCases.length &&
        performancePassed;

      setLastRun({
        status: allPassed ? "success" : "failure",
        message: allPassed
          ? "좋습니다. 정답과 성능 테스트를 모두 통과했습니다."
          : "아직 한두 군데가 흔들립니다. 예시와 숨은 테스트 결과를 보고 다시 다듬어보세요.",
        visiblePassCount,
        hiddenPassCount,
        performanceMs: benchmark,
        details: detailLines,
      });

      if (allPassed) {
        setCompletedIds((current) =>
          current.includes(challenge.id) ? current : [...current, challenge.id]
        );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "알 수 없는 실행 오류";
      setLastRun({
        status: "failure",
        message: "실행 중 오류가 발생했습니다. 함수 선언과 반환값부터 확인해보세요.",
        visiblePassCount: 0,
        hiddenPassCount: 0,
        performanceMs: null,
        details: [message],
      });
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#ffe8c7_0%,#fff7ef_38%,#f4efe5_100%)] text-slate-900">
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-5 py-8 md:px-8 lg:px-12">
        <section className="grid gap-6 lg:grid-cols-[1.25fr_0.9fr]">
          <div className="overflow-hidden rounded-[32px] border border-amber-950/10 bg-[#fff7ed]/90 p-8 shadow-[0_25px_80px_rgba(120,53,15,0.12)] backdrop-blur">
            <div className="mb-5 inline-flex rounded-full border border-amber-900/15 bg-white/70 px-4 py-1 text-sm font-semibold tracking-[0.2em] text-amber-800 uppercase">
              Dev Rehab Lab
            </div>
            <h1 className="max-w-3xl text-4xl font-black leading-tight tracking-tight text-balance md:text-6xl">
              개발 감각을 천천히 되살리는 코딩 재활 캠프
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-stone-700 md:text-lg">
              오래 쉬었던 개발자가 다시 문제를 읽고, 풀고, 통과시키는 감각을
              되찾도록 설계한 개인 훈련장입니다. 카카오 스타일 문제를 향해
              올라가되, 시작은 가장 기초적인 구현 감각부터 회복합니다.
            </p>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <StatCard label="학습 흐름" value="코스 + 실전 + 채점" />
              <StatCard label="현재 문제" value={`${challenges.length}개 탑재`} />
              <StatCard label="성능 체크" value="브라우저 내 즉시 측정" />
            </div>
          </div>

          <div className="grid gap-5">
            <div className="rounded-[28px] border border-slate-900/10 bg-[#111827] p-6 text-white shadow-[0_20px_70px_rgba(15,23,42,0.26)]">
              <p className="text-sm uppercase tracking-[0.28em] text-amber-200/80">
                Recovery Meter
              </p>
              <p className="mt-4 text-5xl font-black">{progressPercent}%</p>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                {completedIds.length} / {challenges.length} 문제를 통과했습니다.
                반복해서 다시 풀어도 좋습니다. 중요한 건 속도보다 재현성입니다.
              </p>
              <div className="mt-6 h-3 rounded-full bg-white/10">
                <div
                  className="h-3 rounded-full bg-[linear-gradient(90deg,#f59e0b,#fb7185)] transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-900/10 bg-white/85 p-6 shadow-[0_16px_50px_rgba(148,163,184,0.16)]">
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500">
                오늘의 루틴
              </p>
              <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-700">
                <li>1. 문제를 읽고 입력/출력을 먼저 한국어로 적기</li>
                <li>2. 예시를 손으로 추적한 뒤 코드 작성 시작하기</li>
                <li>3. 채점 후 실패 이유를 한 줄 메모 남기기</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-[0.95fr_1.45fr]">
          <div className="grid gap-5">
            <div className="rounded-[28px] border border-slate-900/10 bg-white/85 p-6 shadow-[0_12px_45px_rgba(148,163,184,0.18)]">
              <SectionHeading
                eyebrow="Recovery Course"
                title="4주 재활 코스"
                body="문제를 많이 푸는 것보다, 다시 문제를 읽고 구조화하는 습관을 만드는 데 초점을 맞췄습니다."
              />
              <div className="mt-5 space-y-4">
                {recoveryWeeks.map((week) => (
                  <article
                    key={week.week}
                    className="rounded-3xl border border-slate-900/8 bg-stone-50 p-4"
                  >
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">
                      {week.week}
                    </p>
                    <h3 className="mt-2 text-lg font-bold">{week.title}</h3>
                    <p className="mt-2 text-sm leading-7 text-slate-600">
                      {week.goal}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {week.habits.map((habit) => (
                        <span
                          key={habit}
                          className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600"
                        >
                          {habit}
                        </span>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-900/10 bg-[#172554] p-6 text-white shadow-[0_18px_55px_rgba(30,41,59,0.28)]">
              <SectionHeading
                eyebrow="Pass Criteria"
                title="합격 평가 방식"
                body="프로그래머스처럼 예시 테스트, 숨은 테스트, 성능 확인을 함께 돌립니다."
                dark
              />
              <ul className="mt-5 space-y-3 text-sm leading-7 text-slate-200">
                <li>예시 테스트: 문제 이해 여부 확인</li>
                <li>숨은 테스트: 예외 케이스 처리 확인</li>
                <li>성능 테스트: 불필요한 중첩 반복 여부 확인</li>
                <li>진행도 저장: 브라우저에 자동 저장</li>
              </ul>
            </div>
          </div>

          <section className="rounded-[32px] border border-slate-900/10 bg-white/92 p-6 shadow-[0_18px_70px_rgba(148,163,184,0.22)]">
            <SectionHeading
              eyebrow="Practice Arena"
              title="웹 코딩 인터페이스"
              body="문제를 고르고 바로 코드를 실행해 보세요. 제출은 로컬 브라우저에서만 실행됩니다."
            />

            <div className="mt-6 grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
              <div className="space-y-3">
                {challenges.map((challenge) => {
                  const active = challenge.id === selectedChallenge.id;
                  const completed = completedIds.includes(challenge.id);
                  return (
                    <button
                      key={challenge.id}
                      type="button"
                      onClick={() => setSelectedId(challenge.id)}
                      className={`w-full rounded-[24px] border p-4 text-left transition ${
                        active
                          ? "border-amber-400 bg-amber-50 shadow-[0_10px_30px_rgba(245,158,11,0.18)]"
                          : "border-slate-200 bg-stone-50 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                          {challenge.level}
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                            completed
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-slate-200 text-slate-600"
                          }`}
                        >
                          {completed ? "통과" : "진행 중"}
                        </span>
                      </div>
                      <h3 className="mt-3 text-lg font-bold">{challenge.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {challenge.objective}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {challenge.concepts.map((concept) => (
                          <span
                            key={concept}
                            className="rounded-full bg-white px-2.5 py-1 text-xs text-slate-500"
                          >
                            {concept}
                          </span>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="space-y-4">
                <article className="rounded-[26px] border border-slate-200 bg-[#fffaf5] p-5">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-amber-700">
                      {selectedChallenge.level}
                    </span>
                    <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-white">
                      {selectedChallenge.theme}
                    </span>
                  </div>
                  <h2 className="mt-4 text-3xl font-black tracking-tight">
                    {selectedChallenge.title}
                  </h2>
                  <p className="mt-4 text-sm leading-7 text-slate-700">
                    {selectedChallenge.prompt}
                  </p>
                  <p className="mt-3 text-sm leading-7 text-slate-500">
                    왜 중요하나: {selectedChallenge.whyItMatters}
                  </p>
                  <p className="mt-4 rounded-2xl bg-white px-4 py-3 font-mono text-sm text-slate-700">
                    {selectedChallenge.signature}
                  </p>
                </article>

                <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                  <div className="rounded-[26px] bg-[#101827] p-4 shadow-[0_18px_40px_rgba(15,23,42,0.22)]">
                    <div className="mb-3 flex items-center justify-between text-slate-300">
                      <span className="text-xs font-bold uppercase tracking-[0.2em]">
                        Editor
                      </span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={handleReset}
                          className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold hover:bg-white/10"
                        >
                          초기화
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            runChallenge(selectedChallenge, codeMap[selectedChallenge.id])
                          }
                          className="rounded-full bg-amber-400 px-4 py-1 text-xs font-black text-slate-950 hover:bg-amber-300"
                        >
                          채점 실행
                        </button>
                      </div>
                    </div>
                    <textarea
                      value={codeMap[selectedChallenge.id]}
                      onChange={(event) => handleCodeChange(event.target.value)}
                      spellCheck={false}
                      className="min-h-[420px] w-full resize-y rounded-[22px] border border-white/10 bg-[#0b1120] p-4 font-mono text-sm leading-7 text-slate-100 outline-none ring-0 placeholder:text-slate-500"
                    />
                  </div>

                  <div className="space-y-4">
                    <article className="rounded-[26px] border border-slate-200 bg-stone-50 p-5">
                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                        예시 입출력
                      </p>
                      <div className="mt-4 space-y-3">
                        {selectedChallenge.visibleCases.map((item, index) => (
                          <div
                            key={`${item.inputLabel}-${index}`}
                            className="rounded-2xl bg-white p-3 text-sm leading-7 text-slate-600"
                          >
                            <p>입력: {item.inputLabel}</p>
                            <p>출력: {item.expectedLabel}</p>
                          </div>
                        ))}
                      </div>
                    </article>

                    <article
                      className={`rounded-[26px] border p-5 ${
                        lastRun.status === "success"
                          ? "border-emerald-200 bg-emerald-50"
                          : lastRun.status === "failure"
                            ? "border-rose-200 bg-rose-50"
                            : "border-slate-200 bg-white"
                      }`}
                    >
                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                        채점 결과
                      </p>
                      <h3 className="mt-3 text-xl font-black">{lastRun.message}</h3>
                      <div className="mt-4 grid gap-3 sm:grid-cols-3">
                        <MetricCard
                          label="예시 통과"
                          value={`${lastRun.visiblePassCount}/${selectedChallenge.visibleCases.length}`}
                        />
                        <MetricCard
                          label="숨은 테스트"
                          value={`${lastRun.hiddenPassCount}/${selectedChallenge.hiddenCases.length}`}
                        />
                        <MetricCard
                          label="성능"
                          value={
                            lastRun.performanceMs === null
                              ? "-"
                              : `${lastRun.performanceMs}ms`
                          }
                        />
                      </div>
                      <p className="mt-4 text-sm leading-7 text-slate-600">
                        {selectedChallenge.performanceCase.note}
                      </p>
                      <div className="mt-4 max-h-52 space-y-2 overflow-auto pr-1 text-sm leading-6 text-slate-600">
                        {lastRun.details.map((detail) => (
                          <p
                            key={detail}
                            className="rounded-2xl bg-white/80 px-3 py-2"
                          >
                            {detail}
                          </p>
                        ))}
                      </div>
                    </article>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </section>
      </main>
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  body,
  dark = false,
}: {
  eyebrow: string;
  title: string;
  body: string;
  dark?: boolean;
}) {
  return (
    <div>
      <p
        className={`text-xs font-bold uppercase tracking-[0.24em] ${
          dark ? "text-amber-200/80" : "text-slate-500"
        }`}
      >
        {eyebrow}
      </p>
      <h2 className={`mt-3 text-2xl font-black ${dark ? "text-white" : ""}`}>
        {title}
      </h2>
      <p className={`mt-3 text-sm leading-7 ${dark ? "text-slate-200" : "text-slate-600"}`}>
        {body}
      </p>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[24px] border border-amber-900/8 bg-white p-4">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
        {label}
      </p>
      <p className="mt-3 text-lg font-black text-slate-900">{value}</p>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/90 p-3">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-lg font-black text-slate-900">{value}</p>
    </div>
  );
}
