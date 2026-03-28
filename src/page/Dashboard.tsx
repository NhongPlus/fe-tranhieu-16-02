import { useEffect, useMemo, useState } from "react";
import {
  ActionIcon,
  Anchor,
  Box,
  Badge,
  Button,
  Container,
  Group,
  Loader,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  Title,
  useMantineTheme,
} from "@mantine/core";
import { useDisclosure, useMediaQuery } from "@mantine/hooks";
import {
  IconCalendar,
  IconEdit,
  IconLanguage,
  IconMathFunction,
  IconX,
  IconRobot,
  IconShieldCheck,
  IconTerminal,
  IconSend,
  IconChartPie,
  IconAlertCircle,
} from "@tabler/icons-react";
import ChatPanel from "../components/ChatPanel";
import { getTelegramStatus, unlinkTelegram } from "../api/telegram";
import API from "../api/axios";
import { getEvents } from "../api/event";
import Navbar from "../components/Navbar";

function clampNumber(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

interface GpaSummaryRow {
  current_gpa: number;
  total_credits_completed: number;
  total_credits_required: number;
  target_gpa: number;
  needed_avg_for_target: number | null;
  progress_percent: number;
}

interface TranscriptRow {
  id: string | null;
  course_code: string;
  course_name: string;
  credits: number;
  score_10: number | null;
  score_letter: string | null;
  semester: string | null;
  done?: boolean;
}

function parseEventsPayload(res: any): any[] {
  const d = res?.data;
  if (Array.isArray(d?.data)) return d.data;
  if (Array.isArray(d)) return d;
  return [];
}

function isTranscriptDone(row: TranscriptRow): boolean {
  if (typeof row.done === "boolean") return row.done;
  return row.score_10 !== null && row.score_10 !== undefined;
}

function letterToBadgeColor(letter: string | null): "teal" | "blue" | "yellow" | "orange" | "red" | "gray" {
  if (!letter) return "gray";
  if (["A+", "A"].includes(letter)) return "teal";
  if (["B+", "B"].includes(letter)) return "blue";
  if (["C+", "C"].includes(letter)) return "yellow";
  if (["D+", "D"].includes(letter)) return "orange";
  return "red";
}

const FINISH_STYLES = [
  { bg: "rgba(255,194,146,0.25)", fg: "#a63300" },
  { bg: "rgba(125,211,252,0.25)", fg: "#2563eb" },
  { bg: "rgba(216,180,254,0.35)", fg: "#7e22ce" },
  { bg: "rgba(167,243,208,0.3)", fg: "#059669" },
] as const;

function eventDayLabel(dow: string) {
  const d = String(dow ?? "").trim();
  if (!d) return "—";
  if (d === "CN" || d.toLowerCase() === "cn" || d === "7") return "CN";
  if (/^\d+$/.test(d)) return `Thứ ${d}`;
  return d;
}

function eventDateChip(start: string | undefined) {
  if (!start) return "—";
  const t = Date.parse(start);
  if (Number.isNaN(t)) return "—";
  return String(new Date(t).getDate());
}

export default function Dashboard() {
  const theme = useMantineTheme();
  const isMdUp = useMediaQuery("(min-width: 48em)");
  const isLgWideUp = useMediaQuery("(min-width: 62em)");

  const [chatOpened, { open: openChat, close: closeChat }] = useDisclosure(false);

  const [telegramLinked, setTelegramLinked] = useState<boolean | null>(null);
  const [telegramLink, setTelegramLink] = useState<string | null>(null);
  const [loadingTelegram, setLoadingTelegram] = useState(false);

  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [gpaSummary, setGpaSummary] = useState<GpaSummaryRow | null>(null);
  const [transcript, setTranscript] = useState<TranscriptRow[]>([]);
  const [eventsWeek, setEventsWeek] = useState<any[]>([]);
  const [eventsDeadline, setEventsDeadline] = useState<any[]>([]);

  const primary = theme.colors.orange?.[6] ?? "#a63300";
  const primaryContainer = theme.colors.orange?.[1] ?? "#ffefe8";
  const tertiary = theme.colors.purple?.[6] ?? "#853d97";
  const secondary = theme.colors.gray?.[6] ?? "#565d5f";
  const error = theme.colors.red?.[6] ?? "#b31b25";

  const loadTelegramStatus = async () => {
    setLoadingTelegram(true);
    try {
      const res = await getTelegramStatus();
      setTelegramLinked(Boolean(res.data?.is_telegram_linked));
      setTelegramLink(res.data?.telegram_link ?? null);
    } catch {
      setTelegramLinked(false);
      setTelegramLink(null);
    } finally {
      setLoadingTelegram(false);
    }
  };

  const loadDashboard = async () => {
    setLoadingDashboard(true);
    try {
      const [sumRes, trRes, weekRes, deadlineRes] = await Promise.all([
        API.get("/gpa/summary"),
        API.get("/gpa/transcript"),
        getEvents({ days: 7 }),
        getEvents({ event_type: "deadline" }),
      ]);
      setGpaSummary(sumRes?.data ?? null);
      const rows = Array.isArray(trRes?.data?.data) ? trRes.data.data : [];
      setTranscript(rows);
      setEventsWeek(parseEventsPayload(weekRes));
      setEventsDeadline(parseEventsPayload(deadlineRes));
    } catch {
      setGpaSummary(null);
      setTranscript([]);
      setEventsWeek([]);
      setEventsDeadline([]);
    } finally {
      setLoadingDashboard(false);
    }
  };

  useEffect(() => {
    loadTelegramStatus();
    loadDashboard();
  }, []);

  const handleLinkTelegram = () => {
    if (!telegramLink) return;
    window.open(telegramLink, "_blank");

    // poll trạng thái 10 lần mỗi 3s, nếu liên kết true thì dừng ngay
    let tries = 0;
    const maxTries = 10;
    const intervalId = window.setInterval(async () => {
      tries += 1;
      try {
        const res = await getTelegramStatus();
        const linked = Boolean(res.data?.is_telegram_linked);
        const link = res.data?.telegram_link ?? null;
        setTelegramLinked(linked);
        setTelegramLink(link);

        if (linked || tries >= maxTries) {
          window.clearInterval(intervalId);
        }
      } catch {
        if (tries >= maxTries) {
          window.clearInterval(intervalId);
        }
      }
    }, 3000);
  };

  const handleUnlinkTelegram = async () => {
    setLoadingTelegram(true);
    try {
      await unlinkTelegram();
      await loadTelegramStatus();
    } catch {
      // bỏ qua, status giữ nguyên
    } finally {
      setLoadingTelegram(false);
    }
  };

  const stats = useMemo(() => {
    const gpaVal =
      gpaSummary != null && Number.isFinite(Number(gpaSummary.current_gpa))
        ? Number(gpaSummary.current_gpa).toFixed(2)
        : loadingDashboard
          ? "…"
          : "—";
    const creditsDone =
      gpaSummary != null ? String(gpaSummary.total_credits_completed) : loadingDashboard ? "…" : "—";
    const creditsReq =
      gpaSummary != null ? String(gpaSummary.total_credits_required) : loadingDashboard ? "…" : "—";
    const week = loadingDashboard ? "…" : String(eventsWeek.length);
    const dl = loadingDashboard ? "…" : String(eventsDeadline.length);

    return [
      {
        label: "Sự kiện tuần này",
        value: week,
        icon: <IconCalendar size={22} color={primary} />,
      },
      {
        label: "GPA tích lũy",
        value: gpaVal,
        sub: "/ 4.0",
        icon: <IconChartPie size={22} color={primary} />,
      },
      {
        label: "Tín chỉ",
        value: creditsDone,
        sub: `/ ${creditsReq}`,
        icon: <IconMathFunction size={22} color={primary} />,
      },
      {
        label: "Deadline",
        value: dl,
        icon: <IconAlertCircle size={22} color={error} />,
        isError: true,
      },
    ];
  }, [loadingDashboard, gpaSummary, eventsWeek.length, eventsDeadline.length, error, primary]);

  const finishedCourses = useMemo(() => {
    const done = transcript.filter(isTranscriptDone);
    const sorted = [...done].sort((a, b) => {
      const sa = a.semester ?? "";
      const sb = b.semester ?? "";
      return sb.localeCompare(sa, undefined, { numeric: true });
    });
    const top = sorted.slice(0, 4);
    const icons = [IconTerminal, IconMathFunction, IconLanguage, IconShieldCheck] as const;

    return top.map((c, i) => {
      const style = FINISH_STYLES[i % FINISH_STYLES.length];
      const Ico = icons[i % icons.length];
      const letter = c.score_letter;
      const badge = letterToBadgeColor(letter);
      return {
        key: c.course_code,
        title: c.course_name,
        grade: letter ?? (c.score_10 != null ? String(c.score_10) : "?"),
        tag: "Hoàn thành",
        bg: style.bg,
        fg: style.fg,
        icon: <Ico size={22} />,
        scoreBadgeColor: badge,
      };
    });
  }, [transcript]);

  const upcomingTasks = useMemo(() => {
    const sorted = [...eventsWeek].sort((a, b) => {
      const ta = a.start_date ? Date.parse(a.start_date) : 0;
      const tb = b.start_date ? Date.parse(b.start_date) : 0;
      return ta - tb;
    });
    const take = sorted.slice(0, 5);
    const accents = [
      { border: primary, bg: `${primaryContainer}`, chipColor: "gray" as const },
      { border: tertiary, bg: "rgba(168,85,247,0.15)", chipColor: "purple" as const },
      { border: secondary, bg: "rgba(148,163,184,0.20)", chipColor: "gray" as const },
    ];

    return take.map((ev, i) => {
      const a = accents[i % accents.length];
      const sessionRaw = String(ev.session ?? "").toLowerCase();
      const sessionVi =
        sessionRaw === "afternoon" || sessionRaw === "chieu"
          ? "Chiều"
          : sessionRaw === "evening" || sessionRaw === "night" || sessionRaw === "toi"
            ? "Tối"
            : "Sáng";
      const metaRoom = ev.room ? ` • ${ev.room}` : "";
      const metaDefault = `Tiết ${ev.period_start ?? "?"}–${ev.period_end ?? "?"}${metaRoom}`;
      const isDeadline = String(ev.event_type ?? "").toLowerCase() === "deadline";
      const meta =
        isDeadline && (ev.deadline_at || ev.deadline_time)
          ? `Deadline: ${ev.deadline_at ?? ev.deadline_time}`
          : metaDefault;

      return {
        key: String(ev.id ?? `${ev.title}-${i}`),
        day: eventDayLabel(ev.day_of_week),
        date: eventDateChip(ev.start_date),
        title: ev.title ?? "Sự kiện",
        meta,
        chip: { label: isDeadline ? "Deadline" : sessionVi, color: isDeadline ? "purple" : a.chipColor },
        borderColor: a.border,
        accentBg: a.bg,
      };
    });
  }, [eventsWeek, primary, primaryContainer, secondary, tertiary]);

  const normalizeSession = (session: string | null | undefined) => {
    const s = String(session ?? "").trim().toLowerCase();
    if (s === "morning" || s === "sáng" || s === "sang") return "Sáng";
    if (s === "afternoon" || s === "chiều" || s === "chieu") return "Chiều";
    if (s === "evening" || s === "tối" || s === "toi") return "Tối";
    return String(session ?? "").trim() || "TBD";
  };

  const weeklyDays = useMemo(() => {
    if (!eventsWeek?.length) {
      return [];
    }

    const byDay = new Map<string, any>();

    eventsWeek.forEach((ev) => {
      const label = eventDayLabel(ev.day_of_week);
      const date = eventDateChip(ev.start_date);
      const key = label.toLowerCase().replace(/\s+/g, "-");
      const period = normalizeSession(ev.session);
      const title = ev.title || "Không tên";
      const sub = `Tiết ${ev.period_start ?? "?"}–${ev.period_end ?? "?"}`;

      if (!byDay.has(key)) {
        byDay.set(key, {
          key,
          label,
          date,
          sessions: [],
        });
      }

      const day = byDay.get(key);
      day.sessions.push({ period, title, sub });

      // Keep first date for day
      if (!day.date || day.date === "—") {
        day.date = date;
      }
    });

    const sortedDays = Array.from(byDay.values()).sort((a, b) => {
      const order = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "CN"];
      const ia = order.indexOf(a.label);
      const ib = order.indexOf(b.label);
      if (ia >= 0 && ib >= 0) return ia - ib;
      if (ia >= 0) return -1;
      if (ib >= 0) return 1;
      return a.label.localeCompare(b.label, undefined, { numeric: true });
    });

    return sortedDays;
  }, [eventsWeek]);

  const percentDone = clampNumber(
    gpaSummary != null && Number.isFinite(Number(gpaSummary.progress_percent))
      ? Math.round(Number(gpaSummary.progress_percent))
      : 0,
    0,
    100
  );
  const circleRadius = 88;
  const circumference = 2 * Math.PI * circleRadius;
  const dashOffset = circumference * (1 - clampNumber(percentDone, 0, 100) / 100);

  const targetGpaDisplay =
    gpaSummary != null && Number.isFinite(Number(gpaSummary.target_gpa))
      ? `${Number(gpaSummary.target_gpa).toFixed(1)} / 4.0`
      : loadingDashboard
        ? "… / 4.0"
        : "— / 4.0";

  const neededAvgDisplay =
    gpaSummary != null && gpaSummary.needed_avg_for_target != null && Number.isFinite(Number(gpaSummary.needed_avg_for_target))
      ? Number(gpaSummary.needed_avg_for_target).toFixed(2)
      : loadingDashboard
        ? "…"
        : "—";

  const creditsCompletedDisplay =
    gpaSummary != null ? String(gpaSummary.total_credits_completed) : loadingDashboard ? "…" : "—";

  return (
    <Box
      style={{
        minHeight: "100vh",
        background: theme.colors.gray[0],
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Local animation styles to mimic HTML pulse */}
      <style>{`
        @keyframes pulse-ring {
          0% { transform: scale(0.8); opacity: 0.5; }
          100% { transform: scale(1.3); opacity: 0; }
        }
      `}</style>

      <Navbar />

      {/* Main */}
      <Container size="xl" style={{ paddingTop: 88, paddingBottom: 80 }}>
        <Stack gap={28}>
          {/* Header Section & Stats Bar */}
          <SimpleGrid cols={{ base: 1, md: 4 }} spacing="md">
            {stats.map((s) => (
              <Paper
                key={s.label}
                p="md"
                radius="md"
                style={{ background: theme.white, transition: "box-shadow 200ms ease" }}
                shadow="xs"
              >
                <Text
                  size="xs"
                  fw={800}
                  style={{ textTransform: "uppercase", letterSpacing: 0.12, opacity: 0.6 }}
                >
                  {s.label}
                </Text>
                <Group align="baseline" justify="space-between" mt={6}>
                  <Text fw={900} style={{ fontSize: 34, color: theme.black }}>
                    {s.value}
                  </Text>
                  <Box style={{ display: "flex", alignItems: "center" }}>{s.icon}</Box>
                </Group>
                {s.sub && (
                  <Text size="sm" mt={-4} style={{ color: theme.colors.gray[7] }}>
                    {s.sub}
                  </Text>
                )}
              </Paper>
            ))}
          </SimpleGrid>

          {/* Recently Finished Section */}
          <Stack gap={14}>
            <Title order={2} fw={800}>
              Vừa mới học xong
            </Title>

            <SimpleGrid cols={{ base: 2, md: 4 }} spacing="md">
              {loadingDashboard ? (
                <Paper p="xl" radius="lg" style={{ gridColumn: "1 / -1" }}>
                  <Group justify="center">
                    <Loader size="sm" />
                    <Text size="sm" c="dimmed">
                      Đang tải bảng điểm…
                    </Text>
                  </Group>
                </Paper>
              ) : finishedCourses.length === 0 ? (
                <Paper p="md" radius="lg" style={{ gridColumn: "1 / -1" }}>
                  <Text size="sm" c="dimmed" ta="center">
                    Chưa có môn nào đánh dấu hoàn thành trong transcript.
                  </Text>
                </Paper>
              ) : null}
              {!loadingDashboard &&
                finishedCourses.map((c) => {
                  return (
                    <Paper
                      key={c.key}
                      p="md"
                      radius="lg"
                      style={{
                        height: "100%",
                        cursor: "pointer",
                        background: theme.white,
                        border: `1px solid ${theme.colors.gray[2]}`,
                        transition: "border-color 150ms ease, box-shadow 150ms ease",
                      }}
                      shadow="xs"
                      withBorder
                    >
                      <Stack gap={12} style={{ height: "100%" }}>
                        <Box
                          style={{
                            width: 48,
                            height: 48,
                            borderRadius: 12,
                            background: c.bg,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: c.fg,
                          }}
                        >
                          {c.icon}
                        </Box>
                        <Box style={{ flex: 1 }}>
                          <Text fw={900} style={{ fontSize: 16 }} mb={6}>
                            {c.title}
                          </Text>
                          <Group gap={8}>
                            <Badge
                              size="sm"
                              radius="sm"
                              variant="light"
                              color={c.scoreBadgeColor}
                              styles={{
                                root: {
                                  fontWeight: 800,
                                },
                              }}
                            >
                              {c.grade}
                            </Badge>
                            <Badge size="xs" radius="sm" variant="filled" color="gray" styles={{ root: { opacity: 0.75 } }}>
                              {c.tag}
                            </Badge>
                          </Group>
                        </Box>
                      </Stack>
                    </Paper>
                  );
                })}
            </SimpleGrid>
          </Stack>

          {/* Telegram Banner */}
          <Paper
            radius="lg"
            p="md"
            style={{
              background: theme.colors.dark[7] ?? "#0f172a",
              color: theme.white,
              position: "relative",
              overflow: "hidden",
            }}
          >
            <Box style={{ position: "absolute", inset: 0, opacity: 0.12, pointerEvents: "none" }}>
              <svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 100 100">
                <path d="M0 100 C 20 0 50 0 100 100 Z" fill="white" />
              </svg>
            </Box>

            <Group style={{ position: "relative" }} justify="space-between">
              <Group gap={18}>
                <Box
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 999,
                    background: "rgba(255,255,255,0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <IconSend size={22} />
                </Box>
                <Box>
                  <Text fw={900} style={{ fontSize: 20 }}>
                    {telegramLinked
                      ? "Telegram đã được kết nối"
                      : "Kết nối Telegram ngay"}
                  </Text>
                  <Text size="sm" style={{ color: "rgba(255,255,255,0.65)" }}>
                    {telegramLinked
                      ? "Bạn sẽ nhận thông báo tự động trên Telegram."
                      : "Nhận thông báo lịch học và deadline tức thì trên điện thoại."}
                  </Text>
                </Box>
              </Group>

              {loadingTelegram ? (
                <Loader size="sm" variant="dots" color="gray" />
              ) : telegramLinked ? (
                <Button
                  radius="xl"
                  color="red"
                  onClick={handleUnlinkTelegram}
                  styles={{
                    root: { fontWeight: 900 },
                  }}
                >
                  Unlink
                </Button>
              ) : (
                <Button
                  radius="xl"
                  onClick={handleLinkTelegram}
                  disabled={!telegramLink}
                  styles={{
                    root: {
                      background: theme.white,
                      color: theme.colors.gray[9],
                      fontWeight: 900,
                    },
                  }}
                >
                  Kết nối ngay
                </Button>
              )}
            </Group>
          </Paper>

          {/* Dashboard Body: Asymmetric Grid */}
          <Box
            style={{
              display: "grid",
              gap: "2rem",
              gridTemplateColumns: isLgWideUp ? "8fr 4fr" : "1fr",
              alignItems: "stretch",
            }}
          >
            <Box>
              <Stack gap={18}>
                <Group justify="space-between" align="flex-end">
                  <Title order={2} fw={900}>
                    Lịch tuần này
                  </Title>
                  <Button variant="subtle" color="orange" size="xs">
                    Xem tất cả
                  </Button>
                </Group>

                <Stack gap={14}>
                  {!loadingDashboard && upcomingTasks.length === 0 && (
                    <Paper p="lg" radius="lg" style={{ background: theme.white, boxShadow: theme.shadows.sm }}>
                      <Text size="sm" c="dimmed" ta="center">
                        Không có sự kiện trong 7 ngày tới.
                      </Text>
                    </Paper>
                  )}
                  {upcomingTasks.map((t) => (
                    <Paper
                      key={t.key}
                      p="md"
                      radius="lg"
                      style={{
                        background: theme.white,
                        borderLeft: `4px solid ${t.borderColor}`,
                        boxShadow: theme.shadows.sm,
                      }}
                    >
                      <Group align="center" style={{ flexWrap: "nowrap" }}>
                        <Box
                          style={{
                            minWidth: 60,
                            height: 60,
                            borderRadius: 10,
                            background: t.accentBg,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            color: t.borderColor,
                            padding: "6px 8px",
                          }}
                        >
                          <Text size="xs" fw={900} style={{ textTransform: "uppercase", lineHeight: 1 }}>
                            {t.day}
                          </Text>
                          <Text fw={900} style={{ fontSize: 22, lineHeight: 1.1 }}>
                            {t.date}
                          </Text>
                        </Box>

                        <Box style={{ flex: 1 }}>
                          <Text fw={900} style={{ fontSize: 18 }}>
                            {t.title}
                          </Text>
                          <Group gap={8} mt={4}>
                            <Text size="sm" style={{ color: theme.colors.gray[7] }}>
                              {t.meta}
                            </Text>
                          </Group>
                        </Box>

                        <Badge variant="light" color={t.chip.color as any} size="sm">
                          {t.chip.label}
                        </Badge>
                      </Group>
                    </Paper>
                  ))}
                </Stack>
              </Stack>
            </Box>

            <Box>
              <Paper
                p="xl"
                radius="lg"
                style={{ background: theme.white, boxShadow: theme.shadows.sm }}
              >
                <Title order={3} fw={900} mb={22}>
                  GPA & Tiến độ
                </Title>

                {/* Circular Chart Placeholder */}
                <Box style={{ position: "relative", width: 192, height: 192, margin: "0 auto" }}>
                  <svg
                    width="100%"
                    height="100%"
                    style={{ transform: "rotate(-90deg)" }}
                  >
                    <circle
                      cx="96"
                      cy="96"
                      r={circleRadius}
                      fill="transparent"
                      stroke={theme.colors.gray[2]}
                      strokeWidth="12"
                    />
                    <circle
                      cx="96"
                      cy="96"
                      r={circleRadius}
                      fill="transparent"
                      stroke={primary}
                      strokeWidth="12"
                      strokeLinecap="round"
                      strokeDasharray={circumference}
                      strokeDashoffset={dashOffset}
                    />
                  </svg>
                  <Box
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text fw={900} style={{ fontSize: 40, lineHeight: 1, color: theme.colors.gray[9] }}>
                      {loadingDashboard ? "…" : `${percentDone}%`}
                    </Text>
                    <Text
                      size="xs"
                      fw={900}
                      style={{
                        textTransform: "uppercase",
                        letterSpacing: 1,
                        color: theme.colors.gray[7],
                        opacity: 0.6,
                        marginTop: 8,
                      }}
                    >
                      Hoàn thành
                    </Text>
                  </Box>
                </Box>

                <Stack mt={22} gap={12}>
                  <Paper
                    radius="md"
                    p="sm"
                    style={{
                      background: theme.colors.gray[0],
                      border: `1px solid ${theme.colors.gray[2]}`,
                    }}
                  >
                    <Group align="center">
                      <Box>
                        <Text size="xs" fw={900} style={{ textTransform: "uppercase", letterSpacing: 0.8, color: theme.colors.gray[6] }}>
                          Mục tiêu GPA
                        </Text>
                        <Text fw={900} style={{ fontSize: 22, color: primary }} mt={2}>
                          {targetGpaDisplay}
                        </Text>
                      </Box>
                      <ActionIcon
                        radius="xl"
                        variant="light"
                        color={primary}
                        styles={{ root: { border: `1px solid ${theme.colors.gray[2]}` } }}
                      >
                        <IconEdit size={18} />
                      </ActionIcon>
                    </Group>
                  </Paper>

                  <SimpleGrid cols={1} spacing="sm">
                    <Paper radius="md" p="sm" withBorder>
                      <Group >
                        <Text size="sm" fw={600} style={{ color: theme.colors.gray[7] }}>
                          Tín chỉ hoàn thành
                        </Text>
                        <Text fw={900} style={{ fontSize: 18 }}>
                          {creditsCompletedDisplay}
                        </Text>
                      </Group>
                    </Paper>
                    <Paper radius="md" p="sm" withBorder>
                      <Group >
                        <Text size="sm" fw={600} style={{ color: theme.colors.gray[7] }}>
                          Trung bình cần còn lại
                        </Text>
                        <Text fw={900} style={{ fontSize: 18, color: primary }}>
                          {neededAvgDisplay}
                        </Text>
                      </Group>
                    </Paper>
                  </SimpleGrid>
                </Stack>
              </Paper>
            </Box>
          </Box>

          {/* Weekly Schedule Section */}
          <Stack gap={16} mt={4}>
            <Title order={2} fw={900}>
              Lịch sắp tới
            </Title>

            <SimpleGrid cols={{ base: 1, md: 7 }} spacing="sm">
              {weeklyDays.map((d) => {
                const isActive = (d as any).active;
                const isWeekend = (d as any).weekend;
                const cardBg = isActive ? `${primaryContainer}` : theme.white;

                return (
                  <Paper
                    key={d.key}
                    p="sm"
                    radius="md"
                    style={{
                      background: cardBg,
                      border: isActive ? `2px solid ${primary}` : `1px solid ${theme.colors.gray[2]}`,
                      boxShadow: theme.shadows.xs,
                      transition: "border-color 150ms ease",
                    }}
                  >
                    <Stack gap={12}>
                      <Box
                        style={{
                          paddingBottom: 10,
                          borderBottom: `1px solid ${theme.colors.gray[2]}`,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: 6,
                          opacity: isWeekend ? 0.45 : 1,
                        }}
                      >
                        <Text size="xs" fw={900} style={{ color: isWeekend ? error : theme.colors.gray[7] }}>
                          {d.label}
                        </Text>
                        <Box
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 999,
                            background: isActive ? primary : theme.colors.gray[2],
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: isActive ? theme.white : theme.colors.gray[7],
                            fontWeight: 900,
                          }}
                        >
                          {d.date}
                        </Box>
                      </Box>

                      {(d as any).sessionsEmpty ? (
                        <Box style={{ height: 104, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Text size="xs" style={{ color: theme.colors.gray[6], textAlign: "center", fontStyle: "italic", lineHeight: 1.2 }}>
                            {(d as any).sessionsEmpty}
                          </Text>
                        </Box>
                      ) : isWeekend ? (
                        <Box style={{ height: 104, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Text
                            size="xs"
                            style={{
                              color: theme.colors.gray[6],
                              fontStyle: "italic",
                              textTransform: "uppercase",
                              letterSpacing: 2,
                              fontWeight: 900,
                              opacity: 0.25,
                            }}
                          >
                            Nghỉ
                          </Text>
                        </Box>
                      ) : (
                        <Stack gap={12} style={{ fontSize: 12 }}>
                          {(d as any).sessions.map((s: any, idx: number) => {
                            const isItalic = Boolean(s.italic);
                            const isActiveBox = Boolean(s.icon === "activeBox");
                            return (
                              <Box key={`${d.key}-${idx}`}>
                                <Text
                                  size="xs"
                                  fw={900}
                                  style={{
                                    color: isActive ? primary : theme.colors.gray[7],
                                    textTransform: "uppercase",
                                    letterSpacing: 0.8,
                                    marginBottom: 4,
                                  }}
                                >
                                  {s.period}
                                </Text>

                                {isActiveBox ? (
                                  <Paper
                                    radius="md"
                                    p="xs"
                                    style={{
                                      background: `${primary}10`,
                                      borderLeft: `2px solid ${primary}`,
                                      marginBottom: 8,
                                    }}
                                  >
                                    <Text fw={900} style={{ lineHeight: 1.1 }}>
                                      {s.title}
                                    </Text>
                                    <Text size="xs" style={{ color: theme.colors.gray[7], opacity: 0.7 }}>
                                      {s.sub}
                                    </Text>
                                  </Paper>
                                ) : (
                                  <>
                                    <Text
                                      fw={600}
                                      style={{
                                        color: theme.colors.gray[9],
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                      }}
                                    >
                                      {s.title}
                                    </Text>
                                    {s.sub ? (
                                      <Text
                                        size="xs"
                                        style={{
                                          color: theme.colors.gray[7],
                                          opacity: 0.7,
                                          fontStyle: isItalic ? "italic" : "normal",
                                        }}
                                      >
                                        {s.sub}
                                      </Text>
                                    ) : (
                                      <Text
                                        size="xs"
                                        style={{
                                          color: theme.colors.gray[7],
                                          opacity: 0.5,
                                          fontStyle: isItalic ? "italic" : "normal",
                                        }}
                                      >
                                        Trống
                                      </Text>
                                    )}
                                  </>
                                )}
                              </Box>
                            );
                          })}
                        </Stack>
                      )}
                    </Stack>
                  </Paper>
                );
              })}
            </SimpleGrid>
          </Stack>
        </Stack>
      </Container>

      {/* Footer */}
      <Box
        style={{
          marginTop: "auto",
          background: theme.colors.gray[0],
          borderTop: `1px solid ${theme.colors.gray[2]}`,
          padding: "48px 0",
        }}
      >
        <Container size="xl">
          <Group justify="space-between" align="center" style={{ gap: 24, flexWrap: "wrap" }}>
            <Stack gap={4}>
              <Text fw={900} style={{ fontSize: 18 }}>
                StudyMind
              </Text>
              <Text size="sm" style={{ color: theme.colors.gray[7] }}>
                © 2024 StudyMind. Nền tảng học tập thông minh.
              </Text>
            </Stack>
            <Group gap={20} style={{ flexWrap: "wrap" }}>
              <Anchor href="#" underline={'never'} style={{ color: theme.colors.gray[7], fontWeight: 600 }}>
                Điều khoản
              </Anchor>
              <Anchor href="#" underline={'never'} style={{ color: theme.colors.gray[7], fontWeight: 600 }}>
                Bảo mật
              </Anchor>
              <Anchor href="#" underline={'never'} style={{ color: theme.colors.gray[7], fontWeight: 600 }}>
                Trợ giúp
              </Anchor>
              <Anchor href="#" underline={'never'} style={{ color: theme.colors.gray[7], fontWeight: 600 }}>
                Liên hệ
              </Anchor>
            </Group>
          </Group>
        </Container>
      </Box>

      {/* FAB for AI Chat */}
      <Box
        style={{
          position: "fixed",
          bottom: 22,
          right: 22,
          zIndex: 60,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: 16,
        }}
      >
        {isMdUp && (
          <Paper
            radius="lg"
            withBorder
            p="md"
            style={{
              background: theme.white,
              borderColor: theme.colors.orange[1],
              padding: "12px 16px",
              fontWeight: 900,
              boxShadow: theme.shadows.xl,
            }}
          >
            <Text size="sm" fw={900} style={{ color: primary }}>
              👋 Chào bạn!
            </Text>
            <Text size="sm" fw={700}>
              Tôi có thể giúp gì cho việc học hôm nay?
            </Text>
          </Paper>
        )}

        <ActionIcon
          size={80}
          radius="xl"
          onClick={openChat}
          style={{
            background: `linear-gradient(135deg, ${primary} 0%, ${theme.colors.orange[5]} 100%)`,
            color: theme.white,
            boxShadow: "0 20px 50px rgba(69, 23, 3, 0.4)",
            position: "relative",
            overflow: "visible",
          }}
        >
          {/* Pulse ring */}
          <Box
            style={{
              position: "absolute",
              inset: -10,
              borderRadius: 999,
              background: primary,
              zIndex: -1,
              animation: "pulse-ring 2s cubic-bezier(0.455, 0.03, 0.515, 0.955) infinite",
            }}
          />

          <IconRobot size={46} style={{ fontSize: 46 }} />
          <Box
            style={{
              position: "absolute",
              top: -8,
              right: -6,
              width: 22,
              height: 22,
              borderRadius: 999,
              background: error,
              border: `4px solid ${theme.white}`,
            }}
          />
        </ActionIcon>
      </Box>

      {/* Custom Chat Hub Modal (HTML-like) */}
      {chatOpened && (
        <>
          <Box
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 0,
              filter: "blur(32px)",
              opacity: 0.4,
              transform: "scale(1.05)",
              overflow: "hidden",
            }}
          >
            <Box style={{ height: "100%", display: "flex" }}>
              {/* Sidebar Mock */}
              <Box
                style={{
                  width: 256,
                  background: theme.colors.gray[1],
                  padding: 24,
                  display: "flex",
                  flexDirection: "column",
                  gap: 24,
                }}
              >
                <Box style={{ height: 32, width: 128, background: theme.colors.gray[2], borderRadius: 8 }} />
                <Box style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <Box style={{ height: 40, width: "100%", background: theme.colors.gray[2], borderRadius: 12 }} />
                  <Box style={{ height: 40, width: "100%", background: theme.colors.gray[2], borderRadius: 12 }} />
                  <Box style={{ height: 40, width: "100%", background: theme.colors.gray[2], borderRadius: 12 }} />
                </Box>
              </Box>

              {/* Main Content Mock */}
              <Box style={{ flex: 1, padding: 48, display: "flex", flexDirection: "column", gap: 32 }}>
                <Box style={{ height: 48, width: "33%", background: theme.colors.gray[2], borderRadius: 12 }} />
                <Box style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
                  <Box style={{ height: 256, background: theme.colors.gray[0], borderRadius: 12 }} />
                  <Box style={{ height: 256, background: theme.colors.gray[0], borderRadius: 12 }} />
                  <Box style={{ height: 256, background: theme.colors.gray[0], borderRadius: 12 }} />
                </Box>
              </Box>
            </Box>
          </Box>

          {/* Modal Overlay Background */}
          <Box
            onClick={closeChat}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 100000,
              background: "rgba(0, 0, 0, 0.85)",
            }}
          >

          {/* Main Chat Hub Modal */}
            <Box
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 50,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 16,
                
              }}
            >
              <Box
                onClick={(e) => e.stopPropagation()}
                style={{
                  width: "100%",
                  maxWidth: 900,
                  height: "calc(100vh - 32px)",
                  maxHeight: 900,
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                  borderRadius: 12,
                  backgroundColor: "rgba(246, 246, 246, 0.85)",
                  backdropFilter: "blur(32px)",
                  boxShadow:
                    "0 10px 30px -5px rgba(45, 47, 47, 0.05), 0 20px 60px -10px rgba(45, 47, 47, 0.03)",
                }}
              >
                {/* Close Button */}
                <ActionIcon
                  variant="subtle"
                  radius="xl"
                  onClick={closeChat}
                  style={{
                    position: "absolute",
                    top: 24,
                    right: 32,
                    zIndex: 60,
                    background: "transparent",
                  }}
                >
                  <IconX size={20} />
                </ActionIcon>

                {/* Header Section */}
                <Box
                  style={{
                    padding: "24px 32px",
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    borderBottom: `1px solid ${theme.colors.gray[2]}`,
                  }}
                >
                  <Box style={{ position: "relative" }}>
                    <Box
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: 9999,
                        background: `linear-gradient(135deg, ${primary} 0%, ${theme.colors.orange[5]} 100%)`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: theme.white,
                      }}
                    >
                      <IconRobot size={24} />
                    </Box>
                    <Box
                      style={{
                        position: "absolute",
                        bottom: -4,
                        right: -4,
                        width: 16,
                        height: 16,
                        background: theme.colors.green?.[6] ?? "#22c55e",
                        border: `4px solid ${theme.colors.gray[0]}`,
                        borderRadius: 9999,
                      }}
                    />
                  </Box>

                  <Box>
                    <Text fw={800} size="lg" style={{ fontSize: 18 }}>
                      Trợ lý StudyMind AI
                    </Text>
                    <Text size="sm" style={{ color: theme.colors.gray[7], display: "flex", alignItems: "center", gap: 8 }}>
                      <Box style={{ width: 8, height: 8, borderRadius: 9999, background: theme.colors.green?.[6] ?? "#22c55e" }} />
                      Đang sẵn sàng hỗ trợ bạn
                    </Text>
                  </Box>
                </Box>

                {/* Chat Content Area + Footer */}
                <Box style={{ flex: 1, display: "flex", minHeight: 0 }}>
                  <ChatPanel />
                </Box>
              </Box>
            </Box>
          </Box>
        </>
      )}
    </Box>
  );
}