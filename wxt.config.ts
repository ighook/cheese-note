import { defineConfig } from "wxt";

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  manifest: {
    name: "Chzzk Note",
    action: {
      default_title: "Chzzk Note",
    },
    permissions: ["storage"],
    description:
      "치지직을 보면서 간단한 메모를 남길 수 있는 Chrome 확장 프로그램",
  },
});
