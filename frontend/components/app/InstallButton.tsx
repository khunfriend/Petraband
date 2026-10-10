"use client";

import { useEffect, useState } from "react";
import { Download, Share, SquarePlus } from "lucide-react";
import { Modal } from "@/components/ui/Modal";

type InstallPrompt = Event & { prompt: () => Promise<void> };

/**
 * "เพิ่มหน้าจอหลัก" — install the site as an app. Android/Chrome gets the
 * browser's own install prompt; iPhone Safari has none, so it shows how.
 * Hidden once the site already runs as the installed app.
 */
export function InstallButton({ className = "" }: { className?: string }) {
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);
  const [showHowTo, setShowHowTo] = useState(false);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPrompt(e as InstallPrompt);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  async function install() {
    if (prompt) {
      await prompt.prompt();
      setPrompt(null);
    } else {
      setShowHowTo(true);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={install}
        className={`standalone:hidden inline-flex items-center gap-1.5 h-9 px-3 rounded-full border border-white/25 text-[13px] font-medium text-white hover:bg-white/10 ${className}`}
      >
        <Download size={16} strokeWidth={1.75} />
        เพิ่มหน้าจอหลัก
      </button>

      <Modal open={showHowTo} onClose={() => setShowHowTo(false)} title="เพิ่ม PETRAband ไว้ที่หน้าจอหลัก">
        <ol className="flex flex-col gap-3 text-sm text-body">
          <li className="flex items-start gap-3">
            <Share size={18} strokeWidth={1.75} className="shrink-0 mt-0.5 text-primary" />
            <span>iPhone: เปิดใน Safari แล้วกดปุ่มแชร์ด้านล่าง</span>
          </li>
          <li className="flex items-start gap-3">
            <SquarePlus size={18} strokeWidth={1.75} className="shrink-0 mt-0.5 text-primary" />
            <span>เลือก &quot;เพิ่มไปยังหน้าจอโฮม&quot; แล้วกด &quot;เพิ่ม&quot;</span>
          </li>
          <li className="flex items-start gap-3">
            <Download size={18} strokeWidth={1.75} className="shrink-0 mt-0.5 text-primary" />
            <span>Android: เปิดใน Chrome แล้วเลือก &quot;ติดตั้งแอป&quot; จากเมนู ⋮</span>
          </li>
        </ol>
      </Modal>
    </>
  );
}
