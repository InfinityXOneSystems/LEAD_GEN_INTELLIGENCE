"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  id: string;
  role: "user" | "ai";
  content: string;
  timestamp: Date;
}

const QUICK_COMMANDS = [
  "scrape epoxy contractors ohio",
  "show top leads",
  "run outreach campaign",
  "export leads CSV",
  "run pipeline",
  "check scraper status",
];

function getAIResponse(command: string): string {
  const cmd = command.toLowerCase().trim();

  if (cmd.includes("scrape") || cmd.includes("contractor")) {
    const query = cmd.replace("scrape", "").trim();
    return `🤖 **Scraper initiated** for query: "${query || cmd}"\n\nPipeline started:\n• Google Maps scraper → searching business listings\n• Yelp scraper → cross-referencing reviews\n• Directory scraper → checking contractor databases\n\n⏳ Estimated completion: ~3-5 minutes\n📊 Expected leads: 50-200 results\n\nRun ID: SCR-${Date.now().toString(36).toUpperCase()}`;
  }
  if (cmd.includes("top leads") || cmd.includes("show leads") || cmd.includes("best leads")) {
    return `🎯 **Top 5 Leads by Score:**\n\n1. 🔥 Premium Epoxy Floors LLC — Score: 95 | Columbus, OH\n2. 🔥 Elite Flooring Solutions — Score: 92 | Cleveland, OH\n3. 🔥 ProCoat Industrial — Score: 88 | Cincinnati, OH\n4. ⚡ Midwest Floor Pros — Score: 76 | Toledo, OH\n5. ⚡ Great Lakes Flooring — Score: 74 | Akron, OH\n\nNavigate to the **Leads** section for full details and filtering.`;
  }
  if (cmd.includes("outreach") || cmd.includes("campaign") || cmd.includes("email")) {
    return `📧 **Outreach Campaign Queued**\n\nConfiguration:\n• Target: HOT leads (score ≥ 75)\n• Template: Flooring Partnership Intro v2\n• Schedule: Sending in 15 minutes\n• Follow-up: +3 days if no reply\n\n📋 Leads queued: 23\n⚠️ Rate limit: 50 emails/day\n\nCampaign ID: CAMP-${Date.now().toString(36).toUpperCase()}\nGo to **Outreach** panel to monitor delivery.`;
  }
  if (cmd.includes("export") || cmd.includes("csv") || cmd.includes("download")) {
    return `📥 **Export initiated**\n\nGenerating CSV file...\n• All leads: ✓ included\n• Fields: company, phone, email, city, state, score, tier, industry\n• Format: UTF-8 CSV\n\n✅ File ready: leads_export_${new Date().toISOString().split("T")[0]}.csv\n\n💡 Navigate to **Leads** section and click Export for the actual download.`;
  }
  if (cmd.includes("pipeline") || cmd.includes("run all")) {
    return `⚙️ **Full Pipeline Triggered**\n\nExecuting stages:\n\n1. 🔍 Scrape — Starting scrapers... ⏳\n2. ✅ Validate — Queued\n3. 🔬 Enrich — Queued\n4. 📊 Score — Queued\n5. 📧 Outreach — Queued\n\nWorkflow: PIPELINE-${Date.now().toString(36).toUpperCase()}\n⏱️ ETA: ~12 minutes for full cycle\n\nMonitor progress in **Workflows** → GitHub Actions.`;
  }
  if (cmd.includes("status") || cmd.includes("health") || cmd.includes("check")) {
    return `📡 **System Status Report**\n\n✅ Google Maps Scraper — Active (last run: 2h ago)\n✅ Yelp Scraper — Active (last run: 4h ago)\n⚡ Bing Scraper — Idle (scheduled: +1h)\n✅ Validation Engine — Running\n✅ Scoring Engine — Running\n⚡ Outreach Bot — Standby\n\n📊 Stats:\n• Leads processed today: 847\n• Emails sent today: 23\n• Queue depth: Normal`;
  }
  if (cmd.includes("help") || cmd === "?") {
    return `🧠 **XPS AI Command Interface**\n\nAvailable commands:\n\n• **scrape [query] [location]** — Run scrapers\n• **show top leads** — View highest scored leads\n• **run outreach campaign** — Start email outreach\n• **export leads CSV** — Download leads data\n• **run pipeline** — Execute full pipeline\n• **check scraper status** — System health report\n\nYou can type natural language — I'll understand your intent!`;
  }

  return `🧠 **Processing:** "${command}"\n\nI understood your request. In full deployment, this command would be processed by the AI orchestration engine.\n\n💡 Try a quick command below or type **help** to see all available commands.`;
}

const MIN_RESPONSE_DELAY = 700;
const MAX_RESPONSE_JITTER = 500;

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChatPanel({ isOpen, onClose }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "ai",
      content: "👋 **Welcome to XPS AI Command**\n\nI control the lead intelligence system. Try a command below or type your own!\n\nType **help** to see all available commands.",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const sendMessage = (content: string) => {
    if (!content.trim()) return;
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: content.trim(),
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsTyping(true);
    setTimeout(
      () => {
        const aiMsg: Message = {
          id: `ai-${Date.now()}`,
          role: "ai",
          content: getAIResponse(content),
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiMsg]);
        setIsTyping(false);
      },
      MIN_RESPONSE_DELAY + Math.random() * MAX_RESPONSE_JITTER,
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputValue);
    }
  };

  const formatTime = (date: Date) =>
    date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const renderMessageContent = (content: string) => {
    const lines = content.split("\n");
    return lines.map((line, i) => {
      const parts = line.split(/\*\*(.*?)\*\*/g);
      return (
        <div key={i} className={line === "" ? "h-2" : ""}>
          {parts.map((part, j) =>
            j % 2 === 1 ? (
              <strong key={j} className="font-semibold text-yellow-400">
                {part}
              </strong>
            ) : (
              <span key={j}>{part}</span>
            ),
          )}
        </div>
      );
    });
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Mobile: full-screen overlay */}
      <div
        className={[
          "fixed inset-0 z-50 flex flex-col",
          "md:hidden",
          "bg-black chat-mobile-enter",
        ].join(" ")}
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        {/* Mobile Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-yellow-400/15 bg-black/95 backdrop-blur-xl flex-shrink-0">
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-white hover:bg-[#1a1a1a] transition-colors text-lg"
            aria-label="Close chat"
          >
            ←
          </button>
          <div className="flex items-center gap-2 flex-1">
            <div className="w-8 h-8 rounded-full bg-yellow-400/15 border border-yellow-400/30 flex items-center justify-center text-base">
              🧠
            </div>
            <div>
              <div className="text-sm font-bold text-white leading-tight">XPS AI Command</div>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 live-dot" />
                <span className="text-[10px] text-green-400">Online</span>
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} items-end gap-2`}
            >
              {msg.role === "ai" && (
                <div className="w-6 h-6 rounded-full bg-yellow-400/15 border border-yellow-400/25 flex items-center justify-center text-xs flex-shrink-0 mb-1">
                  🧠
                </div>
              )}
              <div
                className={[
                  "max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                  msg.role === "user"
                    ? "bg-yellow-400 text-black font-semibold rounded-br-sm"
                    : "bg-[#141414] text-gray-100 rounded-bl-sm border border-yellow-400/10",
                ].join(" ")}
              >
                {msg.role === "ai" ? (
                  <div className="space-y-0.5">{renderMessageContent(msg.content)}</div>
                ) : (
                  msg.content
                )}
                <div className={`text-[10px] mt-1.5 ${msg.role === "user" ? "text-yellow-900/70" : "text-gray-600"}`}>
                  {formatTime(msg.timestamp)}
                </div>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start items-end gap-2">
              <div className="w-6 h-6 rounded-full bg-yellow-400/15 border border-yellow-400/25 flex items-center justify-center text-xs">
                🧠
              </div>
              <div className="bg-[#141414] border border-yellow-400/10 rounded-2xl rounded-bl-sm px-4 py-3">
                <div className="flex gap-1 items-center h-4">
                  {[0, 150, 300].map((delay) => (
                    <span
                      key={delay}
                      className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce"
                      style={{ animationDelay: `${delay}ms` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Commands — horizontal scroll */}
        <div className="px-4 py-2 border-t border-yellow-400/10 flex-shrink-0">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {QUICK_COMMANDS.map((cmd) => (
              <button
                key={cmd}
                onClick={() => sendMessage(cmd)}
                className="flex-shrink-0 text-[11px] px-3 py-1.5 rounded-full bg-[#141414] border border-yellow-400/20 text-gray-400 hover:border-yellow-400/50 hover:text-yellow-400 active:bg-yellow-400/10 transition-all"
              >
                {cmd}
              </button>
            ))}
          </div>
        </div>

        {/* Input bar — fixed at bottom */}
        <div className="px-4 py-3 border-t border-yellow-400/15 bg-black/95 backdrop-blur-xl flex-shrink-0">
          <div className="flex items-center gap-2 bg-[#141414] border border-yellow-400/20 rounded-2xl px-4 py-2.5 focus-within:border-yellow-400/50 transition-colors">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message XPS AI…"
              className="flex-1 bg-transparent text-sm text-white placeholder-gray-600 outline-none"
            />
            <button
              onClick={() => sendMessage(inputValue)}
              disabled={!inputValue.trim() || isTyping}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-yellow-400 hover:bg-yellow-500 text-black font-bold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0 active:scale-95"
              aria-label="Send"
            >
              ↑
            </button>
          </div>
        </div>
      </div>

      {/* Desktop: slide-in panel (bottom-right) */}
      <div className="hidden md:flex fixed inset-0 z-50 items-end justify-end pointer-events-none">
        <div
          className="absolute inset-0 bg-black/40 pointer-events-auto"
          onClick={onClose}
        />
        <div
          className={[
            "relative pointer-events-auto chat-panel-enter",
            "flex flex-col",
            "glass-dark border border-yellow-400/20",
            "w-[420px] h-[600px]",
            "mb-4 mr-4 rounded-2xl",
            "shadow-2xl shadow-yellow-400/5",
          ].join(" ")}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-yellow-400/15 flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-yellow-400/15 border border-yellow-400/30 flex items-center justify-center text-base">
                🧠
              </div>
              <div>
                <div className="text-sm font-bold text-white">XPS AI Command</div>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 live-dot" />
                  <span className="text-[10px] text-green-400">Online</span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-full text-gray-500 hover:text-white hover:bg-[#2a2a2a] transition-colors text-sm"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} items-end gap-2`}
              >
                {msg.role === "ai" && (
                  <div className="w-6 h-6 rounded-full bg-yellow-400/15 border border-yellow-400/25 flex items-center justify-center text-xs flex-shrink-0 mb-1">
                    🧠
                  </div>
                )}
                <div
                  className={[
                    "max-w-[85%] rounded-2xl px-3 py-2.5 text-sm leading-relaxed",
                    msg.role === "user"
                      ? "bg-yellow-400 text-black font-medium rounded-br-sm"
                      : "bg-[#1a1a1a] text-gray-200 rounded-bl-sm border border-yellow-400/10",
                  ].join(" ")}
                >
                  {msg.role === "ai" ? (
                    <div className="space-y-0.5">{renderMessageContent(msg.content)}</div>
                  ) : (
                    msg.content
                  )}
                  <div className={`text-[10px] mt-1.5 ${msg.role === "user" ? "text-yellow-900/70" : "text-gray-500"}`}>
                    {formatTime(msg.timestamp)}
                  </div>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start items-end gap-2">
                <div className="w-6 h-6 rounded-full bg-yellow-400/15 border border-yellow-400/25 flex items-center justify-center text-xs">
                  🧠
                </div>
                <div className="bg-[#1a1a1a] border border-yellow-400/10 rounded-2xl rounded-bl-sm px-4 py-3">
                  <div className="flex gap-1 items-center h-4">
                    {[0, 150, 300].map((delay) => (
                      <span
                        key={delay}
                        className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-bounce"
                        style={{ animationDelay: `${delay}ms` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Commands */}
          <div className="px-4 py-2 border-t border-yellow-400/10 flex-shrink-0">
            <div className="flex flex-wrap gap-1.5">
              {QUICK_COMMANDS.map((cmd) => (
                <button
                  key={cmd}
                  onClick={() => sendMessage(cmd)}
                  className="text-[10px] px-2 py-1 rounded-full bg-[#1a1a1a] border border-yellow-400/15 text-gray-400 hover:border-yellow-400/50 hover:text-yellow-400 transition-all truncate max-w-[140px]"
                >
                  {cmd}
                </button>
              ))}
            </div>
          </div>

          {/* Input */}
          <div className="px-4 py-3 border-t border-yellow-400/15 flex-shrink-0">
            <div className="flex items-center gap-2 bg-[#1a1a1a] border border-yellow-400/20 rounded-xl px-3 py-2 focus-within:border-yellow-400/50 transition-colors">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a command…"
                className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 outline-none"
              />
              <button
                onClick={() => sendMessage(inputValue)}
                disabled={!inputValue.trim() || isTyping}
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-yellow-400 hover:bg-yellow-500 text-black text-sm font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                aria-label="Send"
              >
                ↑
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
