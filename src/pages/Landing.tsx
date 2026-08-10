import { useNavigate } from "react-router-dom";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#020b18] text-white overflow-hidden">
      {/* Navbar */}
      <nav className="h-20 px-8 md:px-16 flex items-center justify-between border-b border-white/10 bg-[#020b18]/80 backdrop-blur-md">
        <div
          className="text-2xl md:text-3xl font-black tracking-wider cursor-pointer"
          onClick={() => navigate("/")}
        >
          <span className="text-[#f5b82e]">ITH</span>
          <span>ACA</span>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/login")}
            className="px-6 py-2.5 rounded-full border border-[#f5b82e] text-[#f5b82e] hover:bg-[#f5b82e] hover:text-black transition"
          >
            LOGIN
          </button>

          
        </div>
      </nav>

      {/* Hero */}
      <main className="relative min-h-[calc(100vh-80px)] flex items-center">
        {/* Background glow */}
        <div className="absolute inset-0">
          <div className="absolute right-[-10%] top-[10%] w-150 h-[600px] bg-[#f5b82e]/10 rounded-full blur-[150px]" />
          <div className="absolute left-[-10%] bottom-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[150px]" />
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-8 md:px-16 py-20 grid lg:grid-cols-2 gap-12 items-center">
          
          {/* Left */}
          <section>
            <p className="text-[#f5b82e] uppercase tracking-[0.3em] text-sm font-semibold mb-6">
              Your journey. Your progress.
            </p>

            <h1 className="text-5xl md:text-7xl font-black leading-[0.95] tracking-tight">
              Build the life
              <br />
              you're meant to
              <br />
              <span className="text-[#f5b82e]">live.</span>
            </h1>

            <p className="mt-8 text-lg md:text-xl text-gray-400 max-w-xl leading-relaxed">
              Voyage helps you turn your goals into action. Plan your tasks,
              build better habits, protect your focus, and track your progress
              every day.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <button
                onClick={() => navigate("/signup")}
                className="px-8 py-4 rounded-full bg-[#f5b82e] text-black font-bold text-lg hover:bg-[#ffd15c] transition"
              >
                START YOUR VOYAGE →
              </button>

              
            </div>
          </section>

          {/* Right - Visual */}
          <section className="relative hidden lg:flex justify-center items-center">
            <div className="relative w-125 h-[500px]">
              
              {/* Mountain */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2">
                <div
                  className="w-0 h-0
                  border-l-[230px] border-l-transparent
                  border-r-[230px] border-r-transparent
                  border-b-[420px] border-b-[#0d1c30]"
                />

                <div
                  className="absolute bottom-0 left-1/2 -translate-x-1/2
                  w-0 h-0
                  border-l-[120px] border-l-transparent
                  border-r-[120px] border-r-transparent
                  border-b-[220px] border-b-[#152944]"
                />
              </div>

              {/* Path */}
              <div className="absolute left-1/2 bottom-[55px] w-[4px] h-[330px] bg-[#f5b82e] rotate-[18deg] shadow-[0_0_20px_#f5b82e]" />

              {/* Goal */}
              <div className="absolute top-[45px] left-[54%]">
                <div className="w-4 h-4 bg-[#f5b82e] rounded-full shadow-[0_0_25px_#f5b82e]" />
                <div className="absolute top-[-30px] left-2 w-px h-8 bg-[#f5b82e]" />
              </div>

              {/* Focus Card */}
              <div className="absolute top-16 left-0 w-48 p-5 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/15">
                <p className="text-xs text-gray-400 uppercase tracking-wider">
                  Focus Today
                </p>

                <p className="text-4xl font-bold mt-3">
                  120
                  <span className="text-sm text-gray-400 ml-1">min</span>
                </p>

                <div className="mt-4 h-1.5 bg-white/10 rounded-full">
                  <div className="h-full w-[70%] bg-[#f5b82e] rounded-full" />
                </div>
              </div>

              {/* Tasks Card */}
              <div className="absolute top-44 right-0 w-48 p-5 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/15">
                <p className="text-xs text-gray-400 uppercase tracking-wider">
                  Tasks
                </p>

                <div className="mt-4 space-y-2 text-sm">
                  <p>
                    <span className="text-[#f5b82e] font-bold">3</span>{" "}
                    Pending
                  </p>
                  <p>
                    <span className="text-blue-400 font-bold">2</span>{" "}
                    In Progress
                  </p>
                  <p>
                    <span className="text-green-400 font-bold">4</span>{" "}
                    Completed
                  </p>
                </div>
              </div>

              {/* Habits Card */}
              <div className="absolute bottom-10 left-10 w-48 p-5 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/15">
                <p className="text-xs text-gray-400 uppercase tracking-wider">
                  Habits
                </p>

                <p className="text-4xl font-bold mt-3">
                  4<span className="text-gray-500 text-xl"> / 5</span>
                </p>

                <p className="text-sm text-green-400 mt-2">
                  Completed
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Bottom Features */}
      <div className="relative z-20 max-w-6xl mx-auto px-8 pb-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md">
          <Feature
            title="Plan"
            description="Organize your tasks and goals."
          />

          <Feature
            title="Focus"
            description="Protect your attention."
          />

          <Feature
            title="Habits"
            description="Build consistency every day."
          />

          <Feature
            title="Progress"
            description="Measure how far you've come."
          />
        </div>
      </div>
    </div>
  );
}

function Feature({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="px-4 py-3">
      <h3 className="text-[#f5b82e] font-bold text-lg">
        {title}
      </h3>

      <p className="text-gray-500 text-sm mt-1">
        {description}
      </p>
    </div>
  );
}