import { useEffect, useMemo, useState } from "react";
import {
  Stack,
  Text,
  Group,
  Loader,
  Center,
  NumberInput,
  Button,
  Badge,
  ScrollArea,
  Table,
  Box,
  TextInput,
  ActionIcon,
  Title,
  SegmentedControl,
  Container,
  Grid,
  useMantineTheme,
  Anchor,
  Avatar,
} from "@mantine/core";
import {
  IconTargetArrow,
  IconTrash,
  IconDeviceFloppy,
  IconBell,
  IconSettings,
  IconFilter,
  IconPlus,
  IconTrendingUp,
  IconChartBar,
} from "@tabler/icons-react";
import API from "../api/axios";
import { notifications } from "@mantine/notifications";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

// ─── Types ───────────────────────────────────────────────────────────────────
interface GpaSummary {
  current_gpa: number;
  total_credits_completed: number;
  total_credits_required: number;
  remaining_credits: number;
  target_gpa: number;
  needed_avg_for_target: number | null;
  progress_percent: number;
}

interface Course {
  id: string | null;
  course_code: string;
  course_name: string;
  credits: number;
  score_10: number | null;
  score_4: number | null;
  score_letter: string | null;
  semester: string | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function gpaLabel(gpa: number) {
  if (gpa >= 3.6) return "Xuất sắc";
  if (gpa >= 3.2) return "Giỏi";
  if (gpa >= 2.5) return "Khá";
  if (gpa >= 2.0) return "Trung bình";
  return "Yếu";
}

function scoreColor(letter: string | null) {
  if (!letter) return "gray";
  if (["A+", "A"].includes(letter)) return "orange";
  if (["B+", "B"].includes(letter)) return "gray";
  if (["C+", "C"].includes(letter)) return "yellow";
  if (["D+", "D"].includes(letter)) return "orange";
  return "red";
}

const PRESETS = [
  { label: "Xuất sắc", value: "xuat_sac", gpa: 3.6, range: "3.6 - 4.0" },
  { label: "Giỏi", value: "gioi", gpa: 3.2, range: "3.2 - 3.59" },
  { label: "Khá", value: "kha", gpa: 2.5, range: "2.5 - 3.19" },
  { label: "Trung bình", value: "trung_binh", gpa: 2.0, range: "2.0 - 2.49" },
];

// ─── Component ───────────────────────────────────────────────────────────────
export default function GpaPage() {
  const theme = useMantineTheme();
  const navigate = useNavigate();

  const [summary, setSummary] = useState<GpaSummary | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [submittingTarget, setSubmittingTarget] = useState(false);

  const [targetGpaInput, setTargetGpaInput] = useState(3.2);
  const [preset, setPreset] = useState("kha");

  const [courses, setCourses] = useState<Course[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [filter, setFilter] = useState("all");
  const [savingMap, setSavingMap] = useState<Record<string, boolean>>({});
  const [deletingMap, setDeletingMap] = useState<Record<string, boolean>>({});

  const primary = theme.colors.orange?.[8] ?? "#a63300";
  const primaryLight = theme.colors.orange?.[5] ?? "#ff7949";
  const surface = theme.colors.gray?.[0] ?? "#f6f6f6";
  const surfaceLow = theme.colors.gray?.[1] ?? "#f0f1f1";
  const surfaceHigh = theme.colors.gray?.[2] ?? "#e1e3e3";
  const surfaceHighest = theme.colors.gray?.[3] ?? "#dbdddd";

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchSummary = async () => {
    setLoadingSummary(true);
    try {
      const res = await API.get("/gpa/summary");
      setSummary(res.data);
      const target = Number(res.data.target_gpa ?? 0);
      setTargetGpaInput(Number.isFinite(target) ? target : 0);
      setPreset(
        target >= 3.6 ? "xuat_sac" : target >= 3.2 ? "gioi" : target >= 2.5 ? "kha" : "trung_binh"
      );
    } catch {
      notifications.show({ message: "Không thể tải GPA", color: "red" });
    } finally {
      setLoadingSummary(false);
    }
  };

  const fetchCourses = async () => {
    setLoadingCourses(true);
    try {
      const res = await API.get("/gpa/transcript");
      const data: Course[] = Array.isArray(res.data.data) ? res.data.data : [];
      setCourses(data);
    } catch {
      notifications.show({ message: "Không thể tải bảng điểm", color: "red" });
    } finally {
      setLoadingCourses(false);
    }
  };

  useEffect(() => {
    fetchSummary();
    fetchCourses();
  }, []);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleSetTarget = async () => {
    const val = Number(targetGpaInput);
    if (!val || val <= 0 || val > 4) {
      notifications.show({ message: "GPA phải từ 0 đến 4", color: "red" });
      return;
    }
    setSubmittingTarget(true);
    try {
      await API.patch("/gpa/target", {
        target_gpa: val,
        preset,
      });
      notifications.show({ message: `Đã đặt mục tiêu GPA: ${val}`, color: "teal" });
      await fetchSummary();
    } catch {
      notifications.show({ message: "Lỗi khi đặt mục tiêu", color: "red" });
    } finally {
      setSubmittingTarget(false);
    }
  };

  const ALLOWED_SEMESTERS = ["2024.1", "2024.2", "2025.1"];

  const handleSaveGrade = async (course: Course) => {
    const semesterInput = document.getElementById(`semester-${course.course_code}`) as HTMLInputElement | null;
    const scoreInput = document.getElementById(`score-${course.course_code}`) as HTMLInputElement | null;

    const semester = semesterInput?.value.trim();
    const scoreValue = scoreInput?.value;

    if (!semester || !scoreValue) {
      notifications.show({ message: "Nhập đủ điểm và học kỳ", color: "red" });
      return;
    }

    if (!ALLOWED_SEMESTERS.includes(semester)) {
      notifications.show({
        message: `Học kỳ chỉ được chọn một trong: ${ALLOWED_SEMESTERS.join(", ")}`,
        color: "red",
      });
      return;
    }

    const score = Number(scoreValue);
    if (isNaN(score) || score < 0 || score > 10) {
      notifications.show({ message: "Điểm phải từ 0 đến 10", color: "red" });
      return;
    }

    setSavingMap((p) => ({ ...p, [course.course_code]: true }));
    try {
      await API.post("/gpa/grades", {
        course_code: course.course_code,
        score_10: score,
        semester,
      });
      notifications.show({ message: `Đã lưu điểm ${course.course_name}`, color: "teal" });
      await fetchCourses();
      await fetchSummary();
    } catch {
      notifications.show({ message: "Lỗi khi lưu điểm", color: "red" });
    } finally {
      setSavingMap((p) => ({ ...p, [course.course_code]: false }));
    }
  };

  const handleDeleteGrade = async (course: Course) => {
    if (!course.id) return;
    setDeletingMap((p) => ({ ...p, [course.course_code]: true }));
    try {
      await API.delete(`/gpa/grades/${course.id}`);
      notifications.show({ message: `Đã xoá điểm ${course.course_name}`, color: "teal" });
      await fetchCourses();
      await fetchSummary();
    } catch {
      notifications.show({ message: "Lỗi khi xoá điểm", color: "red" });
    } finally {
      setDeletingMap((p) => ({ ...p, [course.course_code]: false }));
    }
  };

  // ── Derived ────────────────────────────────────────────────────────────────
  const studied = courses.filter((c) => c.score_10 !== null);
  const notStudied = courses.filter((c) => c.score_10 === null);
  const displayed =
    filter === "studied" ? studied : filter === "not_studied" ? notStudied : courses;

  const avg10Weighted = useMemo(() => {
    if (studied.length === 0) return 0;
    let pts = 0;
    let cr = 0;
    for (const c of studied) {
      if (c.score_10 != null && c.credits) {
        pts += c.score_10 * c.credits;
        cr += c.credits;
      }
    }
    return cr > 0 ? pts / cr : 0;
  }, [studied]);

  const progressRing = summary?.progress_percent ?? 0;
  const r = 45;
  const circumference = 2 * Math.PI * r;
  const dashOffset = circumference * (1 - Math.min(100, Math.max(0, progressRing)) / 100);

  const adviceText =
    summary && summary.needed_avg_for_target != null
      ? `Để đạt mục tiêu ${gpaLabel(summary.target_gpa)}, bạn cần giữ điểm trung bình còn lại khoảng ${summary.needed_avg_for_target.toFixed(2)} / 4.0 cho các tín chỉ chưa hoàn thành.`
      : "Tiếp tục duy trì nhịp học đều; cập nhật điểm sớm để theo dõi tiến độ GPA chính xác hơn.";

  const weakCourse = useMemo(() => {
    const withScore = studied.filter((c) => c.score_10 != null);
    if (withScore.length === 0) return null;
    return [...withScore].sort((a, b) => (a.score_10 ?? 0) - (b.score_10 ?? 0))[0];
  }, [studied]);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <Box style={{ minHeight: "100vh", background: surface, display: "flex", flexDirection: "column" }}>
      <style>{`
        .gpa-page-tr:hover .gpa-row-actions { opacity: 1 !important; }
        .gpa-row-actions { opacity: 0; transition: opacity 0.2s ease; }
      `}</style>

      {/* TopNavBar */}
      <Navbar />

      <Box component="main" style={{ flex: 1 }} mt={88}>
        <Container size={1440} px="md" py="xl">
          <Grid gutter="xl">
            {/* Left: GPA & Goals */}
            <Grid.Col span={{ base: 12, lg: 4 }}>
              <Stack gap="xl">
                <Box
                  p="xl"
                  style={{
                    background: theme.white,
                    borderRadius: theme.radius.md,
                    boxShadow: "0 10px 30px -5px rgba(45, 47, 47, 0.05)",
                  }}
                >
                  <Title order={3} size="h4" fw={700} mb="xl" c="dark.8">
                    Mục tiêu GPA
                  </Title>

                  {loadingSummary ? (
                    <Center py="xl">
                      <Loader size="sm" />
                    </Center>
                  ) : summary ? (
                    <>
                      <Box style={{ display: "flex", justifyContent: "center", marginBottom: 40 }}>
                        <Box style={{ position: "relative", width: 192, height: 192 }}>
                          <svg width="100%" height="100%" viewBox="0 0 100 100" style={{ transform: "rotate(-90deg)" }}>
                            <circle cx="50" cy="50" r={r} fill="transparent" stroke={surfaceHigh} strokeWidth={8} />
                            <circle
                              cx="50"
                              cy="50"
                              r={r}
                              fill="transparent"
                              stroke="url(#gpaGrad)"
                              strokeWidth={8}
                              strokeLinecap="round"
                              strokeDasharray={circumference}
                              strokeDashoffset={dashOffset}
                            />
                            <defs>
                              <linearGradient id="gpaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor={primary} />
                                <stop offset="100%" stopColor={primaryLight} />
                              </linearGradient>
                            </defs>
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
                            <Text fw={800} style={{ fontSize: 36, lineHeight: 1, color: theme.colors.dark?.[8] }}>
                              {summary.current_gpa.toFixed(2)}
                            </Text>
                            <Text size="xs" fw={600} tt="uppercase" c="dimmed" style={{ letterSpacing: "0.08em", marginTop: 6 }}>
                              Hiện tại
                            </Text>
                          </Box>
                        </Box>
                      </Box>

                      <Stack gap="md">
                        {PRESETS.map((p) => {
                          const active = preset === p.value;
                          const isGioi = p.value === "gioi";
                          return (
                            <Box
                              key={p.value}
                              onClick={() => {
                                setPreset(p.value);
                                setTargetGpaInput(p.gpa);
                              }}
                              p="md"
                              style={{
                                borderRadius: theme.radius.md,
                                cursor: "pointer",
                                background: active
                                  ? "rgba(166, 51, 0, 0.1)"
                                  : surfaceLow,
                                border: active ? `1px solid rgba(166, 51, 0, 0.2)` : "1px solid transparent",
                                transition: "background 0.15s ease",
                              }}
                            >
                              <Group justify="space-between" wrap="nowrap">
                                <Text size="sm" fw={active ? 700 : 500} c={active ? primary : "dark.7"}>
                                  {p.label}
                                  {isGioi && active ? " (Mục tiêu)" : ""}
                                </Text>
                                <Text size="sm" fw={700} c={active ? primary : "dimmed"}>
                                  {p.range}
                                </Text>
                              </Group>
                            </Box>
                          );
                        })}
                      </Stack>

                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleSetTarget();
                        }}
                        style={{ marginTop: 24 }}
                      >
                        <Group gap="xs" align="flex-end" wrap="nowrap" mb="xs">
                          <IconTargetArrow size={16} color={primary} />
                          <Text size="xs" fw={600}>
                            Tuỳ chỉnh mục tiêu
                          </Text>
                        </Group>
                        <NumberInput
                          placeholder="Nhập GPA mục tiêu (0–4)"
                          min={0}
                          max={4}
                          step={0.1}
                          decimalScale={2}
                          size="sm"
                          mb="sm"
                          value={targetGpaInput}
                          onChange={(value) => {
                            const normalized =
                              typeof value === "number"
                                ? value
                                : value === undefined || value === null
                                  ? 0
                                  : Number(value);
                            setTargetGpaInput(Number.isFinite(normalized) ? normalized : 0);
                          }}
                        />
                        <Button type="submit" fullWidth radius="md" loading={submittingTarget} style={{ background: primary }}>
                          Đặt mục tiêu
                        </Button>
                      </form>
                    </>
                  ) : null}
                </Box>

                <Box
                  p="xl"
                  style={{
                    background: `linear-gradient(135deg, ${primary} 0%, ${primaryLight} 100%)`,
                    borderRadius: theme.radius.md,
                    color: theme.white,
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  <Box style={{ position: "relative", zIndex: 2 }}>
                    <Title order={4} fw={700} mb="xs" c="white">
                      Lời khuyên học tập
                    </Title>
                    <Text size="sm" style={{ opacity: 0.92, lineHeight: 1.65 }}>
                      {weakCourse
                        ? `Bạn có thể ưu tiên cải thiện điểm môn "${weakCourse.course_name}" để hỗ trợ mục tiêu GPA. ${adviceText}`
                        : adviceText}
                    </Text>
                    <Button
                      mt="lg"
                      radius="xl"
                      variant="white"
                      color={primary}
                      size="sm"
                      fw={700}
                      onClick={() => navigate("/dashboard")}
                    >
                      Xem lộ trình
                    </Button>
                  </Box>
                  <Box
                    style={{
                      position: "absolute",
                      right: -48,
                      bottom: -48,
                      width: 192,
                      height: 192,
                      borderRadius: "50%",
                      background: "rgba(255, 121, 73, 0.25)",
                      filter: "blur(48px)",
                    }}
                  />
                </Box>
              </Stack>
            </Grid.Col>

            {/* Right: Table + insights */}
            <Grid.Col span={{ base: 12, lg: 8 }}>
              <Stack gap="xl">
                <Box
                  p="xl"
                  style={{
                    background: theme.white,
                    borderRadius: theme.radius.md,
                    boxShadow: "0 10px 30px -5px rgba(45, 47, 47, 0.05)",
                    overflow: "hidden",
                  }}
                >
                  <Group justify="space-between" align="flex-start" mb="xl" wrap="wrap" gap="md">
                    <Box>
                      <Title order={3} size="h4" fw={700} c="dark.8">
                        Bảng điểm chi tiết
                      </Title>
                      <Text size="sm" c="dimmed" mt={6}>
                        Quản lý và cập nhật kết quả học tập của bạn. — {courses.length} môn (Đã học: {studied.length} · Chưa học:{" "}
                        {notStudied.length})
                      </Text>
                    </Box>
                    <Group gap="sm" wrap="wrap">
                      <SegmentedControl
                        size="xs"
                        value={filter}
                        onChange={setFilter}
                        data={[
                          { label: "Tất cả", value: "all" },
                          { label: "Đã học", value: "studied" },
                          { label: "Chưa học", value: "not_studied" },
                        ]}
                        styles={{ root: { flexWrap: "wrap" } }}
                      />
                      <Button
                        leftSection={<IconFilter size={16} />}
                        variant="light"
                        color="gray"
                        radius="xl"
                        size="sm"
                        fw={600}
                      >
                        Bộ lọc
                      </Button>
                      <Button
                        leftSection={<IconPlus size={16} />}
                        radius="xl"
                        size="sm"
                        fw={700}
                        styles={{
                          root: {
                            background: `linear-gradient(135deg, ${primary} 0%, ${primaryLight} 100%)`,
                            color: theme.white,
                          },
                        }}
                        onClick={() => navigate("/gradeentry")}
                      >
                        Thêm môn học
                      </Button>
                    </Group>
                  </Group>

                  {loadingCourses ? (
                    <Center py="xl">
                      <Loader size="md" />
                    </Center>
                  ) : (
                    <ScrollArea type="scroll" offsetScrollbars>
                      <Table horizontalSpacing="md" verticalSpacing="md" withRowBorders={false} style={{ minWidth: 900 }}>
                        <Table.Thead>
                          <Table.Tr>
                            <Table.Th style={{ color: theme.colors.gray[6], fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                              #
                            </Table.Th>
                            <Table.Th style={{ color: theme.colors.gray[6], fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                              Tên học phần
                            </Table.Th>
                            <Table.Th ta="center" style={{ color: theme.colors.gray[6], fontSize: 11, textTransform: "uppercase" }}>
                              TC
                            </Table.Th>
                            <Table.Th ta="center" style={{ color: theme.colors.gray[6], fontSize: 11, textTransform: "uppercase" }}>
                              Điểm 10
                            </Table.Th>
                            <Table.Th ta="center" style={{ color: theme.colors.gray[6], fontSize: 11, textTransform: "uppercase" }}>
                              H4
                            </Table.Th>
                            <Table.Th ta="center" style={{ color: theme.colors.gray[6], fontSize: 11, textTransform: "uppercase" }}>
                              CHỮ
                            </Table.Th>
                            <Table.Th style={{ color: theme.colors.gray[6], fontSize: 11, textTransform: "uppercase" }}>Học kỳ</Table.Th>
                            <Table.Th style={{ color: theme.colors.gray[6], fontSize: 11, textTransform: "uppercase" }}>Nhập điểm</Table.Th>
                            <Table.Th ta="right" style={{ color: theme.colors.gray[6], fontSize: 11, textTransform: "uppercase" }}>
                              Thao tác
                            </Table.Th>
                          </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                          {displayed.map((course, idx) => {
                            const hasGrade = course.score_10 !== null;
                            return (
                              <Table.Tr
                                key={course.course_code}
                                className="gpa-page-tr"
                                style={{
                                  background: surfaceLow,
                                  transition: "background 0.15s ease",
                                }}
                              >
                                <Table.Td style={{ borderRadius: `${theme.radius.md} 0 0 ${theme.radius.md}`, fontWeight: 500 }}>
                                  {String(idx + 1).padStart(2, "0")}
                                </Table.Td>
                                <Table.Td>
                                  <Text size="sm" fw={600}>
                                    {course.course_name}
                                  </Text>
                                  <Text size="xs" c="dimmed">
                                    {course.course_code}
                                  </Text>
                                </Table.Td>
                                <Table.Td ta="center">{course.credits}</Table.Td>
                                <Table.Td ta="center">
                                  <Text size="sm" fw={700}>
                                    {hasGrade ? course.score_10 : <Text span fs="italic" c="dimmed">--</Text>}
                                  </Text>
                                </Table.Td>
                                <Table.Td ta="center">
                                  {hasGrade ? (
                                    course.score_4
                                  ) : (
                                    <Text span fs="italic" c="dimmed" fw={700}>
                                      --
                                    </Text>
                                  )}
                                </Table.Td>
                                <Table.Td ta="center">
                                  {course.score_letter ? (
                                    <Badge
                                      size="sm"
                                      fw={700}
                                      variant="light"
                                      color={scoreColor(course.score_letter)}
                                      styles={{
                                        root: {
                                          background:
                                            scoreColor(course.score_letter) === "orange"
                                              ? "rgba(166, 51, 0, 0.1)"
                                              : undefined,
                                          color: scoreColor(course.score_letter) === "orange" ? primary : undefined,
                                        },
                                      }}
                                    >
                                      {course.score_letter}
                                    </Badge>
                                  ) : (
                                    <Text fs="italic" c="dimmed" fw={700} size="sm">
                                      --
                                    </Text>
                                  )}
                                </Table.Td>
                                <Table.Td>
                                  <TextInput
                                    id={`semester-${course.course_code}`}
                                    placeholder="2024.1"
                                    size="xs"
                                    defaultValue={course.semester ?? ""}
                                    styles={{
                                      input: {
                                        background: surfaceHighest,
                                        border: "none",
                                        borderRadius: theme.radius.sm,
                                      },
                                    }}
                                  />
                                </Table.Td>
                                <Table.Td>
                                  <NumberInput
                                    id={`score-${course.course_code}`}
                                    placeholder="—"
                                    size="xs"
                                    min={0}
                                    max={10}
                                    step={0.1}
                                    decimalScale={1}
                                    defaultValue={course.score_10 ?? undefined}
                                    w={72}
                                    styles={{
                                      input: {
                                        background: surfaceHighest,
                                        border: "none",
                                        textAlign: "center",
                                        borderRadius: theme.radius.sm,
                                      },
                                    }}
                                  />
                                </Table.Td>
                                <Table.Td
                                  ta="right"
                                  style={{ borderRadius: `0 ${theme.radius.md} ${theme.radius.md} 0` }}
                                >
                                  <Group gap={6} justify="flex-end" wrap="nowrap" className="gpa-row-actions">
                                    <ActionIcon
                                      size="sm"
                                      variant="subtle"
                                      color="orange"
                                      loading={savingMap[course.course_code]}
                                      onClick={() => handleSaveGrade(course)}
                                      title="Lưu điểm"
                                      radius="md"
                                    >
                                      <IconDeviceFloppy size={16} />
                                    </ActionIcon>
                                    {hasGrade && (
                                      <ActionIcon
                                        size="sm"
                                        variant="subtle"
                                        color="red"
                                        loading={deletingMap[course.course_code]}
                                        onClick={() => handleDeleteGrade(course)}
                                        title="Xoá điểm"
                                        radius="md"
                                      >
                                        <IconTrash size={16} />
                                      </ActionIcon>
                                    )}
                                  </Group>
                                </Table.Td>
                              </Table.Tr>
                            );
                          })}
                        </Table.Tbody>
                      </Table>
                    </ScrollArea>
                  )}

                  <Group justify="space-between" mt="xl" wrap="wrap" gap="md">
                    <Text size="sm" fw={600} c="dimmed">
                      Tổng tín chỉ tích lũy:{" "}
                      <Text span c="dark.8" fw={700}>
                        {summary?.total_credits_completed ?? "—"}
                      </Text>
                    </Text>
                    <Group gap="xl" wrap="wrap">
                      <Text size="sm" fw={600} c="dimmed">
                        Điểm trung bình (10):{" "}
                        <Text span fw={700} c={primary}>
                          {studied.length ? avg10Weighted.toFixed(2) : "—"}
                        </Text>
                      </Text>
                      <Text size="sm" fw={600} c="dimmed">
                        GPA (4.0):{" "}
                        <Text span fw={700} c={primary}>
                          {summary ? summary.current_gpa.toFixed(2) : "—"}
                        </Text>
                      </Text>
                    </Group>
                  </Group>
                </Box>

                <Grid gutter="xl">
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <Group
                      align="flex-start"
                      gap="lg"
                      p="xl"
                      wrap="nowrap"
                      style={{ background: surfaceLow, borderRadius: theme.radius.md }}
                    >
                      <Box
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: "50%",
                          background: "rgba(133, 61, 151, 0.1)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <IconTrendingUp size={22} color={theme.colors.grape?.[6] ?? "#853d97"} />
                      </Box>
                      <Box>
                        <Text fw={700} mb="xs" c="dark.8">
                          Dự đoán kết quả
                        </Text>
                        <Text size="sm" c="dimmed" style={{ lineHeight: 1.65 }}>
                          {summary
                            ? `Tiến độ hiện tại khoảng ${summary.progress_percent.toFixed(0)}% so với mục tiêu tín chỉ — tiếp tục duy trì để ổn định GPA.`
                            : "Tải dữ liệu GPA để xem gợi ý phù hợp hơn."}
                        </Text>
                      </Box>
                    </Group>
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <Group
                      align="flex-start"
                      gap="lg"
                      p="xl"
                      wrap="nowrap"
                      style={{ background: surfaceLow, borderRadius: theme.radius.md }}
                    >
                      <Box
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: "50%",
                          background: "rgba(166, 51, 0, 0.1)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <IconChartBar size={22} color={primary} />
                      </Box>
                      <Box>
                        <Text fw={700} mb="xs" c="dark.8">
                          Phân tích môn học
                        </Text>
                        <Text size="sm" c="dimmed" style={{ lineHeight: 1.65 }}>
                          {studied.length >= 3
                            ? "Bạn đang có nhiều môn đã có điểm — hãy theo dõi các môn điểm thấp hơn trung bình để cân bằng GPA."
                            : "Nhập thêm điểm cho các môn còn lại để có phân tích chi tiết hơn."}
                        </Text>
                      </Box>
                    </Group>
                  </Grid.Col>
                </Grid>
              </Stack>
            </Grid.Col>
          </Grid>
        </Container>
      </Box>

      <Box
        component="footer"
        mt="auto"
        py="xl"
        px="xl"
        style={{ background: surfaceLow, borderTop: `1px solid ${theme.colors.gray[2]}` }}
      >
        <Container size={1440}>
          <Grid>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Text fw={700} mb={8} style={{ fontSize: 16 }}>
                Scholarly Sanctuary
              </Text>
              <Text size="sm" c="dimmed" style={{ lineHeight: 1.65 }}>
                © 2024 Scholarly Sanctuary. Preserving the focus of the modern student.
              </Text>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Group gap="xl" justify="flex-end" wrap="wrap">
                <Anchor href="#" size="sm" c="dimmed">
                  Academic Integrity
                </Anchor>
                <Anchor href="#" size="sm" c="dimmed">
                  Privacy Research
                </Anchor>
                <Anchor href="#" size="sm" c="dimmed">
                  Institutional Terms
                </Anchor>
                <Anchor href="#" size="sm" c="dimmed">
                  Support
                </Anchor>
              </Group>
            </Grid.Col>
          </Grid>
        </Container>
      </Box>
    </Box>
  );
}
