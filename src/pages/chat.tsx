import { useState, useRef, useEffect } from "react";
import {
  useSendChatMessage,
  getGetDashboardStatsQueryKey,
  getListProductsQueryKey,
} from "@/lib/api-client";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Bot, User, Zap, Package, BarChart2, RefreshCw, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const SUGGESTIONS = [
  "¿Qué productos tienen stock bajo?",
  "Dame un resumen del inventario",
  "¿Cuáles son los movimientos recientes?",
  "Registra la entrada de 20 unidades de arroz",
];

const STORAGE_KEY = "urpi-chat-history";

type LocalChatEntry = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

function loadHistory(): LocalChatEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveHistory(entries: LocalChatEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // localStorage no disponible (modo privado, cuota llena): se ignora
  }
}

function newEntry(role: LocalChatEntry["role"], content: string): LocalChatEntry {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    content,
    createdAt: new Date().toISOString(),
  };
}

export function Chat() {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Historial local por navegador: no se comparte entre usuarios
  const [history, setHistory] = useState<LocalChatEntry[]>(loadHistory);
  const sendMessage = useSendChatMessage();

  useEffect(() => {
    saveHistory(history);
  }, [history]);

  function clearHistory() {
    setHistory([]);
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, sendMessage.isPending]);

  function handleSend(message?: string) {
    const text = message ?? input.trim();
    if (!text) return;
    setInput("");
    setHistory(prev => [...prev, newEntry("user", text)]);
    sendMessage.mutate({ data: { message: text } }, {
      onSuccess: (res) => {
        setHistory(prev => [...prev, newEntry("assistant", res.response)]);
        queryClient.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
      },
      onError: () => toast({ title: "Error al enviar mensaje", variant: "destructive" }),
    });
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] space-y-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">StockBot</h1>
        <p className="text-muted-foreground">Consulta y gestiona tu inventario en lenguaje natural.</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="flex items-center gap-2 rounded-lg border bg-card p-3 text-sm">
          <Zap className="w-4 h-4 text-primary shrink-0" />
          <span className="text-muted-foreground">Consultas en lenguaje natural</span>
        </div>
        <div className="flex items-center gap-2 rounded-lg border bg-card p-3 text-sm">
          <Package className="w-4 h-4 text-primary shrink-0" />
          <span className="text-muted-foreground">Actualiza stock automaticamente</span>
        </div>
        <div className="flex items-center gap-2 rounded-lg border bg-card p-3 text-sm">
          <BarChart2 className="w-4 h-4 text-primary shrink-0" />
          <span className="text-muted-foreground">Reportes y alertas inteligentes</span>
        </div>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center gap-4 py-12">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="w-8 h-8 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-lg">Hola, soy StockBot</p>
                <p className="text-muted-foreground text-sm mt-1">Preguntame sobre tu inventario en espanol. Puedo consultar datos, registrar movimientos y darte recomendaciones.</p>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2 w-full max-w-md">
                {SUGGESTIONS.map(s => (
                  <button
                    key={s}
                    onClick={() => handleSend(s)}
                    className="text-left text-sm border rounded-lg p-2.5 hover:bg-accent hover:text-accent-foreground transition-colors text-muted-foreground"
                    data-testid={`button-suggestion-${s.slice(0, 20)}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {history.map(entry => (
                <div key={entry.id} className={`flex gap-3 ${entry.role === "user" ? "flex-row-reverse" : ""}`} data-testid={`message-${entry.id}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    entry.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                  }`}>
                    {entry.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                  <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${
                    entry.role === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-none"
                      : "bg-muted text-foreground rounded-tl-none"
                  }`}>
                    {entry.content}
                  </div>
                </div>
              ))}
              {sendMessage.isPending && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-muted rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-1">
                    <RefreshCw className="w-4 h-4 animate-spin text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Pensando...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </CardContent>

        <div className="border-t p-4">
          {history.length > 0 && (
            <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
              <button
                onClick={clearHistory}
                disabled={sendMessage.isPending}
                className="text-xs border rounded-full px-3 py-1 whitespace-nowrap hover:bg-destructive hover:text-destructive-foreground transition-colors text-muted-foreground shrink-0 flex items-center gap-1"
                data-testid="button-clear-chat"
              >
                <Trash2 className="w-3 h-3" />
                Limpiar chat
              </button>
              {SUGGESTIONS.slice(0, 2).map(s => (
                <button
                  key={s}
                  onClick={() => handleSend(s)}
                  disabled={sendMessage.isPending}
                  className="text-xs border rounded-full px-3 py-1 whitespace-nowrap hover:bg-accent hover:text-accent-foreground transition-colors text-muted-foreground shrink-0"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribe tu consulta en español..."
              disabled={sendMessage.isPending}
              className="flex-1"
              data-testid="input-chat-message"
            />
            <Button
              onClick={() => handleSend()}
              disabled={!input.trim() || sendMessage.isPending}
              data-testid="button-send-message"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
