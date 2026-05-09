"use client";

import { useEffect, useState } from "react";
import {
  buildWelcomeCopy,
  getDeterministicChatReply,
  getDeterministicSuggestions,
} from "@/lib/demo-chat";
import { useBillStore } from "@/lib/store/bill-store";

type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  content: string;
};

export function KanaChatSidebar() {
  const bills = useBillStore((state) => state.bills);
  const activeBillIndex = useBillStore((state) => state.activeBillIndex);
  const personas = useBillStore((state) => state.personas);
  const setActiveView = useBillStore((state) => state.setActiveView);
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: crypto.randomUUID(),
      role: "assistant",
      content: buildWelcomeCopy(false),
    },
  ]);

  useEffect(() => {
    setMessages([
      {
        id: crypto.randomUUID(),
        role: "assistant",
        content: buildWelcomeCopy(bills.length > 0),
      },
    ]);
  }, [bills.length, activeBillIndex]);

  const suggestions = getDeterministicSuggestions(bills.length > 0);

  function pushAssistantMessage(content: string) {
    setMessages((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        role: "assistant",
        content,
      },
    ]);
  }

  function handlePrompt(rawPrompt: string) {
    const prompt = rawPrompt.trim();
    if (!prompt) return;

    setMessages((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        role: "user",
        content: prompt,
      },
    ]);
    setInput("");
    setIsOpen(true);

    const result = getDeterministicChatReply({
      prompt,
      bills,
      activeBillIndex,
      personas,
    });
    if (result.view) {
      setActiveView(result.view);
    }
    pushAssistantMessage(result.reply);
  }

  return (
    <>
      {isOpen && (
        <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-zinc-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-zinc-950">Kana</p>
              <p className="text-xs text-zinc-500">
                Deterministic demo copilot for bill summary, benchmark, changes, and savings
              </p>
            </div>
            <button
              className="rounded-full border border-zinc-200 px-3 py-1 text-sm text-zinc-600 transition-colors hover:bg-zinc-50"
              onClick={() => setIsOpen(false)}
              type="button"
            >
              Close
            </button>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={message.role === "user" ? "flex justify-end" : "flex justify-start"}
              >
                <div
                  className={
                    message.role === "user"
                      ? "max-w-[85%] rounded-2xl bg-zinc-950 px-4 py-3 text-sm text-white"
                      : "max-w-[85%] rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700"
                  }
                >
                  {message.content}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-zinc-200 px-4 py-4">
            <div className="mb-3 flex flex-wrap gap-2">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion.message}
                  className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100"
                  onClick={() => handlePrompt(suggestion.message)}
                  type="button"
                >
                  {suggestion.title}
                </button>
              ))}
            </div>

            <form
              className="flex items-end gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                handlePrompt(input);
              }}
            >
              <textarea
                className="min-h-[52px] flex-1 resize-none rounded-2xl border border-zinc-200 px-4 py-3 text-sm text-zinc-700 outline-none transition-colors focus:border-blue-300"
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask about your bill, comparison, changes, or savings..."
                value={input}
              />
              <button
                className="rounded-2xl bg-zinc-950 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
                disabled={input.trim().length === 0}
                type="submit"
              >
                Send
              </button>
            </form>
          </div>
        </aside>
      )}

      {!isOpen && (
        <button
          className="fixed bottom-4 right-4 z-40 rounded-full bg-zinc-950 px-5 py-3 text-sm font-medium text-white shadow-lg transition-colors hover:bg-zinc-800"
          onClick={() => setIsOpen(true)}
          type="button"
        >
          Open Chat
        </button>
      )}
    </>
  );
}
