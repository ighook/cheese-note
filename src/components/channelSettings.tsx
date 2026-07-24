import { useEffect, useState, type FormEvent } from "react";
import type {
  ChannelMessageResponse,
  ChzzkApiCredentials,
} from "@/src/types/channel";
import styles from "./channelSettings.module.css";

const EMPTY_CREDENTIALS: ChzzkApiCredentials = {
  clientId: "",
  clientSecret: "",
};

export function ChannelSettings() {
  const [credentials, setCredentials] =
    useState<ChzzkApiCredentials>(EMPTY_CREDENTIALS);
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    void browser.runtime
      .sendMessage({ type: "channel:credentials:get" })
      .then((response: ChannelMessageResponse<ChzzkApiCredentials>) => {
        if (response.ok) {
          setCredentials(response.data);
        }
      })
      .catch(() => setMessage("설정을 불러오지 못했습니다."));
  }, []);

  const saveCredentials = async (event: FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    setMessage("");

    try {
      const response: ChannelMessageResponse<ChzzkApiCredentials> =
        await browser.runtime.sendMessage({
          type: "channel:credentials:set",
          credentials,
        });
      setMessage(response.ok ? "저장했습니다." : response.error);
    } catch {
      setMessage("설정을 저장하지 못했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className={styles.settings}>
      <button
        type="button"
        className={styles.toggle}
        onClick={() => setIsOpen((current) => !current)}
        aria-expanded={isOpen}
      >
        치지직 API 설정
        <span>{isOpen ? "−" : "+"}</span>
      </button>
      {isOpen && (
        <form className={styles.form} onSubmit={saveCredentials}>
          <p className={styles.description}>
            치지직 Developers에서 발급한 애플리케이션 인증 정보를 입력하세요.
          </p>
          <label>
            Client ID
            <input
              value={credentials.clientId}
              autoComplete="off"
              onChange={(event) =>
                setCredentials((current) => ({
                  ...current,
                  clientId: event.target.value,
                }))
              }
            />
          </label>
          <label>
            Client Secret
            <input
              type="password"
              value={credentials.clientSecret}
              autoComplete="off"
              onChange={(event) =>
                setCredentials((current) => ({
                  ...current,
                  clientSecret: event.target.value,
                }))
              }
            />
          </label>
          <div className={styles.actions}>
            <span className={styles.message}>{message}</span>
            <button
              type="submit"
              disabled={
                isSaving ||
                !credentials.clientId.trim() ||
                !credentials.clientSecret.trim()
              }
            >
              {isSaving ? "저장 중…" : "저장"}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
