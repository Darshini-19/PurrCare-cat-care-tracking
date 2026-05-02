import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { api } from "../api";
import CatPicker from "../components/CatPicker.jsx";
import { useCats } from "../context/CatContext.jsx";

const PIE_COLORS = ["#5b2db8", "#7b57d1", "#9c7cff", "#c3adff", "#8f79c9"];

function getMoodCounts(list) {
  return {
    normal: list.filter((l) => l.mood === "normal").length,
    playful: list.filter((l) => l.mood === "playful").length,
    sleepy: list.filter((l) => l.mood === "sleepy").length,
    restless: list.filter((l) => l.mood === "restless").length,
    hiding: list.filter((l) => l.mood === "hiding").length,
    not_eating_well: list.filter((l) => l.mood === "not_eating_well").length,
  };
}

function getTopMood(counts) {
  let topMood = "normal";
  let topCount = -1;

  Object.entries(counts).forEach(([key, value]) => {
    if (value > topCount) {
      topMood = key;
      topCount = value;
    }
  });

  return topCount > 0 ? topMood : "";
}

function formatMoodLabel(mood) {
  return String(mood || "").replace(/_/g, " ");
}

function getMoodSuggestion(topMood) {
  if (topMood === "playful") {
    return "This month your cat is mostly playful. Keep regular play sessions, balanced meals, fresh water, and enough rest to maintain good health.";
  }
  if (topMood === "sleepy") {
    return "This month your cat is mostly sleepy. Make sure feeding and water routines are regular, and watch for unusual tiredness if it continues for many days.";
  }
  if (topMood === "restless") {
    return "This month your cat seems restless. Try more play time, a calm environment, regular feeding, and a clean litter area to reduce stress.";
  }
  if (topMood === "hiding") {
    return "This month your cat is hiding often. Reduce noise and stress, give safe private spaces, and monitor for any sudden behavior changes.";
  }
  if (topMood === "not_eating_well") {
    return "This month your cat is often not eating well. Watch appetite closely, keep food routine stable, ensure hydration, and consider a vet visit if it continues.";
  }
  if (topMood === "normal") {
    return "This month your cat is mostly normal. Continue healthy food, fresh water, clean litter maintenance, and regular play for good wellbeing.";
  }
  return "No strong monthly mood pattern yet. Continue logging behavior to understand your cat better.";
}

function formatShortDate(dateValue) {
  return new Date(dateValue).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function getLast7DaysMoodTrend(logs) {
  const moodScoreMap = {
    playful: 5,
    normal: 4,
    sleepy: 3,
    restless: 2,
    hiding: 1,
    not_eating_well: 1,
  };

  const today = new Date();
  const result = [];

  for (let i = 6; i >= 0; i -= 1) {
    const day = new Date();
    day.setHours(0, 0, 0, 0);
    day.setDate(today.getDate() - i);

    const nextDay = new Date(day);
    nextDay.setDate(day.getDate() + 1);

    const dayLogs = logs.filter((log) => {
      if (!log.completedAt || log.category !== "mood" || !log.mood) return false;
      const t = new Date(log.completedAt).getTime();
      return t >= day.getTime() && t < nextDay.getTime();
    });

    const avgScore =
      dayLogs.length > 0
        ? Number(
            (
              dayLogs.reduce((sum, log) => sum + (moodScoreMap[log.mood] || 0), 0) / dayLogs.length
            ).toFixed(1)
          )
        : 0;

    result.push({
      day: formatShortDate(day),
      moodScore: avgScore,
    });
  }

  return result;
}

export default function Insights() {
  const { selectedCatId } = useCats();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  const load = useCallback(async () => {
    if (!selectedCatId) {
      setLogs([]);
      return;
    }

    setLoading(true);
    setErr(null);

    try {
      const data = await api.listLogs(selectedCatId);
      const filtered = data.filter((l) =>
        ["feeding", "water", "litter", "mood", "sleep"].includes(l.category)
      );
      setLogs(filtered);
    } catch (e) {
      setErr(e?.message || "Something went wrong while loading insights.");
    } finally {
      setLoading(false);
    }
  }, [selectedCatId]);

  useEffect(() => {
    load();
  }, [load]);

  const weeklyLogs = useMemo(() => {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return logs.filter((l) => {
      if (!l.completedAt) return false;
      return new Date(l.completedAt).getTime() >= weekAgo;
    });
  }, [logs]);

  const weeklyFeedingCount = weeklyLogs.filter((l) => l.category === "feeding").length;
  const weeklyWaterCount = weeklyLogs.filter((l) => l.category === "water").length;
  const weeklyLitterCount = weeklyLogs.filter((l) => l.category === "litter").length;
  const weeklySleepCount = weeklyLogs.filter((l) => l.category === "sleep").length;
  const weeklyMoodLogs = weeklyLogs.filter((l) => l.category === "mood");
  const weeklyMoodCount = weeklyMoodLogs.length;
  const weeklyMoodCounts = getMoodCounts(weeklyMoodLogs);

  const monthlyMoodLogs = useMemo(() => {
    const monthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    return logs.filter((l) => {
      if (!l.completedAt || l.category !== "mood") return false;
      return new Date(l.completedAt).getTime() >= monthAgo;
    });
  }, [logs]);

  const monthlyMoodCounts = getMoodCounts(monthlyMoodLogs);
  const topMonthlyMood = getTopMood(monthlyMoodCounts);
  const monthlyMoodSuggestion = getMoodSuggestion(topMonthlyMood);

  const weeklySummaryBarData = [
    { name: "Feeding", count: weeklyFeedingCount },
    { name: "Water", count: weeklyWaterCount },
    { name: "Litter", count: weeklyLitterCount },
    { name: "Sleep", count: weeklySleepCount },
    { name: "Mood", count: weeklyMoodCount },
  ];

  const weeklyMoodPieData = Object.entries(weeklyMoodCounts)
    .map(([key, value]) => ({
      name: formatMoodLabel(key),
      value,
    }))
    .filter((item) => item.value > 0);

  const weeklyMoodTrendData = useMemo(() => getLast7DaysMoodTrend(logs), [logs]);

  return (
    <div className="page">
      
      <h1 style={{ textAlign: "center" }}>Insights</h1>
      <p style={{ textAlign: "center", color: "var(--muted)" }}>
        View weekly summaries and monthly mood insights based on your cat’s care and behavior logs.
      </p>

      {err && <div className="alert error">{err}</div>}

      <div
        className="card"
        style={{
          marginBottom: "1rem",
          background: "rgba(247, 244, 255, 0.96)",
          border: "1px solid #8f79c9",
          boxShadow: "0 8px 18px rgba(60, 34, 112, 0.10)",
          maxWidth: "580px",
          marginLeft: "auto",
          marginRight: "auto",
        }}
      >
        <CatPicker />
      </div>

      {selectedCatId && (
        <>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.2rem",
              marginTop: "1.25rem",
              marginBottom: "0.65rem",
              textAlign: "center",
            }}
          >
            Weekly summary
          </h2>

          <div
            className="card"
            style={{
              marginBottom: "1rem",
              background: "rgba(247, 244, 255, 0.96)",
              border: "1px solid #8f79c9",
              boxShadow: "0 8px 18px rgba(60, 34, 112, 0.10)",
              maxWidth: "580px",
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            {loading ? (
              <p className="muted">Loading insights…</p>
            ) : (
              <>
                <p style={{ marginBottom: "0.45rem" }}>
                  Feedings this week: <strong>{weeklyFeedingCount}</strong>
                </p>
                <p style={{ marginBottom: "0.45rem" }}>
                  Water refreshes this week: <strong>{weeklyWaterCount}</strong>
                </p>
                <p style={{ marginBottom: "0.45rem" }}>
                  Litter care this week: <strong>{weeklyLitterCount}</strong>
                </p>
                <p style={{ marginBottom: "0.45rem" }}>
                  Sleep logs this week: <strong>{weeklySleepCount}</strong>
                </p>
                <p style={{ marginBottom: "0.85rem" }}>
                  Mood logs this week: <strong>{weeklyMoodCount}</strong>
                </p>
              </>
            )}
          </div>

          <div className="grid-2" style={{ marginBottom: "1rem" }}>
            <div
              className="card"
              style={{
                background: "rgba(247, 244, 255, 0.96)",
                border: "1px solid #8f79c9",
                boxShadow: "0 8px 18px rgba(60, 34, 112, 0.10)",
              }}
            >
              <h3 style={{ marginTop: 0, marginBottom: "0.75rem", fontSize: "1rem" , textAlign: "center"}}>
                Weekly care chart
              </h3>

              {loading ? (
                <p className="muted">Loading chart…</p>
              ) : (
                <div style={{ width: "100%", height: 300 }}>
                  <ResponsiveContainer>
                    <BarChart data={weeklySummaryBarData}>
                      <CartesianGrid stroke="#d7c8ff" strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fill: "#5f4b8a", fontSize: 12 }} />
                      <YAxis allowDecimals={false} tick={{ fill: "#5f4b8a", fontSize: 12 }} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" name="Count" fill="var(--accent)" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div
              className="card"
              style={{
                background: "rgba(247, 244, 255, 0.96)",
                border: "1px solid #8f79c9",
                boxShadow: "0 8px 18px rgba(60, 34, 112, 0.10)",
              }}
            >
              <h3 style={{ marginTop: 0, marginBottom: "0.75rem", fontSize: "1rem", textAlign: "center" }}>
                Weekly mood distribution
              </h3>

              {loading ? (
                <p className="muted">Loading chart…</p>
              ) : weeklyMoodPieData.length === 0 ? (
                <p className="muted" style={{ margin: 0 }}>
                  No mood logs recorded in the last 7 days.
                </p>
              ) : (
                <div style={{ width: "100%", height: 300 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={weeklyMoodPieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        label
                      >
                        {weeklyMoodPieData.map((entry, index) => (
                          <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          <div
            className="card"
            style={{
              marginBottom: "1rem",
              background: "rgba(247, 244, 255, 0.96)",
              border: "1px solid #8f79c9",
              boxShadow: "0 8px 18px rgba(60, 34, 112, 0.10)",
              maxWidth: "580px",
              margin: "0 auto",
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: "0.75rem", fontSize: "1rem" , textAlign: "center"}}>
              Mood trend graph
            </h3>

            {loading ? (
              <p className="muted">Loading chart…</p>
            ) : weeklyMoodTrendData.every((item) => item.moodScore === 0) ? (
              <p className="muted" style={{ margin: 0 }}>
                No mood trend data available for the last 7 days.
              </p>
            ) : (
              <>
                <div style={{ width: "100%", height: 320 }}>
                  <ResponsiveContainer>
                    <LineChart data={weeklyMoodTrendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" tick={{ fill: "#5f4b8a", fontSize: 12 }} />
                      <YAxis domain={[0, 5]} allowDecimals={false} tick={{ fill: "#5f4b8a", fontSize: 12 }} />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="moodScore"
                        name="Mood score"
                        stroke="var(--accent)"
                        strokeWidth={3}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <p className="muted" style={{ marginBottom: 0 }}>
                  Mood score guide: 5 = playful, 4 = normal, 3 = sleepy, 2 = restless, 1 = hiding / not eating well.
                </p>
              </>
            )}
          </div>

          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.2rem",
              marginTop: "1.75rem",
              marginBottom: "0.65rem",
              textAlign: "center",
            }}
          >
            Monthly mood insight
          </h2>

          <div
            className="card"
            style={{
              marginBottom: "1rem",
              background: "rgba(247, 244, 255, 0.96)",
              border: "1px solid #8f79c9",
              boxShadow: "0 8px 18px rgba(60, 34, 112, 0.10)",
              maxWidth: "580px",
              margin: "0 auto",
            }}
          >
            {loading ? (
              <p className="muted">Loading insights…</p>
            ) : (
              <>
                <p style={{ marginBottom: "0.55rem" }}>
                  This month your cat is{" "}
                  <strong>
                    {topMonthlyMood ? formatMoodLabel(topMonthlyMood) : "not logged enough yet"}
                  </strong>
                  .
                </p>
                <p className="muted" style={{ marginBottom: "0.9rem", lineHeight: 1.6 }}>
                  {monthlyMoodSuggestion}
                </p>

                {Object.values(monthlyMoodCounts).some((count) => count > 0) ? (
                  <div style={{ width: "100%", height: 300 }}>
                    <ResponsiveContainer>
                      <BarChart
                        data={Object.entries(monthlyMoodCounts).map(([mood, count]) => ({
                          mood: formatMoodLabel(mood),
                          count,
                        }))}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="mood" tick={{ fill: "#5f4b8a", fontSize: 12 }} />
                        <YAxis allowDecimals={false} tick={{ fill: "#5f4b8a", fontSize: 12 }} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="count" name="Monthly count" fill="var(--accent)" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="muted" style={{ margin: 0 }}>
                    Not enough monthly mood data to show chart.
                  </p>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}