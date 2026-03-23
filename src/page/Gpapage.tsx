import { useEffect, useState } from "react";
import {
  Stack,
  Text,
  Card,
  Group,
  Progress,
  Loader,
  Center,
  NumberInput,
  Button,
  Divider,
  Badge,
  ScrollArea,
  Table,
  Box,
  TextInput,
  ActionIcon,
  Title,
  SegmentedControl,
} from "@mantine/core";
import {
  IconTargetArrow,
  IconTrash,
  IconDeviceFloppy,
} from "@tabler/icons-react";
import API from "../api/axios";
import { notifications } from "@mantine/notifications";
import { useNavigate } from "react-router-dom";

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
function gpaColor(gpa: number) {
  if (gpa >= 3.6) return "teal";
  if (gpa >= 3.2) return "blue";
  if (gpa >= 2.5) return "yellow";
  if (gpa >= 2.0) return "orange";
  return "red";
}

function gpaLabel(gpa: number) {
  if (gpa >= 3.6) return "Xuất sắc";
  if (gpa >= 3.2) return "Giỏi";
  if (gpa >= 2.5) return "Khá";
  if (gpa >= 2.0) return "Trung bình";
  return "Yếu";
}

function scoreColor(letter: string | null) {
  if (!letter) return "gray";
  if (["A+", "A"].includes(letter)) return "teal";
  if (["B+", "B"].includes(letter)) return "blue";
  if (["C+", "C"].includes(letter)) return "yellow";
  if (["D+", "D"].includes(letter)) return "orange";
  return "red";
}

const PRESETS = [
  { label: "TB", value: "trung_binh", gpa: 2.0 },
  { label: "Khá", value: "kha", gpa: 2.5 },
  { label: "Giỏi", value: "gioi", gpa: 3.2 },
  { label: "Xuất sắc", value: "xuat_sac", gpa: 3.6 },
];

// ─── Component ───────────────────────────────────────────────────────────────
export default function GpaPage() {
  // Summary state
  const [summary, setSummary] = useState<GpaSummary | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [targetGpa, setTargetGpa] = useState<number | string>(3.2);
  const [selectedPreset, setSelectedPreset] = useState("kha");
  const [submittingTarget, setSubmittingTarget] = useState(false);
  const navigate = useNavigate();

  // Transcript state 
  const [courses, setCourses] = useState<Course[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [filter, setFilter] = useState("all");

  // Inline input state: { [course_code]: { score_10, semester } }
  const [inputMap, setInputMap] = useState<
    Record<string, { score: string; semester: string }>
  >({});
  const [savingMap, setSavingMap] = useState<Record<string, boolean>>({});
  const [deletingMap, setDeletingMap] = useState<Record<string, boolean>>({});

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchSummary = async () => {
    setLoadingSummary(true);
    try {
      const res = await API.get("/gpa/summary");
      setSummary(res.data);
      setTargetGpa(res.data.target_gpa);
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
      // pre-fill input nếu đã có điểm
      const pre: Record<string, { score: string; semester: string }> = {};
      data.forEach((c) => {
        if (c.score_10 !== null) {
          pre[c.course_code] = {
            score: String(c.score_10),
            semester: c.semester ?? "",
          };
        }
      });
      setInputMap(pre);
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
    const val = Number(targetGpa);
    if (!val || val <= 0 || val > 4) {
      notifications.show({ message: "GPA phải từ 0 đến 4", color: "red" });
      return;
    }
    setSubmittingTarget(true);
    try {
      await API.patch("/gpa/target", {
        target_gpa: val,
        preset: selectedPreset,
      });
      notifications.show({ message: `Đã đặt mục tiêu GPA: ${val}`, color: "teal" });
      fetchSummary();
    } catch {
      notifications.show({ message: "Lỗi khi đặt mục tiêu", color: "red" });
    } finally {
      setSubmittingTarget(false);
    }
  };

  const handleSaveGrade = async (course: Course) => {
    const inp = inputMap[course.course_code];
    if (!inp?.score || !inp?.semester) {
      notifications.show({ message: "Nhập đủ điểm và học kỳ", color: "red" });
      return;
    }
    const score = Number(inp.score);
    if (isNaN(score) || score < 0 || score > 10) {
      notifications.show({ message: "Điểm phải từ 0 đến 10", color: "red" });
      return;
    }
    setSavingMap((p) => ({ ...p, [course.course_code]: true }));
    try {
      await API.post("/gpa/grades", {
        course_code: course.course_code,
        score_10: score,
        semester: inp.semester,
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
      // clear input
      setInputMap((p) => {
        const next = { ...p };
        delete next[course.course_code];
        return next;
      });
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
    filter === "studied"
      ? studied
      : filter === "not_studied"
        ? notStudied
        : courses;
  console.log('courses', courses);
  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <Box
      style={{
        display: "flex",
        height: "calc(100vh - 80px)",
        gap: 16,
        overflow: "hidden",
        padding: 16,
      }}
    >
      {/* ═══ LEFT PANEL: GPA + Target ═══════════════════════════════════════ */}
      <Box style={{ width: 260, flexShrink: 0 }}>
        <ScrollArea h="100%">
          <Button onClick={() => navigate(-1)}>
            Main
          </Button>
          <Stack gap="sm">
            <Title order={5} fw={700}>GPA & Mục tiêu</Title>

            {loadingSummary ? (
              <Center py="xl"><Loader size="sm" /></Center>
            ) : summary ? (
              <>
                {/* GPA Card */}
                <Card withBorder radius="md" padding="sm" shadow="xs">
                  <Group justify="space-between" mb={4}>
                    <Text size="xs" c="dimmed">GPA (Thang 4)</Text>
                    <Badge color={gpaColor(summary.current_gpa)} variant="light" size="sm">
                      {gpaLabel(summary.current_gpa)}
                    </Badge>
                  </Group>
                  <Text fw={800} size="xl" c={gpaColor(summary.current_gpa)}>
                    {summary.current_gpa.toFixed(2)}
                    <Text span size="sm" c="dimmed" fw={400}> / 4.0</Text>
                  </Text>

                  <Divider my="xs" />

                  <Stack gap={6}>
                    {[
                      { label: "Mục tiêu", value: summary.target_gpa.toFixed(2) },
                      {
                        label: "Còn thiếu",
                        value: Math.max(0, summary.target_gpa - summary.current_gpa).toFixed(2),
                        color: "red",
                      },
                      {
                        label: "TC hoàn thành",
                        value: `${summary.total_credits_completed} / ${summary.total_credits_required}`,
                      },
                      { label: "TC còn lại", value: `${summary.remaining_credits} TC` },
                      {
                        label: "Cần TB / TC",
                        value: summary.needed_avg_for_target
                          ? `${summary.needed_avg_for_target.toFixed(2)} / 4.0`
                          : "—",
                        color: "blue",
                      },
                    ].map((row) => (
                      <Group key={row.label} justify="space-between">
                        <Text size="xs" c="dimmed">{row.label}</Text>
                        <Text size="xs" fw={600} c={row.color ?? "dark"}>
                          {row.value}
                        </Text>
                      </Group>
                    ))}
                  </Stack>

                  <Divider my="xs" />

                  <Text size="xs" c="dimmed" mb={4}>
                    Tiến độ {summary.progress_percent.toFixed(1)}%
                  </Text>
                  <Progress
                    value={summary.progress_percent}
                    color={gpaColor(summary.current_gpa)}
                    size="sm"
                    radius="xl"
                  />
                </Card>

                {/* Target Card */}
                <Card withBorder radius="md" padding="sm" shadow="xs">
                  <Group gap={6} mb="sm">
                    <IconTargetArrow size={14} color="var(--mantine-color-blue-6)" />
                    <Text size="xs" fw={600}>Chọn mục tiêu tốt nghiệp</Text>
                  </Group>

                  <Group gap={4} mb="sm">
                    {PRESETS.map((p) => (
                      <Button
                        key={p.value}
                        size="xs"
                        variant={selectedPreset === p.value ? "filled" : "light"}
                        color="blue"
                        style={{ flex: 1, padding: "2px 4px" }}
                        onClick={() => {
                          setSelectedPreset(p.value);
                          setTargetGpa(p.gpa);
                        }}
                      >
                        <Stack gap={0} align="center">
                          <Text size="xs" fw={600}>{p.label}</Text>
                          <Text size="xs">{p.gpa}</Text>
                        </Stack>
                      </Button>
                    ))}
                  </Group>

                  <NumberInput
                    placeholder="Nhập GPA mục tiêu"
                    min={0}
                    max={4}
                    step={0.1}
                    decimalScale={2}
                    value={targetGpa}
                    onChange={setTargetGpa}
                    size="xs"
                    mb="xs"
                  />
                  <Button
                    size="xs"
                    fullWidth
                    loading={submittingTarget}
                    onClick={handleSetTarget}
                  >
                    Đặt mục tiêu
                  </Button>
                </Card>
              </>
            ) : null}
          </Stack>
        </ScrollArea>
      </Box>

      {/* ═══ MAIN: BẢNG ĐIỂM ════════════════════════════════════════════════ */}
      <Box style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <Group justify="space-between" mb="sm">
          <div>
            <Title order={5} fw={700}>Bảng điểm</Title>
            <Text size="xs" c="dimmed">
              {courses.length} môn — Đã học: {studied.length} — Chưa học: {notStudied.length}
            </Text>
          </div>
          <SegmentedControl
            size="xs"
            value={filter}
            onChange={setFilter}
            data={[
              { label: "Tất cả", value: "all" },
              { label: "Đã học", value: "studied" },
              { label: "Chưa học", value: "not_studied" },
            ]}
          />
        </Group>

        {/* Table */}
        {loadingCourses ? (
          <Center py="xl"><Loader size="md" /></Center>
        ) : (
          <ScrollArea style={{ flex: 1 }}>
            <Table highlightOnHover withColumnBorders style={{ minWidth: 780 }}  withTableBorder>
              <Table.Thead bg="gray.0" style={{ position: "sticky", top: 0, zIndex: 1 }}>
                <Table.Tr>
                  <Table.Th style={{ width: 40 }}>#</Table.Th>
                  <Table.Th>Tên học phần</Table.Th>
                  <Table.Th style={{ width: 70 }} ta="center">TC</Table.Th>
                  <Table.Th style={{ width: 90 }} ta="center">Điểm 10</Table.Th>
                  <Table.Th style={{ width: 70 }} ta="center">H4</Table.Th>
                  <Table.Th style={{ width: 60 }} ta="center">CHỮ</Table.Th>
                  <Table.Th style={{ width: 140 }}>Học kỳ</Table.Th>
                  <Table.Th style={{ width: 120 }}>Nhập điểm</Table.Th>
                  <Table.Th style={{ width: 80 }} ta="center">Thao tác</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {displayed.map((course, idx) => {
                  const inp = inputMap[course.course_code] ?? { score: "", semester: "" };
                  const hasGrade = course.score_10 !== null;

                  return (
                    <Table.Tr
                      key={course.course_code}
                      style={{ opacity: hasGrade ? 1 : 0.6 }}
                    >
                      <Table.Td><Text size="sm" c="dimmed">{idx + 1}</Text></Table.Td>
                      <Table.Td>
                        <Text size="sm" fw={hasGrade ? 500 : 400}>
                          {course.course_name}
                        </Text>
                        <Text size="xs" c="dimmed">{course.course_code}</Text>
                      </Table.Td>
                      <Table.Td ta="center">{course.credits}</Table.Td>
                      <Table.Td ta="center">
                        <Text size="sm">{course.score_10 ?? "—"}</Text>
                      </Table.Td>
                      <Table.Td ta="center">
                        <Text size="sm">{course.score_4 ?? "—"}</Text>
                      </Table.Td>
                      <Table.Td ta="center">
                        {course.score_letter ? (
                          <Badge
                            color={scoreColor(course.score_letter)}
                            variant="filled"
                            size="sm"
                          >
                            {course.score_letter}
                          </Badge>
                        ) : (
                          <Text c="dimmed" size="sm">—</Text>
                        )}
                      </Table.Td>

                      {/* Học kỳ input */}
                      <Table.Td>
                        <TextInput
                          placeholder="2024.1"
                          size="xs"
                          value={inp.semester}
                          onChange={(e) =>
                            setInputMap((p) => ({
                              ...p,
                              [course.course_code]: {
                                ...inp,
                                semester: e.currentTarget.value,
                              },
                            }))
                          }
                        />
                      </Table.Td>

                      {/* Điểm input */}
                      <Table.Td>
                        <NumberInput
                          placeholder="0–10"
                          size="xs"
                          min={0}
                          max={10}
                          step={0.1}
                          decimalScale={1}
                          value={inp.score}
                          onChange={(v) =>
                            setInputMap((p) => ({
                              ...p,
                              [course.course_code]: {
                                ...inp,
                                score: String(v),
                              },
                            }))
                          }
                        />
                      </Table.Td>

                      {/* Actions */}
                      <Table.Td>
                        <Group gap={4} justify="center">
                          <ActionIcon
                            size="sm"
                            color="teal"
                            variant="light"
                            loading={savingMap[course.course_code]}
                            onClick={() => handleSaveGrade(course)}
                            title="Lưu điểm"
                          >
                            <IconDeviceFloppy size={14} />
                          </ActionIcon>
                          {hasGrade && (
                            <ActionIcon
                              size="sm"
                              color="red"
                              variant="light"
                              loading={deletingMap[course.course_code]}
                              onClick={() => handleDeleteGrade(course)}
                              title="Xoá điểm"
                            >
                              <IconTrash size={14} />
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

        {/* Footer legend */}
        <Group gap="md" pt="xs">
          <Group gap={4}>
            <Box style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--mantine-color-teal-5)" }} />
            <Text size="xs" c="dimmed">Đã học: {studied.length} môn</Text>
          </Group>
          <Group gap={4}>
            <Box style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--mantine-color-gray-4)" }} />
            <Text size="xs" c="dimmed">Chưa học: {notStudied.length} môn</Text>
          </Group>
          <Group gap={4}>
            <Box style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--mantine-color-orange-5)" }} />
            <Text size="xs" c="dimmed">Môn tín chỉ cao ưu tiên nhập trước</Text>
          </Group>
        </Group>
      </Box>
    </Box>
  );
}