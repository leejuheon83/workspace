export default function WorkspacePremiumHero() {
  return (
    <div className="w-full">
      <div className="relative w-full rounded-[36px] border border-white/60 bg-gradient-to-br from-[#eef4ff] via-[#f8fbff] to-[#eef3fb] shadow-[0_20px_60px_rgba(31,41,55,0.10)]">
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[36px]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(120,160,255,0.16),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(160,190,255,0.14),transparent_30%),linear-gradient(to_bottom,rgba(255,255,255,0.35),rgba(255,255,255,0.12))]" />
          <div className="absolute left-10 top-8 h-24 w-24 rounded-full bg-white/35 blur-2xl" />
          <div className="absolute right-16 top-12 h-28 w-28 rounded-full bg-[#dce9ff]/70 blur-2xl" />
          <div className="absolute left-1/2 top-6 -translate-x-1/2">
            <div className="hero-water-inline h-2.5 w-2.5 rounded-full bg-[#eef4ff] shadow-[0_0_14px_rgba(220,235,255,0.95),0_0_36px_rgba(210,228,255,0.65),0_0_64px_rgba(230,242,255,0.4)] ring-1 ring-white/60 motion-reduce:animate-none motion-safe:animate-[heroGlowOrb_4.5s_ease-in-out_infinite]" />
          </div>

          {/* 물결 표면 */}
          <div className="absolute -bottom-[30%] left-1/2 h-[65%] w-[210%] rounded-[50%] bg-gradient-to-t from-[#c4d9ff]/14 via-[#e8f0ff]/06 to-transparent motion-reduce:animate-none animate-[heroSurfaceWave_12s_ease-in-out_infinite]" />
          <div className="absolute -bottom-[34%] left-1/2 h-[58%] w-[195%] rounded-[50%] border border-white/35 bg-gradient-to-t from-white/18 to-transparent shadow-[0_-20px_50px_rgba(200,220,255,0.12)] motion-reduce:animate-none animate-[heroSurfaceWaveSlow_15s_ease-in-out_infinite]" />

          {/* 은은한 빛 이동 */}
          <div className="absolute left-[12%] top-[32%] h-24 w-[76%] rounded-full bg-gradient-to-r from-transparent via-white/30 to-transparent blur-2xl motion-reduce:animate-none animate-[heroShimmerDrift_14s_ease-in-out_infinite]" />

          {/* 물방울 터짐 → 동심 리플 */}
          {(
            [
              { left: "16%", top: "58%", dur: "5.4s", delay: "0s", delay2: "0.4s" },
              { left: "78%", top: "52%", dur: "6.1s", delay: "2.2s", delay2: "2.6s" },
              { left: "44%", top: "68%", dur: "5.8s", delay: "1.1s", delay2: "1.5s" },
              { left: "10%", top: "42%", dur: "6.4s", delay: "3.6s", delay2: "4s" },
              { left: "88%", top: "38%", dur: "5.5s", delay: "4.4s", delay2: "4.8s" },
            ] as const
          ).map((r, i) => (
            <div key={`ripple-${i}`} className="absolute" style={{ left: r.left, top: r.top }}>
              <div className="relative -translate-x-1/2 -translate-y-1/2">
                <div
                  className="hero-water-inline absolute left-1/2 top-1/2 h-[7.25rem] w-[7.25rem] -translate-x-1/2 -translate-y-1/2 origin-center rounded-full border border-sky-200/45 bg-sky-100/[0.07] shadow-[0_0_24px_rgba(200,220,255,0.35),inset_0_0_20px_rgba(255,255,255,0.25)]"
                  style={{
                    animation: `heroRippleBurst ${r.dur} ease-out infinite`,
                    animationDelay: r.delay,
                  }}
                />
                <div
                  className="hero-water-inline absolute left-1/2 top-1/2 h-[7.25rem] w-[7.25rem] -translate-x-1/2 -translate-y-1/2 origin-center rounded-full border border-white/50 shadow-[0_0_32px_rgba(220,232,255,0.45)]"
                  style={{
                    animation: `heroRippleBurst2 ${r.dur} ease-out infinite`,
                    animationDelay: r.delay2,
                  }}
                />
              </div>
            </div>
          ))}

          {/* 작은 방울 코어 */}
          {(
            [
              { left: "18%", top: "40%", delay: "0.3s", dur: "4.2s" },
              { left: "74%", top: "44%", delay: "1.8s", dur: "4.8s" },
              { left: "30%", top: "24%", delay: "3.1s", dur: "4.4s" },
              { left: "91%", top: "52%", delay: "2.4s", dur: "5.1s" },
            ] as const
          ).map((d, i) => (
            <div key={`drop-${i}`} className="absolute" style={{ left: d.left, top: d.top }}>
              <div className="relative -translate-x-1/2 -translate-y-1/2">
                <div
                  className="hero-water-inline h-3 w-3 rounded-full bg-[#eef4ff]/95 shadow-[0_0_16px_rgba(210,228,255,0.95),0_0_36px_rgba(200,220,255,0.55),0_0_56px_rgba(230,240,255,0.35)] ring-2 ring-sky-100/40"
                  style={{
                    animation: `heroDropletCore ${d.dur} ease-in-out infinite`,
                    animationDelay: d.delay,
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="relative z-10 px-10 py-10 md:px-14 md:py-12">
          <div className="grid grid-cols-12 items-start gap-4">
            <div className="col-span-12 flex justify-start md:col-span-2">
              <div className="hero-pill-motion motion-reduce:animate-none inline-block rounded-full border border-white/70 bg-white/70 px-5 py-2 text-sm text-slate-500 shadow-sm backdrop-blur-md motion-safe:animate-[heroPillFloat_6.2s_ease-in-out_infinite]">
                smart flow
              </div>
            </div>
            <div className="col-span-12 flex flex-col items-center overflow-visible px-2 pt-2 text-center md:col-span-8 md:px-4">
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#d9e6ff] bg-white/60 px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-[#6f8fcf] backdrop-blur-md">
                Personal Portal
              </div>

              <h1 className="overflow-visible px-2 text-[48px] font-semibold leading-[1.08] tracking-[-0.04em] text-slate-900 md:text-[64px]">
                <span className="bg-gradient-to-b from-slate-900 via-slate-800 to-slate-600 bg-clip-text text-transparent">
                  Work
                </span>
                <span className="ml-1 inline-block bg-gradient-to-r from-[#7aa7ff] via-[#93b5ff] to-[#c1d4ff] bg-clip-text pb-0.5 pl-0.5 pr-3 font-light italic text-transparent [-webkit-background-clip:text] [background-clip:text] md:pr-4">
                  space
                </span>
              </h1>

              <p className="mt-5 max-w-2xl text-[15px] leading-7 text-slate-500 md:text-[17px]">
                개인 사이트와 자주 쓰는 업무 링크를 감각적으로 정리하고,
                <br className="hidden md:block" />
                더 빠르고 매끄럽게 이동하는 나만의 스마트 허브
              </p>
            </div>
            <div className="col-span-12 flex justify-end md:col-span-2">
              <div className="hero-pill-motion motion-reduce:animate-none inline-block rounded-full border border-white/70 bg-white/70 px-5 py-2 text-sm text-slate-500 shadow-sm backdrop-blur-md motion-safe:animate-[heroPillFloatReverse_6.8s_ease-in-out_infinite] [animation-delay:0.9s]">
                active space
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
