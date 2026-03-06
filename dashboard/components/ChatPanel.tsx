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
    return `📥 **Export initiated**\n\nGenerating CSV file...\n• All leads: ✓ included\n• Fields: company, phone, email, city, state, score, tier, industry\n• Format: UTF-8 CSV\n\n✅ File ready: leads_export_${new Date().toISOString().split("T")[0]}.csv\n\n💡 In production mode, your browser would automatically download this file. Navigate to **Leads** section and click the Export button for the actual download.`;
  }
  if (cmd.includes("pipeline") || cmd.includes("run all")) {
    return `⚙️ **Full Pipeline Triggered**\n\nExecuting stages:\n\n1. 🔍 Scrape — Starting scrapers... ⏳\n2. ✅ Validate — Queued\n3. 🔬 Enrich — Queued\n4. 📊 Score — Queued\n5. 📧 Outreach — Queued\n\nWorkflow: PIPELINE-${Date.now().toString(36).toUpperCase()}\n⏱️ ETA: ~12 minutes for full cycle\n\nYou can monitor progress in **AI Command** → Pipeline Status, or check **Workflows** for GitHub Actions status.`;
  }
  if (cmd.includes("status") || cmd.includes("health") || cmd.includes("check")) {
    return `📡 **System Status Report**\n\n✅ Google Maps Scraper — Active (last run: 2h ago)\n✅ Yelp Scraper — Active (last run: 4h ago)\n⚡ Bing Scraper — Idle (scheduled: +1h)\n✅ Validation Engine — Running\n✅ Scoring Engine — Running\n⚡ Outreach Bot — Standby\n\n📊 Stats:\n• Leads in queue: 14\n• Leads processed today: 847\n• Emails sent today: 23\n• Queue depth: Normal`;
  }
  if (cmd.includes("help") || cmd.includes("?")) {
    return `🧠 **XPS AI Command Interface**\n\nAvailable commands:\n\n• **scrape [query] [location]** — Run scrapers\n• **show top leads** — View highest scored leads\n• **run outreach campaign** — Start email outreach\n• **export leads CSV** — Download leads data\n• **run pipeline** — Execute full pipeline\n• **check scraper status** — System health report\n\nYou can type natural language — I'll understand your intent!`;
  }

  return `🧠 **Processing:** "${command}"\n\nI understood your request. In the full deployment, this command would be processed by the AI orchestration engine and routed to the appropriate system agent.\n\n💡 Try one of the quick commands below, or type **help** to see all available commands.`;
}

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChatPanel({ isOpen, onClose }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "ai",
      content: "👋 **Welcome to XPS AI Command**\n\nI can control the lead intelligence system. Try a command below or type your own!\n\nType **help** to see all available commands.",
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
  }, [messages]);

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

    // Simulate AI response delay
    setTimeout(() => {
      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        role: "ai",
        content: getAIResponse(content),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 800 + Math.random() * 600);
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
    // Simple markdown-ish rendering
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
            )
          )}
        </div>
      );
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end md:items-end md:justify-end pointer-events-none">
      {/* Backdrop on mobile */}
      <div
        className="absolute inset-0 bg-black/50 md:hidden pointer-events-auto"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={[
          "relative pointer-events-auto chat-panel-enter",
          "flex flex-col bg-[#0a0a0a] border border-[#2a2a2a]",
          "w-full md:w-[420px]",
          "h-[80vh] md:h-[600px]",
          "md:mb-4 md:mr-4 md:rounded-xl",
          "rounded-t-xl",
          "shadow-2xl shadow-black",
        ].join(" ")}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#2a2a2a] flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-lg">🧠</span>
            <div>
              <div className="text-sm font-semibold text-white">AI Command</div>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 live-dot" />
                <span className="text-[10px] text-green-400">Online</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded text-gray-500 hover:text-white hover:bg-[#2a2a2a] transition-colors text-sm"
          >
            ✕
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={[
                  "max-w-[85%] rounded-xl px-3 py-2.5 text-sm leading-relaxed",
                  msg.role === "user"
                    ? "bg-yellow-400 text-black font-medium rounded-br-sm"
                    : "bg-[#1a1a1a] text-gray-200 rounded-bl-sm border border-[#2a2a2a]",
                ].join(" ")}
              >
                {msg.role === "ai" ? (
                  <div className="space-y-0.5">
                    {renderMessageContent(msg.content)}
                  </div>
                ) : (
                  msg.content
                )}
                <div
                  className={`text-[10px] mt-1.5 ${msg.role === "user" ? "text-yellow-900/70" : "text-gray-500"}`}
                >
                  {formatTime(msg.timestamp)}
                </div>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl rounded-bl-sm px-4 py-3">
                <div className="flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Commands */}
        <div className="px-4 py-2 border-t border-[#2a2a2a] flex-shrink-0">
          <div className="flex flex-wrap gap-1.5">
            {QUICK_COMMANDS.map((cmd) => (
              <button
                key={cmd}
                onClick={() => sendMessage(cmd)}
                className="text-[10px] px-2 py-1 rounded-full bg-[#1a1a1a] border border-[#2a2a2a] text-gray-400 hover:border-yellow-400/50 hover:text-yellow-400 transition-all truncate max-w-[140px]"
              >
                {cmd}
              </button>
            ))}
          </div>
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t border-[#2a2a2a] flex-shrink-0">
          <div className="flex items-center gap-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 focus-within:border-yellow-400/50 transition-colors">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a command..."
              className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 outline-none"
            />
            <button
              onClick={() => sendMessage(inputValue)}
              disabled={!inputValue.trim() || isTyping}
              className="w-7 h-7 flex items-center justify-center rounded bg-yellow-400 hover:bg-yellow-500 text-black text-sm font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
            >
              ↑
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
