import { MemoList } from "@/src/components/memoList";
import styles from "./App.module.css";

function App() {
  return (
    <div className={styles.app}>
      <MemoList />
      <footer className={styles.footer}>
        <a href="https://github.com/ighook/cheese-note" target="_blank" rel="noreferrer">GitHub</a>
      </footer>
    </div>
  );
}

export default App;
