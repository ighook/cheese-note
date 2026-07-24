import { ChannelSettings } from "@/src/components/channelSettings";
import { MemoList } from "@/src/components/memoList";
import styles from "./App.module.css";

function App() {
  return (
    <div className={styles.app}>
      <ChannelSettings />
      <MemoList />
    </div>
  );
}

export default App;
