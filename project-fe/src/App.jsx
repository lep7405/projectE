import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";

function App() {
  const apiBaseUrl = useMemo(() => (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api").replace(/\/+$/, ""), []);
  const toYmd = (date) => date.toISOString().slice(0, 10);
  const todayYmd = toYmd(new Date());
  const weekAgoYmd = toYmd(new Date(Date.now() - 6 * 24 * 60 * 60 * 1000));

  const [page, setPage] = useState("dashboard");

  const [limit, setLimit] = useState(10);
  const [backLang, setBackLang] = useState("all");
  const [dashboardDate, setDashboardDate] = useState("");
  const [sentences, setSentences] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const [form, setForm] = useState({
    english_sentence: "",
    vietnamese_sentence: "",
    back_lang: "en",
    images: null,
    remove_image: false,
  });
  const [submitting, setSubmitting] = useState(false);

  const [bulkText, setBulkText] = useState("");
  const [bulkBackLang, setBulkBackLang] = useState("en");
  const [bulkFiles, setBulkFiles] = useState([]);
  const [bulkSubmitting, setBulkSubmitting] = useState(false);

  const [flippedCards, setFlippedCards] = useState({});
  const [speakingId, setSpeakingId] = useState(null);

  const [testLimit, setTestLimit] = useState(20);
  const [testBackLang, setTestBackLang] = useState("en");
  const [testCards, setTestCards] = useState([]);
  const [testLoading, setTestLoading] = useState(false);
  const [testStartedAt, setTestStartedAt] = useState(null);
  const [testNow, setTestNow] = useState(Date.now());
  const [testIndex, setTestIndex] = useState(0);
  const [testFlipped, setTestFlipped] = useState(false);
  const [cardTimerStartAt, setCardTimerStartAt] = useState(null);
  const [cardElapsedMs, setCardElapsedMs] = useState(0);
  const [testResults, setTestResults] = useState({});
  const [financeItems, setFinanceItems] = useState([]);
  const [financeLoading, setFinanceLoading] = useState(false);
  const [financeSubmitting, setFinanceSubmitting] = useState(false);
  const [editingFinanceId, setEditingFinanceId] = useState(null);
  const [financeForm, setFinanceForm] = useState({
    date: "",
    expense: "",
    income: "",
    description: "",
  });
  const [dailyRewards, setDailyRewards] = useState([]);
  const [testHistories, setTestHistories] = useState([]);
  const [rewardForm, setRewardForm] = useState({
    reward_date: "",
    amount: "",
    test_histories_count: "",
  });
  const [editingRewardId, setEditingRewardId] = useState(null);
  const [rewardSubmitting, setRewardSubmitting] = useState(false);
  const [rewardSaving, setRewardSaving] = useState(false);
  const [testSaved, setTestSaved] = useState(false);
  const [testSaveMessage, setTestSaveMessage] = useState("");
  const [tasks, setTasks] = useState([]);
  const [taskForm, setTaskForm] = useState({
    description: "",
    created_at: new Date().toISOString().slice(0, 10),
    type: "custom",
  });
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [taskSubmitting, setTaskSubmitting] = useState(false);
  const [clickHistory, setClickHistory] = useState([]);
  const [statsLoading, setStatsLoading] = useState(false);
  const [presenceLoading, setPresenceLoading] = useState(false);
  const [presenceDailyStats, setPresenceDailyStats] = useState([]);
  const [learningLoading, setLearningLoading] = useState(false);
  const [learningSeries, setLearningSeries] = useState([]);
  const [dayDetailLoading, setDayDetailLoading] = useState(false);
  const [selectedLearningDay, setSelectedLearningDay] = useState("");
  const [learningDayDetail, setLearningDayDetail] = useState({ learned_words: [], unlearned_words: [] });
  const [isLearningDetailOpen, setIsLearningDetailOpen] = useState(false);
  const [statsBackLang, setStatsBackLang] = useState("all");
  const [statsStartDate, setStatsStartDate] = useState(weekAgoYmd);
  const [statsEndDate, setStatsEndDate] = useState(todayYmd);
  const [presenceNow, setPresenceNow] = useState(Date.now());
  const presenceStartedAtRef = useRef(null);
  const presencePageRef = useRef("dashboard");
  const presenceHeartbeatRef = useRef(null);

  const limitOptions = [10, 20, 50, 100, 200];
  const backLangOptions = [
    { value: "all", label: "All" },
    { value: "en", label: "EN" },
    { value: "ja", label: "JA" },
    { value: "zh", label: "ZH" },
  ];
  const taskTypeOptions = [
    { value: "custom", label: "custom" },
    { value: "LAI", label: "LAI" },
  ];

  const assetBaseUrl = apiBaseUrl.replace(/\/api$/, "");

  const imageUrl = (path) => {
    if (!path) return "";
    if (path.startsWith("http://") || path.startsWith("https://")) return path;
    return `${assetBaseUrl}/storage/${path}`;
  };

  const formatDuration = (ms) => {
    const safeMs = Math.max(0, Number(ms) || 0);
    const totalSeconds = Math.floor(safeMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  };

  const formatDurationLong = (ms) => {
    const safeMs = Math.max(0, Number(ms) || 0);
    const totalSeconds = Math.floor(safeMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  };

  const fetchSentences = async (currentLimit, currentBackLang, currentCreatedDate = "") => {
    const params = new URLSearchParams();
    params.set("limit", String(currentLimit));
    if (currentCreatedDate) {
      params.set("created_date", currentCreatedDate);
    }
    if (currentBackLang && currentBackLang !== "all") {
      params.set("back_lang", currentBackLang);
    }

    const res = await fetch(`${apiBaseUrl}/sentences?${params.toString()}`);
    if (!res.ok) {
      throw new Error("Cannot load sentences");
    }
    const data = await res.json();
    return data.data || [];
  };

  const loadSentences = async (currentLimit = limit, currentBackLang = backLang, currentCreatedDate = dashboardDate) => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchSentences(currentLimit, currentBackLang, currentCreatedDate);
      setSentences(data);
      setFlippedCards({});
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const loadFinances = async () => {
    setFinanceLoading(true);
    setError("");
    try {
      const res = await fetch(`${apiBaseUrl}/daily-finances?limit=500`);
      if (!res.ok) throw new Error("Cannot load finances");
      const data = await res.json();
      setFinanceItems(data.data || []);
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setFinanceLoading(false);
    }
  };

  const loadDailyRewards = async () => {
    const res = await fetch(`${apiBaseUrl}/daily-rewards?limit=200`);
    if (!res.ok) throw new Error("Cannot load daily rewards");
    const data = await res.json();
    setDailyRewards(data.data || []);
  };

  const loadTestHistories = async () => {
    const res = await fetch(`${apiBaseUrl}/test-histories?limit=200`);
    if (!res.ok) throw new Error("Cannot load test histories");
    const data = await res.json();
    setTestHistories(data.data || []);
  };

  const loadTasks = async () => {
    const res = await fetch(`${apiBaseUrl}/tasks?limit=500`);
    if (!res.ok) throw new Error("Cannot load tasks");
    const data = await res.json();
    setTasks(data.data || []);
  };

  const loadClickStats = async (currentStartDate = statsStartDate, currentEndDate = statsEndDate, currentBackLang = statsBackLang) => {
    setStatsLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (currentStartDate) params.set("start_date", currentStartDate);
      if (currentEndDate) params.set("end_date", currentEndDate);
      if (currentBackLang && currentBackLang !== "all") params.set("back_lang", currentBackLang);
      params.set("limit", "500");

      const res = await fetch(`${apiBaseUrl}/flashcard-review-events?${params.toString()}`);
      if (!res.ok) throw new Error("Cannot load click history");
      const data = await res.json();
      setClickHistory(data.data || []);
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setStatsLoading(false);
    }
  };

  const loadPresenceStats = async (currentStartDate = statsStartDate, currentEndDate = statsEndDate) => {
    setPresenceLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (currentStartDate) params.set("start_date", currentStartDate);
      if (currentEndDate) params.set("end_date", currentEndDate);

      const res = await fetch(`${apiBaseUrl}/presence/stats/daily?${params.toString()}`);
      if (!res.ok) throw new Error("Cannot load active time stats");
      const data = await res.json();
      setPresenceDailyStats(data.data || []);
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setPresenceLoading(false);
    }
  };

  const loadLearningOverview = async (currentEndDate = statsEndDate, currentBackLang = statsBackLang) => {
    setLearningLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (currentEndDate) params.set("end_date", currentEndDate);
      params.set("days", "14");
      if (currentBackLang && currentBackLang !== "all") params.set("back_lang", currentBackLang);

      const res = await fetch(`${apiBaseUrl}/flashcard-review-events/stats/learning-overview?${params.toString()}`);
      if (!res.ok) throw new Error("Cannot load 14-day learning overview");
      const data = await res.json();
      setLearningSeries(data.data || []);
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLearningLoading(false);
    }
  };

  const openLearningDayDetail = async (date) => {
    setDayDetailLoading(true);
    setError("");
    setSelectedLearningDay(date);
    setIsLearningDetailOpen(true);
    try {
      const params = new URLSearchParams();
      params.set("date", date);
      if (statsBackLang && statsBackLang !== "all") params.set("back_lang", statsBackLang);

      const res = await fetch(`${apiBaseUrl}/flashcard-review-events/stats/day-detail?${params.toString()}`);
      if (!res.ok) throw new Error("Cannot load day detail");
      const data = await res.json();
      setLearningDayDetail(data.data || { learned_words: [], unlearned_words: [] });
    } catch (err) {
      setError(err.message || "Something went wrong");
      setLearningDayDetail({ learned_words: [], unlearned_words: [] });
    } finally {
      setDayDetailLoading(false);
    }
  };

  const downloadUnlearnedCsv = () => {
    const rows = learningDayDetail.unlearned_words || [];
    const clean = (value) =>
      String(value ?? "")
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, " ")
        .trim();
    const esc = (value) => `"${clean(value).replace(/"/g, '""')}"`;
    const header = ["No", "Flashcard ID", "Vietnamese", "English", "Back Lang"];
    const lines = [header.map(esc).join(",")];
    rows.forEach((row, idx) => {
      lines.push([idx + 1, row.flashcard_id, row.vietnamese_sentence, row.english_sentence, row.back_lang].map(esc).join(","));
    });
    const csvContent = `\uFEFF${lines.join("\r\n")}`;
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const safeDate = (selectedLearningDay || statsEndDate || "date").replace(/[^0-9-]/g, "");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `unlearned-words-${safeDate}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const downloadUnlearnedDoc = () => {
    const rows = learningDayDetail.unlearned_words || [];
    const clean = (value) =>
      String(value ?? "")
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, " ")
        .trim();
    const escapeHtml = (value) =>
      clean(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Unlearned Words</title>
  <style>
    body { font-family: "Segoe UI", Arial, sans-serif; font-size: 12pt; color: #111; }
    h2, p { margin: 0 0 8px 0; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #bbb; padding: 6px; vertical-align: top; text-align: left; }
    th { background: #f3f3f3; }
  </style>
</head>
<body>
  <h2>Unlearned Words - ${escapeHtml(selectedLearningDay || statsEndDate)}</h2>
  <p>Back Lang: ${escapeHtml(statsBackLang)}</p>
  <p>Total: ${rows.length}</p>
  <table>
    <thead>
      <tr><th>No</th><th>Flashcard ID</th><th>Vietnamese</th><th>English</th><th>Back Lang</th></tr>
    </thead>
    <tbody>
      ${rows
        .map(
          (row, idx) => `
        <tr>
          <td>${idx + 1}</td>
          <td>${escapeHtml(row.flashcard_id)}</td>
          <td>${escapeHtml(row.vietnamese_sentence)}</td>
          <td>${escapeHtml(row.english_sentence)}</td>
          <td>${escapeHtml(row.back_lang)}</td>
        </tr>`
        )
        .join("")}
    </tbody>
  </table>
</body>
</html>`;

    const blob = new Blob([`\uFEFF${html}`], { type: "application/msword;charset=utf-8" });
    const safeDate = (selectedLearningDay || statsEndDate || "date").replace(/[^0-9-]/g, "");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `unlearned-words-${safeDate}.doc`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const sendPresenceHeartbeat = (activeMs, pageName, useBeacon = false) => {
    if (!activeMs || activeMs < 1000) return;
    const payload = JSON.stringify({
      page: pageName,
      active_ms: Math.round(activeMs),
      recorded_at: new Date().toISOString(),
    });

    if (useBeacon && navigator.sendBeacon) {
      const blob = new Blob([payload], { type: "application/json" });
      navigator.sendBeacon(`${apiBaseUrl}/presence/heartbeat`, blob);
      return;
    }

    fetch(`${apiBaseUrl}/presence/heartbeat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: payload,
    }).catch(() => {});
  };

  const flushPresence = (useBeacon = false) => {
    if (!presenceStartedAtRef.current) return;
    const now = Date.now();
    const activeMs = now - presenceStartedAtRef.current;
    const pageName = presencePageRef.current || "dashboard";
    presenceStartedAtRef.current = null;
    sendPresenceHeartbeat(activeMs, pageName, useBeacon);
  };

  const startPresence = () => {
    const isVisible = document.visibilityState === "visible";
    const isFocused = document.hasFocus();
    if (!isVisible || !isFocused) return;
    if (presenceStartedAtRef.current) return;
    presenceStartedAtRef.current = Date.now();
  };

  const resetFinanceForm = () => {
    setEditingFinanceId(null);
    setFinanceForm({
      date: "",
      expense: "",
      income: "",
      description: "",
    });
  };

  const resetRewardForm = () => {
    setEditingRewardId(null);
    setRewardForm({
      reward_date: "",
      amount: "",
      test_histories_count: "",
    });
  };

  const resetTaskForm = () => {
    setEditingTaskId(null);
    setTaskForm({
      description: "",
      created_at: new Date().toISOString().slice(0, 10),
      type: "custom",
    });
  };

  useEffect(() => {
    loadSentences();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  useEffect(() => {
    if (!testStartedAt) return;
    const timer = window.setInterval(() => {
      setTestNow(Date.now());
    }, 1000);
    return () => window.clearInterval(timer);
  }, [testStartedAt]);

  useEffect(() => {
    if (!cardTimerStartAt) return;
    const timer = window.setInterval(() => {
      setCardElapsedMs(Date.now() - cardTimerStartAt);
    }, 100);
    return () => window.clearInterval(timer);
  }, [cardTimerStartAt]);

  useEffect(() => {
    if (page === "finance") {
      Promise.all([loadFinances(), loadDailyRewards(), loadTestHistories()]).catch((err) => {
        setError(err.message || "Something went wrong");
      });
    }
    if (page === "stats") {
      Promise.all([loadClickStats(), loadPresenceStats(), loadLearningOverview()]).catch((err) => {
        setError(err.message || "Something went wrong");
      });
    }
    if (page === "task") {
      loadTasks().catch((err) => {
        setError(err.message || "Something went wrong");
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  useEffect(() => {
    // Close old page segment, then continue tracking with new page.
    flushPresence(false);
    presencePageRef.current = page;
    startPresence();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  useEffect(() => {
    presencePageRef.current = page;
    startPresence();

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        flushPresence(false);
        return;
      }
      startPresence();
    };
    const onFocus = () => startPresence();
    const onBlur = () => flushPresence(false);
    const onPageHide = () => flushPresence(true);
    const onBeforeUnload = () => flushPresence(true);

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("focus", onFocus);
    window.addEventListener("blur", onBlur);
    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("beforeunload", onBeforeUnload);

    presenceHeartbeatRef.current = window.setInterval(() => {
      if (!presenceStartedAtRef.current) return;
      const now = Date.now();
      const activeMs = now - presenceStartedAtRef.current;
      if (activeMs < 1000) return;
      presenceStartedAtRef.current = now;
      sendPresenceHeartbeat(activeMs, presencePageRef.current, false);
    }, 5000);

    return () => {
      if (presenceHeartbeatRef.current) {
        window.clearInterval(presenceHeartbeatRef.current);
        presenceHeartbeatRef.current = null;
      }
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("pagehide", onPageHide);
      window.removeEventListener("beforeunload", onBeforeUnload);
      flushPresence(true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setPresenceNow(Date.now());
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (page !== "stats") return;
    const timer = window.setInterval(() => {
      loadPresenceStats(statsStartDate, statsEndDate).catch((err) => {
        setError(err.message || "Something went wrong");
      });
    }, 5000);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statsStartDate, statsEndDate]);

  const openCreateModal = () => {
    setEditingItem(null);
    setForm({
      english_sentence: "",
      vietnamese_sentence: "",
      back_lang: "en",
      images: null,
      remove_image: false,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setForm({
      english_sentence: item.english_sentence || "",
      vietnamese_sentence: item.vietnamese_sentence || "",
      back_lang: item.back_lang || "en",
      images: null,
      remove_image: false,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (!submitting) setIsModalOpen(false);
  };

  const openBulkModal = () => {
    setBulkText("");
    setBulkBackLang("en");
    setBulkFiles([]);
    setIsBulkModalOpen(true);
  };

  const closeBulkModal = () => {
    if (!bulkSubmitting) setIsBulkModalOpen(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    setForm((prev) => ({ ...prev, images: file, remove_image: false }));
  };

  const handleRemoveImageChange = (e) => {
    const checked = e.target.checked;
    setForm((prev) => ({ ...prev, remove_image: checked }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const payload = new FormData();
      payload.append("english_sentence", form.english_sentence);
      payload.append("vietnamese_sentence", form.vietnamese_sentence);
      payload.append("back_lang", form.back_lang);
      if (form.images) payload.append("images", form.images);
      if (form.remove_image) payload.append("remove_image", "1");

      const isUpdating = Boolean(editingItem);
      const url = isUpdating ? `${apiBaseUrl}/sentences/${editingItem.id}` : `${apiBaseUrl}/sentences`;

      if (isUpdating) payload.append("_method", "PUT");

      const res = await fetch(url, {
        method: "POST",
        body: payload,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Submit failed");
      }

      await loadSentences(limit, backLang);
      setIsModalOpen(false);
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (item) => {
    const ok = window.confirm("Delete this sentence?");
    if (!ok) return;

    setError("");
    try {
      const res = await fetch(`${apiBaseUrl}/sentences/${item.id}`, { method: "DELETE" });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Delete failed");
      }
      await loadSentences(limit, backLang);
    } catch (err) {
      setError(err.message || "Something went wrong");
    }
  };

  const onLimitChange = (e) => {
    const nextLimit = Number(e.target.value) || 10;
    setLimit(nextLimit);
    loadSentences(nextLimit, backLang);
  };

  const onBackLangChange = (e) => {
    const nextBackLang = e.target.value;
    setBackLang(nextBackLang);
    loadSentences(limit, nextBackLang, dashboardDate);
  };

  const onDashboardDateChange = (e) => {
    const nextDate = e.target.value || "";
    setDashboardDate(nextDate);
    loadSentences(limit, backLang, nextDate);
  };

  const clearDashboardDateFilter = () => {
    setDashboardDate("");
    loadSentences(limit, backLang, "");
  };

  const onStatsStartDateChange = (e) => {
    const value = e.target.value || "";
    setStatsStartDate(value);
    Promise.all([loadClickStats(value, statsEndDate, statsBackLang), loadPresenceStats(value, statsEndDate)]).catch((err) => {
      setError(err.message || "Something went wrong");
    });
  };

  const onStatsEndDateChange = (e) => {
    const value = e.target.value || "";
    setStatsEndDate(value);
    Promise.all([loadClickStats(statsStartDate, value, statsBackLang), loadPresenceStats(statsStartDate, value), loadLearningOverview(value, statsBackLang)]).catch(
      (err) => {
        setError(err.message || "Something went wrong");
      }
    );
  };

  const onStatsBackLangChange = (e) => {
    const value = e.target.value;
    setStatsBackLang(value);
    Promise.all([loadClickStats(statsStartDate, statsEndDate, value), loadLearningOverview(statsEndDate, value)]).catch((err) => {
      setError(err.message || "Something went wrong");
    });
  };

  const logFlashcardClick = async (item) => {
    if (!item?.id) return;
    const payload = {
      flashcard_id: item.id,
      back_lang: item.back_lang || (backLang !== "all" ? backLang : undefined),
    };

    try {
      await fetch(`${apiBaseUrl}/flashcard-review-events`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
    } catch {
      // Do not block UI when logging click events.
    }
  };

  const parseBulkText = (rawText) => {
    const lines = rawText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    const items = [];
    for (const line of lines) {
      const parts = line.split("|").map((part) => part?.trim());
      const vietnameseSentence = parts[0];
      const englishSentence = parts[1];
      const imageRef = parts[2] || "";

      if (!vietnameseSentence || !englishSentence) {
        throw new Error("Wrong format. Use: Vietnamese | English | image_url_or_file_name");
      }

      const row = {
        english_sentence: englishSentence,
        vietnamese_sentence: vietnameseSentence,
        back_lang: bulkBackLang,
      };

      if (imageRef) {
        row.image_ref = imageRef;
      }
      items.push(row);
    }

    return items;
  };

  const handleBulkFilesChange = (e) => {
    setBulkFiles(Array.from(e.target.files || []));
  };

  const handleBulkSubmit = async (e) => {
    e.preventDefault();
    setBulkSubmitting(true);
    setError("");

    try {
      const items = parseBulkText(bulkText);
      const payload = new FormData();
      payload.append("items", JSON.stringify(items));
      bulkFiles.forEach((file) => payload.append("images[]", file));

      const res = await fetch(`${apiBaseUrl}/sentences/bulk`, {
        method: "POST",
        body: payload,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Bulk submit failed");
      }

      await loadSentences(limit, backLang);
      setIsBulkModalOpen(false);
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setBulkSubmitting(false);
    }
  };

  const handleFinanceInputChange = (e) => {
    const { name, value } = e.target;
    setFinanceForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFinanceSubmit = async (e) => {
    e.preventDefault();
    setFinanceSubmitting(true);
    setError("");

    try {
      const payload = {
        date: financeForm.date,
        expense: Number(financeForm.expense || 0),
        income: Number(financeForm.income || 0),
        description: financeForm.description || null,
      };

      const isUpdating = Boolean(editingFinanceId);
      const url = isUpdating ? `${apiBaseUrl}/daily-finances/${editingFinanceId}` : `${apiBaseUrl}/daily-finances`;

      const res = await fetch(url, {
        method: isUpdating ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Save finance failed");
      }

      await loadFinances();
      resetFinanceForm();
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setFinanceSubmitting(false);
    }
  };

  const handleFinanceEdit = (item) => {
    setEditingFinanceId(item.id);
    setFinanceForm({
      date: item.date || "",
      expense: Number(item.expense || 0),
      income: Number(item.income || 0),
      description: item.description || "",
    });
  };

  const handleFinanceDelete = async (item) => {
    const ok = window.confirm(`Delete finance row on ${item.date}?`);
    if (!ok) return;

    setError("");
    try {
      const res = await fetch(`${apiBaseUrl}/daily-finances/${item.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Delete finance failed");
      }
      await loadFinances();
      if (editingFinanceId === item.id) {
        resetFinanceForm();
      }
    } catch (err) {
      setError(err.message || "Something went wrong");
    }
  };

  const handleRewardInputChange = (e) => {
    const { name, value } = e.target;
    setRewardForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleRewardSubmit = async (e) => {
    e.preventDefault();
    setRewardSubmitting(true);
    setError("");

    try {
      const payload = {
        reward_date: rewardForm.reward_date,
        amount: Number(rewardForm.amount || 0),
        test_histories_count: Number(rewardForm.test_histories_count || 0),
      };

      const isUpdating = Boolean(editingRewardId);
      const url = isUpdating ? `${apiBaseUrl}/daily-rewards/${editingRewardId}` : `${apiBaseUrl}/daily-rewards`;

      const res = await fetch(url, {
        method: isUpdating ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Save reward failed");
      }

      await loadDailyRewards();
      resetRewardForm();
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setRewardSubmitting(false);
    }
  };

  const handleRewardEdit = (item) => {
    setEditingRewardId(item.id);
    setRewardForm({
      reward_date: item.reward_date || "",
      amount: Number(item.amount || 0),
      test_histories_count: Number(item.test_histories_count || 0),
    });
  };

  const handleRewardDelete = async (item) => {
    const ok = window.confirm(`Delete daily reward on ${item.reward_date}?`);
    if (!ok) return;

    setError("");
    try {
      const res = await fetch(`${apiBaseUrl}/daily-rewards/${item.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Delete reward failed");
      }
      await loadDailyRewards();
      if (editingRewardId === item.id) {
        resetRewardForm();
      }
    } catch (err) {
      setError(err.message || "Something went wrong");
    }
  };

  const handleTaskInputChange = (e) => {
    const { name, value } = e.target;
    setTaskForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleTaskSubmit = async (e) => {
    e.preventDefault();
    setTaskSubmitting(true);
    setError("");

    try {
      const description = taskForm.description.trim();
      if (!description) {
        throw new Error("Description is required");
      }

      const payload = {
        description,
        created_at: taskForm.created_at,
        type: taskForm.type,
      };

      const isUpdating = Boolean(editingTaskId);
      const url = isUpdating ? `${apiBaseUrl}/tasks/${editingTaskId}` : `${apiBaseUrl}/tasks`;
      const res = await fetch(url, {
        method: isUpdating ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Save task failed");
      }

      await loadTasks();
      resetTaskForm();
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setTaskSubmitting(false);
    }
  };

  const handleTaskEdit = (item) => {
    setEditingTaskId(item.id);
    setTaskForm({
      description: item.description || "",
      created_at: item.created_at || new Date().toISOString().slice(0, 10),
      type: item.type || "custom",
    });
  };

  const handleTaskDelete = async (item) => {
    const ok = window.confirm("Delete this task?");
    if (!ok) return;

    setError("");
    try {
      const res = await fetch(`${apiBaseUrl}/tasks/${item.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Delete task failed");
      }

      await loadTasks();
      if (editingTaskId === item.id) {
        resetTaskForm();
      }
    } catch (err) {
      setError(err.message || "Something went wrong");
    }
  };

  const toggleCard = (item) => {
    const id = item.id;
    const nextIsFlipped = !Boolean(flippedCards[id]);
    setFlippedCards((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
    if (nextIsFlipped) {
      void logFlashcardClick(item);
    }
  };

  const areAllCardsFlipped = sentences.length > 0 && sentences.every((item) => Boolean(flippedCards[item.id]));

  const toggleAllCards = () => {
    if (sentences.length === 0) return;

    if (areAllCardsFlipped) {
      setFlippedCards({});
      return;
    }

    const nextFlipped = {};
    sentences.forEach((item) => {
      nextFlipped[item.id] = true;
    });
    setFlippedCards(nextFlipped);
  };

  const resolveSpeechLang = (langCode) => {
    const value = (langCode || "").toLowerCase();
    if (value === "ja") return "ja-JP";
    if (value === "zh") return "zh-CN";
    return "en-US";
  };

  const pickVoiceByLang = (speechLang) => {
    const voices = window.speechSynthesis.getVoices();
    return voices.find((voice) => voice.lang.toLowerCase().startsWith(speechLang.toLowerCase().slice(0, 2)));
  };

  const speakBackText = (event, sentenceId, text, langCode) => {
    event.stopPropagation();
    if (!("speechSynthesis" in window)) {
      setError("Your browser does not support speech.");
      return;
    }

    if (speakingId === sentenceId) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const speechLang = resolveSpeechLang(langCode);
    utterance.lang = speechLang;

    const voice = pickVoiceByLang(speechLang);
    if (voice) {
      utterance.voice = voice;
    }

    utterance.rate = 0.95;
    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);
    setSpeakingId(sentenceId);
    window.speechSynthesis.speak(utterance);
  };

  const startTest = async () => {
    setTestLoading(true);
    setError("");

    try {
      const data = await fetchSentences(testLimit, testBackLang);
      setTestCards(data);
      setTestIndex(0);
      setTestFlipped(false);
      setTestResults({});
      setTestSaved(false);
      setTestSaveMessage("");

      const now = Date.now();
      setTestStartedAt(now);
      setTestNow(now);
      setCardTimerStartAt(data.length > 0 ? now : null);
      setCardElapsedMs(0);
    } catch (err) {
      setError(err.message || "Cannot start test");
    } finally {
      setTestLoading(false);
    }
  };

  const resetTest = () => {
    setTestCards([]);
    setTestIndex(0);
    setTestFlipped(false);
    setTestStartedAt(null);
    setCardTimerStartAt(null);
    setCardElapsedMs(0);
    setTestResults({});
    setTestSaved(false);
    setTestSaveMessage("");
    setError("");
  };

  const currentTestCard = testCards[testIndex] || null;
  const currentTestResult = currentTestCard ? testResults[currentTestCard.id] || {} : {};
  const isCardStopped = Boolean(currentTestResult.timer_stopped);

  const stopCurrentCardTimer = () => {
    if (!currentTestCard || isCardStopped) return;
    const finalElapsed = cardElapsedMs;

    setCardTimerStartAt(null);
    setTestResults((prev) => ({
      ...prev,
      [currentTestCard.id]: {
        ...(prev[currentTestCard.id] || {}),
        time_ms: finalElapsed,
        timer_stopped: true,
      },
    }));
  };

  const setCurrentCardState = (field, value) => {
    if (!currentTestCard) return;
    setTestResults((prev) => ({
      ...prev,
      [currentTestCard.id]: {
        ...(prev[currentTestCard.id] || {}),
        [field]: value,
      },
    }));
  };

  const goNextCard = () => {
    if (!currentTestCard) return;

    const result = testResults[currentTestCard.id] || {};
    const mergedResult = {
      ...result,
      timer_stopped: result.timer_stopped ?? true,
      time_ms: result.timer_stopped ? (result.time_ms ?? 0) : cardElapsedMs,
      remembered: typeof result.remembered === "boolean" ? result.remembered : false,
      known: typeof result.known === "boolean" ? result.known : false,
    };

    setTestResults((prev) => ({
      ...prev,
      [currentTestCard.id]: mergedResult,
    }));
    setError("");

    if (testIndex >= testCards.length - 1) {
      setCardTimerStartAt(null);
      setTestNow(Date.now());
      return;
    }

    const nextIndex = testIndex + 1;
    setTestIndex(nextIndex);
    setTestFlipped(false);
    const now = Date.now();
    setCardTimerStartAt(now);
    setCardElapsedMs(0);
  };

  const saveCompletedTest = async () => {
    if (testSaved || testCards.length === 0) return;

    setRewardSaving(true);
    setError("");

    try {
      const payload = {
        back_lang: testBackLang,
        total_cards: testCards.length,
        completed_cards: completedCount,
        total_time_ms: Math.max(0, Math.round(totalElapsedMs)),
        average_time_ms: Math.max(0, Math.round(averageCardMs)),
        remember_yes_count: rememberYesCount,
        known_yes_count: knowYesCount,
      };

      const res = await fetch(`${apiBaseUrl}/test-histories/complete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Cannot save test result");
      }

      const data = await res.json();
      setTestSaved(true);
      setTestSaveMessage(data.reward_awarded_now ? "Completed test. Reward +100,000 today." : "Completed test. Today's reward already claimed.");

      await Promise.all([loadDailyRewards(), loadTestHistories()]);
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setRewardSaving(false);
    }
  };

  const completedCount = testCards.filter((card) => {
    const result = testResults[card.id];
    return result?.timer_stopped && typeof result.remembered === "boolean" && typeof result.known === "boolean";
  }).length;

  const totalElapsedMs = testStartedAt ? testNow - testStartedAt : 0;
  const averageCardMs =
    completedCount > 0 ? Math.round(testCards.reduce((sum, card) => sum + Number(testResults[card.id]?.time_ms || 0), 0) / completedCount) : 0;

  const rememberYesCount = testCards.filter((card) => testResults[card.id]?.remembered === true).length;
  const knowYesCount = testCards.filter((card) => testResults[card.id]?.known === true).length;
  const presenceDailyTotals = useMemo(() => {
    const grouped = presenceDailyStats.reduce((acc, row) => {
      const key = row.event_date;
      acc[key] = (acc[key] || 0) + Number(row.total_active_ms || 0);
      return acc;
    }, {});

    return Object.entries(grouped)
      .map(([eventDate, totalActiveMs]) => ({ event_date: eventDate, total_active_ms: totalActiveMs }))
      .sort((a, b) => (a.event_date < b.event_date ? 1 : -1));
  }, [presenceDailyStats]);
  const todayActiveMs = useMemo(() => {
    const row = presenceDailyTotals.find((item) => item.event_date === todayYmd);
    return Number(row?.total_active_ms || 0);
  }, [presenceDailyTotals, todayYmd]);
  const todayActiveLiveMs = useMemo(() => {
    const startedAt = presenceStartedAtRef.current;
    if (!startedAt) return todayActiveMs;
    const pendingMs = Math.max(0, presenceNow - startedAt);
    return todayActiveMs + pendingMs;
  }, [todayActiveMs, presenceNow]);
  const learningChartMax = useMemo(() => {
    if (learningSeries.length === 0) return 1;
    return Math.max(
      ...learningSeries.map((row) => Math.max(Number(row.created_today || 0), Number(row.learned_today || 0))),
      1
    );
  }, [learningSeries]);

  const pageTitle =
    page === "dashboard"
      ? "Sentence Dashboard"
      : page === "test"
      ? "Flashcard Test"
      : page === "finance"
      ? "Daily Finance"
      : page === "stats"
      ? "Flashcard Stats"
      : "Task Manager";

  return (
    <div className="page">
      <div className="dashboard">
        <div className="header">
          <h1>{pageTitle}</h1>
          <div className="header-actions">
            <button className={`btn ${page === "dashboard" ? "btn-primary" : ""}`} onClick={() => setPage("dashboard")}>
              Dashboard
            </button>
            <button className={`btn ${page === "test" ? "btn-primary" : ""}`} onClick={() => setPage("test")}>
              Test
            </button>
            <button className={`btn ${page === "finance" ? "btn-primary" : ""}`} onClick={() => setPage("finance")}>
              Finance
            </button>
            <button className={`btn ${page === "stats" ? "btn-primary" : ""}`} onClick={() => setPage("stats")}>
              Stats
            </button>
            <button className={`btn ${page === "task" ? "btn-primary" : ""}`} onClick={() => setPage("task")}>
              Task
            </button>
            <button className="btn" onClick={openBulkModal}>
              Bulk Add
            </button>
            <button className="btn btn-primary" onClick={openCreateModal}>
              Add Sentence
            </button>
          </div>
        </div>

        {page === "dashboard" ? (
          <div className="toolbar">
            <label htmlFor="limit">Limit</label>
            <select id="limit" value={limit} onChange={onLimitChange}>
              {limitOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <label htmlFor="back-lang">Back Lang</label>
            <select id="back-lang" className="lang-select" value={backLang} onChange={onBackLangChange}>
              {backLangOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <label htmlFor="dashboard-date">Date</label>
            <input id="dashboard-date" type="date" value={dashboardDate} onChange={onDashboardDateChange} />
            <button className="btn" onClick={clearDashboardDateFilter} disabled={!dashboardDate}>
              Clear Date
            </button>
            <button className="btn" onClick={toggleAllCards}>
              {areAllCardsFlipped ? "Show Front" : "Flip All"}
            </button>
            <button className="btn" onClick={() => loadSentences(limit, backLang)}>
              Refresh
            </button>
          </div>
        ) : page === "test" ? (
          <div className="toolbar">
            <label htmlFor="test-limit">Limit</label>
            <select id="test-limit" value={testLimit} onChange={(e) => setTestLimit(Number(e.target.value) || 20)}>
              {limitOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <label htmlFor="test-back-lang">Back Lang</label>
            <select id="test-back-lang" className="lang-select" value={testBackLang} onChange={(e) => setTestBackLang(e.target.value)}>
              {backLangOptions
                .filter((option) => option.value !== "all")
                .map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
            </select>
            <button className="btn btn-primary" onClick={startTest} disabled={testLoading}>
              {testLoading ? "Starting..." : "Start Test"}
            </button>
            <button className="btn" onClick={resetTest}>
              Reset
            </button>
          </div>
        ) : page === "finance" ? (
          <div className="toolbar">
            <button
              className="btn"
              onClick={() =>
                Promise.all([loadFinances(), loadDailyRewards(), loadTestHistories()]).catch((err) => setError(err.message || "Something went wrong"))
              }
            >
              Refresh Finance
            </button>
            <button className="btn" onClick={resetFinanceForm}>
              {editingFinanceId ? "Cancel Edit" : "Clear Form"}
            </button>
            <button className="btn" onClick={resetRewardForm}>
              {editingRewardId ? "Cancel Reward Edit" : "Clear Reward Form"}
            </button>
          </div>
        ) : page === "stats" ? (
          <div className="toolbar">
            <label htmlFor="stats-start-date">From</label>
            <input id="stats-start-date" type="date" value={statsStartDate} onChange={onStatsStartDateChange} />
            <label htmlFor="stats-end-date">To</label>
            <input id="stats-end-date" type="date" value={statsEndDate} onChange={onStatsEndDateChange} />
            <label htmlFor="stats-back-lang">Back Lang</label>
            <select id="stats-back-lang" className="lang-select" value={statsBackLang} onChange={onStatsBackLangChange}>
              {backLangOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button
              className="btn"
              onClick={() =>
                Promise.all([
                  loadClickStats(statsStartDate, statsEndDate, statsBackLang),
                  loadPresenceStats(statsStartDate, statsEndDate),
                  loadLearningOverview(statsEndDate, statsBackLang),
                ]).catch((err) => setError(err.message || "Something went wrong"))
              }
            >
              Refresh Stats
            </button>
          </div>
        ) : (
          <div className="toolbar">
            <button className="btn" onClick={() => loadTasks().catch((err) => setError(err.message || "Something went wrong"))}>
              Refresh Tasks
            </button>
            <button className="btn" onClick={resetTaskForm}>
              {editingTaskId ? "Cancel Edit" : "Clear Form"}
            </button>
          </div>
        )}

        {error ? <p className="error">{error}</p> : null}

        {page === "dashboard" ? (
          <div className="cards-grid">
            {loading ? <div className="empty">Loading...</div> : null}
            {!loading && sentences.length === 0 ? <div className="empty">No data</div> : null}

            {!loading
              ? sentences.map((item) => (
                  <article key={item.id} className={`flash-card ${flippedCards[item.id] ? "is-flipped" : ""}`} onClick={() => toggleCard(item)}>
                    <div className="flash-card-inner">
                      <div className="flash-card-face flash-card-front">
                        <div className="card-id">#{item.id}</div>
                        <p className="card-text">{item.vietnamese_sentence}</p>
                        <p className="card-hint">Tap to see back side</p>
                      </div>

                      <div className="flash-card-face flash-card-back">
                        <div className="card-top">
                          <div className="card-id">#{item.id}</div>
                          <button
                            type="button"
                            className={`speak-btn ${speakingId === item.id ? "is-speaking" : ""}`}
                            onClick={(event) => speakBackText(event, item.id, item.english_sentence, item.back_lang)}
                            aria-label="Speak back text"
                            title="Speak"
                          >
                            <svg viewBox="0 0 24 24" aria-hidden="true">
                              <path d="M3 10v4h4l5 4V6L7 10H3zm13.5 2a3.5 3.5 0 0 0-1.75-3.03v6.06A3.5 3.5 0 0 0 16.5 12zm0-7a1 1 0 0 0-1 1v2.07a6.5 6.5 0 0 1 0 7.86V18a1 1 0 0 0 2 0v-2.68a8.5 8.5 0 0 0 0-6.64V6a1 1 0 0 0-1-1z" />
                            </svg>
                          </button>
                        </div>
                        <p className="card-text">{item.english_sentence}</p>
                        {item.images ? <img src={imageUrl(item.images)} alt="sentence" className="flash-image" /> : <p className="muted">No image</p>}
                        <div className="actions" onClick={(e) => e.stopPropagation()}>
                          <button className="btn btn-edit" onClick={() => openEditModal(item)}>
                            Edit
                          </button>
                          <button className="btn btn-danger" onClick={() => handleDelete(item)}>
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                ))
              : null}
          </div>
        ) : page === "test" ? (
          <div className="test-area">
            {!testStartedAt ? (
              <div className="empty">Press Start Test to begin.</div>
            ) : testCards.length === 0 ? (
              <div className="empty">No cards for this language.</div>
            ) : (
              <>
                <div className="test-stats">
                  <div>
                    Progress: {Math.min(testIndex + 1, testCards.length)}/{testCards.length}
                  </div>
                  <div>Total Time: {formatDuration(totalElapsedMs)}</div>
                  <div>
                    Completed: {completedCount}/{testCards.length}
                  </div>
                </div>

                {currentTestCard ? (
                  <div className="test-card-wrap">
                    <article className={`flash-card test-card ${testFlipped ? "is-flipped" : ""}`} onClick={() => setTestFlipped((prev) => !prev)}>
                      <div className="flash-card-inner">
                        <div className="flash-card-face flash-card-front">
                          <div className="card-id">#{currentTestCard.id}</div>
                          <p className="card-text">{currentTestCard.vietnamese_sentence}</p>
                          <p className="card-hint">Tap to flip</p>
                        </div>

                        <div className="flash-card-face flash-card-back">
                          <div className="card-top">
                            <div className="card-id">#{currentTestCard.id}</div>
                            <button
                              type="button"
                              className={`speak-btn ${speakingId === currentTestCard.id ? "is-speaking" : ""}`}
                              onClick={(event) =>
                                speakBackText(event, currentTestCard.id, currentTestCard.english_sentence, currentTestCard.back_lang)
                              }
                              aria-label="Speak back text"
                              title="Speak"
                            >
                              <svg viewBox="0 0 24 24" aria-hidden="true">
                                <path d="M3 10v4h4l5 4V6L7 10H3zm13.5 2a3.5 3.5 0 0 0-1.75-3.03v6.06A3.5 3.5 0 0 0 16.5 12zm0-7a1 1 0 0 0-1 1v2.07a6.5 6.5 0 0 1 0 7.86V18a1 1 0 0 0 2 0v-2.68a8.5 8.5 0 0 0 0-6.64V6a1 1 0 0 0-1-1z" />
                              </svg>
                            </button>
                          </div>
                          <p className="card-text">{currentTestCard.english_sentence}</p>
                          {currentTestCard.images ? (
                            <img src={imageUrl(currentTestCard.images)} alt="sentence" className="flash-image" />
                          ) : (
                            <p className="muted">No image</p>
                          )}
                        </div>
                      </div>
                    </article>

                    <div className="test-controls">
                      <div className="timer-box">
                        <strong>Card Time:</strong> {formatDuration(isCardStopped ? currentTestResult.time_ms || 0 : cardElapsedMs)}
                        <button className="btn" type="button" onClick={stopCurrentCardTimer} disabled={isCardStopped}>
                          {isCardStopped ? "Stopped" : "Stop Timer"}
                        </button>
                      </div>

                      <div className="state-row">
                        <span>Remembered?</span>
                        <button
                          className={`btn ${currentTestResult.remembered === true ? "btn-primary" : ""}`}
                          type="button"
                          onClick={() => setCurrentCardState("remembered", true)}
                        >
                          Yes
                        </button>
                        <button
                          className={`btn ${currentTestResult.remembered === false ? "btn-danger" : ""}`}
                          type="button"
                          onClick={() => setCurrentCardState("remembered", false)}
                        >
                          No
                        </button>
                      </div>

                      <div className="state-row">
                        <span>Known?</span>
                        <button
                          className={`btn ${currentTestResult.known === true ? "btn-primary" : ""}`}
                          type="button"
                          onClick={() => setCurrentCardState("known", true)}
                        >
                          Yes
                        </button>
                        <button
                          className={`btn ${currentTestResult.known === false ? "btn-danger" : ""}`}
                          type="button"
                          onClick={() => setCurrentCardState("known", false)}
                        >
                          No
                        </button>
                      </div>

                      <button className="btn btn-primary" type="button" onClick={goNextCard}>
                        {testIndex >= testCards.length - 1 ? "Finish" : "Next Card"}
                      </button>
                    </div>
                  </div>
                ) : null}

                {testIndex >= testCards.length - 1 && completedCount === testCards.length ? (
                  <div className="test-summary">
                    <h3>Test Summary</h3>
                    <p>Average/card: {formatDuration(averageCardMs)}</p>
                    <p>
                      Remembered Yes: {rememberYesCount}/{testCards.length}
                    </p>
                    <p>
                      Known Yes: {knowYesCount}/{testCards.length}
                    </p>
                    {testSaveMessage ? <p>{testSaveMessage}</p> : null}
                    <button className="btn btn-primary" type="button" onClick={saveCompletedTest} disabled={testSaved || rewardSaving}>
                      {rewardSaving ? "Saving..." : testSaved ? "Saved" : "Complete Test (+100k/day)"}
                    </button>
                  </div>
                ) : null}
              </>
            )}
          </div>
        ) : page === "finance" ? (
          <div className="finance-area">
            <form className="finance-form" onSubmit={handleFinanceSubmit}>
              <label>
                Date
                <input type="date" name="date" value={financeForm.date} onChange={handleFinanceInputChange} required />
              </label>
              <label>
                Expense
                <input type="number" name="expense" min="0" step="0.01" value={financeForm.expense} onChange={handleFinanceInputChange} />
              </label>
              <label>
                Income
                <input type="number" name="income" min="0" step="0.01" value={financeForm.income} onChange={handleFinanceInputChange} />
              </label>
              <label className="finance-desc">
                Description
                <textarea name="description" value={financeForm.description} onChange={handleFinanceInputChange} />
              </label>
              <button className="btn btn-primary" type="submit" disabled={financeSubmitting}>
                {financeSubmitting ? "Saving..." : editingFinanceId ? "Update" : "Save"}
              </button>
            </form>

            <div className="finance-table-wrap">
              {financeLoading ? (
                <div className="empty">Loading finance data...</div>
              ) : financeItems.length === 0 ? (
                <div className="empty">No finance data yet.</div>
              ) : (
                <table className="finance-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Expense</th>
                      <th>Income</th>
                      <th>Description</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {financeItems.map((item) => (
                      <tr key={item.id}>
                        <td>{item.date}</td>
                        <td>{Number(item.expense || 0).toLocaleString()}</td>
                        <td>{Number(item.income || 0).toLocaleString()}</td>
                        <td>{item.description || "-"}</td>
                        <td className="actions">
                          <button className="btn btn-edit" type="button" onClick={() => handleFinanceEdit(item)}>
                            Edit
                          </button>
                          <button className="btn btn-danger" type="button" onClick={() => handleFinanceDelete(item)}>
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="finance-table-wrap">
              <form className="finance-form" onSubmit={handleRewardSubmit}>
                <label>
                  Reward Date
                  <input type="date" name="reward_date" value={rewardForm.reward_date} onChange={handleRewardInputChange} required />
                </label>
                <label>
                  Amount
                  <input type="number" name="amount" min="0" step="1" value={rewardForm.amount} onChange={handleRewardInputChange} required />
                </label>
                <label>
                  Test Count
                  <input
                    type="number"
                    name="test_histories_count"
                    min="0"
                    step="1"
                    value={rewardForm.test_histories_count}
                    onChange={handleRewardInputChange}
                  />
                </label>
                <button className="btn btn-primary" type="submit" disabled={rewardSubmitting}>
                  {rewardSubmitting ? "Saving..." : editingRewardId ? "Update Reward" : "Save Reward"}
                </button>
              </form>

              {dailyRewards.length === 0 ? (
                <div className="empty">No daily rewards yet.</div>
              ) : (
                <table className="finance-table">
                  <thead>
                    <tr>
                      <th>Reward Date</th>
                      <th>Amount</th>
                      <th>Completed Tests (saved)</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dailyRewards.map((item) => (
                      <tr key={item.id}>
                        <td>{item.reward_date}</td>
                        <td>{Number(item.amount || 0).toLocaleString()}</td>
                        <td>{item.test_histories_count}</td>
                        <td className="actions">
                          <button className="btn btn-edit" type="button" onClick={() => handleRewardEdit(item)}>
                            Edit
                          </button>
                          <button className="btn btn-danger" type="button" onClick={() => handleRewardDelete(item)}>
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="finance-table-wrap">
              {testHistories.length === 0 ? (
                <div className="empty">No test history yet.</div>
              ) : (
                <table className="finance-table">
                  <thead>
                    <tr>
                      <th>Tested At</th>
                      <th>Lang</th>
                      <th>Total Cards</th>
                      <th>Time</th>
                      <th>Remembered</th>
                      <th>Known</th>
                    </tr>
                  </thead>
                  <tbody>
                    {testHistories.map((item) => (
                      <tr key={item.id}>
                        <td>{item.tested_at}</td>
                        <td>{item.back_lang}</td>
                        <td>
                          {item.completed_cards}/{item.total_cards}
                        </td>
                        <td>{formatDuration(item.total_time_ms || 0)}</td>
                        <td>{item.remember_yes_count}</td>
                        <td>{item.known_yes_count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        ) : page === "stats" ? (
          <div className="finance-area">
            <div className="finance-table-wrap">
              {learningLoading ? (
                <div className="empty">Loading 14-day learning chart...</div>
              ) : learningSeries.length === 0 ? (
                <div className="empty">No learning data for last 14 days.</div>
              ) : (
                <div className="learning-chart-wrap">
                  <div className="learning-chart-title">Learned Today / Created Today (Last 14 Days)</div>
                  <div className="learning-chart">
                    {learningSeries.map((row) => {
                      const totalWords = Number(row.created_today || 0);
                      const learnedCount = Number(row.learned_today || 0);
                      const learnedHeight = `${Math.max(2, (learnedCount / learningChartMax) * 100)}%`;
                      const totalHeight = `${Math.max(2, (totalWords / learningChartMax) * 100)}%`;
                      const dateLabel = row.event_date.slice(5);
                      return (
                        <button
                          key={row.event_date}
                          type="button"
                          className="learning-bar-btn"
                          onClick={() => openLearningDayDetail(row.event_date)}
                          title={`${row.event_date}: ${learnedCount}/${totalWords}`}
                        >
                          <div className="learning-bar-stack">
                            <div className="learning-bar-total" style={{ height: totalHeight }} />
                            <div className="learning-bar-learned" style={{ height: learnedHeight }} />
                          </div>
                          <div className="learning-bar-value">
                            {learnedCount}/{totalWords}
                          </div>
                          <div className="learning-bar-date">{dateLabel}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="test-stats">
              <div>
                Active Today ({todayYmd}): {presenceLoading ? "Loading..." : formatDurationLong(todayActiveLiveMs)}
              </div>
            </div>

            <div className="finance-table-wrap">
              {presenceLoading ? (
                <div className="empty">Loading active time...</div>
              ) : presenceDailyTotals.length === 0 ? (
                <div className="empty">No active-time data in selected range.</div>
              ) : (
                <table className="finance-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Total Active Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {presenceDailyTotals.map((row) => (
                      <tr key={row.event_date}>
                        <td>{row.event_date}</td>
                        <td>{formatDurationLong(row.total_active_ms)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="finance-table-wrap">
              {presenceLoading ? (
                <div className="empty">Loading active-time breakdown...</div>
              ) : presenceDailyStats.length === 0 ? (
                <div className="empty">No page breakdown in selected range.</div>
              ) : (
                <table className="finance-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Page</th>
                      <th>Active Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {presenceDailyStats.map((row, idx) => (
                      <tr key={`${row.event_date}-${row.page}-${idx}`}>
                        <td>{row.event_date}</td>
                        <td>{row.page}</td>
                        <td>{formatDurationLong(row.total_active_ms)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="finance-table-wrap">
              {statsLoading ? (
                <div className="empty">Loading click history...</div>
              ) : clickHistory.length === 0 ? (
                <div className="empty">No click history in selected range.</div>
              ) : (
                <table className="finance-table">
                  <thead>
                    <tr>
                      <th>Event Time</th>
                      <th>Flashcard ID</th>
                      <th>Back Lang</th>
                      <th>Vietnamese</th>
                      <th>English</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clickHistory.map((row) => (
                      <tr key={row.id}>
                        <td>{row.event_at}</td>
                        <td>{row.flashcard_id}</td>
                        <td>{row.back_lang}</td>
                        <td>{row.vietnamese_sentence || "-"}</td>
                        <td>{row.english_sentence || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        ) : (
          <div className="task-area">
            <form className="task-form" onSubmit={handleTaskSubmit}>
              <label className="task-desc">
                Description
                <textarea name="description" value={taskForm.description} onChange={handleTaskInputChange} required />
              </label>
              <label>
                Created Date
                <input type="date" name="created_at" value={taskForm.created_at} onChange={handleTaskInputChange} required />
              </label>
              <label>
                Type
                <select name="type" value={taskForm.type} onChange={handleTaskInputChange}>
                  {taskTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <button className="btn btn-primary" type="submit" disabled={taskSubmitting}>
                {taskSubmitting ? "Saving..." : editingTaskId ? "Update Task" : "Create Task"}
              </button>
            </form>

            <div className="finance-table-wrap">
              {tasks.length === 0 ? (
                <div className="empty">No tasks yet.</div>
              ) : (
                <table className="finance-table task-table">
                  <thead>
                    <tr>
                      <th>Description</th>
                      <th>Created Date</th>
                      <th>Type</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map((item) => (
                      <tr key={item.id}>
                        <td>{item.description}</td>
                        <td>{item.created_at}</td>
                        <td>{item.type}</td>
                        <td className="actions">
                          <button className="btn btn-edit" type="button" onClick={() => handleTaskEdit(item)}>
                            Edit
                          </button>
                          <button className="btn btn-danger" type="button" onClick={() => handleTaskDelete(item)}>
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>

      {isModalOpen ? (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editingItem ? "Edit Sentence" : "Create Sentence"}</h2>
            <form onSubmit={handleSubmit}>
              <label>
                English sentence
                <textarea name="english_sentence" value={form.english_sentence} onChange={handleInputChange} required />
              </label>

              <label>
                Vietnamese sentence
                <textarea name="vietnamese_sentence" value={form.vietnamese_sentence} onChange={handleInputChange} required />
              </label>

              <label>
                Back language
                <select name="back_lang" value={form.back_lang} onChange={handleInputChange}>
                  {backLangOptions
                    .filter((option) => option.value !== "all")
                    .map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                </select>
              </label>

              <label>
                Image
                <input type="file" accept="image/*" onChange={handleFileChange} />
              </label>

              {editingItem?.images ? (
                <div className="current-image-box">
                  <p className="current-image-title">Current image</p>
                  {!form.remove_image ? <img src={imageUrl(editingItem.images)} alt="current sentence" className="thumb" /> : null}
                  <label className="checkbox-line">
                    <input type="checkbox" checked={form.remove_image} onChange={handleRemoveImageChange} />
                    Remove current image
                  </label>
                </div>
              ) : null}

              <div className="modal-actions">
                <button type="button" className="btn" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {isBulkModalOpen ? (
        <div className="modal-overlay" onClick={closeBulkModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Bulk Add Sentences</h2>
            <form onSubmit={handleBulkSubmit}>
              <label>
                Back language
                <select value={bulkBackLang} onChange={(e) => setBulkBackLang(e.target.value)}>
                  {backLangOptions
                    .filter((option) => option.value !== "all")
                    .map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                </select>
              </label>

              <label>
                One sentence per line (Vietnamese | English | image_url_or_file_name)
                <textarea
                  className="bulk-textarea"
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  placeholder={"Xin chao | Hello | hello.jpg\nToi yeu lap trinh | I love coding | https://example.com/coding.jpg"}
                  required
                />
              </label>

              <label>
                Upload image files (optional)
                <input type="file" accept="image/*" multiple onChange={handleBulkFilesChange} />
              </label>

              {bulkFiles.length > 0 ? <div className="bulk-tip">Selected files: {bulkFiles.map((file) => file.name).join(", ")}</div> : null}
              <div className="bulk-tip">Maximum 500 lines per request. Match file name in line 3rd column.</div>

              <div className="modal-actions">
                <button type="button" className="btn" onClick={closeBulkModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={bulkSubmitting}>
                  {bulkSubmitting ? "Importing..." : "Import"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {isLearningDetailOpen ? (
        <div className="modal-overlay" onClick={() => setIsLearningDetailOpen(false)}>
          <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
            <h2>Learning Detail - {selectedLearningDay || "-"}</h2>
            {dayDetailLoading ? (
              <div className="empty">Loading detail...</div>
            ) : (
              <div className="learning-detail-grid">
                <div className="finance-table-wrap">
                  <div className="learning-detail-header">
                    <h3>Learned Words ({learningDayDetail.learned_words?.length || 0})</h3>
                  </div>
                  {learningDayDetail.learned_words?.length ? (
                    <table className="finance-table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Vietnamese</th>
                          <th>English</th>
                          <th>Clicks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {learningDayDetail.learned_words.map((row) => (
                          <tr key={`learned-${row.flashcard_id}`}>
                            <td>{row.flashcard_id}</td>
                            <td>{row.vietnamese_sentence || "-"}</td>
                            <td>{row.english_sentence || "-"}</td>
                            <td>{row.click_count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="empty">No learned words this day.</div>
                  )}
                </div>

                <div className="finance-table-wrap">
                  <div className="learning-detail-header">
                    <h3>Unlearned Words ({learningDayDetail.unlearned_words?.length || 0})</h3>
                    <div className="actions">
                      <button className="btn" type="button" onClick={downloadUnlearnedCsv} disabled={!learningDayDetail.unlearned_words?.length}>
                        Excel (CSV)
                      </button>
                      <button className="btn" type="button" onClick={downloadUnlearnedDoc} disabled={!learningDayDetail.unlearned_words?.length}>
                        Word (.doc)
                      </button>
                    </div>
                  </div>
                  {learningDayDetail.unlearned_words?.length ? (
                    <table className="finance-table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Vietnamese</th>
                          <th>English</th>
                        </tr>
                      </thead>
                      <tbody>
                        {learningDayDetail.unlearned_words.map((row) => (
                          <tr key={`unlearned-${row.flashcard_id}`}>
                            <td>{row.flashcard_id}</td>
                            <td>{row.vietnamese_sentence || "-"}</td>
                            <td>{row.english_sentence || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="empty">No unlearned words.</div>
                  )}
                </div>
              </div>
            )}

            <div className="modal-actions">
              <button type="button" className="btn" onClick={() => setIsLearningDetailOpen(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default App;
